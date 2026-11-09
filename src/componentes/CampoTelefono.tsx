import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, Search } from 'lucide-react'
import { PAISES } from '../datos/paises'

interface Props {
  iso: string
  numero: string
  onCambio: (iso: string, numero: string) => void
  required?: boolean
}

const normalizar = (texto: string) => texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/** Devuelve el teléfono completo en formato internacional, p. ej. "+593 991000001". */
export const telefonoCompleto = (iso: string, numero: string): string => {
  const pais = PAISES.find((p) => p.iso === iso)
  const digitos = numero.replace(/[^\d ]/g, '').trim()
  return pais ? `+${pais.prefijo} ${digitos}` : digitos
}

export default function CampoTelefono({ iso, numero, onCambio, required }: Props) {
  const [abierto, setAbierto] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [activo, setActivo] = useState(0)
  const contenedor = useRef<HTMLDivElement>(null)
  const lista = useRef<HTMLUListElement>(null)
  const pais = PAISES.find((p) => p.iso === iso) ?? PAISES[0]!

  const termino = normalizar(busqueda.replace(/^\+/, ''))
  const filtrados = PAISES.filter((p) => !termino || normalizar(p.nombre).includes(termino) || p.prefijo.startsWith(termino) || p.iso.toLowerCase() === termino)

  useEffect(() => {
    if (!abierto) return
    const cerrar = (e: MouseEvent) => !contenedor.current?.contains(e.target as Node) && setAbierto(false)
    document.addEventListener('mousedown', cerrar)
    return () => document.removeEventListener('mousedown', cerrar)
  }, [abierto])

  useEffect(() => {
    lista.current?.querySelector<HTMLElement>(`[data-indice="${activo}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [activo])

  const abrir = () => {
    setBusqueda('')
    setActivo(Math.max(0, PAISES.findIndex((p) => p.iso === pais.iso)))
    setAbierto(true)
  }

  const elegir = (nuevoIso: string) => {
    onCambio(nuevoIso, numero)
    setAbierto(false)
  }

  return (
    <div ref={contenedor} className="relative">
      <div className="flex rounded-lg border border-slate-300 bg-white focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100">
        <button
          type="button"
          onClick={() => (abierto ? setAbierto(false) : abrir())}
          aria-haspopup="listbox"
          aria-expanded={abierto}
          aria-label={`Prefijo: ${pais.nombre} +${pais.prefijo}`}
          title={pais.nombre}
          className="flex shrink-0 items-center gap-1.5 rounded-l-lg border-r border-slate-200 bg-slate-50 px-2.5 text-sm hover:bg-slate-100"
        >
          <span className="rounded bg-slate-200 px-1 text-[10px] font-bold text-slate-600">{pais.iso}</span>
          <span className="tabular-nums text-slate-800">+{pais.prefijo}</span>
          <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${abierto ? 'rotate-180' : ''}`} />
        </button>
        <input
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          placeholder="Teléfono"
          value={numero}
          onChange={(e) => onCambio(iso, e.target.value.replace(/[^\d\s-]/g, ''))}
          required={required}
          className="w-full min-w-0 rounded-r-lg bg-transparent px-3 py-2 text-sm outline-none"
        />
      </div>

      {abierto && (
        <div className="absolute left-0 z-30 mt-1.5 w-72 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          <div className="relative border-b border-slate-100 p-2">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              autoFocus
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value)
                setActivo(0)
              }}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') { e.preventDefault(); setActivo((i) => Math.min(filtrados.length - 1, i + 1)) }
                else if (e.key === 'ArrowUp') { e.preventDefault(); setActivo((i) => Math.max(0, i - 1)) }
                else if (e.key === 'Enter') { e.preventDefault(); const p = filtrados[activo]; if (p) elegir(p.iso) }
                else if (e.key === 'Escape') setAbierto(false)
              }}
              placeholder="Buscar país o prefijo"
              aria-label="Buscar país o prefijo"
              className="w-full rounded-lg border border-slate-200 py-1.5 pl-8 pr-2 text-sm outline-none focus:border-indigo-500"
            />
          </div>
          <ul ref={lista} role="listbox" className="max-h-60 overflow-y-auto p-1">
            {filtrados.length === 0 && <li className="px-3 py-4 text-center text-xs text-slate-400">Sin resultados</li>}
            {filtrados.map((p, i) => (
              <li key={p.iso} data-indice={i}>
                <button
                  type="button"
                  role="option"
                  aria-selected={p.iso === pais.iso}
                  onClick={() => elegir(p.iso)}
                  onMouseEnter={() => setActivo(i)}
                  className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm ${i === activo ? 'bg-indigo-50' : ''} ${p.iso === pais.iso ? 'font-medium text-indigo-700' : 'text-slate-700'}`}
                >
                  <span className="w-7 shrink-0 rounded bg-slate-100 text-center text-[10px] font-bold text-slate-500">{p.iso}</span>
                  <span className="flex-1 truncate">{p.nombre}</span>
                  <span className="shrink-0 tabular-nums text-xs text-slate-500">+{p.prefijo}</span>
                  {p.iso === pais.iso && <Check className="h-3.5 w-3.5 shrink-0" />}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
