import { HOY } from '../datos/datosEjemplo'
import type { AprobacionHorasExtra, Asignacion, Proyecto, RegistroHoras } from '../tipos'
import { horasDiariasDe, horasSemanalesDe, redondearHoras } from './equipo'
import { diasLaborablesTranscurridos, semanasEntre } from './semanas'

export const VENTANA_SEMANAS = 12

export const aprobacionExtra = (extras: AprobacionHorasExtra[], proyectoId: string, desarrolladorId: string, semana: string): AprobacionHorasExtra | undefined =>
  extras.find((x) => x.proyectoId === proyectoId && x.desarrolladorId === desarrolladorId && x.semana === semana)

export const horasExtraDe = (extras: AprobacionHorasExtra[], proyectoId: string, desarrolladorId: string, semana: string): number =>
  aprobacionExtra(extras, proyectoId, desarrolladorId, semana)?.horas ?? 0

const suma = (registros: RegistroHoras[]): number => redondearHoras(registros.reduce((total, r) => total + r.horas, 0))

export const horasDe = (registros: RegistroHoras[], proyectoId: string, desarrolladorId: string, semana: string): number =>
  registros.find((r) => r.proyectoId === proyectoId && r.desarrolladorId === desarrolladorId && r.semana === semana)?.horas ?? 0

export const totalDeDesarrollador = (registros: RegistroHoras[], proyectoId: string, desarrolladorId: string): number =>
  suma(registros.filter((r) => r.proyectoId === proyectoId && r.desarrolladorId === desarrolladorId))

export const totalDeSemana = (registros: RegistroHoras[], proyectoId: string, semana: string): number =>
  suma(registros.filter((r) => r.proyectoId === proyectoId && r.semana === semana))

export const totalDeProyecto = (registros: RegistroHoras[], proyectoId: string): number =>
  suma(registros.filter((r) => r.proyectoId === proyectoId))

export const semanasDelProyecto = (proyecto: Proyecto): string[] =>
  proyecto.fechaInicio > HOY ? [] : semanasEntre(proyecto.fechaInicio, HOY)

export const planificadoALaFecha = (asignacion: Asignacion, proyecto: Proyecto): number => {
  const semanas = semanasDelProyecto(proyecto)
  if (semanas.length === 0) return 0
  const horasDia = horasDiariasDe(asignacion)
  return redondearHoras((semanas.length - 1) * horasSemanalesDe(horasDia) + horasDia * diasLaborablesTranscurridos(HOY))
}

export const cumplimiento = (invertido: number, planificado: number): number | null =>
  planificado > 0 ? Math.round((invertido / planificado) * 100) : null

export const idsConHoras = (registros: RegistroHoras[], proyectoId: string, equipo: Asignacion[]): string[] => {
  const ids = equipo.map((a) => a.desarrolladorId)
  registros.filter((r) => r.proyectoId === proyectoId).forEach((r) => {
    if (!ids.includes(r.desarrolladorId)) ids.push(r.desarrolladorId)
  })
  return ids
}