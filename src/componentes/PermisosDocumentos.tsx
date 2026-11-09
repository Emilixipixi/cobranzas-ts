import { useState } from 'react'
import { Eye, EyeOff, Lock, ShieldCheck } from 'lucide-react'
import { useDatos } from '../contextos/DatosContext'
import { CATEGORIAS_CONTROLADAS, PERMISOS_DOCUMENTOS_INICIALES, ROLES_CONTROLADOS } from '../utils/permisosDocumentos'
import { Panel } from './Panel'

/** Matriz para que el administrador decida qué tipo de documento ve cada rol. */
export default function PermisosDocumentos() {
  const { permisosDocumentos, cambiarPermisoDocumento } = useDatos()
  const [error, setError] = useState<string | null>(null)
  const permisos = { ...PERMISOS_DOCUMENTOS_INICIALES, ...permisosDocumentos }

  return (
    <Panel
      titulo="Visibilidad de documentos por rol"
      subtitulo="Decide qué tipo de documento puede ver cada área. Lo que se oculta no aparece en listas, expedientes, búsquedas ni avisos."
      className="mb-5"
      accion={<span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700"><ShieldCheck className="h-3.5 w-3.5" />Solo administrador</span>}
    >
      <div className="-mx-5 -mb-5 overflow-x-auto border-t border-slate-100">
        <table className="w-full text-sm">
          <thead className="bg-slate-50/60 text-[11px] uppercase tracking-wider text-slate-500">
            <tr>
              <th className="p-3 text-left font-medium">Tipo de documento</th>
              <th className="p-3 text-center font-medium">Administrador</th>
              {ROLES_CONTROLADOS.map((r) => <th key={r.id} className="p-3 text-center font-medium">{r.etiqueta}</th>)}
            </tr>
          </thead>
          <tbody>
            {CATEGORIAS_CONTROLADAS.map((c) => (
              <tr key={c.id} className="border-t border-slate-100">
                <td className="p-3">
                  <p className="font-medium text-slate-900">{c.etiqueta}</p>
                  <p className="text-xs text-slate-500">{c.detalle}</p>
                </td>
                <td className="p-3 text-center">
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-400" title="El administrador siempre ve todo"><Lock className="h-3.5 w-3.5" />Siempre</span>
                </td>
                {ROLES_CONTROLADOS.map((r) => {
                  const permitido = permisos[c.id].includes(r.id)
                  return (
                    <td key={r.id} className="p-3 text-center">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={permitido}
                        aria-label={`${r.etiqueta} ${permitido ? 'puede' : 'no puede'} ver ${c.etiqueta.toLowerCase()}`}
                        onClick={() => setError(cambiarPermisoDocumento(c.id, r.id, !permitido))}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors ${permitido ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'}`}
                      >
                        {permitido ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                        {permitido ? 'Puede ver' : 'Oculto'}
                      </button>
                    </td>
                  )
                })}
              </tr>
            ))}
            <tr className="border-t border-slate-100 bg-slate-50/40">
              <td className="p-3" colSpan={2 + ROLES_CONTROLADOS.length}>
                <p className="text-xs text-slate-500">
                  <strong className="text-slate-700">Minutas de reunión:</strong> se controlan en cada reunión (equipo de desarrollo o áreas invitadas).
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      {error && <p className="mt-6 text-sm text-rose-600">{error}</p>}
    </Panel>
  )
}
