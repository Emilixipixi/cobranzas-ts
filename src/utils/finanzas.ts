import { HOY } from '../datos/datosEjemplo'
import type { Cobro, Contrato, Cuota, EstadoCuota, FlujoPorProyecto, ItemFlujo } from '../tipos'

export const redondear = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100

export const formatoMoneda = (n: number, moneda = 'USD'): string =>
  new Intl.NumberFormat('es-EC', { style: 'currency', currency: moneda }).format(n)

export const formatoFecha = (fecha?: string | null): string => {
  if (!fecha) return '—'
  const [anio, mes, dia] = fecha.slice(0, 10).split('-')
  const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  return `${dia} ${meses[Number(mes) - 1]} ${anio}`
}

export const diasEntre = (desde: string, hasta: string): number =>
  Math.round((Date.parse(hasta) - Date.parse(desde)) / 86400000)

export const sumarDias = (fecha: string, dias: number): string => {
  const f = new Date(fecha + 'T00:00:00Z')
  f.setUTCDate(f.getUTCDate() + dias)
  return f.toISOString().slice(0, 10)
}

export const sumarMeses = (fecha: string, meses: number): string => {
  const f = new Date(fecha + 'T00:00:00Z')
  f.setUTCMonth(f.getUTCMonth() + meses)
  return f.toISOString().slice(0, 10)
}

export const montoCuota = (cuota: Cuota, contrato: Contrato): number =>
  cuota.tipoValor === 'porcentaje' ? redondear((contrato.monto * cuota.valor) / 100) : redondear(cuota.valor)

export interface ResumenPlan {
  total: number
  diferencia: number
  estado: 'completo' | 'incompleto' | 'excedido'
  porcentaje: number
}

export const resumenPlan = (contrato: Contrato, cuotas: Cuota[]): ResumenPlan => {
  const lista = cuotas.filter((c) => c.contratoId === contrato.id)
  const total = redondear(lista.reduce((suma, c) => suma + montoCuota(c, contrato), 0))
  const diferencia = redondear(contrato.monto - total)
  const estado = diferencia === 0 ? 'completo' : diferencia > 0 ? 'incompleto' : 'excedido'
  return { total, diferencia, estado, porcentaje: redondear((total / contrato.monto) * 100) }
}

export const cobradoCuota = (cuotaId: string, cobros: Cobro[]): number =>
  redondear(cobros.filter((b) => b.cuotaId === cuotaId).reduce((suma, b) => suma + b.valor, 0))

export const saldoCuota = (cuota: Cuota, contrato: Contrato, cobros: Cobro[]): number =>
  Math.max(0, redondear(montoCuota(cuota, contrato) - cobradoCuota(cuota.id, cobros)))

export const fechaVencimiento = (cuota: Cuota): string | null => cuota.vencimientoFactura ?? cuota.fechaProyectada

export const diasMora = (cuota: Cuota): number => {
  const vence = fechaVencimiento(cuota)
  return vence ? Math.max(0, diasEntre(vence, HOY)) : 0
}

export const estadoCuota = (cuota: Cuota, contrato: Contrato, cobros: Cobro[]): EstadoCuota => {
  const monto = montoCuota(cuota, contrato)
  const cobrado = cobradoCuota(cuota.id, cobros)
  if (monto > 0 && saldoCuota(cuota, contrato, cobros) === 0) return 'Cobrada'
  const vence = fechaVencimiento(cuota)
  if (monto > 0 && vence && vence < HOY) return 'Vencida'
  if (cobrado > 0) return 'Parcialmente cobrada'
  if (cuota.numeroFactura) return 'Facturada'
  if (cuota.estadoEntrega === 'Entregado') return 'Habilitada para cobro'
  return 'Pendiente'
}

export const flujoProyectado = (cuotas: Cuota[], contratos: Contrato[]): FlujoPorProyecto => {
  const salida: FlujoPorProyecto = {}
  cuotas.forEach((q) => {
    if (!q.fechaProyectada) return
    const k = contratos.find((c) => c.id === q.contratoId)
    if (!k) return
    salida[k.proyectoId] ??= {}
    salida[k.proyectoId][q.fechaProyectada] ??= []
    salida[k.proyectoId][q.fechaProyectada].push({ cuota: q, importe: montoCuota(q, k) })
  })
  return salida
}

export const flujoEjecutado = (cobros: Cobro[], cuotas: Cuota[], contratos: Contrato[]): FlujoPorProyecto => {
  const salida: FlujoPorProyecto = {}
  cobros.forEach((b) => {
    const q = cuotas.find((x) => x.id === b.cuotaId)
    const k = q ? contratos.find((c) => c.id === q.contratoId) : undefined
    if (!q || !k) return
    salida[k.proyectoId] ??= {}
    salida[k.proyectoId][b.fechaReal] ??= []
    salida[k.proyectoId][b.fechaReal].push({ cuota: q, importe: b.valor, cobro: b })
  })
  return salida
}

export const sumarCelda = (celda?: ItemFlujo[]): number =>
  redondear((celda ?? []).reduce((suma, x) => suma + x.importe, 0))
