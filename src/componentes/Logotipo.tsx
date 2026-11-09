import { useId } from 'react'

/**
 * Marca de ProjectFlow: una «P» de dos trazos separados por un corte
 * y dos pasos que se desvanecen hacia adelante (el flujo del proyecto).
 */
export function LogoMarca({ tamano = 40, className = '' }: { tamano?: number; className?: string }) {
  const id = useId().replace(/:/g, '')
  return (
    <svg width={tamano} height={tamano} viewBox="0 0 40 40" role="img" aria-label="ProjectFlow" className={`shrink-0 ${className}`}>
      <defs>
        <linearGradient id={`pf-fondo-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#4f46e5" />
          <stop offset="1" stopColor="#10b981" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="11" fill={`url(#pf-fondo-${id})`} />
      <path d="M12.5 30.5V9.5" stroke="#fff" strokeWidth="3.8" strokeLinecap="round" />
      <path d="M18 9.5h3.25a6.25 6.25 0 0 1 0 12.5H18" fill="none" stroke="#fff" strokeWidth="3.8" strokeLinecap="round" />
      <circle cx="24.5" cy="29" r="2.4" fill="#fff" fillOpacity="0.55" />
      <circle cx="30" cy="29" r="2.4" fill="#fff" fillOpacity="0.3" />
    </svg>
  )
}

interface Props {
  tamano?: number
  tono?: 'oscuro' | 'claro'
  lema?: string
  className?: string
}

/** Marca + nombre. `tono` indica el fondo sobre el que va: oscuro (texto blanco) o claro. */
export default function Logotipo({ tamano = 40, tono = 'oscuro', lema, className = '' }: Props) {
  const oscuro = tono === 'oscuro'
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <LogoMarca tamano={tamano} className="drop-shadow-[0_6px_16px_rgba(79,70,229,0.35)]" />
      <div className="min-w-0">
        <p className={`font-bold leading-none tracking-tight ${oscuro ? 'text-white' : 'text-slate-900'}`} style={{ fontSize: tamano * 0.48 }}>
          Project
          <span className={`bg-gradient-to-r bg-clip-text text-transparent ${oscuro ? 'from-indigo-300 to-emerald-300' : 'from-indigo-600 to-emerald-600'}`}>Flow</span>
        </p>
        {lema && <p className={`mt-1 truncate text-xs ${oscuro ? 'text-slate-400' : 'text-slate-500'}`}>{lema}</p>}
      </div>
    </div>
  )
}
