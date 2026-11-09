import type { Asignacion, Desarrollador, EstadoEvidencia, Evidencia, TipoEvidencia, Usuario } from '../tipos'
import { jefeDeProyecto } from './equipo'

export const TIPOS_EVIDENCIA: { id: TipoEvidencia; etiqueta: string; color: string }[] = [
  { id: 'commit', etiqueta: 'Commit', color: '#6366f1' },
  { id: 'actividad', etiqueta: 'Actividad', color: '#0ea5e9' },
  { id: 'entrega', etiqueta: 'Entrega / demo', color: '#10b981' },
  { id: 'captura', etiqueta: 'Captura', color: '#f59e0b' },
  { id: 'documento', etiqueta: 'Documento técnico', color: '#8b5cf6' },
]

export const ETIQUETA_TIPO = Object.fromEntries(TIPOS_EVIDENCIA.map((t) => [t.id, t.etiqueta])) as Record<TipoEvidencia, string>
export const COLOR_TIPO = Object.fromEntries(TIPOS_EVIDENCIA.map((t) => [t.id, t.color])) as Record<TipoEvidencia, string>

export const ESTADOS_EVIDENCIA: Record<EstadoEvidencia, { etiqueta: string; clase: string; color: string }> = {
  pendiente: { etiqueta: 'Por revisar', clase: 'border-amber-200 bg-amber-50 text-amber-700', color: '#f59e0b' },
  validada: { etiqueta: 'Validada', clase: 'border-emerald-200 bg-emerald-50 text-emerald-700', color: '#10b981' },
  observada: { etiqueta: 'Con observación', clase: 'border-rose-200 bg-rose-50 text-rose-700', color: '#f43f5e' },
}

/** Hash corto de git: 7 a 40 caracteres hexadecimales. */
export const hashValido = (texto: string): boolean => /^[0-9a-f]{7,40}$/i.test(texto.trim())

/** Si se pega la URL de un commit (GitHub, GitLab, Bitbucket) se extrae su hash. */
export const hashDesdeEnlace = (enlace: string): string | null => {
  const coincidencia = enlace.match(/\/commits?\/([0-9a-f]{7,40})/i)
  return coincidencia ? coincidencia[1].slice(0, 7) : null
}

export const desarrolladorDeUsuario = (desarrolladores: Desarrollador[], usuario: Usuario | null): Desarrollador | undefined =>
  usuario ? desarrolladores.find((d) => d.usuarioId === usuario.id) : undefined

/** Integrantes del proyecto para los que este usuario puede registrar evidencias. */
export const registrablesPor = (usuario: Usuario | null, proyectoId: string, desarrolladores: Desarrollador[], asignaciones: Asignacion[]): Desarrollador[] => {
  if (!usuario) return []
  const equipo = asignaciones.filter((a) => a.proyectoId === proyectoId).map((a) => a.desarrolladorId)
  if (usuario.rol === 'administrador') return desarrolladores.filter((d) => equipo.includes(d.id))
  const propio = desarrolladorDeUsuario(desarrolladores, usuario)
  return propio && equipo.includes(propio.id) ? [propio] : []
}

/** Revisan el administrador y el jefe de proyecto (este último, nunca sus propias evidencias). */
export const puedeRevisar = (usuario: Usuario | null, evidencia: Evidencia, desarrolladores: Desarrollador[], asignaciones: Asignacion[]): boolean => {
  if (!usuario) return false
  if (usuario.rol === 'administrador') return true
  const propio = desarrolladorDeUsuario(desarrolladores, usuario)
  if (!propio || propio.id === evidencia.desarrolladorId) return false
  return jefeDeProyecto(asignaciones, evidencia.proyectoId)?.desarrolladorId === propio.id
}

/** El autor corrige o borra mientras no esté validada; el administrador siempre. */
export const puedeModificar = (usuario: Usuario | null, evidencia: Evidencia, desarrolladores: Desarrollador[]): boolean => {
  if (!usuario) return false
  if (usuario.rol === 'administrador') return true
  const propio = desarrolladorDeUsuario(desarrolladores, usuario)
  return propio?.id === evidencia.desarrolladorId && evidencia.estado !== 'validada'
}
