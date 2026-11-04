import { useAuditoria } from '../../contextos/AuditoriaContext'

export default function PestanaAuditoria({ proyectoId }: { proyectoId: string }) {
  const { registros } = useAuditoria()
  const lista = registros.filter((r) => r.proyectoId === proyectoId)

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead className="text-left text-slate-500">
          <tr>
            {['Fecha', 'Usuario', 'Acción', 'Detalle'].map((t) => <th key={t} className="p-3 font-medium">{t}</th>)}
          </tr>
        </thead>
        <tbody>
          {lista.length === 0 && <tr><td colSpan={4} className="p-4 text-center text-slate-400">Sin modificaciones registradas en esta sesión</td></tr>}
          {lista.map((r) => (
            <tr key={r.id} className="border-t border-slate-100">
              <td className="whitespace-nowrap p-3">{new Date(r.fecha).toLocaleString('es-EC')}</td>
              <td className="p-3">{r.usuario}</td>
              <td className="p-3">{r.accion}</td>
              <td className="p-3">{r.detalle}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
