// Indicadores del ciclo comercial: etapas del embudo, pendientes y oportunidades.
import { HOY } from '../datos/datosEjemplo'
import type { Contrato, Cuota, Documento, Proyecto } from '../tipos'
import { diasEntre } from './finanzas'

export type EtapaComercial = 'alta' | 'prototipo' | 'contratacion' | 'desarrollo' | 'entrega' | 'ampliacion'

export const ETAPAS_COMERCIALES: { id: EtapaComercial; etiqueta: string; detalle: string; color: string }[] = [
  { id: 'alta', etiqueta: 'Alta comercial', detalle: 'Cliente registrado, sin cotización', color: '#94a3b8' },
  { id: 'prototipo', etiqueta: 'Prototipo', detalle: 'Prototipo en preparación o presentado', color: '#f59e0b' },
  { id: 'contratacion', etiqueta: 'Contratación', detalle: 'Prototipo validado, contrato por firmar', color: '#f97316' },
  { id: 'desarrollo', etiqueta: 'Desarrollo', detalle: 'Contrato firmado, en construcción', color: '#0ea5e9' },
  { id: 'entrega', etiqueta: 'Entrega', detalle: 'En entrega o cerrado', color: '#6366f1' },
  { id: 'ampliacion', etiqueta: 'Ampliación', detalle: 'Con contrato de ampliación', color: '#10b981' },
]

const docsDe = (documentos: Documento[], proyectoId: string) => documentos.filter((d) => d.proyectoId === proyectoId)
const cerrado = (d: Documento) => d.estado === 'firmado' || d.estado === 'aprobado'

export const tieneContratoFirmado = (documentos: Documento[], proyectoId: string): boolean =>
  docsDe(documentos, proyectoId).some((d) => d.categoria === 'contrato' && d.estado === 'firmado')

/** Etapa actual del proyecto dentro del embudo comercial. */
export const etapaComercial = (p: Proyecto, contratos: Contrato[], documentos: Documento[]): EtapaComercial => {
  if (contratos.some((k) => k.proyectoId === p.id && k.tipo === 'ampliacion')) return 'ampliacion'
  if (p.estado === 'En entrega' || p.estado === 'Cerrado') return 'entrega'
  if (p.estado === 'En desarrollo') return 'desarrollo'
  if (p.prototipo === 'Validado') return 'contratacion'
  const hayCotizacion = docsDe(documentos, p.id).some((d) => d.categoria === 'cotizacion')
  return p.prototipo === 'Pendiente' && !hayCotizacion ? 'alta' : 'prototipo'
}

/** Cotizaciones cuyo proyecto todavía no tiene contrato firmado. */
export const cotizacionesAbiertas = (documentos: Documento[]): Documento[] =>
  documentos
    .filter((d) => d.categoria === 'cotizacion' && !tieneContratoFirmado(documentos, d.proyectoId))
    .sort((a, b) => a.fecha.localeCompare(b.fecha))

export interface MetaSinDefinir {
  cuota: Cuota
  faltantes: string[]
}

/** Cuotas del plan con entregable, fecha o valor pendientes de definir (RF-16 permite completarlos después). */
export const metasSinDefinir = (cuotas: Cuota[]): MetaSinDefinir[] =>
  cuotas
    .map((q) => ({
      cuota: q,
      faltantes: [
        !q.entregable.trim() ? 'entregable' : '',
        !q.fechaProyectada && q.modalidad !== 'hito' ? 'fecha' : '',
        q.valor <= 0 ? 'valor' : '',
      ].filter(Boolean),
    }))
    .filter((m) => m.faltantes.length > 0)

export interface DocumentoFaltante {
  proyecto: Proyecto
  faltan: string[]
}

/** Documentos que el expediente debería tener según la etapa del proyecto. */
export const documentosFaltantes = (proyectos: Proyecto[], documentos: Documento[]): DocumentoFaltante[] =>
  proyectos
    .map((p) => {
      const propios = docsDe(documentos, p.id)
      const faltan: string[] = []
      if (!propios.some((d) => d.categoria === 'cotizacion' && cerrado(d))) faltan.push('Cotización aprobada')
      if (p.estado !== 'Prototipo' && !tieneContratoFirmado(documentos, p.id)) faltan.push('Contrato firmado')
      if ((p.estado === 'En entrega' || p.estado === 'Cerrado') && !propios.some((d) => d.categoria === 'acta' && cerrado(d))) faltan.push('Acta de entrega')
      return { proyecto: p, faltan }
    })
    .filter((x) => x.faltan.length > 0)

export interface Oportunidad {
  proyecto: Proyecto
  motivo: string
  diasParaEntrega: number
  yaAmpliado: boolean
}

/** Proyectos entregados o a punto de cerrar: buen momento para ofrecer una ampliación. */
export const oportunidadesAmpliacion = (proyectos: Proyecto[], contratos: Contrato[], ventanaDias = 45): Oportunidad[] =>
  proyectos
    .map((p) => {
      const dias = diasEntre(HOY, p.fechaEntrega)
      const motivo =
        p.estado === 'Cerrado' ? 'Proyecto cerrado' : p.estado === 'En entrega' ? 'En etapa de entrega' : p.estado === 'En desarrollo' && dias <= ventanaDias ? `Entrega ${dias < 0 ? 'vencida' : `en ${dias} días`}` : ''
      return { proyecto: p, motivo, diasParaEntrega: dias, yaAmpliado: contratos.some((k) => k.proyectoId === p.id && k.tipo === 'ampliacion') }
    })
    .filter((o) => o.motivo)
    .sort((a, b) => a.diasParaEntrega - b.diasParaEntrega)
