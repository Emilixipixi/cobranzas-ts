import { HOY } from '../datos/datosEjemplo'
import type { Almacen, Rol, Usuario } from '../tipos'
import { diasEntre, estadoCuota, fechaVencimiento, formatoFecha, formatoMoneda, resumenPlan, saldoCuota } from './finanzas'
import { jefeDeProyecto } from './equipo'
import { puedeVerCategoria } from './permisosDocumentos'
import { areasDeReunion } from './reuniones'
import { etiquetaSemana } from './semanas'

export type Departamento = Exclude<Rol, 'administrador'> | 'direccion'
export type Prioridad = 'peligro' | 'alerta' | 'info' | 'exito'

export interface Notificacion {
  id: string
  departamento: Departamento
  prioridad: Prioridad
  titulo: string
  detalle: string
  ruta: string
  fecha: string
  /** Al marcarla como leída se avisa también al almacén (solo horas extra). */
  horasExtraId?: string
}

export const ETIQUETAS_DEPARTAMENTO: Record<Departamento, string> = {
  direccion: 'Dirección',
  finanzas: 'Finanzas',
  comercial: 'Comercial',
  desarrollador: 'Desarrollo',
}

const PESO: Record<Prioridad, number> = { peligro: 0, alerta: 1, exito: 2, info: 3 }

const enDias = (dias: number): string => (dias === 0 ? 'hoy' : dias === 1 ? 'mañana' : `en ${dias} días`)

const normalizar = (texto: string) => texto.trim().toLowerCase()

/** Finanzas: cuotas vencidas, facturas por vencer y cuotas listas para facturar. */
const deFinanzas = (a: Almacen): Notificacion[] => {
  const salida: Notificacion[] = []
  a.cuotas.forEach((q) => {
    const contrato = a.contratos.find((k) => k.id === q.contratoId)
    const proyecto = a.proyectos.find((p) => p.id === contrato?.proyectoId)
    if (!contrato || !proyecto) return
    const estado = estadoCuota(q, contrato, a.cobros)
    const saldo = saldoCuota(q, contrato, a.cobros)
    const vence = fechaVencimiento(q)
    const ruta = `/proyectos/${proyecto.id}`
    if (estado === 'Vencida' && vence) {
      salida.push({
        id: `fin-vencida-${q.id}`, departamento: 'finanzas', prioridad: 'peligro', ruta, fecha: vence,
        titulo: `Cuota vencida · ${proyecto.nombre}`,
        detalle: `${q.concepto}: ${formatoMoneda(saldo, contrato.moneda)} pendiente desde el ${formatoFecha(vence)} (${diasEntre(vence, HOY)} días de mora)`,
      })
    } else if (estado === 'Habilitada para cobro' && q.facturaRequerida && !q.numeroFactura) {
      salida.push({
        id: `fin-facturar-${q.id}`, departamento: 'finanzas', prioridad: 'alerta', ruta, fecha: HOY,
        titulo: `Lista para facturar · ${proyecto.nombre}`,
        detalle: `${q.concepto}: entregable aprobado, emite la factura por ${formatoMoneda(saldo, contrato.moneda)}`,
      })
    } else if (saldo > 0 && vence && vence >= HOY && diasEntre(HOY, vence) <= 7 && estado !== 'Cobrada') {
      salida.push({
        id: `fin-porvencer-${q.id}-${vence}`, departamento: 'finanzas', prioridad: 'alerta', ruta, fecha: vence,
        titulo: `Cobro por vencer · ${proyecto.nombre}`,
        detalle: `${q.concepto}: ${formatoMoneda(saldo, contrato.moneda)} vence ${enDias(diasEntre(HOY, vence))} (${formatoFecha(vence)})`,
      })
    }
  })
  a.adicionales.forEach((x) => {
    if (x.estado !== 'aprobado' || !x.contratoId) return
    const contrato = a.contratos.find((k) => k.id === x.contratoId)
    const porFacturar = a.cuotas.filter((q) => q.contratoId === x.contratoId && q.facturaRequerida && !q.numeroFactura).length
    if (!contrato || porFacturar === 0) return
    const proyecto = a.proyectos.find((p) => p.id === x.proyectoId)
    salida.push({
      id: `fin-ampliacion-${x.id}`, departamento: 'finanzas', prioridad: 'info', ruta: '/cobranza', fecha: (x.decision?.fecha ?? HOY).slice(0, 10),
      titulo: `Nueva ampliación aprobada · ${proyecto?.nombre ?? ''}`,
      detalle: `${contrato.numero} por ${formatoMoneda(contrato.monto, contrato.moneda)} · ${porFacturar} cuota(s) por facturar`,
    })
  })
  const cobrosSinArchivo = a.cobros.filter((b) => !b.archivoComprobante).length
  const facturasSinArchivo = a.cuotas.filter((q) => q.numeroFactura && !q.archivoFactura).length
  if (cobrosSinArchivo + facturasSinArchivo > 0) {
    const partes = [
      facturasSinArchivo ? `${facturasSinArchivo} factura(s)` : '',
      cobrosSinArchivo ? `${cobrosSinArchivo} comprobante(s) de cobro` : '',
    ].filter(Boolean)
    salida.push({
      id: `fin-respaldo-${facturasSinArchivo}-${cobrosSinArchivo}`, departamento: 'finanzas', prioridad: 'alerta', ruta: '/cobranza', fecha: HOY,
      titulo: 'Respaldos pendientes de subir',
      detalle: `Faltan los archivos de ${partes.join(' y ')} en el control de cobranza`,
    })
  }
  a.documentos.forEach((d) => {
    if (!d.minuta || d.minuta.fecha < HOY || d.minuta.alcance !== 'areas' || !d.minuta.areas?.includes('finanzas')) return
    const proyecto = a.proyectos.find((p) => p.id === d.proyectoId)
    salida.push({
      id: `fin-reunion-${d.id}`, departamento: 'finanzas', prioridad: 'info', ruta: '/reuniones', fecha: d.minuta.fecha,
      titulo: `Te invitaron a una reunión ${enDias(diasEntre(HOY, d.minuta.fecha))}`,
      detalle: `${d.titulo}${proyecto ? ` · ${proyecto.nombre}` : ''}${d.minuta.organizador ? ` · convoca ${d.minuta.organizador}` : ''}`,
    })
  })
  return salida
}

/** Comercial: planes de pago descuadrados, entregas cercanas, documentos en revisión y reuniones próximas. */
const deComercial = (a: Almacen): Notificacion[] => {
  const salida: Notificacion[] = []
  a.contratos.forEach((k) => {
    const plan = resumenPlan(k, a.cuotas)
    const proyecto = a.proyectos.find((p) => p.id === k.proyectoId)
    if (plan.estado === 'completo' || !proyecto) return
    salida.push({
      id: `com-plan-${k.id}-${plan.porcentaje}`, departamento: 'comercial', prioridad: 'alerta', ruta: '/plan-pagos', fecha: HOY,
      titulo: `Plan de pagos ${plan.estado} · ${proyecto.nombre}`,
      detalle: `${k.numero} cubre el ${plan.porcentaje} % del contrato`,
    })
  })
  a.proyectos.forEach((p) => {
    if (p.estado === 'Cerrado') return
    const dias = diasEntre(HOY, p.fechaEntrega)
    if (p.fechaEntrega < HOY) {
      salida.push({
        id: `com-entrega-vencida-${p.id}-${p.fechaEntrega}`, departamento: 'comercial', prioridad: 'peligro', ruta: `/proyectos/${p.id}`, fecha: p.fechaEntrega,
        titulo: `Plazo de entrega vencido · ${p.nombre}`,
        detalle: `La entrega estaba comprometida para el ${formatoFecha(p.fechaEntrega)}`,
      })
    } else if (dias <= 15) {
      salida.push({
        id: `com-entrega-${p.id}-${p.fechaEntrega}`, departamento: 'comercial', prioridad: 'alerta', ruta: `/proyectos/${p.id}`, fecha: p.fechaEntrega,
        titulo: `Entrega cercana · ${p.nombre}`,
        detalle: `Entrega al cliente ${enDias(dias)} (${formatoFecha(p.fechaEntrega)})`,
      })
    }
  })
  a.adicionales.forEach((x) => {
    if (x.estado !== 'solicitado' && x.estado !== 'cotizado') return
    const proyecto = a.proyectos.find((p) => p.id === x.proyectoId)
    salida.push({
      id: `com-adicional-${x.id}-${x.estado}`, departamento: 'comercial', prioridad: x.estado === 'solicitado' ? 'alerta' : 'info', ruta: `/proyectos/${x.proyectoId}?pestana=adicionales`, fecha: x.fechaSolicitud,
      titulo: x.estado === 'solicitado' ? `Adicional por cotizar · ${proyecto?.nombre ?? ''}` : `Adicional esperando respuesta · ${proyecto?.nombre ?? ''}`,
      detalle: `${x.titulo} · pedido por ${x.solicitadoPor}${x.montoEstimado ? ` · ${formatoMoneda(x.montoEstimado)}` : ''}`,
    })
  })
  a.documentos.forEach((d) => {
    if (d.estado !== 'en revisión' || !puedeVerCategoria('comercial', d.categoria, a.permisosDocumentos)) return
    const proyecto = a.proyectos.find((p) => p.id === d.proyectoId)
    salida.push({
      id: `com-doc-${d.id}`, departamento: 'comercial', prioridad: 'info', ruta: '/documentos', fecha: d.fecha,
      titulo: 'Documento en revisión',
      detalle: `${d.titulo}${proyecto ? ` · ${proyecto.nombre}` : ''}`,
    })
  })
  a.documentos.forEach((d) => {
    if (!d.minuta || d.minuta.fecha < HOY || !areasDeReunion(d).includes('comercial')) return
    const proyecto = a.proyectos.find((p) => p.id === d.proyectoId)
    salida.push({
      id: `com-reunion-${d.id}`, departamento: 'comercial', prioridad: 'info', ruta: '/reuniones', fecha: d.minuta.fecha,
      titulo: `Reunión agendada ${enDias(diasEntre(HOY, d.minuta.fecha))}`,
      detalle: `${d.titulo}${proyecto ? ` · ${proyecto.nombre}` : ''}`,
    })
  })
  return salida
}

/** Desarrollo: solo lo que le toca a la persona (sus horas extra, sus compromisos, reuniones y atrasos de sus proyectos). */
const deDesarrollador = (a: Almacen, desarrolladorId: string): Notificacion[] => {
  const dev = a.desarrolladores.find((d) => d.id === desarrolladorId)
  if (!dev) return []
  const salida: Notificacion[] = []
  const misProyectos = a.asignaciones.filter((x) => x.desarrolladorId === dev.id).map((x) => x.proyectoId)

  a.horasExtra.filter((x) => x.desarrolladorId === dev.id).forEach((x) => {
    const proyecto = a.proyectos.find((p) => p.id === x.proyectoId)
    salida.push({
      id: `dev-extra-${x.id}-${x.horas}`, departamento: 'desarrollador', prioridad: 'exito', ruta: `/proyectos/${x.proyectoId}`, fecha: x.fecha.slice(0, 10),
      titulo: `Te aprobaron ${x.horas} h extra`,
      detalle: `${proyecto?.nombre ?? 'Proyecto'} · semana del ${etiquetaSemana(x.semana)} · aprobó ${x.aprobadoPor}`,
      horasExtraId: x.id,
    })
  })

  a.documentos.forEach((d) => {
    if (!d.minuta) return
    const proyecto = a.proyectos.find((p) => p.id === d.proyectoId)
    d.minuta.pendientes.forEach((p, i) => {
      if (normalizar(p.responsable) !== normalizar(dev.nombre)) return
      const dias = diasEntre(HOY, p.fecha)
      if (p.fecha >= HOY && dias > 7) return
      salida.push({
        id: `dev-compromiso-${d.id}-${i}`, departamento: 'desarrollador', prioridad: p.fecha < HOY ? 'peligro' : 'alerta', ruta: '/reuniones', fecha: p.fecha,
        titulo: p.fecha < HOY ? 'Compromiso vencido' : `Compromiso para ${enDias(dias)}`,
        detalle: `${p.tarea}${proyecto ? ` · ${proyecto.nombre}` : ''}`,
      })
    })
    if (misProyectos.includes(d.proyectoId) && d.minuta.fecha >= HOY && areasDeReunion(d).includes('desarrollo')) {
      salida.push({
        id: `dev-reunion-${d.id}`, departamento: 'desarrollador', prioridad: 'info', ruta: '/reuniones', fecha: d.minuta.fecha,
        titulo: `${d.minuta.alcance === 'equipo' ? 'Reunión de equipo' : 'Reunión agendada'} ${enDias(diasEntre(HOY, d.minuta.fecha))}`,
        detalle: `${d.titulo}${proyecto ? ` · ${proyecto.nombre}` : ''}${d.minuta.organizador ? ` · convoca ${d.minuta.organizador}` : ''}`,
      })
    }
  })

  a.adicionales.forEach((x) => {
    if (x.estado !== 'aprobado' || !misProyectos.includes(x.proyectoId)) return
    const proyecto = a.proyectos.find((p) => p.id === x.proyectoId)
    salida.push({
      id: `dev-adicional-${x.id}`, departamento: 'desarrollador', prioridad: 'info', ruta: `/proyectos/${x.proyectoId}?pestana=adicionales`, fecha: (x.decision?.fecha ?? HOY).slice(0, 10),
      titulo: `Nuevo adicional aprobado · ${proyecto?.nombre ?? ''}`,
      detalle: `${x.titulo}${x.diasEstimados ? ` · ${x.diasEstimados} días de trabajo` : ''}${x.decision?.fechaEntregaNueva ? ` · nueva entrega ${formatoFecha(x.decision.fechaEntregaNueva)}` : ''}`,
    })
  })

  a.evidencias.forEach((e) => {
    const proyecto = a.proyectos.find((p) => p.id === e.proyectoId)
    const ruta = `/proyectos/${e.proyectoId}?pestana=evidencias`
    if (e.desarrolladorId === dev.id && e.revision && e.estado !== 'pendiente') {
      salida.push({
        id: `dev-evidencia-${e.id}-${e.estado}-${e.revision.fecha}`, departamento: 'desarrollador', prioridad: e.estado === 'observada' ? 'alerta' : 'exito', ruta, fecha: e.revision.fecha.slice(0, 10),
        titulo: e.estado === 'observada' ? 'Evidencia con observación' : 'Evidencia validada',
        detalle: `${e.titulo} · ${proyecto?.nombre ?? ''}${e.estado === 'observada' && e.revision.comentario ? ` · «${e.revision.comentario}»` : ` · revisó ${e.revision.por}`}`,
      })
    }
    const comoJefe = jefeDeProyecto(a.asignaciones, e.proyectoId)?.desarrolladorId === dev.id
    if (comoJefe && e.desarrolladorId !== dev.id && e.estado === 'pendiente') {
      const autor = a.desarrolladores.find((d) => d.id === e.desarrolladorId)
      salida.push({
        id: `dev-revisar-${e.id}`, departamento: 'desarrollador', prioridad: 'info', ruta, fecha: e.creadoEn.slice(0, 10),
        titulo: `Evidencia por revisar · ${autor?.nombre ?? ''}`,
        detalle: `${e.titulo} · ${proyecto?.nombre ?? ''}`,
      })
    }
  })

  a.cuotas.forEach((q) => {
    const contrato = a.contratos.find((k) => k.id === q.contratoId)
    if (!contrato || !misProyectos.includes(contrato.proyectoId) || !q.estadoEntrega.startsWith('Atraso')) return
    const proyecto = a.proyectos.find((p) => p.id === contrato.proyectoId)
    salida.push({
      id: `dev-atraso-${q.id}`, departamento: 'desarrollador', prioridad: 'peligro', ruta: `/proyectos/${contrato.proyectoId}`, fecha: q.fechaProyectada ?? HOY,
      titulo: `Entregable con atraso · ${proyecto?.nombre ?? ''}`,
      detalle: `${q.entregable || q.concepto} (${q.estadoEntrega.toLowerCase()})`,
    })
  })
  return salida
}

/** Dirección: visión global del equipo técnico (horas por encima del plan, horas extra aprobadas, sobrecarga). */
const deDireccion = (a: Almacen): Notificacion[] => {
  const salida: Notificacion[] = []
  a.horasExtra.forEach((x) => {
    const dev = a.desarrolladores.find((d) => d.id === x.desarrolladorId)
    const proyecto = a.proyectos.find((p) => p.id === x.proyectoId)
    salida.push({
      id: `dir-extra-${x.id}-${x.horas}`, departamento: 'direccion', prioridad: 'info', ruta: `/proyectos/${x.proyectoId}`, fecha: x.fecha.slice(0, 10),
      titulo: `Horas extra aprobadas a ${dev?.nombre ?? 'un desarrollador'}`,
      detalle: `+${x.horas} h · ${proyecto?.nombre ?? ''} · semana del ${etiquetaSemana(x.semana)}${x.vista ? ' · ya la vio' : ' · aún no la ve'}`,
    })
  })
  a.documentos.forEach((d) => {
    if (!d.minuta || d.minuta.fecha < HOY || areasDeReunion(d).includes('comercial')) return
    const proyecto = a.proyectos.find((p) => p.id === d.proyectoId)
    salida.push({
      id: `dir-reunion-${d.id}`, departamento: 'direccion', prioridad: 'info', ruta: '/reuniones', fecha: d.minuta.fecha,
      titulo: `${d.minuta.alcance === 'equipo' ? 'Reunión de equipo' : 'Reunión agendada'} ${enDias(diasEntre(HOY, d.minuta.fecha))}`,
      detalle: `${d.titulo}${proyecto ? ` · ${proyecto.nombre}` : ''}${d.minuta.organizador ? ` · convoca ${d.minuta.organizador}` : ''}`,
    })
  })
  a.evidencias.filter((e) => e.estado === 'pendiente').forEach((e) => {
    const dev = a.desarrolladores.find((d) => d.id === e.desarrolladorId)
    const proyecto = a.proyectos.find((p) => p.id === e.proyectoId)
    salida.push({
      id: `dir-evidencia-${e.id}`, departamento: 'direccion', prioridad: 'info', ruta: `/proyectos/${e.proyectoId}?pestana=evidencias`, fecha: e.creadoEn.slice(0, 10),
      titulo: `Nueva evidencia de ${dev?.nombre ?? 'un desarrollador'}`,
      detalle: `${e.titulo} · ${proyecto?.nombre ?? ''} · por revisar`,
    })
  })
  a.desarrolladores.forEach((d) => {
    const horas = a.asignaciones.filter((x) => x.desarrolladorId === d.id).reduce((s, x) => s + x.horasSemana, 0)
    if (horas <= 40) return
    salida.push({
      id: `dir-carga-${d.id}-${horas}`, departamento: 'direccion', prioridad: 'alerta', ruta: '/desarrolladores', fecha: HOY,
      titulo: `${d.nombre} está sobrecargado`,
      detalle: `${horas} h por semana asignadas (máximo recomendado 40 h)`,
    })
  })
  return salida
}

/**
 * Cada departamento recibe solo lo suyo. El administrador recibe todo:
 * finanzas, comercial, el desarrollo de todo el equipo y los avisos propios de dirección.
 */
export const notificacionesPara = (a: Almacen, usuario: Usuario): Notificacion[] => {
  let lista: Notificacion[]
  if (usuario.rol === 'administrador') {
    // Del área de desarrollo, dirección ve los compromisos de cada persona y los atrasos de entregables
    // (las reuniones y horas extra ya llegan por comercial y por dirección).
    const unicos = new Map<string, Notificacion>()
    a.desarrolladores.forEach((d) =>
      deDesarrollador(a, d.id).forEach((n) => {
        if (n.id.startsWith('dev-compromiso-')) unicos.set(`${n.id}-${d.id}`, { ...n, id: `${n.id}-${d.id}`, titulo: `${n.titulo} · ${d.nombre}` })
        if (n.id.startsWith('dev-atraso-')) unicos.set(n.id, n)
      })
    )
    lista = [...deDireccion(a), ...deFinanzas(a), ...deComercial(a), ...unicos.values()]
  } else if (usuario.rol === 'finanzas') {
    lista = deFinanzas(a)
  } else if (usuario.rol === 'comercial') {
    lista = deComercial(a)
  } else {
    const dev = a.desarrolladores.find((d) => d.usuarioId === usuario.id)
    lista = dev ? deDesarrollador(a, dev.id) : []
  }
  return lista.sort((x, y) => PESO[x.prioridad] - PESO[y.prioridad] || y.fecha.localeCompare(x.fecha))
}
