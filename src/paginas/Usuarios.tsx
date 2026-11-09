import { useState } from 'react'
import { Briefcase, Code2, Landmark, ShieldCheck, Trash2, UserPlus } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import Avatar from '../componentes/Avatar'
import ModalUsuario, { ETIQUETAS_ROL } from '../componentes/modales/ModalUsuario'
import { useAuditoria } from '../contextos/AuditoriaContext'
import { useAuth } from '../contextos/AuthContext'
import { useDatos } from '../contextos/DatosContext'
import { DOMINIO_CORPORATIVO } from '../datos/datosEjemplo'
import { botonPrimario } from '../utils/estilos'
import { formatoFecha } from '../utils/finanzas'
import type { Rol } from '../tipos'

const ICONOS_ROL: Record<Rol, LucideIcon> = {
  administrador: ShieldCheck,
  comercial: Briefcase,
  finanzas: Landmark,
  desarrollador: Code2,
}

const COLORES_ROL: Record<Rol, string> = {
  administrador: 'border-indigo-200 bg-indigo-50 text-indigo-700',
  comercial: 'border-sky-200 bg-sky-50 text-sky-700',
  finanzas: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  desarrollador: 'border-amber-200 bg-amber-50 text-amber-700',
}

const ROLES: Rol[] = ['administrador', 'comercial', 'finanzas', 'desarrollador']

export default function Usuarios() {
  const { usuario, usuarios, eliminarUsuario } = useAuth()
  const { registrar } = useAuditoria()
  const { desarrolladores, desvincularUsuario } = useDatos()
  const [creando, setCreando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const eliminar = (id: string, nombre: string) => {
    if (!window.confirm(`¿Eliminar el usuario de ${nombre}? Ya no podrá iniciar sesión.`)) return
    const objetivo = usuarios.find((u) => u.id === id)
    const resultado = eliminarUsuario(id)
    setError(resultado)
    if (resultado || !objetivo) return
    desvincularUsuario(id)
    registrar('Eliminó usuario', `${objetivo.nombre} (${ETIQUETAS_ROL[objetivo.rol]}): ${objetivo.correo}`)
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-semibold">Usuarios del sistema</h2>
          <p className="text-sm text-slate-500">Solo el administrador crea cuentas. Todas usan correo corporativo @{DOMINIO_CORPORATIVO}.</p>
        </div>
        <button className={`${botonPrimario} inline-flex items-center gap-2`} onClick={() => setCreando(true)}>
          <UserPlus className="h-4 w-4" />
          Nuevo usuario
        </button>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {ROLES.map((rol) => {
          const Icono = ICONOS_ROL[rol]
          return (
            <div key={rol} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg border ${COLORES_ROL[rol]}`}>
                <Icono className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold leading-none text-slate-900">{usuarios.filter((u) => u.rol === rol).length}</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-500">{ETIQUETAS_ROL[rol]}</p>
              </div>
            </div>
          )
        })}
      </div>

      {error && <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</div>}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="text-left text-slate-500">
            <tr>
              {['Nombre', 'Correo corporativo', 'Área', 'Alta', 'Perfil de desarrollador', ''].map((t) => <th key={t} className="p-3 font-medium">{t}</th>)}
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => {
              const Icono = ICONOS_ROL[u.rol]
              const perfil = desarrolladores.find((d) => d.usuarioId === u.id)
              const esYo = u.id === usuario?.id
              return (
                <tr key={u.id} className="border-t border-slate-100">
                  <td className="whitespace-nowrap p-3 font-medium text-slate-900">
                    <span className="flex items-center gap-2.5">
                      <Avatar usuario={u} tamano={30} />
                      {u.nombre}
                      {esYo && <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-slate-500">Tú</span>}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-xs text-slate-600">{u.correo}</td>
                  <td className="p-3">
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium ${COLORES_ROL[u.rol]}`}>
                      <Icono className="h-3.5 w-3.5" />
                      {ETIQUETAS_ROL[u.rol]}
                    </span>
                  </td>
                  <td className="whitespace-nowrap p-3 text-slate-600">{formatoFecha(u.fechaAlta)}</td>
                  <td className="p-3 text-xs text-slate-600">{u.rol === 'desarrollador' ? (perfil ? perfil.especialidad : 'Sin perfil') : '—'}</td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => eliminar(u.id, u.nombre)}
                      disabled={esYo}
                      title={esYo ? 'No puedes eliminar tu propio usuario' : 'Eliminar usuario'}
                      aria-label={`Eliminar a ${u.nombre}`}
                      className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {creando && <ModalUsuario onCerrar={() => setCreando(false)} />}
    </>
  )
}