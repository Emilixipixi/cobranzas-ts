import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, Clock4, Plus } from 'lucide-react'
import { useDatos } from '../../contextos/DatosContext'
import { aNumero, soloDecimales } from '../../utils/numeros'
import { etiquetaSemana } from '../../utils/semanas'

interface Props {
  proyectoId: string
  desarrolladorId: string
  nombre: string
  semana: string
  plan: number
  extra: number
  esAdministrador: boolean
  onError: (mensaje: string | null) => void
}

export default function ControlHorasExtra({ proyectoId, desarrolladorId, nombre, semana, plan, extra, esAdministrador, onError }: Props) {
  const { aprobarHorasExtra, retirarHorasExtra } = useDatos()
  const [posicion, setPosicion] = useState<{ top: number; left: number } | null>(null)
  const [aprobado, setAprobado] = useState(extra > 0)
  const [cantidad, setCantidad] = useState(extra > 0 ? String(extra) : '')
  const boton = useRef<HTMLButtonElement>(null)
  const panel = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!posicion) return
    const cerrar = (e: MouseEvent) => {
      if (!panel.current?.contains(e.target as Node) && !boton.current?.contains(e.target as Node)) setPosicion(null)
    }
    const escape = (e: KeyboardEvent) => e.key === 'Escape' && setPosicion(null)
    const alDesplazar = (e: Event) => !panel.current?.contains(e.target as Node) && setPosicion(null)
    document.addEventListener('mousedown', cerrar)
    document.addEventListener('keydown', escape)
    window.addEventListener('scroll', alDesplazar, true)
    window.addEventListener('resize', alDesplazar)
    return () => {
      document.removeEventListener('mousedown', cerrar)
      document.removeEventListener('keydown', escape)
      window.removeEventListener('scroll', alDesplazar, true)
      window.removeEventListener('resize', alDesplazar)
    }
  }, [posicion])

  if (!esAdministrador) {
    return extra > 0 ? (
      <span title={`${extra} h extra aprobadas`} className="mt-0.5 inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 text-[10px] font-semibold text-emerald-700">
        +{extra} h
      </span>
    ) : null
  }

  const abrir = () => {
    const rect = boton.current?.getBoundingClientRect()
    if (!rect) return
    setAprobado(extra > 0)
    setCantidad(extra > 0 ? String(extra) : '')
    const ancho = 256
    setPosicion({ top: rect.bottom + 6, left: Math.max(8, Math.min(rect.right - ancho, window.innerWidth - ancho - 8)) })
  }

  const guardar = () => {
    const resultado = aprobado
      ? aprobarHorasExtra(proyectoId, desarrolladorId, semana, aNumero(soloDecimales(cantidad, 2, 2)))
      : retirarHorasExtra(proyectoId, desarrolladorId, semana)
    onError(resultado)
    if (!resultado) setPosicion(null)
  }

  return (
    <>
      <button
        ref={boton}
        type="button"
        onClick={() => (posicion ? setPosicion(null) : abrir())}
        title={extra > 0 ? `${extra} h extra aprobadas · clic para modificar` : 'Aprobar horas extra'}
        aria-label={`Horas extra de ${nombre} en la semana del ${etiquetaSemana(semana)}`}
        className={
          extra > 0
            ? 'mt-0.5 inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 text-[10px] font-semibold text-emerald-700 hover:bg-emerald-100'
            : 'mt-0.5 inline-flex items-center gap-0.5 rounded-full px-1.5 text-[10px] font-medium text-slate-300 hover:bg-indigo-50 hover:text-indigo-600'
        }
      >
        {extra > 0 ? <CheckCircle2 className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
        {extra > 0 ? `${extra} h` : 'extra'}
      </button>

      {posicion && (
        <div ref={panel} style={{ top: posicion.top, left: posicion.left }} className="fixed z-50 w-64 rounded-xl border border-slate-200 bg-white p-3 text-left shadow-lg">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-900">
            <Clock4 className="h-3.5 w-3.5 text-indigo-600" />
            Horas extra · {nombre}
          </p>
          <p className="mb-3 text-[11px] text-slate-500">Semana del {etiquetaSemana(semana)} · plan de {plan} h</p>

          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-2.5 py-2 text-sm hover:bg-slate-50">
            <input type="checkbox" checked={aprobado} onChange={(e) => setAprobado(e.target.checked)} className="h-4 w-4 accent-indigo-600" />
            Aprobar horas extra
          </label>

          {aprobado && (
            <div className="mt-2.5">
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">Cantidad permitida</label>
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  inputMode="decimal"
                  placeholder="0"
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && guardar()}
                  className="w-20 rounded-lg border border-slate-300 px-2 py-1.5 text-right text-sm tabular-nums outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
                <span className="text-sm text-slate-500">h</span>
              </div>
              {aNumero(soloDecimales(cantidad, 2, 2)) > 0 && (
                <p className="mt-1.5 text-[11px] text-slate-500">Límite de la semana: <strong className="text-slate-800">{Math.round((plan + aNumero(soloDecimales(cantidad, 2, 2))) * 100) / 100} h</strong></p>
              )}
            </div>
          )}

          <div className="mt-3 flex justify-end gap-2">
            <button type="button" onClick={() => setPosicion(null)} className="rounded-lg px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100">Cancelar</button>
            <button type="button" onClick={guardar} className="rounded-lg bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-700">
              {aprobado ? 'Aprobar' : extra > 0 ? 'Retirar' : 'Guardar'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
