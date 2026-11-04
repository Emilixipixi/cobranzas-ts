import { useState } from 'react'
import { Link } from 'react-router-dom'
import MatrizCalendario from '../componentes/MatrizCalendario'
import ModalCobro from '../componentes/modales/ModalCobro'
import TarjetaMetrica from '../componentes/TarjetaMetrica'
import { useAuth } from '../contextos/AuthContext'
import { useDatos } from '../contextos/DatosContext'
import { HOY } from '../datos/datosEjemplo'
import { entrada } from '../utils/estilos'
import { formatoFecha, formatoMoneda, redondear, sumarDias } from '../utils/finanzas'
import { filasCartera } from '../utils/indicadores'
import type { Cuota, Proyecto } from '../tipos'
import { CalendarDays, ChevronLeft, ChevronRight, Package } from 'lucide-react'

type TipoEvento = 'realizado' | 'programado' | 'vencido' | 'entrega'
type Modo = 'calendario' | 'matriz'

interface EventoCalendario {
  id: string
  fecha: string
  tipo: TipoEvento
  titulo: string
  detalle: string
  monto?: number
  moneda: string
  cuota: Cuota
  proyecto: Proyecto
}

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

const ESTILO_CHIP: Record<TipoEvento, string> = {
  realizado: 'border-emerald-200 bg-emerald-100 text-emerald-800',
  vencido: 'border-rose-200 bg-rose-100 font-bold text-rose-800',
  programado: 'border-indigo-200 bg-indigo-100 text-indigo-800',
  entrega: 'border-amber-200 bg-amber-100 text-amber-800',
}

const ESTILO_ETIQUETA: Record<TipoEvento, { clase: string; texto: string }> = {
  realizado: { clase: 'bg-emerald-100 text-emerald-800', texto: 'COBRO RECAUDADO' },
  vencido: { clase: 'bg-rose-100 text-rose-800', texto: 'EN MORA' },
  programado: { clase: 'bg-indigo-100 text-indigo-800', texto: 'PROGRAMADO' },
  entrega: { clase: 'bg-amber-100 text-amber-800', texto: 'ENTREGA TÉCNICA' },
}

const LEYENDA: { color: string; texto: string }[] = [
  { color: 'bg-emerald-500', texto: 'Cobro recaudado (efectivo)' },
  { color: 'bg-indigo-500', texto: 'Cobro programado (proyección)' },
  { color: 'bg-rose-500', texto: 'Cobro vencido en mora' },
  { color: 'bg-amber-500', texto: 'Hito de entrega de software' },
]

const dosDigitos = (n: number): string => String(n).padStart(2, '0')

const montoCorto = (n: number): string => (n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n}`)

export default function Calendario() {
  const { usuario } = useAuth()
  const { proyectos, clientes, contratos, cuotas, cobros } = useDatos()
  const [periodo, setPeriodo] = useState({ anio: Number(HOY.slice(0, 4)), mes: Number(HOY.slice(5, 7)) })
  const [modo, setModo] = useState<Modo>('calendario')
  const [proyectoId, setProyectoId] = useState('todos')
  const [diaSeleccionado, setDiaSeleccionado] = useState<string | null>(null)
  const [cuotaCobro, setCuotaCobro] = useState<Cuota | null>(null)

  const puedeOperar = usuario?.rol === 'administrador' || usuario?.rol === 'finanzas'
  const { anio, mes } = periodo
  const mesTexto = `${anio}-${dosDigitos(mes)}`
  const primerDia = `${mesTexto}-01`
  const desfase = new Date(`${primerDia}T00:00:00Z`).getUTCDay()
  const diasMes = new Date(Date.UTC(anio, mes, 0)).getUTCDate()
  const totalCeldas = Math.ceil((desfase + diasMes) / 7) * 7

  const celdas = Array.from({ length: totalCeldas }, (_, i) => {
    const fecha = sumarDias(primerDia, i - desfase)
    return { fecha, dia: Number(fecha.slice(8)), delMes: fecha.startsWith(mesTexto) }
  })
  const diasDelMes = Array.from({ length: diasMes }, (_, i) => `${mesTexto}-${dosDigitos(i + 1)}`)

  const proyectosVisibles = proyectoId === 'todos' ? proyectos : proyectos.filter((p) => p.id === proyectoId)
  const filas = filasCartera(proyectos, clientes, contratos, cuotas, cobros).filter(
    (f) => proyectoId === 'todos' || f.proyecto.id === proyectoId
  )

  const eventos: EventoCalendario[] = []
  filas.forEach((f) => {
    const cuota = f.cuota
    const reprogramada = cuota.fechaOriginal && cuota.fechaOriginal !== cuota.fechaProyectada ? ` · reprogramada (original ${formatoFecha(cuota.fechaOriginal)})` : ''
    if (cuota.fechaProyectada && cuota.entregable) {
      eventos.push({
        id: `entrega-${cuota.id}`,
        fecha: cuota.fechaProyectada,
        tipo: 'entrega',
        titulo: `Entrega: ${cuota.entregable}`,
        detalle: `${f.proyecto.nombre} · hito "${cuota.concepto}" · estado: ${cuota.estadoEntrega}${reprogramada}`,
        moneda: f.contrato.moneda,
        cuota,
        proyecto: f.proyecto,
      })
    }
    if (f.saldo > 0 && f.fecha) {
      const vencido = f.estado === 'Vencida'
      eventos.push({
        id: `cobro-${cuota.id}`,
        fecha: f.fecha,
        tipo: vencido ? 'vencido' : 'programado',
        titulo: `${vencido ? 'Vencido' : 'Cobro programado'}: ${cuota.concepto}`,
        detalle: `${f.proyecto.nombre} · ${cuota.numeroFactura ? `factura ${cuota.numeroFactura}` : 'sin factura'}${vencido ? ` · ${f.diasMora} días de mora` : ''}`,
        monto: f.saldo,
        moneda: f.contrato.moneda,
        cuota,
        proyecto: f.proyecto,
      })
    }
  })
  cobros.forEach((b) => {
    const fila = filas.find((f) => f.cuota.id === b.cuotaId)
    if (!fila) return
    eventos.push({
      id: `real-${b.id}`,
      fecha: b.fechaReal,
      tipo: 'realizado',
      titulo: `Cobro recibido: ${fila.cuota.concepto}`,
      detalle: `${fila.proyecto.nombre} · ${b.medio} · ${b.numeroRecibo} · ${b.comprobante}`,
      monto: b.valor,
      moneda: fila.contrato.moneda,
      cuota: fila.cuota,
      proyecto: fila.proyecto,
    })
  })

  const eventosMes = eventos.filter((e) => e.fecha.startsWith(mesTexto))
  const sumar = (tipo: TipoEvento) => redondear(eventosMes.filter((e) => e.tipo === tipo).reduce((suma, e) => suma + (e.monto ?? 0), 0))
  const proyectadoMes = redondear(filas.filter((f) => f.cuota.fechaProyectada?.startsWith(mesTexto)).reduce((suma, f) => suma + f.monto, 0))
  const cobradoMes = sumar('realizado')
  const pendienteMes = sumar('programado')
  const moraMes = sumar('vencido')
  const baseRecaudo = cobradoMes + pendienteMes + moraMes
  const tasaRecaudo = baseRecaudo > 0 ? Math.round((cobradoMes / baseRecaudo) * 100) : 0

  const cambiarMes = (delta: number) => {
    const fecha = new Date(Date.UTC(anio, mes - 1 + delta, 1))
    setPeriodo({ anio: fecha.getUTCFullYear(), mes: fecha.getUTCMonth() + 1 })
    setDiaSeleccionado(null)
  }

  const irAHoy = () => {
    setPeriodo({ anio: Number(HOY.slice(0, 4)), mes: Number(HOY.slice(5, 7)) })
    setDiaSeleccionado(null)
  }

  const eventosDelDia = diaSeleccionado ? eventos.filter((e) => e.fecha === diaSeleccionado) : []

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-semibold">Calendario financiero</h2>
        <div className="flex flex-wrap items-center gap-2">
          <select className={`${entrada} max-w-xs`} value={proyectoId} onChange={(e) => setProyectoId(e.target.value)}>
            <option value="todos">Todos los proyectos</option>
            {proyectos.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
          <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
            {(['calendario', 'matriz'] as Modo[]).map((m) => (
              <button
                key={m}
                onClick={() => setModo(m)}
                className={`rounded px-3 py-1 text-xs font-medium ${modo === m ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:bg-white/60'}`}
              >
                {m === 'calendario' ? 'Calendario' : 'Matriz por proyecto'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <TarjetaMetrica titulo={`Flujo proyectado (${MESES[mes - 1]})`} valor={formatoMoneda(proyectadoMes)} detalle="Total programado en este periodo" />
        <TarjetaMetrica titulo="Cobrado efectivo" valor={formatoMoneda(cobradoMes)} tono="ok" detalle={`Tasa de recaudación: ${tasaRecaudo} %`} />
        <TarjetaMetrica titulo="Pendiente por vencer" valor={formatoMoneda(pendienteMes)} detalle="Cobros en plazo" />
        <TarjetaMetrica titulo="En mora" valor={formatoMoneda(moraMes)} tono={moraMes > 0 ? 'peligro' : 'neutro'} detalle={moraMes > 0 ? 'Requiere gestión inmediata' : 'Sin vencimientos en este mes'} />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">{MESES[mes - 1]} {anio}</h3>
              <p className="text-xs text-slate-500">Flujo de ingresos y entregas de software</p>
            </div>
          </div>
          <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
            <button onClick={() => cambiarMes(-1)} aria-label="Mes anterior" className="rounded p-1.5 text-slate-600 transition-colors hover:bg-white">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={irAHoy} className="rounded px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-white">Hoy</button>
            <button onClick={() => cambiarMes(1)} aria-label="Mes siguiente" className="rounded p-1.5 text-slate-600 transition-colors hover:bg-white">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {modo === 'calendario' ? (
          <>
            <div className="flex flex-wrap items-center gap-4 border-b border-slate-100 py-3 text-xs text-slate-600">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Convenciones:</span>
              {LEYENDA.map((l) => (
                <div key={l.texto} className="flex items-center gap-1.5">
                  <span className={`h-2.5 w-2.5 rounded-full ${l.color}`} />
                  <span>{l.texto}</span>
                </div>
              ))}
            </div>

            <div className="mt-3 grid grid-cols-7 gap-px overflow-hidden rounded-lg bg-slate-200">
              {DIAS_SEMANA.map((d) => (
                <div key={d} className="bg-slate-50 p-2 text-center text-xs font-semibold text-slate-500">{d}</div>
              ))}
            </div>

            <div className="mt-1 grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-slate-200 bg-slate-200">
              {celdas.map((celda) => {
                const delDia = eventos.filter((e) => e.fecha === celda.fecha)
                const esHoy = celda.fecha === HOY
                const seleccionada = diaSeleccionado === celda.fecha
                return (
                  <div
                    key={celda.fecha}
                    data-fecha={celda.fecha}
                    onClick={() => setDiaSeleccionado(celda.fecha)}
                    className={`min-h-[90px] cursor-pointer bg-white p-1.5 transition-all hover:bg-slate-50 sm:min-h-[110px] sm:p-2 ${!celda.delMes ? 'bg-slate-50/50 opacity-40' : ''} ${seleccionada ? 'relative z-10 ring-2 ring-indigo-500' : ''}`}
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${esHoy ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-700'}`}>
                        {celda.dia}
                      </span>
                      {delDia.length > 0 && <span className="rounded bg-indigo-50 px-1 text-[10px] font-semibold text-indigo-600">{delDia.length}</span>}
                    </div>
                    <div className="space-y-1">
                      {delDia.slice(0, 2).map((ev) => (
                        <div key={ev.id} title={`${ev.proyecto.nombre} · ${ev.titulo}`} className={`truncate rounded border p-1 text-[10px] font-medium sm:text-[11px] ${ESTILO_CHIP[ev.tipo]}`}>
                          {ev.monto ? `${ev.tipo === 'realizado' ? '+' : ''}${montoCorto(ev.monto)}` : <Package className="-mt-0.5 inline h-3 w-3" />} {ev.cuota.concepto}
                        </div>
                      ))}
                      {delDia.length > 2 && <div className="text-center text-[10px] font-medium text-slate-400">+{delDia.length - 2} más</div>}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        ) : (
          <div className="mt-4">
            <MatrizCalendario dias={diasDelMes} proyectosVisibles={proyectosVisibles} />
          </div>
        )}
      </div>

      {modo === 'calendario' && diaSeleccionado && (
        <div className="mt-5 rounded-2xl border border-indigo-200 bg-white p-5 shadow-md">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-indigo-600" />
              <h3 className="text-base font-bold text-slate-900">Detalle del día: {formatoFecha(diaSeleccionado)}</h3>
            </div>
            <button onClick={() => setDiaSeleccionado(null)} className="text-xs text-slate-400 hover:text-slate-600">Cerrar</button>
          </div>

          <div className="mt-4 space-y-3">
            {eventosDelDia.length === 0 && (
              <p className="py-6 text-center text-sm text-slate-400">No hay eventos ni vencimientos programados para este día.</p>
            )}
            {eventosDelDia.map((ev) => (
              <div key={ev.id} className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${ESTILO_ETIQUETA[ev.tipo].clase}`}>{ESTILO_ETIQUETA[ev.tipo].texto}</span>
                    <h4 className="text-sm font-bold text-slate-900">{ev.titulo}</h4>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{ev.detalle}</p>
                  <Link to={`/proyectos/${ev.proyecto.id}`} className="mt-1 inline-block text-xs font-medium text-indigo-600 hover:underline">Ver expediente</Link>
                </div>
                <div className="flex items-center gap-3">
                  {ev.monto !== undefined && <span className="text-base font-bold text-slate-900">{formatoMoneda(ev.monto, ev.moneda)}</span>}
                  {puedeOperar && (ev.tipo === 'programado' || ev.tipo === 'vencido') && (
                    <button
                      onClick={() => setCuotaCobro(ev.cuota)}
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
                    >
                      Registrar cobro
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {cuotaCobro && <ModalCobro cuota={cuotaCobro} onCerrar={() => setCuotaCobro(null)} />}
    </>
  )
}