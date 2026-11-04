import { Link } from 'react-router-dom'
import { ArrowUpRight, FolderGit2, History, UserCog, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import DonutGrafico from '../../componentes/graficos/DonutGrafico'
import GraficoFlujoMensual from '../../componentes/graficos/GraficoFlujoMensual'
import EtiquetaEstado from '../../componentes/EtiquetaEstado'
import TarjetaMetrica from '../../componentes/TarjetaMetrica'
import { useAuditoria } from '../../contextos/AuditoriaContext'
import { useAuth } from '../../contextos/AuthContext'
import { useDatos } from '../../contextos/DatosContext'
import { formatoMoneda, redondear } from '../../utils/finanzas'
import { datosDeProyecto, flujoMensual, proyectosEnAtencion, progresoEntrega, resumenFinanciero } from '../../utils/indicadores'

const COLORES_ESTADO: Record<string, string> = {
  Prototipo: '#f59e0b',
  'En desarrollo': '#0ea5e9',
  'En entrega': '#6366f1',
  Cerrado: '#10b981',
}

function Panel({ titulo, subtitulo, children, className = '' }: { titulo: string; subtitulo?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
      <div className="mb-4">
        <h3 className="text-sm font-bold text-slate-900">{titulo}</h3>
        {subtitulo && <p className="text-xs text-slate-500">{subtitulo}</p>}
      </div>
      {children}
    </section>
  )
}

function Leyenda({ color, nombre, valor }: { color: string; nombre: string; valor: string }) {
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

function BarraAvance({ etiqueta, porcentaje, color }: { etiqueta: string; porcentaje: number; color: string }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-[11px] font-medium text-slate-500">
        <span>{etiqueta}</span>
        <span className="tabular-nums text-slate-700">{porcentaje} %</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100">
        <div className="h-2 rounded-full" style={{ width: `${Math.min(100, porcentaje)}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}

export default function DashboardDireccion() {
  const { usuarios } = useAuth()
  const { registros } = useAuditoria()
  const { proyectos, contratos, cuotas, cobros, desarrolladores } = useDatos()

  const global = resumenFinanciero(contratos, cuotas, cobros)
  const alertas = proyectosEnAtencion(proyectos, contratos, cuotas, cobros)
  const flujo = flujoMensual(cuotas, contratos, cobros)
  const porVencer = redondear(Math.max(0, global.porCobrar - global.vencido))

  const segmentosCartera = [
    { nombre: 'Cobrado', valor: global.cobrado, color: '#10b981' },
    { nombre: 'Por vencer', valor: porVencer, color: '#6366f1' },
    { nombre: 'Vencido', valor: global.vencido, color: '#f43f5e' },
  ]

  const segmentosEstado = Object.keys(COLORES_ESTADO).map((estado) => ({
    nombre: estado,
    valor: proyectos.filter((p) => p.estado === estado).length,
    color: COLORES_ESTADO[estado],
  }))

  const avancePorProyecto = proyectos.map((p) => {
    const d = datosDeProyecto(p.id, contratos, cuotas)
    return { proyecto: p, resumen: resumenFinanciero(d.contratos, d.cuotas, cobros), entrega: progresoEntrega(d.cuotas) }
  })

  const controles: { titulo: string; valor: number; detalle: string; ruta: string; icono: LucideIcon }[] = [
    { titulo: 'Proyectos', valor: proyectos.length, detalle: 'Ver, editar y eliminar', ruta: '/proyectos', icono: FolderGit2 },
    { titulo: 'Usuarios', valor: usuarios.length, detalle: 'Crear cuentas por área', ruta: '/usuarios', icono: UserCog },
    { titulo: 'Desarrolladores', valor: desarrolladores.length, detalle: 'Equipo técnico', ruta: '/desarrolladores', icono: Users },
    { titulo: 'Auditoría', valor: registros.length, detalle: 'Eventos registrados', ruta: '/auditoria', icono: History },
  ]

  return (
    <>
      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <TarjetaMetrica titulo="Total contratado" valor={formatoMoneda(global.contratado)} detalle={`${contratos.length} contratos`} />
        <TarjetaMetrica titulo="Cobrado" valor={formatoMoneda(global.cobrado)} tono="ok" detalle={`${global.progresoCobro} % del total`} />
        <TarjetaMetrica titulo="Por cobrar" valor={formatoMoneda(global.porCobrar)} detalle={`${formatoMoneda(porVencer)} aún en plazo`} />
        <TarjetaMetrica titulo="Vencido" valor={formatoMoneda(global.vencido)} tono={global.vencido > 0 ? 'peligro' : 'neutro'} detalle={global.vencido > 0 ? 'Requiere gestión de cobro' : 'Sin cartera vencida'} />
      </div>

      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {controles.map((c) => {
          const Icono = c.icono
          return (
            <Link
              key={c.titulo}
              to={c.ruta}
              className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-indigo-300 hover:shadow"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white transition-colors group-hover:bg-indigo-600">
                <Icono className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-2xl font-bold leading-none text-slate-900">{c.valor}</p>
                <p className="mt-1 truncate text-xs font-semibold uppercase tracking-wider text-slate-500">{c.titulo}</p>
                <p className="truncate text-[11px] text-slate-400">{c.detalle}</p>
              </div>
              <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-300 transition-colors group-hover:text-indigo-600" />
            </Link>
          )
        })}
      </div>

      <div className="mb-5 grid gap-5 lg:grid-cols-3">
        <Panel titulo="Flujo de caja mensual" subtitulo="Cobros proyectados frente a cobros ejecutados" className="lg:col-span-2">
          <div className="mb-2 flex gap-4 text-xs text-slate-600">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />Proyectado</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />Ejecutado</span>
          </div>
          <GraficoFlujoMensual datos={flujo} />
        </Panel>

        <Panel titulo="Salud de la cartera" subtitulo="Distribución del total contratado">
          <DonutGrafico datos={segmentosCartera} centroValor={`${global.progresoCobro} %`} centroEtiqueta="Cobrado" formato={formatoMoneda} />
          <div className="mt-4 space-y-2.5 border-t border-slate-100 pt-4">
            {segmentosCartera.map((s) => <Leyenda key={s.nombre} color={s.color} nombre={s.nombre} valor={formatoMoneda(s.valor)} />)}
          </div>
        </Panel>
      </div>

      <div className="mb-5 grid gap-5 lg:grid-cols-3">
        <Panel titulo="Avance por proyecto" subtitulo="Cobranza y entregables de cada proyecto" className="lg:col-span-2">
          <ul className="space-y-4">
            {avancePorProyecto.map(({ proyecto, resumen, entrega }) => (
              <li key={proyecto.id} className="rounded-xl border border-slate-100 p-3">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <Link to={`/proyectos/${proyecto.id}`} className="text-sm font-semibold text-slate-900 hover:text-indigo-600">
                    <span className="mr-2 font-mono text-xs text-slate-400">{proyecto.codigo}</span>
                    {proyecto.nombre}
                  </Link>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500">Saldo <strong className="text-slate-800">{formatoMoneda(resumen.porCobrar)}</strong></span>
                    <EtiquetaEstado estado={proyecto.estado} />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <BarraAvance etiqueta="Cobranza" porcentaje={resumen.progresoCobro} color="#10b981" />
                  <BarraAvance etiqueta="Entregables" porcentaje={entrega} color="#6366f1" />
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel titulo="Proyectos por estado" subtitulo="Pipeline de la cartera">
          <DonutGrafico datos={segmentosEstado} centroValor={String(proyectos.length)} centroEtiqueta="Proyectos" />
          <div className="mt-4 space-y-2.5 border-t border-slate-100 pt-4">
            {segmentosEstado.map((s) => <Leyenda key={s.nombre} color={s.color} nombre={s.nombre} valor={String(s.valor)} />)}
          </div>
        </Panel>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Panel titulo={`Proyectos que requieren atención (${alertas.length})`} subtitulo="Cartera vencida, planes incompletos y atrasos" className="lg:col-span-2">
          {alertas.length === 0 && <p className="text-sm text-slate-400">Todos los proyectos están en orden</p>}
          <ul className="space-y-3">
            {alertas.map((a) => (
              <li key={a.proyecto.id} className="rounded-xl border border-slate-100 p-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <Link to={`/proyectos/${a.proyecto.id}`} className="font-semibold text-indigo-700 hover:underline">
                    {a.proyecto.codigo} · {a.proyecto.nombre}
                  </Link>
                  <EtiquetaEstado estado={a.proyecto.estado} />
                </div>
                <ul className="mt-1.5 list-disc pl-5 text-slate-600">
                  {a.motivos.map((m) => <li key={m}>{m}</li>)}
                </ul>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel titulo="Actividad reciente" subtitulo="Últimos movimientos del sistema">
          {registros.length === 0 && <p className="text-sm text-slate-400">Aún no hay actividad registrada</p>}
          <ul className="space-y-3">
            {registros.slice(0, 6).map((r) => (
              <li key={r.id} className="flex gap-3 text-sm">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-indigo-500" />
                <div className="min-w-0">
                  
                  <p className="font-medium text-slate-900">{r.accion}</p>
                  <p className="truncate text-xs text-slate-500" title={r.detalle}>{r.detalle}</p>
                  <p className="text-[11px] text-slate-400">{r.usuario} · {new Date(r.fecha).toLocaleString('es-EC')}</p>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  )
}