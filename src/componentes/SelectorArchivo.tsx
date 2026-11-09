import { useRef, useState } from 'react'
import { FileText, ImageIcon, UploadCloud, X } from 'lucide-react'
import { formatoTamano, TIPOS_PERMITIDOS, validarArchivo } from '../utils/archivos'

interface Props {
  archivo: File | null
  onCambio: (archivo: File | null) => void
  /** Qué se sube, para el texto de ayuda (por defecto «la factura»). */
  queSube?: string
}

export default function SelectorArchivo({ archivo, onCambio, queSube = 'la factura' }: Props) {
  const campo = useRef<HTMLInputElement>(null)
  const [arrastrando, setArrastrando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const tomar = (lista: FileList | null) => {
    const elegido = lista?.[0]
    if (!elegido) return
    const problema = validarArchivo(elegido)
    setError(problema)
    if (!problema) onCambio(elegido)
  }

  if (archivo) {
    const Icono = archivo.type === 'application/pdf' ? FileText : ImageIcon
    return (
      <div className="flex items-center gap-3 rounded-xl border border-indigo-200 bg-indigo-50/50 p-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-indigo-600 shadow-sm"><Icono className="h-5 w-5" /></span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-slate-900">{archivo.name}</p>
          <p className="text-xs text-slate-500">{formatoTamano(archivo.size)}</p>
        </div>
        <button type="button" onClick={() => onCambio(null)} aria-label="Quitar archivo" className="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-rose-600">
          <X className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => campo.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setArrastrando(true) }}
        onDragLeave={() => setArrastrando(false)}
        onDrop={(e) => { e.preventDefault(); setArrastrando(false); tomar(e.dataTransfer.files) }}
        className={`flex w-full flex-col items-center gap-1.5 rounded-xl border-2 border-dashed px-4 py-5 text-center transition-colors ${arrastrando ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'}`}
      >
        <UploadCloud className="h-6 w-6 text-indigo-500" />
        <span className="text-sm font-medium text-slate-700">Arrastra {queSube} o <span className="text-indigo-600">elige un archivo</span></span>
        <span className="text-[11px] text-slate-400">PDF, PNG, JPG o WEBP · máximo 10 MB</span>
      </button>
      <input ref={campo} type="file" accept={TIPOS_PERMITIDOS.join(',')} className="hidden" onChange={(e) => { tomar(e.target.files); e.target.value = '' }} />
      {error && <p className="mt-1.5 text-xs text-rose-600">{error}</p>}
    </div>
  )
}
