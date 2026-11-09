import { useState } from 'react'
import { ArrowDownRight, ArrowUpRight, CalendarClock, CheckCircle2, Receipt } from 'lucide-react'
import { HOY } from '../datos/datosEjemplo'
import { useDatos } from '../contextos/DatosContext'
import { cobradoCuota, flujoEjecutado, flujoProyectado, formatoFecha, formatoMoneda, redondear, sumarCelda } from '../utils/finanzas'
import type { FlujoPorProyecto, Proyecto } from '../tipos'
import EtiquetaEstado from './EtiquetaEstado'
import Modal from './Modal'

type Vista = 'proyectado' | 'ejecutado' | 'comparativo'

const VISTAS: { id: Vista; etiqueta: string; detalle: string }[] = [
  { id: 'proyectado', etiqueta: 'Proyectado', detalle: 'Cuotas programadas' },
  { id: 'ejecutado', etiqueta: 'Ejecutado', detalle: 'Cobros recibidos' },
  { id: 'comparativo', etiqueta: 'Comparativo', detalle: 'Recibido − programado' },
]

const PALETA = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#14b8a6']
const INICIAL_DIA = ['D', 'L', 'M', 'X', 'J', 'V', 'S']

const corto = (n: number): string => formatoMoneda(n).replace(',00', '')

/** Importe compacto para que la celda quepa sin barra de desplazamiento: 1000 → 1k, 2500 → 2,5k. */
const compacto = (n: number): string => {
  const abs = Math.abs(n)
  const signo = n < 0 ? '−' : ''
  if (abs >= 1000) return `${signo}${(abs / 1000).toFixed(abs % 1000 === 0 ? 0 : 1).replace('.', ',')}k`
  return `${signo}${Math.round(abs)}`
}

interface Props {
  dias: string[]
  proyectosVisibles: Proyecto[]
}

export default function MatrizCalendario({ dias, proyectosVisibles }: Props) {
  const { contratos, cuotas, cobros } = useDatos()
  const [vista, setVista] = useState<Vista>('proyectado')
  const [seleccion, setSeleccion] = useState<{ proyectoId: string; dia: string } | null>(null)

  const proy = flujoProyectado(cuotas, contratos)
  const ejec = flujoEjecutado(cobros, cuotas, contratos)

  const hayDato = (pid: string, dia: string): boolean => {
    if (vista === 'proyectado') return Boolean(proy[pid]?.[dia]?.length)
    if (vista === 'ejecutado') return Boolean(ejec[pid]?.[dia]?.length)
    return Boolean(proy[pid]?.[dia]?.length || ejec[pid]?.[dia]?.length)
  }

  const valor = (pid: string, dia: string): number => {
    if (vista === 'proyectado') return sumarCelda(proy[pid]?.[dia])
    if (vista === 'ejecutado') return sumarCelda(ejec[pid]?.[dia])
    return redondear(sumarCelda(ejec[pid]?.[dia]) - sumarCelda(proy[pid]?.[dia]))
  }

  // Una cuota programada en el pasado que no se cobró completa está en mora.
  const enMora = (pid: string, dia: string): boolean =>
    dia < HOY && (proy[pid]?.[dia] ?? []).some((x) => cobradoCuota(x.cuota.id, cobros) < x.importe)

  const totalFila = (pid: string) => redondear(dias.reduce((suma, d) => suma + valor(pid, d), 0))
  const totalDia = (dia: string) => redondear(proyectosVisibles.reduce((suma, p) => suma + valor(p.id, dia), 0))
  const totalGeneral = redondear(dias.reduce((suma, d) => suma + totalDia(d), 0))

  const estiloCelda = (pid: string, dia: string, monto: number): string => {
    if (vista === 'ejecutado') return 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
    if (vista === 'comparativo') {
      if (monto > 0) return 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
      if (monto < 0) return 'bg-rose-100 text-rose-700 hover:bg-rose-200'
      return 'bg-slate-100 text-slate-600 hover:bg-slate-200'
    }
    return enMora(pid, dia) ? 'bg-rose-100 text-rose-700 ring-1 ring-inset ring-rose-200 hover:bg-rose-200' : 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200'
  }

  const colorTotal = (n: number) => (vista === 'comparativo' ? (n > 0 ? 'text-emerald-600' : n < 0 ? 'text-rose-600' : 'text-slate-500') : 'text-slate-900')

  const bloqueDetalle = (titulo: string, flujo: FlujoPorProyecto, tipo: 'proyectado' | 'ejecutado') => {
    const items = seleccion ? flujo[seleccion.proyectoId]?.[seleccion.dia] ?? [] : []
    const Icono = tipo === 'proyectado' ? CalendarClock : CheckCircle2
    return (
      <div>
        <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          <Icono className={`h-3.5 w-3.5 ${tipo === 'proyectado' ? 'text-indigo-500' : 'text-emerald-500'}`} />
          {titulo} · {corto(sumarCelda(items))}
        </p>
        {items.length === 0 && <p className="rounded-lg border border-dashed border-slate-200 px-3 py-2 text-xs text-slate-400">Sin movimientos este día</p>}
        <ul className="space-y-2">
          {items.map((x, i) => {
            const reprogramada = x.cuota.fechaOriginal && x.cuota.fechaOriginal !== x.cuota.fechaProyectada
            return (
              <li key={i} className="rounded-xl border border-slate-200 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{x.cuota.concepto}</p>
                    <p className="truncate text-xs text-slate-500">{x.cuota.entregable || 'Sin entregable definido'}</p>
                  </div>
                  <span className={`shrink-0 text-sm font-bold tabular-nums ${tipo === 'proyectado' ? 'text-indigo-700' : 'text-emerald-700'}`}>{formatoMoneda(x.importe)}</span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
                  <EtiquetaEstado estado={x.cuota.estadoEntrega} />
                  {reprogramada && (
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-700">Reprogramada · original {formatoFecha(x.cuota.fechaOriginal)}</span>
                  )}
                  {x.cobro && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600">
                      <Receipt className="h-3 w-3" />{x.cobro.numeroRecibo} · {x.cobro.medio}
                    </span>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    )
  }

  const diferenciaSeleccion = seleccion
    ? redondear(sumarCelda(ejec[seleccion.proyectoId]?.[seleccion.dia]) - sumarCelda(proy[seleccion.proyectoId]?.[seleccion.dia]))
    : 0

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
          {VISTAS.map((v) => (
            <button
              key={v.id}
              onClick={() => setVista(v.id)}
              className={`rounded-lg px-3.5 py-1.5 text-left transition-colors ${vista === v.id ? 'bg-white shadow-sm' : 'hover:bg-white/60'}`}
            >
              <span className={`block text-sm font-semibold ${vista === v.id ? 'text-indigo-700' : 'text-slate-600'}`}>{v.etiqueta}</span>
              <span className="block text-[10px] text-slate-400">{v.detalle}</span>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
          {vista === 'proyectado' && (
            <>
              <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-indigo-100" />Programado</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-rose-100 ring-1 ring-rose-200" />En mora</span>
            </>
          )}
          {vista === 'ejecutado' && <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-emerald-100" />Cobrado</span>}
          {vista === 'comparativo' && (
            <>
              <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-emerald-100" />Cobrado de más o adelantado</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-rose-100" />Pendiente de cobrar</span>
            </>
          )}
          <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded border-2 border-indigo-400" />Hoy</span>
          <span>Importes en miles (k) · clic en una celda para ver el detalle</span>
        </div>
      </div>

      {/* table-fixed reparte el ancho entre los días: la matriz ocupa la pantalla sin barra horizontal. */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 lg:overflow-visible">
        <table className="w-full min-w-[760px] table-fixed border-collapse text-xs lg:min-w-0">
          <colgroup>
            <col className="w-40 xl:w-48" />
            {dias.map((d) => <col key={d} />)}
            <col className="w-20 xl:w-24" />
          </colgroup>
          <thead>
            <tr className="bg-slate-50/80 text-slate-500">
              <th className="sticky left-0 bg-slate-50 px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider">Proyecto</th>
              {dias.map((d) => {
                const diaSemana = new Date(`${d}T12:00:00`).getDay()
                const finDeSemana = diaSemana === 0 || diaSemana === 6
                const esHoy = d === HOY
                return (
                  <th key={d} className={`px-0 py-1.5 text-center font-medium ${finDeSemana ? 'bg-slate-100/80' : ''}`}>
                    <span className="block text-[9px] uppercase text-slate-400">{INICIAL_DIA[diaSemana]}</span>
                    <span className={`mx-auto mt-0.5 flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${esHoy ? 'bg-indigo-600 font-bold text-white' : 'text-slate-600'}`}>{Number(d.slice(8))}</span>
                  </th>
                )
              })}
              <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wider">Total</th>
            </tr>
          </thead>
          <tbody>
            {proyectosVisibles.length === 0 && (
              <tr><td colSpan={dias.length + 2} className="p-6 text-center text-sm text-slate-400">No hay proyectos para mostrar</td></tr>
            )}
            {proyectosVisibles.map((p, i) => {
              const total = totalFila(p.id)
              return (
                <tr key={p.id} className="group border-t border-slate-100">
                  <td className="sticky left-0 bg-white px-3 py-2 group-hover:bg-slate-50">
                    <span className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: PALETA[i % PALETA.length] }} />
                      <span className="min-w-0">
                        <span className="block truncate text-[13px] font-medium text-slate-900" title={p.nombre}>{p.nombre}</span>
                        <span className="block font-mono text-[10px] text-slate-400">{p.codigo}</span>
                      </span>
                    </span>
                  </td>
                  {dias.map((d) => {
                    const hay = hayDato(p.id, d)
                    const monto = hay ? valor(p.id, d) : 0
                    const diaSemana = new Date(`${d}T12:00:00`).getDay()
                    const finDeSemana = diaSemana === 0 || diaSemana === 6
                    return (
                      <td key={d} className={`px-px py-1.5 text-center ${finDeSemana ? 'bg-slate-50/80' : ''} ${d === HOY ? 'bg-indigo-50/60' : ''}`}>
                        {hay ? (
                          <button
                            onClick={() => setSeleccion({ proyectoId: p.id, dia: d })}
                            title={`${p.nombre} · ${formatoFecha(d)}: ${formatoMoneda(monto)}`}
                            className={`flex h-7 w-full items-center justify-center rounded-md text-[10px] font-bold tabular-nums transition-colors ${estiloCelda(p.id, d, monto)}`}
                          >
                            {compacto(monto)}
                          </button>
                        ) : (
                          <span className="mx-auto block h-1 w-1 rounded-full bg-slate-200" />
                        )}
                      </td>
                    )
                  })}
                  <td className={`px-3 py-2 text-right text-[13px] font-bold tabular-nums ${total === 0 ? 'text-slate-300' : colorTotal(total)}`}>
                    {total === 0 ? '—' : `${vista === 'comparativo' && total > 0 ? '+' : ''}${corto(total)}`}
                  </td>
                </tr>
              )
            })}
          </tbody>
          {proyectosVisibles.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-slate-200 bg-slate-50/80">
                <td className="sticky left-0 bg-slate-50 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-600">Total del día</td>
                {dias.map((d) => {
                  const t = totalDia(d)
                  return (
                    <td key={d} className={`px-px py-2 text-center text-[10px] font-bold tabular-nums ${t === 0 ? 'text-slate-300' : colorTotal(t)}`} title={t ? formatoMoneda(t) : undefined}>
                      {t === 0 ? '·' : compacto(t)}
                    </td>
                  )
                })}
                <td className={`px-3 py-2 text-right text-[13px] font-bold tabular-nums ${colorTotal(totalGeneral)}`}>
                  {vista === 'comparativo' && totalGeneral > 0 ? '+' : ''}{corto(totalGeneral)}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {seleccion && (
        <Modal
          titulo={`${proyectosVisibles.find((p) => p.id === seleccion.proyectoId)?.nombre ?? 'Proyecto'} · ${formatoFecha(seleccion.dia)}`}
          onCerrar={() => setSeleccion(null)}
          ancho="max-w-2xl"
        >
          <div className="mb-4 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Diferencia del día</span>
            <span className={`inline-flex items-center gap-1 text-sm font-bold ${diferenciaSeleccion > 0 ? 'text-emerald-600' : diferenciaSeleccion < 0 ? 'text-rose-600' : 'text-slate-600'}`}>
              {diferenciaSeleccion > 0 ? <ArrowUpRight className="h-4 w-4" /> : diferenciaSeleccion < 0 ? <ArrowDownRight className="h-4 w-4" /> : null}
              {diferenciaSeleccion > 0 ? '+' : ''}{formatoMoneda(diferenciaSeleccion)}
            </span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {bloqueDetalle('Proyectado', proy, 'proyectado')}
            {bloqueDetalle('Ejecutado', ejec, 'ejecutado')}
          </div>
        </Modal>
      )}
    </>
  )
}
