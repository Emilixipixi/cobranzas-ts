import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../contextos/AuthContext'
import type { Rol } from '../tipos'

interface Props {
  roles?: Rol[]
  children: ReactNode
}

export default function RutaProtegida({ roles, children }: Props) {
  const { usuario } = useAuth()
  if (!usuario) return <Navigate to="/login" replace />
  if (roles && !roles.includes(usuario.rol)) return <Navigate to="/" replace />
  return <>{children}</>
}
