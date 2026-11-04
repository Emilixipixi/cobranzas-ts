import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { useAuth } from './AuthContext'
import type { RegistroAuditoria } from '../tipos'

interface AuditoriaContextoValor {
  registros: RegistroAuditoria[]
  registrar: (accion: string, detalle: string, proyectoId?: string) => void
  limpiar: () => void
}

const AuditoriaContext = createContext<AuditoriaContextoValor | null>(null)

const CLAVE_AUDITORIA = 'cobranzasAuditoriaV1'

const cargarRegistros = (): RegistroAuditoria[] => {
  try {
    const guardado = localStorage.getItem(CLAVE_AUDITORIA)
    if (guardado) return JSON.parse(guardado) as RegistroAuditoria[]
  } catch {
    return []
  }
  return []
}

export function AuditoriaProvider({ children }: { children: ReactNode }) {
  const { usuario } = useAuth()
  const [registros, setRegistros] = useState<RegistroAuditoria[]>(cargarRegistros)

  useEffect(() => {
    try {
      localStorage.setItem(CLAVE_AUDITORIA, JSON.stringify(registros))
    } catch {
      return
    }
  }, [registros])

  const registrar = (accion: string, detalle: string, proyectoId?: string) => {
    if (!usuario) return
    const nuevo: RegistroAuditoria = {
      id: crypto.randomUUID(),
      fecha: new Date().toISOString(),
      usuario: usuario.nombre,
      rol: usuario.rol,
      accion,
      detalle,
      proyectoId,
    }
    setRegistros((anteriores) => [nuevo, ...anteriores])
  }

  const limpiar = () => setRegistros([])

  return <AuditoriaContext.Provider value={{ registros, registrar, limpiar }}>{children}</AuditoriaContext.Provider>
}

export function useAuditoria(): AuditoriaContextoValor {
  const contexto = useContext(AuditoriaContext)
  if (!contexto) throw new Error('useAuditoria debe usarse dentro de AuditoriaProvider')
  return contexto
}
