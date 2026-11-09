import { Link } from 'react-router-dom'
import { BellRing, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../contextos/AuthContext'
import { useDatos } from '../contextos/DatosContext'
import { redondearHoras } from '../utils/equipo'
import { etiquetaSemana } from '../utils/semanas'
import type { Desarrollador } from '../tipos'

export default function AvisoHorasExtra({ desarrollador }: { desarrollador: Desarrollador }) {
  const { usuario } = useAuth()
  const { horasExtra, proyectos, marcarHorasExtraVistas } = useDatos()

  const nuevas = horasExtra
    .filter((x) => x.desarrolladorId === desarrollador.id && !x.vista)
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
  if (nuevas.length === 0) return null

  const total = redondearHoras(nuevas.reduce((suma, x) => suma + x.horas, 0))
  const esPropio = usuario?.id === desarrollador.usuarioId

  return (
    <div role="status" className="mb-5 overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-white shadow-sm">
      <div className="flex flex-wrap items-start gap-4 p-4">
        <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white">
          <BellRing className="h-5 w-5" />
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">{nuevas.length}</span>
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-slate-900">
            {nuevas.length === 1 ? `Te aprobaron ${total} h extra` : `Te aprobaron ${total} h extra en ${nuevas.length} semanas`}
          </p>
          <ul className="mt-2 space-y-1.5">
            {nuevas.map((x) => {
              const proyecto = proyectos.find((p) => p.id === x.proyectoId)
              return (
                <li key={x.id} className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-slate-600">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  <strong className="tabular-nums text-emerald-700">+{x.horas} h</strong>
                  <span>en</span>
                  {proyecto ? (
                    <Link to={`/proyectos/${proyecto.id}`} className="font-medium text-indigo-700 hover:underline">{proyecto.nombre}</Link>
                  ) : (
                    <span>un proyecto eliminado</span>
                  )}
                  <span className="text-slate-500">· semana del {etiquetaSemana(x.semana)} · aprobó {x.aprobadoPor}</span>
                </li>
              )
            })}
          </ul>
        </div>
        {esPropio && (
          <button
            onClick={() => marcarHorasExtraVistas(nuevas.map((x) => x.id))}
            className="shrink-0 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-emerald-700"
          >
            Entendido
          </button>
        )}
      </div>
    </div>
  )
}
