import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Ban, CalendarClock, Check, CircleDollarSign, FilePlus2, Layers, Pencil, Plus, Trash2, User } from 'lucide-react'
import { useAuth } from '../../contextos/AuthContext'
import { useDatos } from '../../contextos/DatosContext'
import { ESTADOS_ADICIONAL, ETIQUETA_TIPO_CONTRATO, PASOS_ADICIONAL, totalPorTipo } from '../../utils/adicionales'
import { entrada } from '../../utils/estilos'
import { formatoFecha, formatoMoneda, resumenPlan } from '../../utils/finanzas'
import type { Adicional, Proyecto } from '../../tipos'
import { ModalAdicional, ModalAprobarAdicional } from '../modales/ModalAdicional'
import { Panel } from '../Panel'
import TarjetaMetrica from '../TarjetaMetrica'

type Accion = { tipo: 'registrar' } | { tipo: 'editar' | 'cotizar' | 'aprobar'; adicional: Adicional } | null

function Pasos({ adicional }: { adicional: Adicional }) {
  if (adicional.estado === 'rechazado') {
    return <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${ESTADOS_ADICIONAL.rechazado.clase}`}><Ban className="h-3 w-3" />Rechazado</span>
  }
  const actual = PASOS_ADICIONAL.indexOf(adicional.estado)
  return (
    <span className="flex items-center gap-1">
      {PASOS_ADICIONAL.map((paso, i) => {
        const hecho = i <= actual
        return (
          <span key={paso} className="flex items-center gap-1">
            {i > 0 && <span className={`h-px w-3 ${hecho ? 'bg-emerald-400' : 'bg-slate-200'}`} />}
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${i === actual ? ESTADOS_ADICIONAL[paso].clase + ' border' : hecho ? 'text-emerald-600' : 'text-slate-400'}`}>
              {hecho && i < actual && <Check className="h-3 w-3" />}
              {ESTADOS_ADICIONAL[paso].etiqueta}
            </span>
          </span>
        )
      })}
    </span>
  )
}

function TarjetaAdicional({ adicional, puedeGestionar, verMontos, onAccion }: { adicional: Adicional; puedeGestionar: boolean; verMontos: boolean; onAccion: (a: Accion) => void }) {
  const { contratos, rechazarAdicional, eliminarAdicional } = useDatos()
  const [rechazando, setRechazando] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [confirmando, setConfirmando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const contrato = contratos.find((k) => k.id === adicional.contratoId)
  const abierto = adicional.estado === 'solicitado' || adicional.estado === 'cotizado'

  const rechazar = () => {
    const r = rechazarAdicional(adicional.id, motivo)
    setError(r)
    if (!r) setRechazando(false)
  }

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-slate-900">{adicional.titulo}</p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1"><User className="h-3 w-3" />{adicional.solicitadoPor}</span>
            <span>Solicitado el {formatoFecha(adicional.fechaSolicitud)}</span>
            <span>Registró {adicional.registradoPor}</span>
          </p>
        </div>
        <Pasos adicional={adicional} />
      </div>

      {adicional.descripcion && <p className="mt-2 text-sm text-slate-600">{adicional.descripcion}</p>}

      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        {verMontos && (
          <span className="inline-flex items-center gap-1 rounded-lg bg-slate-50 px-2.5 py-1 font-medium text-slate-700">
            <CircleDollarSign className="h-3.5 w-3.5 text-slate-400" />
            {adicional.montoEstimado > 0 ? formatoMoneda(adicional.montoEstimado) : 'Sin cotizar'}
          </span>
        )}
        <span className="inline-flex items-center gap-1 rounded-lg bg-slate-50 px-2.5 py-1 font-medium text-slate-700">
          <CalendarClock className="h-3.5 w-3.5 text-slate-400" />
          {adicional.diasEstimados > 0 ? `${adicional.diasEstimados} días de trabajo` : 'Días por estimar'}
        </span>
        {contrato && (
          <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-700">
            <Layers className="h-3.5 w-3.5" />Contrato {contrato.numero}
          </span>
        )}
      </div>

      {adicional.estado === 'aprobado' && adicional.decision && (
        <p className="mt-2 text-[11px] text-emerald-700">
          Aprobado por {adicional.decision.por} el {formatoFecha(adicional.decision.fecha)}
          {adicional.decision.fechaEntregaNueva && ` · entrega movida del ${formatoFecha(adicional.decision.fechaEntregaAnterior)} al ${formatoFecha(adicional.decision.fechaEntregaNueva)}`}
        </p>
      )}
      {adicional.estado === 'rechazado' && adicional.decision && (
        <p className="mt-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
          <strong>Rechazado por {adicional.decision.por}:</strong> {adicional.decision.motivo}
        </p>
      )}

      {rechazando && (
        <div className="mt-3 flex flex-wrap gap-2">
          <input autoFocus className={`${entrada} min-w-[14rem] flex-1`} placeholder="Motivo del rechazo (p. ej. el cliente no aceptó el costo)" value={motivo} onChange={(e) => setMotivo(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && rechazar()} />
          <button onClick={rechazar} className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-rose-700">Rechazar</button>
          <button onClick={() => setRechazando(false)} className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100">Cancelar</button>
        </div>
      )}

      {puedeGestionar && !rechazando && (abierto || adicional.estado === 'aprobado') && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-3">
          {abierto && (
            <>
              <button onClick={() => onAccion({ tipo: 'aprobar', adicional })} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-700">
                <Check className="h-3.5 w-3.5" />Aprobar
              </button>
              {adicional.estado === 'solicitado' && (
                <button onClick={() => onAccion({ tipo: 'cotizar', adicional })} className="inline-flex items-center gap-1 rounded-lg border border-amber-200 px-2.5 py-1 text-xs font-medium text-amber-700 hover:bg-amber-50">
                  <CircleDollarSign className="h-3.5 w-3.5" />Cotizar
                </button>
              )}
              <button onClick={() => setRechazando(true)} className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50">
                <Ban className="h-3.5 w-3.5" />Rechazar
              </button>
              <span className="flex-1" />
              <button onClick={() => onAccion({ tipo: 'editar', adicional })} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100">
                <Pencil className="h-3.5 w-3.5" />Editar
              </button>
              {!confirmando ? (
                <button onClick={() => setConfirmando(true)} aria-label="Eliminar adicional" className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 className="h-3.5 w-3.5" /></button>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs">
                  <span className="text-rose-700">¿Eliminar?</span>
                  <button onClick={() => setError(eliminarAdicional(adicional.id))} className="rounded-lg bg-rose-600 px-2.5 py-1 font-medium text-white hover:bg-rose-700">Sí</button>
                  <button onClick={() => setConfirmando(false)} className="rounded-lg px-2.5 py-1 font-medium text-slate-600 hover:bg-slate-100">No</button>
                </span>
              )}
            </>
          )}
          {adicional.estado === 'aprobado' && (
            <Link to="/plan-pagos" className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:underline">
              Ajustar cronograma de la ampliación <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      )}
      {error && <p className="mt-2 text-xs text-rose-600">{error}</p>}
    </article>
  )
}

export default function PestanaAdicionales({ proyecto }: { proyecto: Proyecto }) {
  const { usuario } = useAuth()
  const { adicionales, contratos, cuotas } = useDatos()
  const [accion, setAccion] = useState<Accion>(null)
  const puedeGestionar = usuario?.rol === 'administrador' || usuario?.rol === 'comercial'
  const verMontos = usuario?.rol !== 'desarrollador'

  // El equipo de desarrollo solo ve lo aprobado: es lo que debe construir.
  const todos = adicionales.filter((a) => a.proyectoId === proyecto.id).sort((a, b) => b.fechaSolicitud.localeCompare(a.fechaSolicitud))
  const lista = verMontos ? todos : todos.filter((a) => a.estado === 'aprobado')
  const porDecidir = todos.filter((a) => a.estado === 'solicitado' || a.estado === 'cotizado')
  const aprobados = todos.filter((a) => a.estado === 'aprobado')
  const totales = totalPorTipo(contratos, proyecto.id)

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900">Adicionales del cliente</h3>
          <p className="text-sm text-slate-500">
            {verMontos ? 'Pedidos extra sobre el alcance original. Al aprobarse generan un contrato de ampliación con su propio cronograma.' : 'Trabajo extra aprobado por el cliente para este proyecto.'}
          </p>
        </div>
        {puedeGestionar && (
          <button onClick={() => setAccion({ tipo: 'registrar' })} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700">
            <Plus className="h-4 w-4" />Registrar adicional
          </button>
        )}
      </div>

      {verMontos && (
        <>
          <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <TarjetaMetrica titulo="Por decidir" valor={String(porDecidir.length)} tono={porDecidir.length ? 'alerta' : 'neutro'} detalle={`${porDecidir.filter((a) => a.estado === 'cotizado').length} cotizado(s) esperando respuesta`} icono={FilePlus2} />
            <TarjetaMetrica titulo="Aprobados" valor={String(aprobados.length)} tono="ok" detalle={formatoMoneda(totales.ampliaciones)} icono={Check} />
            <TarjetaMetrica titulo="Contrato original" valor={formatoMoneda(totales.original)} detalle="Alcance inicial" />
            <TarjetaMetrica titulo="Total del proyecto" valor={formatoMoneda(totales.total)} detalle={totales.ampliaciones + totales.nuevos > 0 ? `+${formatoMoneda(totales.ampliaciones + totales.nuevos)} por ampliaciones` : 'Sin ampliaciones'} icono={Layers} />
          </div>

          <Panel titulo="Total por contrato" subtitulo="Cada contrato conserva su propio cronograma de pagos (RF-52)" className="mb-5">
            <div className="-mx-5 -mb-5 overflow-x-auto border-t border-slate-100">
              <table className="w-full text-sm">
                <thead className="bg-slate-50/60 text-left text-[11px] uppercase tracking-wider text-slate-500">
                  <tr>{['Contrato', 'Tipo', 'Monto', 'Cronograma', ''].map((t) => <th key={t} className="p-3 font-medium">{t}</th>)}</tr>
                </thead>
                <tbody>
                  {totales.contratos.map((k) => {
                    const plan = resumenPlan(k, cuotas)
                    return (
                      <tr key={k.id} className="border-t border-slate-100">
                        <td className="p-3 font-mono text-xs font-semibold text-slate-900">{k.numero}</td>
                        <td className="p-3">
                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${k.tipo === 'original' ? 'bg-indigo-50 text-indigo-700' : 'bg-emerald-50 text-emerald-700'}`}>{ETIQUETA_TIPO_CONTRATO[k.tipo]}</span>
                        </td>
                        <td className="p-3 font-medium tabular-nums">{formatoMoneda(k.monto, k.moneda)}</td>
                        <td className="p-3">
                          <span className={`text-xs font-semibold ${plan.estado === 'completo' ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {cuotas.filter((q) => q.contratoId === k.id).length} cuota(s) · {plan.porcentaje} %
                          </span>
                        </td>
                        <td className="p-3 text-right"><Link to="/plan-pagos" className="text-xs font-semibold text-indigo-600 hover:underline">Ver plan</Link></td>
                      </tr>
                    )
                  })}
                  <tr className="border-t-2 border-slate-200 bg-slate-50/60 font-bold">
                    <td className="p-3" colSpan={2}>Total del proyecto</td>
                    <td className="p-3 tabular-nums">{formatoMoneda(totales.total)}</td>
                    <td className="p-3" colSpan={2} />
                  </tr>
                </tbody>
              </table>
            </div>
          </Panel>
        </>
      )}

      {lista.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center">
          <p className="text-sm font-medium text-slate-600">{verMontos ? 'El cliente aún no ha pedido adicionales' : 'No hay adicionales aprobados en este proyecto'}</p>
          {puedeGestionar && <p className="mt-1 text-xs text-slate-400">Usa «Registrar adicional» cuando el cliente pida algo fuera del alcance.</p>}
        </div>
      ) : (
        <div className="space-y-3">
          {lista.map((a) => <TarjetaAdicional key={a.id} adicional={a} puedeGestionar={puedeGestionar} verMontos={verMontos} onAccion={setAccion} />)}
        </div>
      )}

      {accion?.tipo === 'registrar' && <ModalAdicional proyectoId={proyecto.id} onCerrar={() => setAccion(null)} />}
      {(accion?.tipo === 'editar' || accion?.tipo === 'cotizar') && (
        <ModalAdicional proyectoId={proyecto.id} adicional={accion.adicional} modo={accion.tipo} onCerrar={() => setAccion(null)} />
      )}
      {accion?.tipo === 'aprobar' && <ModalAprobarAdicional adicional={accion.adicional} onCerrar={() => setAccion(null)} />}
    </>
  )
}
