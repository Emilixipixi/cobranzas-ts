import { useRef, useState } from 'react'
import { Plus, Sparkles, X } from 'lucide-react'
import { categoriaDe, claveTecnologia, identificarTecnologia } from '../datos/tecnologias'

interface Props {
  seleccion: string[]
  onCambio: (tecnologias: string[]) => void
  /** Catálogo precargado + tecnologías que ya usa el equipo */
  catalogo: string[]
  /** Cuántas personas del equipo dominan cada tecnología (para ordenar sugerencias) */
  popularidad?: Record<string, number>
}

/** Campo con etiquetas: sugiere del catálogo, reconoce variantes («node js» → Node.js) y permite agregar tecnologías nuevas. */
export default function SelectorTecnologias({ seleccion, onCambio, catalogo, popularidad = {} }: Props) {
  const [texto, setTexto] = useState('')
  const [abierto, setAbierto] = useState(false)
  const [activo, setActivo] = useState(0)
  const campo = useRef<HTMLInputElement>(null)

  const elegidas = new Set(seleccion.map(claveTecnologia))
  const clave = claveTecnologia(texto)

  const sugerencias = (() => {
    const disponibles = catalogo.filter((t) => !elegidas.has(claveTecnologia(t)))
    const filtradas = clave ? disponibles.filter((t) => claveTecnologia(t).includes(clave)) : disponibles
    return filtradas
      .sort((a, b) => {
        // Primero lo que empieza igual, luego lo más usado por el equipo.
        const empiezaA = claveTecnologia(a).startsWith(clave) ? 0 : 1
        const empiezaB = claveTecnologia(b).startsWith(clave) ? 0 : 1
        return empiezaA - empiezaB || (popularidad[b] ?? 0) - (popularidad[a] ?? 0) || a.localeCompare(b, 'es')
      })
      .slice(0, 8)
  })()

  const identificada = texto.trim() ? identificarTecnologia(texto, catalogo) : null
  const yaElegida = identificada ? elegidas.has(claveTecnologia(identificada.nombre)) : false
  // Opción «Agregar …» solo cuando lo escrito no coincide con ninguna sugerencia.
  const ofrecerNueva = identificada && !yaElegida && !sugerencias.some((s) => claveTecnologia(s) === claveTecnologia(identificada.nombre))
  const opciones = [...(ofrecerNueva ? [identificada!.nombre] : []), ...sugerencias]

  const agregar = (nombre: string) => {
    const { nombre: oficial } = identificarTecnologia(nombre, catalogo)
    if (!elegidas.has(claveTecnologia(oficial))) onCambio([...seleccion, oficial])
    setTexto('')
    setActivo(0)
    campo.current?.focus()
  }

  const quitar = (nombre: string) => onCambio(seleccion.filter((t) => t !== nombre))

  const alTeclear = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ',' || e.key === 'Tab') && texto.trim()) {
      e.preventDefault()
      agregar(opciones[activo] ?? texto)
    } else if (e.key === 'Backspace' && !texto && seleccion.length) {
      quitar(seleccion[seleccion.length - 1])
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setAbierto(true)
      setActivo((i) => Math.min(i + 1, opciones.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActivo((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Escape') {
      setAbierto(false)
    }
  }

  // Pegar «React, Node, Docker» agrega las tres de una vez.
  const alPegar = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const partes = e.clipboardData.getData('text').split(/[,;\n]/).map((p) => p.trim()).filter(Boolean)
    if (partes.length < 2) return
    e.preventDefault()
    const nuevas = [...seleccion]
    partes.forEach((p) => {
      const { nombre } = identificarTecnologia(p, catalogo)
      if (!nuevas.some((t) => claveTecnologia(t) === claveTecnologia(nombre))) nuevas.push(nombre)
    })
    onCambio(nuevas)
  }

  return (
    <div className="relative">
      <div
        onClick={() => campo.current?.focus()}
        className="flex min-h-[42px] w-full cursor-text flex-wrap items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2 py-1.5 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100"
      >
        {seleccion.map((t) => {
          const nueva = !catalogo.includes(t)
          return (
            <span key={t} className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ${nueva ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : 'bg-indigo-50 text-indigo-700'}`}>
              {nueva && <Sparkles className="h-3 w-3" />}
              {t}
              <button type="button" onClick={() => quitar(t)} aria-label={`Quitar ${t}`} className="rounded opacity-60 hover:opacity-100"><X className="h-3 w-3" /></button>
            </span>
          )
        })}
        <input
          ref={campo}
          value={texto}
          onChange={(e) => { setTexto(e.target.value); setAbierto(true); setActivo(0) }}
          onFocus={() => setAbierto(true)}
          onBlur={() => setTimeout(() => setAbierto(false), 120)}
          onKeyDown={alTeclear}
          onPaste={alPegar}
          placeholder={seleccion.length ? 'Agregar otra…' : 'Escribe o elige: React, Node.js, Docker…'}
          className="min-w-[10rem] flex-1 border-0 bg-transparent px-1 py-0.5 text-sm outline-none"
          aria-label="Agregar tecnología"
        />
      </div>

      {abierto && opciones.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-lg" role="listbox">
          {opciones.map((t, i) => {
            const esNueva = ofrecerNueva && i === 0
            return (
              <li key={`${t}-${i}`}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => agregar(t)}
                  onMouseEnter={() => setActivo(i)}
                  className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-1.5 text-left text-sm ${i === activo ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700'}`}
                >
                  <span className="flex items-center gap-2">
                    {esNueva ? <Plus className="h-3.5 w-3.5 text-emerald-600" /> : null}
                    {esNueva ? <>Agregar <strong>«{t}»</strong> como tecnología nueva</> : t}
                  </span>
                  <span className="shrink-0 text-[10px] text-slate-400">
                    {esNueva ? 'Nueva' : `${categoriaDe(t)}${popularidad[t] ? ` · ${popularidad[t]} en el equipo` : ''}`}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
      {identificada && !identificada.nueva && claveTecnologia(texto) !== claveTecnologia(identificada.nombre) && !yaElegida && (
        <p className="mt-1 text-[11px] text-slate-500">Se reconoce como <strong>{identificada.nombre}</strong>.</p>
      )}
      {yaElegida && <p className="mt-1 text-[11px] text-amber-600">{identificada!.nombre} ya está en la lista.</p>}
    </div>
  )
}
