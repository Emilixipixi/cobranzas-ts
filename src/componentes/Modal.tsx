import type { ReactNode } from 'react'
import { X } from 'lucide-react'

interface Props {
  titulo: string
  onCerrar: () => void
  children: ReactNode
  ancho?: string
}

export default function Modal({ titulo, onCerrar, children, ancho = 'max-w-lg' }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm" onClick={onCerrar}>
      <div
        className={`max-h-[90vh] w-full ${ancho} overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-slate-900">{titulo}</h3>
          <button onClick={onCerrar} aria-label="Cerrar" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
  <X className="h-4 w-4" />
</button>
        </div>
        {children}
      </div>
    </div>
  )
}
