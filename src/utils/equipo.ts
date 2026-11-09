import type { Asignacion } from '../tipos'

export const DIAS_LABORABLES_SEMANA = 5

export const redondearHoras = (n: number): number => Math.round(n * 100) / 100

export const horasSemanalesDe = (horasDiarias: number): number => redondearHoras(horasDiarias * DIAS_LABORABLES_SEMANA)

export const horasDiariasDe = (asignacion: Asignacion): number =>
  asignacion.horasDiarias ?? redondearHoras(asignacion.horasSemana / DIAS_LABORABLES_SEMANA)

export const esJefe = (asignacion: Asignacion, equipo: Asignacion[]): boolean => {
  if (asignacion.rol) return asignacion.rol === 'jefe'
  const hayJefeExplicito = equipo.some((a) => a.rol === 'jefe')
  return !hayJefeExplicito && equipo[0]?.id === asignacion.id
}

export const equipoDeProyecto = (asignaciones: Asignacion[], proyectoId: string): Asignacion[] => {
  const equipo = asignaciones.filter((a) => a.proyectoId === proyectoId)
  return [...equipo].sort((a, b) => Number(esJefe(b, equipo)) - Number(esJefe(a, equipo)))
}

export const jefeDeProyecto = (asignaciones: Asignacion[], proyectoId: string): Asignacion | undefined => {
  const equipo = asignaciones.filter((a) => a.proyectoId === proyectoId)
  return equipo.find((a) => esJefe(a, equipo))
}