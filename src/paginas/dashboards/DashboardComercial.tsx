import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle, ArrowRight, Briefcase, CalendarClock, CalendarPlus, CheckCircle2, ClipboardList, FilePlus2, FileSignature, FileWarning,
  FolderPlus, Hourglass, ListChecks, Search, Sparkles, UserPlus, Video,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import EtiquetaEstado from '../../componentes/EtiquetaEstado'
import ModalCliente from '../../componentes/modales/ModalCliente'
import { ESTADOS_PROTOTIPO } from '../../componentes/modales/ModalEditarProyecto'
import ModalMinuta from '../../componentes/modales/ModalMinuta'
import ModalNuevoProyecto from '../../componentes/modales/ModalNuevoProyecto'
import { Panel } from '../../componentes/Panel'
import TarjetaMetrica from '../../componentes/TarjetaMetrica'
import { useAuth } from '../../contextos/AuthContext'
import { useDatos } from '../../contextos/DatosContext'
import { HOY } from '../../datos/datosEjemplo'
import {
  cotizacionesAbiertas, documentosFaltantes, ETAPAS_COMERCIALES, etapaComercial, metasSinDefinir, oportunidadesAmpliacion,
} from '../../utils/comercial'
import type { EtapaComercial } from '../../utils/comercial'
import { entradaCompacta } from '../../utils/estilos'
import { diasEntre, formatoFecha, formatoMoneda, montoCuota, resumenPlan } from '../../utils/finanzas'
import { pendientesDeDecision } from '../../utils/adicionales'
import { puedeVerCategoria } from '../../utils/permisosDocumentos'
import { puedeVerReunion } from '../../utils/reuniones'

const enDias = (dias: number) => (dias === 0 ? 'hoy' : dias === 1 ? 'mañana' : dias === -1 ? 'ayer' : dias < 0 ? `hace ${-dias} días` : `en ${dias} días`)

function Vacio({ texto }: { texto: string }) {
  return (
    <p className="flex items-center gap-2 rounded-xl border border-dashed border-slate-200 px-3 py-4 text-sm text-slate-400">
      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
      {texto}
    </p>
  )
}

function Contador({ valor, tono = 'neutro' }: { valor: number; tono?: 'neutro' | 'alerta' | 'peligro' }) {
  const clase = valor === 0 ? 'bg-emerald-50 text-emerald-700' : tono === 'peligro' ? 'bg-rose-50 text-rose-700' : tono === 'alerta' ? 'bg-amber-50 text-amber-700' : 'bg-indigo-50 text-indigo-700'
  return <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${clase}`}>{valor}</span>
}

type Modal = 'cliente' | 'proyecto' | 'reunion' | null

export default function DashboardComercial() {
  const { usuario } = useAuth()
  const { proyectos: todos, clientes, contratos, cuotas, documentos, desarrolladores, asignaciones, adicionales, permisosDocumentos, programarPrototipo } = useDatos()
  const esComercial = usuario?.rol === 'comercial'
  const puedeGestionar = esComercial || usuario?.rol === 'administrador'
  const [soloMios, setSoloMios] = useState(esComercial)
  const [busqueda, setBusqueda] = useState('')
  const [etapaFiltro, setEtapaFiltro] = useState<EtapaComercial | 'todas'>('todas')
  const [modal, setModal] = useState<Modal>(null)
  const [errorPrototipo, setErrorPrototipo] = useState<string | null>(null)

  // Alcance: mis proyectos (responsable comercial) o toda la cartera.
  const proyectos = soloMios && usuario ? todos.filter((p) => p.responsableId === usuario.id) : todos
  const ids = new Set(proyectos.map((p) => p.id))
  const contratosVista = contratos.filter((k) => ids.has(k.proyectoId))
  const cuotasVista = cuotas.filter((q) => contratosVista.some((k) => k.id === q.contratoId))
  const documentosVista = documentos.filter((d) => ids.has(d.proyectoId))
  const clienteDe = (id: string) => clientes.find((c) => c.id === id)
  const proyectoDeCuota = (q: { contratoId: string }) => todos.find((p) => p.id === contratos.find((k) => k.id === q.contratoId)?.proyectoId)

  // 1. Embudo
  const etapas = new Map(proyectos.map((p) => [p.id, etapaComercial(p, contratos, documentos)]))
  const clientesSinProyecto = clientes.filter((c) => !todos.some((p) => p.clienteId === c.id))
  const embudo = ETAPAS_COMERCIALES.map((e) => {
    const lista = proyectos.filter((p) => etapas.get(p.id) === e.id)
    const valor = contratosVista.filter((k) => lista.some((p) => p.id === k.proyectoId)).reduce((s, k) => s + k.monto, 0)
    return { ...e, cantidad: lista.length + (e.id === 'alta' ? clientesSinProyecto.length : 0), valor }
  })
  const maximoEmbudo = Math.max(1, ...embudo.map((e) => e.cantidad))

  // 2. Cartera con búsqueda
  const texto = busqueda.trim().toLowerCase()
  const cartera = proyectos
    .filter((p) => etapaFiltro === 'todas' || etapas.get(p.id) === etapaFiltro)
    .filter((p) => !texto || `${p.nombre} ${p.codigo} ${clienteDe(p.clienteId)?.nombre ?? ''} ${clienteDe(p.clienteId)?.contacto ?? ''} ${p.estado} ${p.prototipo}`.toLowerCase().includes(texto))

  // 3. Prototipos sin validar
  const prototipos = proyectos.filter((p) => p.prototipo !== 'Validado').sort((a, b) => (a.fechaPrototipo ?? '9999').localeCompare(b.fechaPrototipo ?? '9999'))
  const validados = proyectos.length - prototipos.length

  // 4–10. Pendientes
  const cotizaciones = puedeVerCategoria(usuario?.rol, 'cotizacion', permisosDocumentos) ? cotizacionesAbiertas(documentosVista) : []
  const planes = contratosVista.map((k) => ({ contrato: k, plan: resumenPlan(k, cuotas) })).filter((x) => x.plan.estado !== 'completo')
  const metas = metasSinDefinir(cuotasVista)
  const reuniones = documentos.filter((d) => d.minuta && ids.has(d.proyectoId) && puedeVerReunion(usuario, d, desarrolladores, asignaciones))
  const proximas = reuniones.filter((d) => d.minuta!.fecha >= HOY).sort((a, b) => a.minuta!.fecha.localeCompare(b.minuta!.fecha)).slice(0, 4)
  const compromisos = reuniones
    .filter((d) => d.minuta!.fecha < HOY)
    .flatMap((d) => d.minuta!.pendientes.map((p) => ({ ...p, documento: d })))
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .slice(0, 5)
  const faltantes = documentosFaltantes(proyectos, documentos)
  const oportunidades = oportunidadesAmpliacion(proyectos, contratos)
  const atrasosCliente = cuotasVista.filter((q) => q.estadoEntrega === 'Atraso cliente')
  const adicionalesPendientes = pendientesDeDecision(adicionales.filter((a) => ids.has(a.proyectoId))).sort((a, b) => a.fechaSolicitud.localeCompare(b.fechaSolicitud))

  const valorContratado = contratosVista.reduce((s, k) => s + k.monto, 0)
  const pendientes = cotizaciones.length + planes.length + metas.length + faltantes.length + atrasosCliente.length + adicionalesPendientes.length

  const acciones: { titulo: string; detalle: string; icono: LucideIcon; onClick?: () => void; ruta?: string }[] = [
    { titulo: 'Nuevo cliente', detalle: 'Alta comercial', icono: UserPlus, onClick: () => setModal('cliente') },
    { titulo: 'Nuevo proyecto', detalle: 'Con contrato y equipo', icono: FolderPlus, onClick: () => setModal('proyecto') },
    { titulo: 'Armar cronograma', detalle: 'Plan de pagos y metas', icono: ListChecks, ruta: '/plan-pagos' },
    { titulo: 'Programar reunión', detalle: 'Con el cliente o áreas', icono: CalendarPlus, onClick: () => setModal('reunion') },
  ]

  const cambiarPrototipo = (proyectoId: string, cambios: { fechaPrototipo?: string; prototipo?: string }) => setErrorPrototipo(programarPrototipo(proyectoId, cambios))

  return (
    <>
      {/* Acciones rápidas y alcance */}
      <div className="mb-5 flex flex-wrap items-stretch gap-3">
        <div className="grid flex-1 grid-cols-2 gap-3 lg:grid-cols-4">
          {acciones.map((a) => {
            const contenido = (
              <>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-sm transition-transform group-hover:scale-105">
                  <a.icono className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-slate-900">{a.titulo}</span>
                  <span className="block truncate text-xs text-slate-500">{a.detalle}</span>
                </span>
              </>
            )
            const clase = 'group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow'
            if (!puedeGestionar) return null
            return a.ruta ? <Link key={a.titulo} to={a.ruta} className={clase}>{contenido}</Link> : <button key={a.titulo} onClick={a.onClick} className={clase}>{contenido}</button>
          })}
        </div>
        {esComercial && (
          <div className="flex items-center rounded-xl border border-slate-200 bg-white p-1 text-xs font-semibold shadow-sm">
            {[{ id: true, etiqueta: 'Mis proyectos' }, { id: false, etiqueta: 'Toda la cartera' }].map((o) => (
              <button key={String(o.id)} onClick={() => setSoloMios(o.id)} className={`rounded-lg px-3 py-2 transition-colors ${soloMios === o.id ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-700'}`}>
                {o.etiqueta}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <TarjetaMetrica titulo="Proyectos en cartera" valor={String(proyectos.length)} detalle={`${new Set(proyectos.map((p) => p.clienteId)).size} clientes · ${clientesSinProyecto.length} en alta`} icono={Briefcase} />
        <TarjetaMetrica titulo="Valor contratado" valor={formatoMoneda(valorContratado)} detalle={`${contratosVista.length} contrato(s)`} />
        <TarjetaMetrica titulo="Cotizaciones abiertas" valor={String(cotizaciones.length)} tono={cotizaciones.length ? 'alerta' : 'neutro'} detalle="Sin contrato firmado" icono={FileSignature} />
        <TarjetaMetrica titulo="Pendientes comerciales" valor={String(pendientes)} tono={pendientes ? 'alerta' : 'ok'} detalle="Adicionales, planes, metas, documentos y atrasos" icono={ClipboardList} />
      </div>

      {/* 1. Embudo */}
      <Panel titulo="Embudo comercial" subtitulo="Ciclo de vida del proyecto · clic en una etapa para filtrar la cartera" className="mb-5">
        <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-6">
          {embudo.map((e, i) => {
            const activa = etapaFiltro === e.id
            return (
              <button
                key={e.id}
                onClick={() => setEtapaFiltro(activa ? 'todas' : e.id)}
                className={`relative overflow-hidden rounded-xl border p-3 text-left transition-all ${activa ? 'border-indigo-300 ring-2 ring-indigo-100' : 'border-slate-200 hover:border-slate-300'}`}
              >
                <span className="absolute inset-x-0 bottom-0 h-1" style={{ backgroundColor: e.color }} />
                <span className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <span>{i + 1}. {e.etiqueta}</span>
                  {i < embudo.length - 1 && <ArrowRight className="hidden h-3.5 w-3.5 text-slate-300 xl:block" />}
                </span>
                <span className="mt-1 block text-2xl font-bold text-slate-900">{e.cantidad}</span>
                <span className="block truncate text-[11px] text-slate-500">{e.valor > 0 ? formatoMoneda(e.valor) : e.detalle}</span>
                <span className="mt-2 block h-1.5 rounded-full bg-slate-100">
                  <span className="block h-1.5 rounded-full" style={{ width: `${(e.cantidad / maximoEmbudo) * 100}%`, backgroundColor: e.color }} />
                </span>
              </button>
            )
          })}
        </div>
      </Panel>

      {/* 2. Mis clientes y proyectos */}
      <Panel
        titulo={soloMios ? 'Mis clientes y proyectos' : 'Clientes y proyectos'}
        subtitulo={`${cartera.length} de ${proyectos.length} proyecto(s)${etapaFiltro !== 'todas' ? ` · etapa ${ETAPAS_COMERCIALES.find((e) => e.id === etapaFiltro)?.etiqueta}` : ''}`}
        className="mb-5"
        accion={
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input className={`${entradaCompacta} w-64 py-1.5 pl-8 text-xs`} placeholder="Buscar cliente, proyecto o estado" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
            </div>
            <select className={`${entradaCompacta} w-auto py-1.5 text-xs`} value={etapaFiltro} onChange={(e) => setEtapaFiltro(e.target.value as EtapaComercial | 'todas')}>
              <option value="todas">Todas las etapas</option>
              {ETAPAS_COMERCIALES.map((e) => <option key={e.id} value={e.id}>{e.etiqueta}</option>)}
            </select>
          </div>
        }
      >
        <div className="-mx-5 -mb-5 overflow-x-auto border-t border-slate-100">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/60 text-left text-[11px] uppercase tracking-wider text-slate-500">
              <tr>{['Proyecto', 'Cliente', 'Etapa', 'Estado', 'Prototipo', 'Entrega ofrecida', 'Plan de pagos'].map((t) => <th key={t} className="p-3 font-medium">{t}</th>)}</tr>
            </thead>
            <tbody>
              {cartera.length === 0 && <tr><td colSpan={7} className="p-4 text-center text-slate-400">No hay proyectos con este filtro</td></tr>}
              {cartera.map((p) => {
                const cliente = clienteDe(p.clienteId)
                const etapa = ETAPAS_COMERCIALES.find((e) => e.id === etapas.get(p.id))
                const planesProyecto = contratos.filter((k) => k.proyectoId === p.id).map((k) => ({ k, plan: resumenPlan(k, cuotas) }))
                const dias = diasEntre(HOY, p.fechaEntrega)
                return (
                  <tr key={p.id} className="border-t border-slate-100 transition-colors hover:bg-slate-50/60">
                    <td className="p-3">
                      <Link to={`/proyectos/${p.id}`} className="font-medium text-indigo-600 hover:underline">{p.nombre}</Link>
                      <p className="font-mono text-[11px] text-slate-400">{p.codigo}</p>
                    </td>
                    <td className="p-3">
                      <p className="whitespace-nowrap text-slate-900">{cliente?.nombre}</p>
                      <p className="whitespace-nowrap text-[11px] text-slate-500">{cliente?.contacto}</p>
                    </td>
                    <td className="whitespace-nowrap p-3">
                      {etapa && <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: etapa.color }} />{etapa.etiqueta}</span>}
                    </td>
                    <td className="p-3"><EtiquetaEstado estado={p.estado} /></td>
                    <td className="p-3"><EtiquetaEstado estado={p.prototipo} /></td>
                    <td className="whitespace-nowrap p-3">
                      {formatoFecha(p.fechaEntrega)}
                      <span className={`ml-1 text-xs ${dias < 0 && p.estado !== 'Cerrado' ? 'text-rose-600' : 'text-slate-400'}`}>({enDias(dias)})</span>
                    </td>
                    <td className="whitespace-nowrap p-3 text-xs">
                      {planesProyecto.length === 0 && <span className="text-slate-400">Sin contrato</span>}
                      {planesProyecto.map(({ k, plan }) => (
                        <span key={k.id} className={`mr-1 rounded-full px-2 py-0.5 font-medium ${plan.estado === 'completo' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{k.numero}: {plan.porcentaje} %</span>
                      ))}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* 3 y 4. Prototipos y cotizaciones */}
      <div className="mb-5 grid gap-5 lg:grid-cols-2">
        <Panel titulo="Prototipos" subtitulo={`Por validar con el cliente · ${validados} ya validado(s)`} accion={<Contador valor={prototipos.length} tono="alerta" />}>
          {prototipos.length === 0 && <Vacio texto="Todos los prototipos están validados" />}
          <ul className="space-y-2">
            {prototipos.map((p) => {
              const dias = p.fechaPrototipo ? diasEntre(HOY, p.fechaPrototipo) : null
              return (
                <li key={p.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-100 p-3">
                  <div className={`flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl text-white ${dias === null ? 'bg-slate-300' : dias < 0 ? 'bg-rose-500' : dias <= 7 ? 'bg-amber-500' : 'bg-indigo-500'}`}>
                    {dias === null ? <Hourglass className="h-4 w-4" /> : <><span className="text-sm font-bold leading-none">{Math.abs(dias)}</span><span className="text-[9px] uppercase">{dias < 0 ? 'atraso' : 'días'}</span></>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link to={`/proyectos/${p.id}`} className="block truncate text-sm font-semibold text-slate-900 hover:text-indigo-600">{p.nombre}</Link>
                    <p className="truncate text-xs text-slate-500">
                      {clienteDe(p.clienteId)?.nombre} · {p.fechaPrototipo ? `presentación ${formatoFecha(p.fechaPrototipo)} (${enDias(dias!)})` : 'sin fecha de presentación'}
                    </p>
                  </div>
                  {puedeGestionar ? (
                    <div className="flex gap-1.5">
                      <input type="date" aria-label="Fecha prevista de presentación" className={`${entradaCompacta} w-36 py-1 text-xs`} value={p.fechaPrototipo ?? ''} onChange={(e) => cambiarPrototipo(p.id, { fechaPrototipo: e.target.value })} />
                      <select aria-label="Estado del prototipo" className={`${entradaCompacta} w-28 py-1 text-xs`} value={p.prototipo} onChange={(e) => cambiarPrototipo(p.id, { prototipo: e.target.value })}>
                        {ESTADOS_PROTOTIPO.map((s) => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                  ) : <EtiquetaEstado estado={p.prototipo} />}
                </li>
              )
            })}
          </ul>
          {errorPrototipo && <p className="mt-2 text-xs text-rose-600">{errorPrototipo}</p>}
        </Panel>

        <Panel titulo="Cotizaciones abiertas" subtitulo="Aún no pasan a contrato firmado" accion={<Contador valor={cotizaciones.length} tono="alerta" />}>
          {cotizaciones.length === 0 && <Vacio texto="Todas las cotizaciones ya tienen contrato" />}
          <ul className="space-y-2">
            {cotizaciones.map((d) => {
              const proyecto = todos.find((p) => p.id === d.proyectoId)
              const dias = diasEntre(d.fecha, HOY)
              return (
                <li key={d.id} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600"><FileSignature className="h-4 w-4" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{d.titulo} <span className="font-mono text-[11px] font-normal text-slate-400">{d.version}</span></p>
                    <p className="truncate text-xs text-slate-500">{proyecto?.nombre} · enviada {enDias(-dias)}{d.notas ? ` · ${d.notas}` : ''}</p>
                  </div>
                  <EtiquetaEstado estado={d.estado} />
                  <Link to={`/proyectos/${d.proyectoId}?pestana=documentos`} className="text-xs font-semibold text-indigo-600 hover:underline">Abrir</Link>
                </li>
              )
            })}
          </ul>
        </Panel>
      </div>

      {/* 5 y 6. Planes y metas */}
      <div className="mb-5 grid gap-5 lg:grid-cols-2">
        <Panel titulo="Planes de pago por completar" subtitulo="No suman el 100 % del contrato" accion={<Contador valor={planes.length} tono="alerta" />}>
          {planes.length === 0 && <Vacio texto="Todos los planes cubren su contrato" />}
          <ul className="space-y-3">
            {planes.map(({ contrato, plan }) => (
              <li key={contrato.id}>
                <div className="mb-1 flex justify-between gap-2 text-xs">
                  <span className="truncate font-medium text-slate-700">{contrato.numero} · {todos.find((p) => p.id === contrato.proyectoId)?.nombre}</span>
                  <span className={`shrink-0 font-semibold ${plan.estado === 'excedido' ? 'text-rose-600' : 'text-amber-600'}`}>
                    {plan.porcentaje} % · {plan.estado === 'excedido' ? 'sobran' : 'faltan'} {formatoMoneda(Math.abs(plan.diferencia), contrato.moneda)}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div className={`h-2 rounded-full ${plan.estado === 'excedido' ? 'bg-rose-500' : 'bg-amber-500'}`} style={{ width: `${Math.min(100, plan.porcentaje)}%` }} />
                </div>
              </li>
            ))}
          </ul>
          {planes.length > 0 && <Link to="/plan-pagos" className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:underline">Completar en el plan de pagos <ArrowRight className="h-3.5 w-3.5" /></Link>}
        </Panel>

        <Panel titulo="Entregables y metas sin definir" subtitulo="Se pueden completar después de firmar (RF-16)" accion={<Contador valor={metas.length} tono="alerta" />}>
          {metas.length === 0 && <Vacio texto="Todas las cuotas tienen entregable, fecha y valor" />}
          <ul className="space-y-2">
            {metas.map(({ cuota, faltantes: falta }) => {
              const contrato = contratos.find((k) => k.id === cuota.contratoId)
              return (
                <li key={cuota.id} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600"><ListChecks className="h-4 w-4" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{cuota.concepto} <span className="font-normal text-slate-400">· cuota {cuota.orden}</span></p>
                    <p className="truncate text-xs text-slate-500">{proyectoDeCuota(cuota)?.nombre} · {contrato?.numero}{contrato && montoCuota(cuota, contrato) > 0 ? ` · ${formatoMoneda(montoCuota(cuota, contrato), contrato.moneda)}` : ''}</p>
                  </div>
                  <div className="flex flex-wrap justify-end gap-1">
                    {falta.map((f) => <span key={f} className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">sin {f}</span>)}
                  </div>
                </li>
              )
            })}
          </ul>
          {metas.length > 0 && <Link to="/plan-pagos" className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:underline">Definir en el cronograma <ArrowRight className="h-3.5 w-3.5" /></Link>}
        </Panel>
      </div>

      {/* 7. Reuniones */}
      <Panel titulo="Reuniones" subtitulo="Próximas citas y compromisos de las reuniones ya realizadas" className="mb-5" accion={<Link to="/reuniones" className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:underline">Ver todas <ArrowRight className="h-3.5 w-3.5" /></Link>}>
        <div className="grid gap-5 lg:grid-cols-2">
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Próximas</p>
            {proximas.length === 0 && <Vacio texto="No hay reuniones agendadas" />}
            <ul className="space-y-2">
              {proximas.map((d) => {
                const m = d.minuta!
                return (
                  <li key={d.id} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
                    <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl bg-slate-900 text-white">
                      <span className="text-sm font-bold leading-none">{m.fecha.slice(8, 10)}</span>
                      <span className="text-[9px] uppercase">{new Date(`${m.fecha}T12:00:00`).toLocaleDateString('es', { month: 'short' }).replace('.', '')}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">{d.titulo}</p>
                      <p className="truncate text-xs text-slate-500">{todos.find((p) => p.id === d.proyectoId)?.nombre} · {enDias(diasEntre(HOY, m.fecha))}{m.hora ? ` a las ${m.hora}` : ''}</p>
                    </div>
                    {m.enlace && <a href={m.enlace} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100"><Video className="h-3.5 w-3.5" />Unirse</a>}
                  </li>
                )
              })}
            </ul>
          </div>
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Acuerdos y pendientes</p>
            {compromisos.length === 0 && <Vacio texto="Sin compromisos pendientes" />}
            <ul className="space-y-2">
              {compromisos.map((c, i) => (
                <li key={i} className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm ${c.fecha < HOY ? 'bg-rose-50' : 'bg-slate-50'}`}>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900">{c.tarea}</p>
                    <p className="truncate text-xs text-slate-500">{c.responsable} · {c.documento.titulo}</p>
                  </div>
                  <span className={`shrink-0 text-xs font-semibold ${c.fecha < HOY ? 'text-rose-600' : 'text-slate-600'}`}>{c.fecha < HOY ? `Vencido ${formatoFecha(c.fecha)}` : formatoFecha(c.fecha)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Panel>

      {/* Adicionales por aprobar */}
      <Panel
        titulo="Adicionales por aprobar"
        subtitulo="Pedidos extra del cliente: al aprobarse generan un contrato de ampliación"
        className="mb-5"
        accion={<Contador valor={adicionalesPendientes.length} tono="alerta" />}
      >
        {adicionalesPendientes.length === 0 && <Vacio texto="No hay adicionales esperando decisión" />}
        <ul className="grid gap-2 md:grid-cols-2">
          {adicionalesPendientes.map((a) => {
            const proyecto = todos.find((p) => p.id === a.proyectoId)
            return (
              <li key={a.id} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${a.estado === 'cotizado' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-500'}`}><FilePlus2 className="h-4 w-4" /></span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">{a.titulo}</p>
                  <p className="truncate text-xs text-slate-500">
                    {proyecto?.nombre} · {a.solicitadoPor} · {a.montoEstimado ? formatoMoneda(a.montoEstimado) : 'sin cotizar'} · pedido {enDias(diasEntre(HOY, a.fechaSolicitud))}
                  </p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${a.estado === 'cotizado' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>{a.estado === 'cotizado' ? 'Cotizado' : 'Por cotizar'}</span>
                <Link to={`/proyectos/${a.proyectoId}?pestana=adicionales`} className="text-xs font-semibold text-indigo-600 hover:underline">Decidir</Link>
              </li>
            )
          })}
        </ul>
      </Panel>

      {/* 8, 9 y 10 */}
      <div className="grid gap-5 lg:grid-cols-3">
        <Panel titulo="Documentos faltantes" subtitulo="Según la etapa del proyecto" accion={<Contador valor={faltantes.length} tono="peligro" />}>
          {faltantes.length === 0 && <Vacio texto="Expedientes completos" />}
          <ul className="space-y-2">
            {faltantes.map(({ proyecto, faltan }) => (
              <li key={proyecto.id} className="rounded-xl border border-slate-100 p-3">
                <Link to={`/proyectos/${proyecto.id}?pestana=documentos`} className="flex items-center gap-1.5 text-sm font-semibold text-slate-900 hover:text-indigo-600">
                  <FileWarning className="h-4 w-4 text-rose-500" />{proyecto.nombre}
                </Link>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {faltan.map((f) => <span key={f} className="rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-700">{f}</span>)}
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel titulo="Oportunidades de ampliación" subtitulo="Proyectos entregados o por cerrar" accion={<Contador valor={oportunidades.filter((o) => !o.yaAmpliado).length} />}>
          {oportunidades.length === 0 && <Vacio texto="Sin proyectos cerca del cierre" />}
          <ul className="space-y-2">
            {oportunidades.map((o) => {
              const cliente = clienteDe(o.proyecto.clienteId)
              const contratado = contratos.filter((k) => k.proyectoId === o.proyecto.id).reduce((s, k) => s + k.monto, 0)
              return (
                <li key={o.proyecto.id} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600"><Sparkles className="h-4 w-4" /></span>
                  <div className="min-w-0 flex-1">
                    <Link to={`/proyectos/${o.proyecto.id}`} className="block truncate text-sm font-semibold text-slate-900 hover:text-indigo-600">{o.proyecto.nombre}</Link>
                    <p className="truncate text-xs text-slate-500">{cliente?.contacto ?? cliente?.nombre} · {o.motivo} · {formatoMoneda(contratado)}</p>
                  </div>
                  {o.yaAmpliado && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">Ampliado</span>}
                </li>
              )
            })}
          </ul>
        </Panel>

        <Panel titulo="Atrasos atribuidos al cliente" subtitulo="Entregables detenidos por el cliente" accion={<Contador valor={atrasosCliente.length} tono="alerta" />}>
          {atrasosCliente.length === 0 && <Vacio texto="El cliente no tiene atrasos" />}
          <ul className="space-y-2">
            {atrasosCliente.map((q) => {
              const proyecto = proyectoDeCuota(q)
              const cliente = proyecto ? clienteDe(proyecto.clienteId) : undefined
              const corrimiento = q.fechaOriginal && q.fechaProyectada ? diasEntre(q.fechaOriginal, q.fechaProyectada) : 0
              return (
                <li key={q.id} className="rounded-xl border border-amber-100 bg-amber-50/40 p-3">
                  <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-900"><AlertTriangle className="h-4 w-4 text-amber-500" />{q.entregable || q.concepto}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {proyecto?.nombre} · {cliente?.contacto}
                    {q.fechaProyectada && ` · prevista ${formatoFecha(q.fechaProyectada)}`}
                    {corrimiento > 0 && <span className="font-semibold text-amber-700"> (+{corrimiento} días)</span>}
                  </p>
                  {proyecto && (
                    <Link to={`/proyectos/${proyecto.id}`} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:underline">
                      <CalendarClock className="h-3.5 w-3.5" />Dar seguimiento
                    </Link>
                  )}
                </li>
              )
            })}
          </ul>
        </Panel>
      </div>

      {modal === 'cliente' && <ModalCliente onCerrar={() => setModal(null)} />}
      {modal === 'proyecto' && <ModalNuevoProyecto onCerrar={() => setModal(null)} />}
      {modal === 'reunion' && <ModalMinuta onCerrar={() => setModal(null)} />}
    </>
  )
}
