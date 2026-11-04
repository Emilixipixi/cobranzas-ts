import { AlertOctagon, BadgeDollarSign, CalendarClock, CheckCircle2, FolderGit2, Layers, ListChecks, Receipt, Timer, TrendingUp } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface Props {
  titulo: string
  valor: string
  detalle?: string
  tono?: 'neutro' | 'ok' | 'alerta' | 'peligro'
}

const ICONOS: [RegExp, LucideIcon][] = [
  [/vencid|mora|atraso/i, AlertOctagon],
  [/contratad|presupuesto/i, BadgeDollarSign],
  [/cobrad/i, CheckCircle2],
  [/factur|cobrar/i, Receipt],
  [/entregable/i, Layers],
  [/proyecto/i, FolderGit2],
  [/plan/i, ListChecks],
  [/hora|dedicaci/i, Timer],
  [/plazo|días|entrega|inicio|límite/i, CalendarClock],
]

const TONOS = {
  neutro: { titulo: 'text-slate-500', valor: 'text-slate-900', chip: 'bg-indigo-50 text-indigo-600' },
  ok: { titulo: 'text-emerald-600', valor: 'text-emerald-600', chip: 'bg-emerald-50 text-emerald-600' },
  alerta: { titulo: 'text-amber-600', valor: 'text-amber-600', chip: 'bg-amber-50 text-amber-600' },
  peligro: { titulo: 'text-rose-600', valor: 'text-rose-600', chip: 'bg-rose-100 text-rose-600' },
}

export default function TarjetaMetrica({ titulo, valor, detalle, tono = 'neutro' }: Props) {
  const Icono = ICONOS.find(([patron]) => patron.test(titulo))?.[1] ?? TrendingUp
  const colores = TONOS[tono]

  return (
    <div className={`rounded-xl border bg-white p-4 shadow-sm transition-all hover:shadow ${tono === 'peligro' ? 'border-rose-300 bg-rose-50/20' : 'border-slate-200'}`}>
      <div className="flex items-center justify-between">
        <span className={`text-xs font-semibold uppercase tracking-wider ${colores.titulo}`}>{titulo}</span>
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${colores.chip}`}>
          <Icono className="h-4 w-4" />
        </div>
      </div>
      <strong className={`mt-2 block text-xl font-bold sm:text-2xl ${colores.valor}`}>{valor}</strong>
      {detalle && <span className="mt-1 block text-xs text-slate-500">{detalle}</span>}
    </div>
  )
}
