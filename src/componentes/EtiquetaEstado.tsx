interface Familia {
  caja: string
  punto: string
}

const FAMILIAS: Record<string, Familia> = {
  verde: { caja: 'border-emerald-200 bg-emerald-50 text-emerald-700', punto: 'bg-emerald-500' },
  rojo: { caja: 'border-rose-200 bg-rose-50 text-rose-700', punto: 'bg-rose-500' },
  cian: { caja: 'border-cyan-200 bg-cyan-50 text-cyan-700', punto: 'bg-cyan-500' },
  indigo: { caja: 'border-indigo-200 bg-indigo-50 text-indigo-700', punto: 'bg-indigo-500' },
  celeste: { caja: 'border-sky-200 bg-sky-50 text-sky-700', punto: 'bg-sky-500' },
  ambar: { caja: 'border-amber-200 bg-amber-50 text-amber-700', punto: 'bg-amber-500' },
  naranja: { caja: 'border-orange-200 bg-orange-50 text-orange-700', punto: 'bg-orange-500' },
  gris: { caja: 'border-slate-200 bg-slate-50 text-slate-600', punto: 'bg-slate-400' },
}

const COLORES: Record<string, string> = {
  Cobrada: 'verde',
  Vencida: 'rojo',
  'Parcialmente cobrada': 'cian',
  Facturada: 'indigo',
  'Habilitada para cobro': 'celeste',
  Pendiente: 'gris',
  Entregado: 'verde',
  Observado: 'naranja',
  'Atraso cliente': 'ambar',
  'Atraso interno': 'rojo',
  Prototipo: 'ambar',
  'En desarrollo': 'celeste',
  'En entrega': 'indigo',
  Cerrado: 'verde',
  Validado: 'verde',
  Presentado: 'ambar',
  borrador: 'gris',
  'en revisión': 'ambar',
  firmado: 'verde',
  aprobado: 'verde',
}

export default function EtiquetaEstado({ estado }: { estado: string }) {
  const familia = FAMILIAS[COLORES[estado] ?? 'gris']
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium ${familia.caja}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${familia.punto}`} />
      {estado}
    </span>
  )
}
