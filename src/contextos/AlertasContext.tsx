import { createContext, useContext, useRef, useState } from 'react'
import type { ReactNode } from 'react'

export type TipoAlerta = 'exito' | 'info' | 'peligro'

export interface Alerta {
  id: number
  titulo: string
  detalle: string
  tipo: TipoAlerta
}

interface AlertasContextoValor {
  alertas: Alerta[]
  notificar: (titulo: string, detalle: string, tipo?: TipoAlerta) => void
  descartar: (id: number) => void
}

const AlertasContext = createContext<AlertasContextoValor | null>(null)

const DURACION_MS = 7000
const MAXIMO_VISIBLES = 4

export function AlertasProvider({ children }: { children: ReactNode }) {
  const [alertas, setAlertas] = useState<Alerta[]>([])
  const contador = useRef(0)

  const descartar = (id: number) => setAlertas((previas) => previas.filter((a) => a.id !== id))

  const notificar = (titulo: string, detalle: string, tipo: TipoAlerta = 'exito') => {
    contador.current += 1
    const id = contador.current
    setAlertas((previas) => [...previas, { id, titulo, detalle, tipo }].slice(-MAXIMO_VISIBLES))
    setTimeout(() => descartar(id), DURACION_MS)
  }

  return <AlertasContext.Provider value={{ alertas, notificar, descartar }}>{children}</AlertasContext.Provider>
}

export function useAlertas(): AlertasContextoValor {
  const contexto = useContext(AlertasContext)
  if (!contexto) throw new Error('useAlertas debe usarse dentro de AlertasProvider')
  return contexto
}