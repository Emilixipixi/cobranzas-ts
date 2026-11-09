import { Link } from 'react-router-dom'
import { CheckCircle2, Info, Trash2, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useAlertas } from '../contextos/AlertasContext'
import type { TipoAlerta } from '../contextos/AlertasContext'
import { useAuth } from '../contextos/AuthContext'

const ESTILOS: Record<TipoAlerta, { icono: LucideIcon; caja: string; chip: string }> = {
  exito: { icono: CheckCircle2, caja: 'border-emerald-200', chip: 'bg-emerald-50 text-emerald-600' },
  info: { icono: Info, caja: 'border-indigo-200', chip: 'bg-indigo-50 text-indigo-600' },
  peligro: { icono: Trash2, caja: 'border-rose-200', chip: 'bg-rose-50 text-rose-600' },
}

const partirDetalle = (detalle: string): string[] => detalle.split(/(?<=\.)\s+(?=[A-ZÁÉÍÓÚÑ])/)

export default function Alertas() {
  const { alertas, descartar } = useAlertas()
  const { usuario } = useAuth()

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed bottom-4 right-4 z-[70] flex w-full max-w-sm flex-col gap-2 px-4 sm:px-0"
    >
      {alertas.map((alerta) => {
        const estilo = ESTILOS[alerta.tipo]
        const Icono = estilo.icono
        return (
          <div
            key={alerta.id}
            role="status"
            data-alerta={alerta.titulo}
            className={`pointer-events-auto flex gap-3 rounded-xl border bg-white p-3 shadow-lg ${estilo.caja}`}
          >
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${estilo.chip}`}>
              <Icono className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900">{alerta.titulo}</p>
              <div className="mt-1 max-h-44 space-y-0.5 overflow-y-auto text-xs text-slate-600">
                {partirDetalle(alerta.detalle).map((linea, indice) => <p key={indice}>{linea}</p>)}
              </div>
              {usuario?.rol === 'administrador' && (
                <Link to="/auditoria" onClick={() => descartar(alerta.id)} className="mt-1 inline-block text-xs font-medium text-indigo-600 hover:underline">
                  Ver en auditoría
                </Link>
              )}
            </div>
            <button
              onClick={() => descartar(alerta.id)}
              aria-label="Cerrar alerta"
              className="h-6 w-6 shrink-0 rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="mx-auto h-4 w-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}