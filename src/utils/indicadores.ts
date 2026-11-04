import { HOY } from '../datos/datosEjemplo'
import type { Cliente, Cobro, Contrato, Cuota, EstadoCuota, Proyecto } from '../tipos'
import {
  cobradoCuota, diasEntre, diasMora, estadoCuota, fechaVencimiento, formatoMoneda, montoCuota, redondear, resumenPlan, saldoCuota,
} from './finanzas'

export interface ResumenFinanciero {
  contratado: number
  cobrado: number
  porCobrar: number
  vencido: number
  facturadoPendiente: number
  porFacturar: number
  progresoCobro: number
}

export interface FilaCartera {
  cuota: Cuota
  contrato: Contrato
  proyecto: Proyecto
  cliente?: Cliente
  monto: number
  cobrado: number
  saldo: number
  fecha: string | null
  diasMora: number
  estado: EstadoCuota
}

export interface AlertaProyecto {
  proyecto: Proyecto
  motivos: string[]
}

export const datosDeProyecto = (proyectoId: string, contratos: Contrato[], cuotas: Cuota[]) => {
  const contratosProyecto = contratos.filter((k) => k.proyectoId === proyectoId)
  const cuotasProyecto = cuotas.filter((q) => contratosProyecto.some((k) => k.id === q.contratoId))
  return { contratos: contratosProyecto, cuotas: cuotasProyecto }
}

export const filasCartera = (
  proyectos: Proyecto[], clientes: Cliente[], contratos: Contrato[], cuotas: Cuota[], cobros: Cobro[]
): FilaCartera[] =>
  cuotas.flatMap((cuota) => {
    const contrato = contratos.find((k) => k.id === cuota.contratoId)
    const proyecto = contrato ? proyectos.find((p) => p.id === contrato.proyectoId) : undefined
    if (!contrato || !proyecto) return []
    return [{
      cuota,
      contrato,
      proyecto,
      cliente: clientes.find((c) => c.id === proyecto.clienteId),
      monto: montoCuota(cuota, contrato),
      cobrado: cobradoCuota(cuota.id, cobros),
      saldo: saldoCuota(cuota, contrato, cobros),
      fecha: fechaVencimiento(cuota),
      diasMora: diasMora(cuota),
      estado: estadoCuota(cuota, contrato, cobros),
    }]
  })

export const resumenFinanciero = (contratos: Contrato[], cuotas: Cuota[], cobros: Cobro[]): ResumenFinanciero => {
  const contratado = redondear(contratos.reduce((suma, k) => suma + k.monto, 0))
  const cobrado = redondear(cuotas.reduce((suma, q) => suma + cobradoCuota(q.id, cobros), 0))
  let vencido = 0
  let facturadoPendiente = 0
  let porFacturar = 0
  cuotas.forEach((q) => {
    const k = contratos.find((c) => c.id === q.contratoId)
    if (!k) return
    const saldo = saldoCuota(q, k, cobros)
    if (estadoCuota(q, k, cobros) === 'Vencida') vencido += saldo
    if (q.numeroFactura) facturadoPendiente += saldo
    if (q.facturaRequerida && !q.numeroFactura && q.estadoEntrega === 'Entregado') porFacturar += saldo
  })
  return {
    contratado,
    cobrado,
    porCobrar: redondear(contratado - cobrado),
    vencido: redondear(vencido),
    facturadoPendiente: redondear(facturadoPendiente),
    porFacturar: redondear(porFacturar),
    progresoCobro: contratado > 0 ? Math.round((cobrado / contratado) * 100) : 0,
  }
}

export const antiguedadCartera = (filas: FilaCartera[]) => {
  const rangos = [
    { rango: '1-30 días', min: 1, max: 30 },
    { rango: '31-60 días', min: 31, max: 60 },
    { rango: '61-90 días', min: 61, max: 90 },
    { rango: 'Más de 90', min: 91, max: Infinity },
  ]
  return rangos.map((r) => ({
    rango: r.rango,
    Vencido: redondear(
      filas.filter((f) => f.estado === 'Vencida' && f.diasMora >= r.min && f.diasMora <= r.max).reduce((suma, f) => suma + f.saldo, 0)
    ),
  }))
}

export const proximosVencimientos = (filas: FilaCartera[], dias: number): FilaCartera[] =>
  filas
    .filter((f) => f.saldo > 0 && f.estado !== 'Vencida' && f.fecha !== null && diasEntre(HOY, f.fecha) >= 0 && diasEntre(HOY, f.fecha) <= dias)
    .sort((a, b) => (a.fecha ?? '').localeCompare(b.fecha ?? ''))

export const flujoMensual = (cuotas: Cuota[], contratos: Contrato[], cobros: Cobro[]) => {
  const mapa: Record<string, { mes: string; Proyectado: number; Ejecutado: number }> = {}
  const fila = (mes: string) => (mapa[mes] ??= { mes, Proyectado: 0, Ejecutado: 0 })
  cuotas.forEach((q) => {
    const k = contratos.find((c) => c.id === q.contratoId)
    if (k && q.fechaProyectada) fila(q.fechaProyectada.slice(0, 7)).Proyectado += montoCuota(q, k)
  })
  cobros.forEach((b) => {
    fila(b.fechaReal.slice(0, 7)).Ejecutado += b.valor
  })
  return Object.values(mapa)
    .sort((a, b) => a.mes.localeCompare(b.mes))
    .map((f) => ({ ...f, Proyectado: redondear(f.Proyectado), Ejecutado: redondear(f.Ejecutado) }))
}

export const proyectosEnAtencion = (
  proyectos: Proyecto[], contratos: Contrato[], cuotas: Cuota[], cobros: Cobro[]
): AlertaProyecto[] =>
  proyectos
    .map((proyecto) => {
      const d = datosDeProyecto(proyecto.id, contratos, cuotas)
      const resumen = resumenFinanciero(d.contratos, d.cuotas, cobros)
      const motivos: string[] = []
      if (resumen.vencido > 0) motivos.push(`Cartera vencida: ${formatoMoneda(resumen.vencido)}`)
      d.contratos.forEach((k) => {
        const plan = resumenPlan(k, cuotas)
        if (plan.estado !== 'completo') motivos.push(`Plan de pagos ${plan.estado} en ${k.numero} (${plan.porcentaje} %)`)
      })
      if (d.cuotas.some((q) => q.estadoEntrega === 'Atraso interno' || q.estadoEntrega === 'Atraso cliente')) {
        motivos.push('Entregable con atraso registrado')
      }
      if (proyecto.estado !== 'Cerrado' && proyecto.fechaEntrega < HOY) motivos.push('Plazo de entrega vencido')
      return { proyecto, motivos }
    })
    .filter((a) => a.motivos.length > 0)

export const progresoEntrega = (cuotas: Cuota[]): number => {
  const conEntregable = cuotas.filter((q) => q.entregable !== '')
  if (conEntregable.length === 0) return 0
  return Math.round((conEntregable.filter((q) => q.estadoEntrega === 'Entregado').length / conEntregable.length) * 100)
}
