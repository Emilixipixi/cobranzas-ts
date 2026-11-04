import { useState } from 'react'
import { useAuth } from '../contextos/AuthContext'
import { useDatos } from '../contextos/DatosContext'
import type { Rol } from '../tipos'
import DashboardComercial from './dashboards/DashboardComercial'
import DashboardDesarrollador from './dashboards/DashboardDesarrollador'
import DashboardDireccion from './dashboards/DashboardDireccion'
import DashboardFinanzas from './dashboards/DashboardFinanzas'

const VISTAS: { rol: Rol; titulo: string }[] = [
  { rol: 'administrador', titulo: 'Dirección' },
  { rol: 'finanzas', titulo: 'Finanzas' },
  { rol: 'comercial', titulo: 'Comercial' },
  { rol: 'desarrollador', titulo: 'Desarrollo' },
]

export default function Dashboard() {
  const { usuario } = useAuth()
  const { desarrolladores } = useDatos()
  const [vista, setVista] = useState<Rol>(usuario?.rol ?? 'administrador')

  if (!usuario) return null
  const esAdministrador = usuario.rol === 'administrador'
  const vistaActiva = esAdministrador ? vista : usuario.rol
  const titulo = VISTAS.find((v) => v.rol === vistaActiva)?.titulo ?? ''
  const desarrollador = desarrolladores.find((d) => d.usuarioId === usuario.id) ?? (esAdministrador ? desarrolladores[0] : undefined)

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-semibold">Dashboard · {titulo}</h2>
        {esAdministrador && (
          <div className="flex gap-1">
            {VISTAS.map((v) => (
              <button
                key={v.rol}
                onClick={() => setVista(v.rol)}
                className={`rounded-md border px-3 py-1 text-sm ${vistaActiva === v.rol ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 bg-white hover:bg-slate-50'}`}
              >
                {v.titulo}
              </button>
            ))}
          </div>
        )}
      </div>
      {vistaActiva === 'administrador' && <DashboardDireccion />}
      {vistaActiva === 'finanzas' && <DashboardFinanzas />}
      {vistaActiva === 'comercial' && <DashboardComercial />}
      {vistaActiva === 'desarrollador' && <DashboardDesarrollador desarrollador={desarrollador} />}
    </>
  )
}
