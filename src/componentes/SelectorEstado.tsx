import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { useDatos } from '../contextos/DatosContext'
import type { Proyecto } from '../tipos'
import EtiquetaEstado from './EtiquetaEstado'
import { ESTADOS_PROYECTO } from './modales/ModalEditarProyecto'
import { COLORES_ESTADO } from './Panel'

export default function SelectorEstado({ proyecto }: { proyecto: Proyecto }) {
  const { actualizarProyecto } = useDatos()
  const [posicion, setPosicion] = useState<{ top: number; left: number } | null>(null)
  const contenedor = useRef<HTMLDivElement>(null)
  const abierto = posicion !== null
  const setAbierto = (valor: boolean) => {
    const rect = contenedor.current?.getBoundingClientRect()
    setPosicion(valor && rect ? { top: rect.bottom + 6, left: rect.left } : null)
  }

  useEffect(() => {
    if (!abierto) return
    const cerrar = (e: MouseEvent) => {
      if (!contenedor.current?.contains(e.target as Node)) setAbierto(false)
    }
    const escape = (e: KeyboardEvent) => e.key === 'Escape' && setAbierto(false)
    const alDesplazar = () => setPosicion(null)
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
  }, [abierto])

  const elegir = (estado: string) => {
    setAbierto(false)
    if (estado !== proyecto.estado) actualizarProyecto(proyecto.id, { estado })
  }

  return (
    <div ref={contenedor} className="relative inline-block">
      <button
        type="button"
        onClick={() => setAbierto(!abierto)}
        title="Cambiar estado del proyecto"
        aria-haspopup="listbox"
        aria-expanded={abierto}
        className="group inline-flex items-center gap-0.5 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-indigo-200"
      >
        <EtiquetaEstado estado={proyecto.estado} />
        <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform group-hover:text-indigo-600 ${abierto ? 'rotate-180' : ''}`} />
      </button>
      {posicion && (
        <ul role="listbox" style={{ top: posicion.top, left: posicion.left }} className="fixed z-50 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
          <li className="px-2.5 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Cambiar estado</li>
          {ESTADOS_PROYECTO.map((estado) => {
            const activo = estado === proyecto.estado
            return (
              <li key={estado}>
                <button
                  type="button"
                  role="option"
                  aria-selected={activo}
                  onClick={() => elegir(estado)}
                  className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm ${activo ? 'bg-indigo-50 font-medium text-indigo-700' : 'text-slate-700 hover:bg-slate-50'}`}
                >
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORES_ESTADO[estado] }} />
                    {estado}
                  </span>
                  {activo && <Check className="h-3.5 w-3.5" />}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
