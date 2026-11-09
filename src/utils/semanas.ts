const MS_DIA = 86400000
const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

const aFecha = (texto: string): Date => new Date(`${texto}T00:00:00Z`)

const aTexto = (fecha: Date): string => fecha.toISOString().slice(0, 10)

const indiceDia = (fecha: string): number => (aFecha(fecha).getUTCDay() + 6) % 7

export const inicioSemana = (fecha: string): string => aTexto(new Date(aFecha(fecha).getTime() - indiceDia(fecha) * MS_DIA))

export const semanasEntre = (desde: string, hasta: string): string[] => {
  const semanas: string[] = []
  const ultima = inicioSemana(hasta)
  let actual = inicioSemana(desde)
  while (actual <= ultima) {
    semanas.push(actual)
    actual = aTexto(new Date(aFecha(actual).getTime() + 7 * MS_DIA))
  }
  return semanas
}

export const diasLaborablesTranscurridos = (fecha: string): number => Math.min(5, indiceDia(fecha) + 1)

export const etiquetaCortaSemana = (lunes: string): string => {
  const fecha = aFecha(lunes)
  return `${fecha.getUTCDate()} ${MESES_CORTOS[fecha.getUTCMonth()]}`
}

export const etiquetaSemana = (lunes: string): string => {
  const inicio = aFecha(lunes)
  const fin = new Date(inicio.getTime() + 6 * MS_DIA)
  return `${etiquetaCortaSemana(lunes)} al ${fin.getUTCDate()} ${MESES_CORTOS[fin.getUTCMonth()]}`
}