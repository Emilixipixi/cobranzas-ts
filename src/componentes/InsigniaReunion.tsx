import { Lock } from 'lucide-react'
import { AREAS_REUNION, areasDeReunion } from '../utils/reuniones'
import type { Documento } from '../tipos'

/** Muestra con quién es la reunión: equipo de desarrollo (privada) o los departamentos invitados. */
export default function InsigniaReunion({ documento }: { documento: Documento }) {
  if (!documento.minuta) return null
  if (documento.minuta.alcance === 'equipo') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[11px] font-semibold text-violet-700">
        <Lock className="h-3 w-3" />
        Equipo de desarrollo
      </span>
    )
  }
  const areas = areasDeReunion(documento)
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      {AREAS_REUNION.filter((a) => areas.includes(a.id)).map((a) => (
        <span key={a.id} className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-600">
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: a.color }} />
          {a.etiqueta}
        </span>
      ))}
    </span>
  )
}
