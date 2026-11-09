import { useState } from 'react'
import { AlertTriangle, CheckCircle2, FileSignature, ListChecks, Trash2, X } from 'lucide-react'
import DonutGrafico from '../componentes/graficos/DonutGrafico'
import { Encabezado, Leyenda, Panel } from '../componentes/Panel'
import TarjetaMetrica from '../componentes/TarjetaMetrica'
import { useDatos } from '../contextos/DatosContext'
import { botonSecundario } from '../utils/estilos'
import { formatoFecha, formatoMoneda, montoCuota, redondear, resumenPlan } from '../utils/finanzas'
import type { ReactNode } from 'react'
import type { Cuota, Modalidad, TipoValor } from '../tipos'

// Una sola rejilla para cabecera, filas y total: en pantallas grandes es una tabla, en pequeñas una ficha por cuota.
const COLUMNAS = 'grid-cols-2 gap-x-3 gap-y-2 sm:grid-cols-6 xl:grid-cols-[2.25rem_minmax(0,1fr)_8rem_7rem_6.5rem_8.5rem_9.5rem_2.25rem] xl:items-center'

function Campo({ etiqueta, className = '', children }: { etiqueta: string; className?: string; children: ReactNode }) {
  return (
    <div className={`min-w-0 ${className}`}>
      <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-400 xl:hidden">{etiqueta}</span>
      {children}
    </div>
  )
}

const COLORES_PLAN = { completo: '#10b981', incompleto: '#f59e0b', excedido: '#f43f5e' }
const ETIQUETAS_PLAN = { completo: 'Completo', incompleto: 'Incompleto', excedido: 'Excedido' }
const COLORES_MODALIDAD: Record<Modalidad, string> = { fecha: '#6366f1', hito: '#0ea5e9', mixta: '#8b5cf6' }
const ETIQUETAS_MODALIDAD: Record<Modalidad, string> = { fecha: 'Por fecha', hito: 'Por hito', mixta: 'Mixta' }

export default function PlanPagos() {
  const { proyectos, contratos, cuotas, cobros, actualizarCuota, agregarCuota, eliminarCuota } = useDatos()
  const [contratoId, setContratoId] = useState(contratos[0]?.id ?? '')
  const [error, setError] = useState<string | null>(null)

  const motivoBloqueo = (q: Cuota): string | null => {
    if (q.orden === 1) return 'La cuota de firma del contrato no se puede eliminar'
    if (cobros.some((b) => b.cuotaId === q.id)) return 'Tiene cobros registrados: no se puede eliminar'
    if (q.numeroFactura) return `Ya fue facturada (${q.numeroFactura}): no se puede eliminar`
    return null
  }

  const eliminar = (cuotaId: string, concepto: string) => {
    if (!window.confirm(`¿Eliminar la cuota «${concepto}»? Las demás cuotas se renumerarán.`)) return
    setError(eliminarCuota(cuotaId))
  }

  const planes = contratos.map((k) => ({ contrato: k, resumen: resumenPlan(k, cuotas), proyecto: proyectos.find((p) => p.id === k.proyectoId) }))
  const contrato = contratos.find((k) => k.id === contratoId)
  const completos = planes.filter((p) => p.resumen.estado === 'completo').length
  const conProblemas = planes.length - completos
  const totalCuotas = cuotas.filter((q) => contratos.some((k) => k.id === q.contratoId)).length
  const sinFecha = cuotas.filter((q) => contratos.some((k) => k.id === q.contratoId) && !q.fechaProyectada).length
  const monedaComun = contratos.every((k) => k.moneda === contratos[0]?.moneda) ? contratos[0]?.moneda : undefined
  const totalPlanificado = redondear(planes.reduce((s, p) => s + p.resumen.total, 0))
  const totalContratado = redondear(contratos.reduce((s, k) => s + k.monto, 0))

  const segmentosPlan = (Object.keys(COLORES_PLAN) as (keyof typeof COLORES_PLAN)[]).map((e) => ({
    nombre: ETIQUETAS_PLAN[e],
    valor: planes.filter((p) => p.resumen.estado === e).length,
    color: COLORES_PLAN[e],
  }))

  if (!contrato) {
    return (
      <>
        <Encabezado titulo="Plan de pagos" subtitulo="Cuotas y cobertura de cada contrato" />
        <Panel titulo="Sin contratos"><p className="text-sm text-slate-400">Aún no hay contratos registrados</p></Panel>
      </>
    )
  }

  const lista = cuotas.filter((q) => q.contratoId === contratoId).sort((a, b) => a.orden - b.orden)
  const resumen = resumenPlan(contrato, cuotas)
  const proyectoActual = proyectos.find((p) => p.id === contrato.proyectoId)
  const segmentosModalidad = (Object.keys(COLORES_MODALIDAD) as Modalidad[]).map((m) => ({
    nombre: ETIQUETAS_MODALIDAD[m],
    valor: redondear(lista.filter((q) => q.modalidad === m).reduce((s, q) => s + montoCuota(q, contrato), 0)),
    color: COLORES_MODALIDAD[m],
  }))

  const entrada = 'rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100'

  return (
    <>
      <Encabezado titulo="Plan de pagos" subtitulo="Cuotas, modalidades y cobertura de cada contrato" />

      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <TarjetaMetrica titulo="Contratos" valor={String(contratos.length)} detalle={`${totalCuotas} cuotas planificadas`} icono={FileSignature} />
        <TarjetaMetrica titulo="Planes completos" valor={`${completos} / ${planes.length}`} tono={conProblemas === 0 ? 'ok' : 'neutro'} detalle="Cubren el 100 % del contrato" icono={CheckCircle2} />
        <TarjetaMetrica titulo="Planes por ajustar" valor={String(conProblemas)} tono={conProblemas > 0 ? 'peligro' : 'ok'} detalle={conProblemas > 0 ? 'Incompletos o excedidos' : 'Todo cuadrado'} icono={AlertTriangle} />
        <TarjetaMetrica
          titulo="Cobertura total"
          valor={totalContratado ? `${redondear((totalPlanificado / totalContratado) * 100)} %` : '—'}
          detalle={monedaComun ? `${formatoMoneda(totalPlanificado, monedaComun)} de ${formatoMoneda(totalContratado, monedaComun)}` : `${sinFecha} cuotas sin fecha`}
          icono={ListChecks}
        />
      </div>

      <div className="mb-5 grid gap-5 lg:grid-cols-3">
        <Panel titulo="Cobertura por contrato" subtitulo="Selecciona un contrato para editar su plan" className="lg:col-span-2">
          <ul className="space-y-2">
            {planes.map(({ contrato: k, resumen: r, proyecto }) => {
              const activo = k.id === contratoId
              return (
                <li key={k.id}>
                  <button
                    onClick={() => setContratoId(k.id)}
                    className={`w-full rounded-xl border p-3 text-left transition-all ${activo ? 'border-indigo-300 bg-indigo-50/40 shadow-sm' : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50/60'}`}
                  >
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-slate-900">
                        <span className="mr-2 font-mono text-xs text-slate-400">{k.numero}</span>
                        {proyecto?.nombre}
                      </span>
                      <span className="flex items-center gap-2 text-xs">
                        <span className="text-slate-500">{formatoMoneda(k.monto, k.moneda)}</span>
                        <span className="rounded-full px-2 py-0.5 font-medium text-white" style={{ backgroundColor: COLORES_PLAN[r.estado] }}>{ETIQUETAS_PLAN[r.estado]}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-2 flex-1 rounded-full bg-slate-100">
                        <div className="h-2 rounded-full transition-all" style={{ width: `${Math.min(100, r.porcentaje)}%`, backgroundColor: COLORES_PLAN[r.estado] }} />
                      </div>
                      <span className="w-14 text-right text-[11px] font-medium tabular-nums text-slate-700">{r.porcentaje} %</span>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        </Panel>

        <Panel titulo="Estado de los planes" subtitulo="Cuadre entre cuotas y monto contratado">
          <DonutGrafico datos={segmentosPlan} centroValor={`${completos}/${planes.length}`} centroEtiqueta="Completos" alto={170} />
          <div className="mt-4 space-y-2.5 border-t border-slate-100 pt-4">
            {segmentosPlan.map((s) => <Leyenda key={s.nombre} color={s.color} nombre={s.nombre} valor={String(s.valor)} />)}
          </div>
        </Panel>
      </div>

      {error && (
        <div className="mb-4 flex items-start justify-between gap-3 rounded-lg bg-rose-50 px-4 py-2 text-sm text-rose-700">
          <span>{error}</span>
          <button onClick={() => setError(null)} aria-label="Cerrar aviso" className="text-rose-400 hover:text-rose-700"><X className="h-4 w-4" /></button>
        </div>
      )}

      <Panel
        titulo={`Cuotas · ${contrato.numero}`}
        subtitulo={`${proyectoActual?.nombre ?? ''} · ${formatoMoneda(contrato.monto, contrato.moneda)} · ${lista.length} ${lista.length === 1 ? 'cuota' : 'cuotas'}`}
        className="mb-5"
        accion={
          <div className="flex flex-wrap items-center gap-2">
            <select className={entrada} value={contratoId} onChange={(e) => { setContratoId(e.target.value); setError(null) }}>
              {contratos.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.numero} · {proyectos.find((p) => p.id === k.proyectoId)?.nombre}
                </option>
              ))}
            </select>
            <button onClick={() => agregarCuota(contratoId)} className={botonSecundario}>+ Agregar cuota</button>
          </div>
        }
      >
        {resumen.estado === 'completo' && (
          <div className="mb-3 rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-700">Plan completo: cubre el 100 % del contrato.</div>
        )}
        {resumen.estado === 'incompleto' && (
          <div className="mb-3 rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-700">
            Plan incompleto: cubre {resumen.porcentaje} %. Faltan {formatoMoneda(resumen.diferencia, contrato.moneda)}.
          </div>
        )}
        {resumen.estado === 'excedido' && (
          <div className="mb-3 rounded-lg bg-rose-50 px-4 py-2 text-sm text-rose-700">
            Plan excedido por {formatoMoneda(-resumen.diferencia, contrato.moneda)}. Ajusta los valores o elimina la cuota que sobra.
          </div>
        )}

        <div className="-mx-5 -mb-5 border-t border-slate-100">
          <div className={`${COLUMNAS} hidden bg-slate-50/60 px-5 py-2.5 text-[11px] font-medium uppercase tracking-wider text-slate-500 xl:grid`}>
            <span>#</span>
            <span>Concepto</span>
            <span>Modalidad</span>
            <span>Tipo</span>
            <span>Valor</span>
            <span className="text-right">Importe</span>
            <span>Fecha esperada</span>
            <span className="sr-only">Acciones</span>
          </div>

          <ul>
            {lista.map((q) => {
              const bloqueo = motivoBloqueo(q)
              return (
                <li key={q.id} className={`${COLUMNAS} grid border-t border-slate-100 px-5 py-3 transition-colors hover:bg-slate-50/40`}>
                  <div className="col-span-2 flex items-center gap-2 sm:col-span-6 xl:col-span-1">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-900 text-[11px] font-bold text-white">{q.orden}</span>
                    <span className="truncate text-sm font-medium text-slate-700 xl:hidden">{q.concepto}</span>
                  </div>
                  <Campo etiqueta="Concepto" className="col-span-2 sm:col-span-6 xl:col-span-1">
                    <input
                      key={q.id + q.concepto}
                      className={`${entrada} w-full`}
                      defaultValue={q.concepto}
                      disabled={q.orden === 1}
                      onBlur={(e) => actualizarCuota(q.id, 'concepto', e.target.value)}
                    />
                  </Campo>
                  <Campo etiqueta="Modalidad" className="sm:col-span-2 xl:col-span-1">
                    <select className={`${entrada} w-full`} value={q.modalidad} onChange={(e) => actualizarCuota(q.id, 'modalidad', e.target.value as Modalidad)}>
                      <option value="fecha">Por fecha</option>
                      <option value="hito">Por hito</option>
                      <option value="mixta">Mixta</option>
                    </select>
                  </Campo>
                  <Campo etiqueta="Tipo" className="sm:col-span-2 xl:col-span-1">
                    <select className={`${entrada} w-full`} value={q.tipoValor} onChange={(e) => actualizarCuota(q.id, 'tipoValor', e.target.value as TipoValor)}>
                      <option value="porcentaje">%</option>
                      <option value="fijo">Monto fijo</option>
                    </select>
                  </Campo>
                  <Campo etiqueta="Valor" className="sm:col-span-2 xl:col-span-1">
                    <input
                      key={q.id + q.valor}
                      type="number"
                      step="any"
                      className={`${entrada} w-full`}
                      defaultValue={q.valor}
                      onBlur={(e) => actualizarCuota(q.id, 'valor', Number(e.target.value))}
                    />
                  </Campo>
                  <Campo etiqueta="Importe" className="sm:col-span-2 xl:col-span-1 xl:text-right">
                    <span className="block py-1 text-sm font-semibold tabular-nums text-slate-900">{formatoMoneda(montoCuota(q, contrato), contrato.moneda)}</span>
                  </Campo>
                  <Campo etiqueta="Fecha esperada" className="sm:col-span-3 xl:col-span-1">
                    <input
                      type="date"
                      className={`${entrada} w-full`}
                      value={q.fechaProyectada ?? ''}
                      onChange={(e) => actualizarCuota(q.id, 'fechaProyectada', e.target.value || null)}
                    />
                  </Campo>
                  <div className="col-span-2 flex items-end justify-end sm:col-span-1 xl:col-span-1 xl:items-center">
                    <button
                      onClick={() => eliminar(q.id, q.concepto)}
                      disabled={bloqueo !== null}
                      title={bloqueo ?? `Eliminar «${q.concepto}»`}
                      aria-label={`Eliminar cuota ${q.orden}: ${q.concepto}`}
                      className="flex items-center gap-1.5 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="text-xs font-medium xl:hidden">Eliminar</span>
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>

          <div className={`${COLUMNAS} grid border-t border-slate-200 bg-slate-50/60 px-5 py-3 text-sm font-semibold`}>
            <span className="col-span-1 sm:col-span-3 xl:col-span-5">Total</span>
            <span className="col-span-1 text-right tabular-nums sm:col-span-3 xl:col-span-1">{formatoMoneda(resumen.total, contrato.moneda)}</span>
          </div>
        </div>
      </Panel>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel titulo="Distribución por modalidad" subtitulo={`Importe del contrato ${contrato.numero}`}>
          <div className="grid items-center gap-5 sm:grid-cols-2">
            <DonutGrafico
              datos={segmentosModalidad}
              centroValor={`${lista.length}`}
              centroEtiqueta={lista.length === 1 ? 'Cuota' : 'Cuotas'}
              formato={(n) => formatoMoneda(n, contrato.moneda)}
              alto={170}
            />
            <div className="space-y-2.5">
              {segmentosModalidad.map((s) => <Leyenda key={s.nombre} color={s.color} nombre={s.nombre} valor={formatoMoneda(s.valor, contrato.moneda)} />)}
            </div>
          </div>
        </Panel>

        <Panel titulo="Calendario de cuotas" subtitulo="Fechas esperadas de cobro">
          <ul className="space-y-2">
            {lista.map((q) => (
              <li key={q.id} className="flex items-center justify-between gap-2 text-sm">
                <span className="flex min-w-0 items-center gap-2 text-slate-600">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: COLORES_MODALIDAD[q.modalidad] }} />
                  <span className="truncate">{q.orden}. {q.concepto}</span>
                </span>
                <span className="flex shrink-0 items-center gap-3 tabular-nums">
                  <span className="text-xs text-slate-500">{formatoMoneda(montoCuota(q, contrato), contrato.moneda)}</span>
                  <span className={q.fechaProyectada ? 'text-slate-700' : 'text-amber-600'}>
                    {q.fechaProyectada ? formatoFecha(q.fechaProyectada) : 'Sin fecha'}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  )
}
