import { Link } from 'react-router-dom'
import { useDatos } from '../contextos/DatosContext'
import { formatoFecha } from '../utils/finanzas'

export default function Reuniones() {
  const { documentos, proyectos } = useDatos()
  const minutas = documentos.filter((d) => d.categoria === 'minuta' && d.minuta).sort((a, b) => b.fecha.localeCompare(a.fecha))

  return (
    <>
      <h2 className="mb-4 text-xl font-semibold">Reuniones y acuerdos</h2>
      <div className="space-y-3">
        {minutas.length === 0 && <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-400">Aún no hay minutas registradas</p>}
        {minutas.map((d) => {
          const proyecto = proyectos.find((p) => p.id === d.proyectoId)
          return (
            <div key={d.id} className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">{d.titulo}</p>
                <span className="text-xs text-slate-500">{formatoFecha(d.minuta?.fecha)}</span>
              </div>
              {proyecto && <Link to={`/proyectos/${proyecto.id}`} className="text-xs text-blue-700 hover:underline">{proyecto.nombre}</Link>}
              <p className="mt-2 text-xs text-slate-500">Asistentes: {d.minuta?.asistentes.join(', ') || '—'}</p>
              <ul className="mt-1 list-disc pl-5">
                {d.minuta?.acuerdos.map((a, i) => <li key={i}>{a}</li>)}
              </ul>
              {d.minuta && d.minuta.pendientes.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {d.minuta.pendientes.map((p, i) => (
                    <li key={i} className="rounded bg-slate-50 px-2 py-1 text-xs">
                      {p.tarea} · {p.responsable} · {formatoFecha(p.fecha)}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}
