import type { Adicional, Contrato, EstadoAdicional } from '../tipos'

export const ESTADOS_ADICIONAL: Record<EstadoAdicional, { etiqueta: string; clase: string; color: string }> = {
  solicitado: { etiqueta: 'Solicitado', clase: 'border-slate-200 bg-slate-50 text-slate-700', color: '#94a3b8' },
  cotizado: { etiqueta: 'Cotizado', clase: 'border-amber-200 bg-amber-50 text-amber-700', color: '#f59e0b' },
  aprobado: { etiqueta: 'Aprobado', clase: 'border-emerald-200 bg-emerald-50 text-emerald-700', color: '#10b981' },
  rechazado: { etiqueta: 'Rechazado', clase: 'border-rose-200 bg-rose-50 text-rose-700', color: '#f43f5e' },
}

/** Pasos del flujo, en orden, para dibujar el avance de cada solicitud. */
export const PASOS_ADICIONAL: EstadoAdicional[] = ['solicitado', 'cotizado', 'aprobado']

export const pendientesDeDecision = (adicionales: Adicional[]): Adicional[] =>
  adicionales.filter((a) => a.estado === 'solicitado' || a.estado === 'cotizado')

export const ETIQUETA_TIPO_CONTRATO: Record<Contrato['tipo'], string> = {
  original: 'Original',
  ampliacion: 'Ampliación',
  nuevo: 'Contrato nuevo',
}

/** Total de un proyecto separado por tipo de contrato (RF-52: sin mezclar cronogramas). */
export const totalPorTipo = (contratos: Contrato[], proyectoId: string) => {
  const propios = contratos.filter((k) => k.proyectoId === proyectoId)
  const suma = (tipo: Contrato['tipo']) => propios.filter((k) => k.tipo === tipo).reduce((s, k) => s + k.monto, 0)
  const original = suma('original')
  const ampliaciones = suma('ampliacion')
  const nuevos = suma('nuevo')
  return { original, ampliaciones, nuevos, total: original + ampliaciones + nuevos, contratos: propios }
}
