import type { ReactNode } from 'react'

export function Panel({ titulo, subtitulo, accion, children, className = '' }: { titulo: string; subtitulo?: string; accion?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-slate-900">{titulo}</h3>
          {subtitulo && <p className="text-xs text-slate-500">{subtitulo}</p>}
        </div>
        {accion}
      </div>
      {children}
    </section>
  )
}

export function Leyenda({ color, nombre, valor }: { color: string; nombre: string; valor: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="flex items-center gap-2 text-slate-600">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
        {nombre}
      </span>
      <span className="font-semibold tabular-nums text-slate-900">{valor}</span>
    </div>
  )
}

export function BarraAvance({ etiqueta, porcentaje, color, texto }: { etiqueta: string; porcentaje: number; color: string; texto?: string }) {
  return (
    <div>
      <div className="mb-1 flex justify-between gap-2 text-[11px] font-medium text-slate-500">
        <span className="truncate">{etiqueta}</span>
        <span className="shrink-0 tabular-nums text-slate-700">{texto ?? `${porcentaje} %`}</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100">
        <div className="h-2 rounded-full transition-all" style={{ width: `${Math.max(0, Math.min(100, porcentaje))}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}

export function Encabezado({ titulo, subtitulo, children }: { titulo: string; subtitulo?: string; children?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">{titulo}</h2>
        {subtitulo && <p className="text-sm text-slate-500">{subtitulo}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  )
}

export const COLORES_ESTADO: Record<string, string> = {
  Prototipo: '#f59e0b',
  'En desarrollo': '#0ea5e9',
  'En entrega': '#6366f1',
  Cerrado: '#10b981',
}
