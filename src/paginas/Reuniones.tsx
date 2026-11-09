import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Building2, CalendarDays, Clock, ClipboardList, ExternalLink, Handshake, Lock, Users, Video } from 'lucide-react'
import DonutGrafico from '../componentes/graficos/DonutGrafico'
import InsigniaReunion from '../componentes/InsigniaReunion'
import ModalMinuta from '../componentes/modales/ModalMinuta'
import { BarraAvance, Encabezado, Leyenda, Panel } from '../componentes/Panel'
import TarjetaMetrica from '../componentes/TarjetaMetrica'
import { useAuth } from '../contextos/AuthContext'
import { useDatos } from '../contextos/DatosContext'
import { HOY } from '../datos/datosEjemplo'
import { botonPrimario, entradaCompacta } from '../utils/estilos'
import { diasEntre, formatoFecha } from '../utils/finanzas'
import { AREAS_REUNION, areasDeReunion, proyectosParaAgendar, puedeVerReunion } from '../utils/reuniones'
import type { AreaReunion } from '../tipos'

const PALETA = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#14b8a6']

const plataforma = (enlace: string): string => {
  if (/meet\.google/i.test(enlace)) return 'Google Meet'
  if (/zoom\./i.test(enlace)) return 'Zoom'
  if (/teams\.(microsoft|live)/i.test(enlace)) return 'Microsoft Teams'
  if (/webex/i.test(enlace)) return 'Webex'
  return 'Enlace externo'
}

export default function Reuniones() {
  const { usuario } = useAuth()
  const { documentos, proyectos, desarrolladores, asignaciones } = useDatos()
  const [creando, setCreando] = useState(false)
  const [proyectoFiltro, setProyectoFiltro] = useState('todos')
  const [vista, setVista] = useState<'todas' | 'equipo' | 'areas'>('todas')
  const [areaFiltro, setAreaFiltro] = useState<AreaReunion | 'todas'>('todas')
  const puedeCrear = proyectosParaAgendar(usuario, proyectos, desarrolladores, asignaciones).length > 0

  // Cada persona ve solo las reuniones de su equipo o de su área; el administrador las ve todas.
  const minutas = documentos
    .filter((d) => d.categoria === 'minuta' && d.minuta && puedeVerReunion(usuario, d, desarrolladores, asignaciones))
    .sort((a, b) => (b.minuta!.fecha).localeCompare(a.minuta!.fecha))
  const deEquipo = minutas.filter((d) => d.minuta!.alcance === 'equipo')
  const conAreas = minutas.filter((d) => d.minuta!.alcance !== 'equipo')
  const visibles = minutas
    .filter((d) => proyectoFiltro === 'todos' || d.proyectoId === proyectoFiltro)
    .filter((d) => vista === 'todas' || (vista === 'equipo' ? d.minuta!.alcance === 'equipo' : d.minuta!.alcance !== 'equipo'))
    .filter((d) => vista !== 'areas' || areaFiltro === 'todas' || areasDeReunion(d).includes(areaFiltro))
  const porArea = AREAS_REUNION.map((a) => ({ ...a, valor: conAreas.filter((d) => areasDeReunion(d).includes(a.id)).length }))
  const maximoArea = Math.max(1, deEquipo.length, ...porArea.map((a) => a.valor))
  const mesActual = HOY.slice(0, 7)

  const pendientes = minutas.flatMap((d) => d.minuta!.pendientes.map((p) => ({ ...p, documento: d })))
  const vencidos = pendientes.filter((p) => p.fecha < HOY)
  const proximos = pendientes.filter((p) => p.fecha >= HOY).sort((a, b) => a.fecha.localeCompare(b.fecha)).slice(0, 5)
  const acuerdos = minutas.reduce((suma, d) => suma + d.minuta!.acuerdos.length, 0)
  const conEnlace = minutas.filter((d) => d.minuta!.enlace).length

  const porProyecto = proyectos
    .map((p, i) => ({ nombre: p.nombre, valor: minutas.filter((d) => d.proyectoId === p.id).length, color: PALETA[i % PALETA.length] }))
    .filter((s) => s.valor > 0)
    .sort((a, b) => b.valor - a.valor)
  const maximo = Math.max(1, ...porProyecto.map((s) => s.valor))

  const segmentosCompromisos = [
    { nombre: 'En plazo', valor: pendientes.length - vencidos.length, color: '#10b981' },
    { nombre: 'Vencidos', valor: vencidos.length, color: '#f43f5e' },
  ]

  return (
    <>
      <Encabezado titulo="Reuniones y acuerdos" subtitulo="Minutas, enlaces de reunión y compromisos por proyecto">
        <select className={`${entradaCompacta} w-auto`} value={proyectoFiltro} onChange={(e) => setProyectoFiltro(e.target.value)}>
          <option value="todos">Todos los proyectos</option>
          {proyectos.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
        </select>
        {puedeCrear && <button className={botonPrimario} onClick={() => setCreando(true)}>+ Agendar una reunión</button>}
      </Encabezado>

      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <TarjetaMetrica titulo="Reuniones" valor={String(minutas.length)} detalle={`${minutas.filter((d) => d.minuta!.fecha.startsWith(mesActual)).length} este mes`} icono={CalendarDays} />
        <TarjetaMetrica titulo="Acuerdos" valor={String(acuerdos)} detalle="Registrados en minutas" icono={Handshake} />
        <TarjetaMetrica titulo="Compromisos" valor={String(pendientes.length)} tono={vencidos.length > 0 ? 'alerta' : 'ok'} detalle={vencidos.length > 0 ? `${vencidos.length} con fecha vencida` : 'Todos en plazo'} icono={ClipboardList} />
        <TarjetaMetrica titulo="Con enlace" valor={String(conEnlace)} detalle={`${minutas.length - conEnlace} sin enlace de reunión`} icono={Video} />
      </div>

      <div className="mb-5 grid gap-5 lg:grid-cols-3">
        <Panel titulo="Reuniones por área" subtitulo="Equipo interno y departamentos invitados · clic para filtrar">
          <div className="space-y-1.5">
            {[{ id: 'equipo' as const, etiqueta: 'Equipo de desarrollo', color: '#7c3aed', valor: deEquipo.length }, ...porArea].map((a) => {
              const activa = a.id === 'equipo' ? vista === 'equipo' : vista === 'areas' && areaFiltro === a.id
              return (
                <button
                  key={a.id}
                  onClick={() => {
                    if (activa) return setVista('todas')
                    if (a.id === 'equipo') return setVista('equipo')
                    setVista('areas')
                    setAreaFiltro(a.id)
                  }}
                  className={`block w-full rounded-lg px-2 py-1.5 text-left transition-colors ${activa ? 'bg-slate-100' : 'hover:bg-slate-50'}`}
                >
                  <BarraAvance etiqueta={a.etiqueta} porcentaje={Math.round((a.valor / maximoArea) * 100)} color={a.color} texto={`${a.valor} ${a.valor === 1 ? 'reunión' : 'reuniones'}`} />
                </button>
              )
            })}
          </div>
          {porProyecto.length > 0 && (
            <p className="mt-3 border-t border-slate-100 pt-3 text-[11px] text-slate-500">
              Más reuniones en <span className="font-semibold text-slate-700">{porProyecto[0].nombre}</span> ({porProyecto[0].valor}) · máximo por proyecto {maximo}
            </p>
          )}
        </Panel>

        <Panel titulo="Estado de compromisos" subtitulo="Tareas acordadas en las minutas">
          <DonutGrafico datos={segmentosCompromisos} centroValor={String(pendientes.length)} centroEtiqueta="Compromisos" alto={170} />
          <div className="mt-4 space-y-2.5 border-t border-slate-100 pt-4">
            {segmentosCompromisos.map((s) => <Leyenda key={s.nombre} color={s.color} nombre={s.nombre} valor={String(s.valor)} />)}
          </div>
        </Panel>

        <Panel titulo="Próximos compromisos" subtitulo="Ordenados por fecha límite">
          {proximos.length === 0 && <p className="text-sm text-slate-400">Sin compromisos próximos</p>}
          <ul className="space-y-3">
            {proximos.map((p, i) => {
              const dias = diasEntre(HOY, p.fecha)
              return (
                <li key={i} className="flex items-center gap-3">
                  <div className={`flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl text-white ${dias <= 3 ? 'bg-rose-500' : dias <= 7 ? 'bg-amber-500' : 'bg-slate-900'}`}>
                    <span className="text-sm font-bold leading-none">{dias}</span>
                    <span className="text-[9px] uppercase">días</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900" title={p.tarea}>{p.tarea}</p>
                    <p className="truncate text-xs text-slate-500">{p.responsable} · {formatoFecha(p.fecha)}</p>
                  </div>
                </li>
              )
            })}
          </ul>
        </Panel>
      </div>

      <Panel
        titulo={`Reuniones (${visibles.length})`}
        subtitulo="Más recientes primero"
        accion={
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs font-semibold">
              {([
                { id: 'todas', etiqueta: `Todas (${minutas.length})`, icono: CalendarDays },
                { id: 'equipo', etiqueta: `Equipo de desarrollo (${deEquipo.length})`, icono: Lock },
                { id: 'areas', etiqueta: `Con otras áreas (${conAreas.length})`, icono: Building2 },
              ] as const).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setVista(t.id)}
                  className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 transition-colors ${vista === t.id ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <t.icono className="h-3.5 w-3.5" />
                  {t.etiqueta}
                </button>
              ))}
            </div>
            {vista === 'areas' && (
              <select className={`${entradaCompacta} w-auto py-1.5 text-xs`} value={areaFiltro} onChange={(e) => setAreaFiltro(e.target.value as AreaReunion | 'todas')}>
                <option value="todas">Todos los departamentos</option>
                {AREAS_REUNION.map((a) => <option key={a.id} value={a.id}>{a.etiqueta}</option>)}
              </select>
            )}
          </div>
        }
      >
        {visibles.length === 0 && <p className="text-sm text-slate-400">No hay reuniones con este filtro</p>}
        <div className="grid gap-4 md:grid-cols-2">
          {visibles.map((d) => {
            const proyecto = proyectos.find((p) => p.id === d.proyectoId)
            const m = d.minuta!
            return (
              <article key={d.id} className="flex flex-col rounded-xl border border-slate-100 p-4 text-sm transition-shadow hover:shadow">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">{d.titulo}</p>
                    {proyecto && <Link to={`/proyectos/${proyecto.id}`} className="text-xs font-medium text-indigo-600 hover:underline">{proyecto.codigo} · {proyecto.nombre}</Link>}
                  </div>
                  <span className="shrink-0 rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                    {formatoFecha(m.fecha)}
                    {m.hora && <span className="ml-1 inline-flex items-center gap-0.5 text-slate-500"><Clock className="h-3 w-3" />{m.hora}</span>}
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <InsigniaReunion documento={d} />
                  {m.organizador && <span className="text-[11px] text-slate-400">Convoca {m.organizador}</span>}
                </div>

                <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
                  <Users className="h-3.5 w-3.5" />
                  {m.asistentes.join(', ') || 'Sin asistentes registrados'}
                </p>

                {m.acuerdos.length > 0 && (
                  <ul className="mt-2 list-disc space-y-0.5 pl-5 text-slate-700">
                    {m.acuerdos.map((a, i) => <li key={i}>{a}</li>)}
                  </ul>
                )}

                {m.pendientes.length > 0 && (
                  <ul className="mt-3 space-y-1">
                    {m.pendientes.map((p, i) => (
                      <li key={i} className={`flex justify-between gap-2 rounded-lg px-2.5 py-1.5 text-xs ${p.fecha < HOY ? 'bg-rose-50 text-rose-700' : 'bg-slate-50 text-slate-600'}`}>
                        <span className="truncate">{p.tarea} · {p.responsable}</span>
                        <span className="shrink-0 tabular-nums">{formatoFecha(p.fecha)}</span>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mt-auto pt-3">
                  {m.enlace ? (
                    <a
                      href={m.enlace}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-indigo-700"
                    >
                      <Video className="h-3.5 w-3.5" />
                      {plataforma(m.enlace)}
                      <ExternalLink className="h-3 w-3 opacity-70" />
                    </a>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                      <Video className="h-3.5 w-3.5" />
                      Sin enlace de reunión
                    </span>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      </Panel>

      {creando && <ModalMinuta proyectoId={proyectoFiltro === 'todos' ? undefined : proyectoFiltro} onCerrar={() => setCreando(false)} />}
    </>
  )
}
