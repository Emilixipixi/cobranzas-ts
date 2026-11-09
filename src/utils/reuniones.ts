import type { AlcanceReunion, AreaReunion, Asignacion, Desarrollador, Documento, Proyecto, Rol, Usuario } from '../tipos'
import { jefeDeProyecto } from './equipo'

export const AREAS_REUNION: { id: AreaReunion; etiqueta: string; color: string }[] = [
  { id: 'direccion', etiqueta: 'Dirección', color: '#6366f1' },
  { id: 'comercial', etiqueta: 'Comercial', color: '#0ea5e9' },
  { id: 'finanzas', etiqueta: 'Finanzas', color: '#10b981' },
  { id: 'desarrollo', etiqueta: 'Desarrollo', color: '#8b5cf6' },
]

export const ETIQUETA_AREA = Object.fromEntries(AREAS_REUNION.map((a) => [a.id, a.etiqueta])) as Record<AreaReunion, string>

export const areaDeRol = (rol: Rol): AreaReunion =>
  rol === 'administrador' ? 'direccion' : rol === 'desarrollador' ? 'desarrollo' : rol

/** Reuniones antiguas (sin alcance) se consideran abiertas a todas las áreas. */
export const areasDeReunion = (d: Documento): AreaReunion[] =>
  d.minuta?.alcance === 'equipo' ? ['desarrollo'] : d.minuta?.areas?.length ? d.minuta.areas : AREAS_REUNION.map((a) => a.id)

const desarrolladorDe = (usuario: Usuario, desarrolladores: Desarrollador[]) => desarrolladores.find((d) => d.usuarioId === usuario.id)

const enEquipo = (usuario: Usuario, proyectoId: string, desarrolladores: Desarrollador[], asignaciones: Asignacion[]): boolean => {
  const dev = desarrolladorDe(usuario, desarrolladores)
  return Boolean(dev && asignaciones.some((a) => a.proyectoId === proyectoId && a.desarrolladorId === dev.id))
}

export const esJefeDe = (usuario: Usuario | null, proyectoId: string, desarrolladores: Desarrollador[], asignaciones: Asignacion[]): boolean => {
  if (!usuario || usuario.rol !== 'desarrollador') return false
  const dev = desarrolladorDe(usuario, desarrolladores)
  return Boolean(dev && jefeDeProyecto(asignaciones, proyectoId)?.desarrolladorId === dev.id)
}

/**
 * Quién ve una reunión:
 * - El administrador, todas.
 * - Reunión de equipo: solo los desarrolladores del proyecto.
 * - Reunión con áreas: las áreas invitadas (en Desarrollo, solo el equipo del proyecto).
 */
export const puedeVerReunion = (usuario: Usuario | null, d: Documento, desarrolladores: Desarrollador[], asignaciones: Asignacion[]): boolean => {
  if (!d.minuta) return true
  if (!usuario) return false
  if (usuario.rol === 'administrador' || d.minuta.organizadorId === usuario.id) return true
  const area = areaDeRol(usuario.rol)
  if (!areasDeReunion(d).includes(area)) return false
  if (area === 'desarrollo') return enEquipo(usuario, d.proyectoId, desarrolladores, asignaciones)
  return true
}

/** Proyectos en los que el usuario puede agendar: admin y comercial en todos, el jefe de proyecto en los suyos. */
export const proyectosParaAgendar = (usuario: Usuario | null, proyectos: Proyecto[], desarrolladores: Desarrollador[], asignaciones: Asignacion[]): Proyecto[] => {
  if (!usuario) return []
  if (usuario.rol === 'administrador' || usuario.rol === 'comercial') return proyectos
  if (usuario.rol === 'desarrollador') return proyectos.filter((p) => esJefeDe(usuario, p.id, desarrolladores, asignaciones))
  return []
}

/** Las reuniones internas de desarrollo solo las crean el administrador y el jefe de proyecto. */
export const alcancesPermitidos = (usuario: Usuario | null): AlcanceReunion[] =>
  usuario?.rol === 'administrador' || usuario?.rol === 'desarrollador' ? ['equipo', 'areas'] : usuario?.rol === 'comercial' ? ['areas'] : []

/** Editar el enlace: el administrador, quien la organizó y comercial en las reuniones con su área. */
export const puedeEditarReunion = (usuario: Usuario | null, d: Documento): boolean => {
  if (!usuario || !d.minuta) return false
  if (usuario.rol === 'administrador' || d.minuta.organizadorId === usuario.id) return true
  return usuario.rol === 'comercial' && areasDeReunion(d).includes('comercial')
}

/** Versión para quien solo tiene el rol y el id (notificaciones). */
export const visiblePara = (rol: Rol, usuarioId: string, d: Documento, desarrolladores: Desarrollador[], asignaciones: Asignacion[]): boolean =>
  puedeVerReunion({ id: usuarioId, rol } as Usuario, d, desarrolladores, asignaciones)
