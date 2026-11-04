import { useAuditoria } from '../contextos/AuditoriaContext'
import { useDatos } from '../contextos/DatosContext'

export default function Auditoria() {
  const { registros } = useAuditoria()
  const { proyectos } = useDatos()

  return (
    <>
      <h2 className="mb-4 text-xl font-semibold">Registro de auditoría</h2>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="text-left text-slate-500">
            <tr>
              {['Fecha', 'Usuario', 'Rol', 'Proyecto', 'Acción', 'Detalle'].map((t) => <th key={t} className="p-3 font-medium">{t}</th>)}
            </tr>
          </thead>
          <tbody>
            {registros.length === 0 && (
              <tr><td colSpan={6} className="p-4 text-center text-slate-400">Aún no hay modificaciones registradas</td></tr>
            )}
            {registros.map((r) => (
              <tr key={r.id} className="border-t border-slate-100">
                <td className="whitespace-nowrap p-3">{new Date(r.fecha).toLocaleString('es-EC')}</td>
                <td className="p-3">{r.usuario}</td>
                <td className="p-3 capitalize">{r.rol}</td>
                <td className="whitespace-nowrap p-3">{proyectos.find((p) => p.id === r.proyectoId)?.codigo ?? '—'}</td>
                <td className="p-3">{r.accion}</td>
                <td className="p-3">{r.detalle}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
