import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link2, Pencil, Video, X } from 'lucide-react'
import { useDatos } from '../../contextos/DatosContext'
import { entrada } from '../../utils/estilos'
import type { Documento } from '../../tipos'
import { enlaceValido } from '../modales/ModalMinuta'

/** Muestra el enlace de una reunión y permite agregarlo o cambiarlo a quien puede editar. */
export default function EnlaceReunion({ documento, puedeEditar }: { documento: Documento; puedeEditar: boolean }) {
  const { actualizarEnlaceMinuta } = useDatos()
  const enlace = documento.minuta?.enlace ?? ''
  const [editando, setEditando] = useState(false)
  const [texto, setTexto] = useState(enlace)
  const [error, setError] = useState<string | null>(null)

  const abrirEdicion = () => {
    setTexto(enlace)
    setError(null)
    setEditando(true)
  }

  const guardar = (e: FormEvent) => {
    e.preventDefault()
    const limpio = texto.trim()
    if (limpio && !enlaceValido(limpio)) return setError('El enlace debe empezar con https:// (por ejemplo, https://meet.google.com/...)')
    const resultado = actualizarEnlaceMinuta(documento.id, limpio)
    if (resultado) return setError(resultado)
    setEditando(false)
  }

  if (editando) {
    return (
      <form onSubmit={guardar} className="mt-2">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[16rem] flex-1">
            <Link2 className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              autoFocus
              className={`${entrada} pl-8`}
              placeholder="https://meet.google.com/..."
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={(e) => e.key === 'Escape' && setEditando(false)}
            />
          </div>
          <button className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700">Guardar</button>
          <button type="button" onClick={() => setEditando(false)} className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100">Cancelar</button>
        </div>
        <p className="mt-1 text-[11px] text-slate-400">Deja el campo vacío para quitar el enlace.</p>
        {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
      </form>
    )
  }

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      {enlace ? (
        <a href={enlace} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100">
          <Video className="h-3.5 w-3.5" />
          Unirse a la reunión
        </a>
      ) : (
        !puedeEditar && <span className="text-xs text-slate-400">Sin enlace de reunión</span>
      )}
      {puedeEditar && (
        <button onClick={abrirEdicion} className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-600 hover:border-indigo-300 hover:text-indigo-700">
          {enlace ? <Pencil className="h-3 w-3" /> : <Link2 className="h-3.5 w-3.5" />}
          {enlace ? 'Cambiar enlace' : 'Agregar enlace de la reunión'}
        </button>
      )}
      {enlace && puedeEditar && (
        <button onClick={() => actualizarEnlaceMinuta(documento.id, '')} aria-label="Quitar enlace" title="Quitar enlace" className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600">
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}
