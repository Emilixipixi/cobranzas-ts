export const soloEnteros = (texto: string, maxDigitos = 3): string => texto.replace(/\D/g, '').slice(0, maxDigitos)

export const soloDecimales = (texto: string, decimales = 2, maxEnteros = 9): string => {
  const limpio = texto.replace(/,/g, '.').replace(/[^0-9.]/g, '')
  const [entera, ...resto] = limpio.split('.')
  const parteEntera = entera.slice(0, maxEnteros)
  if (resto.length === 0) return parteEntera
  return `${parteEntera}.${resto.join('').slice(0, decimales)}`
}

export const aNumero = (texto: string): number => {
  const numero = Number(texto)
  return Number.isFinite(numero) ? numero : 0
}