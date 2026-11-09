import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Gauge, KeyRound, Search, Trash2, UserCheck, Users, X } from 'lucide-react'
import DonutGrafico from '../componentes/graficos/DonutGrafico'
import ModalDesarrollador from '../componentes/modales/ModalDesarrollador'
import { BarraAvance, Encabezado, Leyenda, Panel } from '../componentes/Panel'
import TarjetaMetrica from '../componentes/TarjetaMetrica'
import { useDatos } from '../contextos/DatosContext'
import { botonPrimario, entradaCompacta } from '../utils/estilos'
import { jefeDeProyecto } from '../utils/equipo'

const CAPACIDAD_SEMANAL = 40
const PALETA = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#14b8a6', '#64748b']

const colorCarga = (horas: number) => (horas > CAPACIDAD_SEMANAL ? '#f43f5e' : horas >= CAPACIDAD_SEMANAL * 0.8 ? '#f59e0b' : '#10b981')

const iniciales = (nombre: string) => nombre.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join('')

export default function Desarrolladores() {
  const { desarrolladores, asignaciones, proyectos, evidencias, eliminarDesarrollador } = useDatos()
  const [creando, setCreando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [especialidadFiltro, setEspecialidadFiltro] = useState('todas')
  const [rolFiltro, setRolFiltro] = useState<'todos' | 'jefe' | 'colaborador' | 'libre'>('todos')
  const [tecnologiasFiltro, setTecnologiasFiltro] = useState<string[]>([])

  const eliminar = (id: string, nombre: string) => {
    if (!window.confirm(`¿Eliminar a ${nombre}? Se quitará de todos sus proyectos.`)) return
    setError(eliminarDesarrollador(id))
  }

  const equipo = desarrolladores.map((d) => {
    const mias = asignaciones.filter((a) => a.desarrolladorId === d.id)
    return { dev: d, asignaciones: mias, horas: mias.reduce((suma, a) => suma + a.horasSemana, 0) }
  })
  const horasTotales = equipo.reduce((s, e) => s + e.horas, 0)
  const capacidad = desarrolladores.length * CAPACIDAD_SEMANAL
  const ocupacion = capacidad ? Math.round((horasTotales / capacidad) * 100) : 0
  const sobrecargados = equipo.filter((e) => e.horas > CAPACIDAD_SEMANAL).length
  const disponibles = equipo.filter((e) => e.asignaciones.length === 0).length
  const conAcceso = desarrolladores.filter((d) => d.usuarioId).length

  const especialidades = [...new Set(desarrolladores.map((d) => d.especialidad || 'Sin especialidad'))]
  const segmentosEspecialidad = especialidades.map((e, i) => ({
    nombre: e,
    valor: desarrolladores.filter((d) => (d.especialidad || 'Sin especialidad') === e).length,
    color: PALETA[i % PALETA.length],
  }))

  // Filtros de la tabla: nombre, rol/especialidad, rol en los proyectos y tecnologías (debe dominar todas las elegidas).
  const esJefeEnAlguno = (id: string) => proyectos.some((p) => jefeDeProyecto(asignaciones, p.id)?.desarrolladorId === id)
  const texto = busqueda.trim().toLowerCase()
  const filtrados = equipo.filter(({ dev: d, asignaciones: mias }) => {
    if (texto && !`${d.nombre} ${d.correo} ${d.especialidad}`.toLowerCase().includes(texto)) return false
    if (especialidadFiltro !== 'todas' && (d.especialidad || 'Sin especialidad') !== especialidadFiltro) return false
    if (rolFiltro === 'jefe' && !esJefeEnAlguno(d.id)) return false
    if (rolFiltro === 'colaborador' && (mias.length === 0 || esJefeEnAlguno(d.id))) return false
    if (rolFiltro === 'libre' && mias.length > 0) return false
    return tecnologiasFiltro.every((t) => d.tecnologias.includes(t))
  })
  const hayFiltros = Boolean(texto) || especialidadFiltro !== 'todas' || rolFiltro !== 'todos' || tecnologiasFiltro.length > 0
  const limpiarFiltros = () => {
    setBusqueda('')
    setEspecialidadFiltro('todas')
    setRolFiltro('todos')
    setTecnologiasFiltro([])
  }
  const alternarTecnologia = (t: string) =>
    setTecnologiasFiltro((previas) => (previas.includes(t) ? previas.filter((x) => x !== t) : [...previas, t]))

  const tecnologias = Object.entries(
    desarrolladores.flatMap((d) => d.tecnologias).reduce<Record<string, number>>((acc, t) => ({ ...acc, [t]: (acc[t] ?? 0) + 1 }), {})
  ).sort((a, b) => b[1] - a[1])

  return (
    <>
      <Encabezado titulo="Desarrolladores" subtitulo="Equipo técnico, carga semanal y habilidades">
        <button className={botonPrimario} onClick={() => setCreando(true)}>+ Nuevo desarrollador</button>
      </Encabezado>

      {error && <div className="mb-4 rounded-lg bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</div>}

      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <TarjetaMetrica titulo="Desarrolladores" valor={String(desarrolladores.length)} detalle={`${disponibles} sin proyectos asignados`} icono={Users} />
        <TarjetaMetrica titulo="Ocupación del equipo" valor={`${ocupacion} %`} tono={ocupacion > 100 ? 'peligro' : ocupacion >= 80 ? 'alerta' : 'ok'} detalle={`${horasTotales} de ${capacidad} h/semana`} icono={Gauge} />
        <TarjetaMetrica titulo="Sobrecargados" valor={String(sobrecargados)} tono={sobrecargados > 0 ? 'peligro' : 'ok'} detalle={`Más de ${CAPACIDAD_SEMANAL} h/semana`} icono={UserCheck} />
        <TarjetaMetrica titulo="Con acceso" valor={String(conAcceso)} detalle={`${desarrolladores.length - conAcceso} sin usuario en el sistema`} icono={KeyRound} />
      </div>

      <div className="mb-5 grid gap-5 lg:grid-cols-3">
        <Panel titulo="Carga semanal por desarrollador" subtitulo={`Horas asignadas frente a ${CAPACIDAD_SEMANAL} h de capacidad`} className="lg:col-span-2">
          {equipo.length === 0 && <p className="text-sm text-slate-400">No hay desarrolladores registrados</p>}
          <div className="grid gap-x-6 gap-y-3.5 sm:grid-cols-2">
            {equipo.map((e) => (
              <BarraAvance
                key={e.dev.id}
                etiqueta={e.dev.nombre}
                porcentaje={Math.round((e.horas / CAPACIDAD_SEMANAL) * 100)}
                color={colorCarga(e.horas)}
                texto={`${e.horas} h · ${Math.round((e.horas / CAPACIDAD_SEMANAL) * 100)} %`}
              />
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />Disponible</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" />Cerca del límite (≥ 80 %)</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-rose-500" />Sobrecargado</span>
          </div>
        </Panel>

        <Panel titulo="Especialidades" subtitulo="Composición del equipo · clic para filtrar">
          <DonutGrafico datos={segmentosEspecialidad} centroValor={String(desarrolladores.length)} centroEtiqueta="Personas" alto={170} />
          <div className="mt-4 space-y-2.5 border-t border-slate-100 pt-4">
            {segmentosEspecialidad.map((s) => (
              <button
                key={s.nombre}
                onClick={() => setEspecialidadFiltro(especialidadFiltro === s.nombre ? 'todas' : s.nombre)}
                className={`block w-full rounded-lg px-2 py-1 ${especialidadFiltro === s.nombre ? 'bg-slate-100' : 'hover:bg-slate-50'}`}
              >
                <Leyenda color={s.color} nombre={s.nombre} valor={String(s.valor)} />
              </button>
            ))}
          </div>
        </Panel>
      </div>

      {tecnologias.length > 0 && (
        <Panel titulo="Tecnologías del equipo" subtitulo="Cuántas personas dominan cada tecnología · clic para filtrar el equipo" className="mb-5">
          <div className="flex flex-wrap gap-2">
            {tecnologias.map(([t, n]) => {
              const activa = tecnologiasFiltro.includes(t)
              return (
                <button
                  key={t}
                  onClick={() => alternarTecnologia(t)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${activa ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-indigo-300'}`}
                >
                  {t}
                  <span className={`rounded-full px-1.5 text-[10px] font-bold ${activa ? 'bg-white text-indigo-700' : 'bg-indigo-600 text-white'}`}>{n}</span>
                </button>
              )
            })}
          </div>
        </Panel>
      )}

      <Panel
        titulo={`Equipo (${hayFiltros ? `${filtrados.length} de ${desarrolladores.length}` : desarrolladores.length})`}
        subtitulo="Detalle de cada desarrollador y sus proyectos"
        accion={
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input className={`${entradaCompacta} w-48 py-1.5 pl-8 text-xs`} placeholder="Buscar por nombre" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
            </div>
            <select className={`${entradaCompacta} py-1.5 text-xs`} value={especialidadFiltro} onChange={(e) => setEspecialidadFiltro(e.target.value)} aria-label="Filtrar por rol o especialidad">
              <option value="todas">Todos los roles</option>
              {especialidades.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
            <select className={`${entradaCompacta} py-1.5 text-xs`} value={rolFiltro} onChange={(e) => setRolFiltro(e.target.value as typeof rolFiltro)} aria-label="Filtrar por rol en los proyectos">
              <option value="todos">Cualquier rol en proyectos</option>
              <option value="jefe">Jefe de proyecto</option>
              <option value="colaborador">Solo colaborador</option>
              <option value="libre">Sin proyectos</option>
            </select>
            <select className={`${entradaCompacta} py-1.5 text-xs`} value="" onChange={(e) => e.target.value && alternarTecnologia(e.target.value)} aria-label="Filtrar por tecnología">
              <option value="">+ Tecnología</option>
              {tecnologias.filter(([t]) => !tecnologiasFiltro.includes(t)).map(([t, n]) => <option key={t} value={t}>{t} ({n})</option>)}
            </select>
          </div>
        }
      >
        {hayFiltros && (
          <div className="-mt-1 mb-3 flex flex-wrap items-center gap-1.5 text-xs">
            {tecnologiasFiltro.map((t) => (
              <span key={t} className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 font-medium text-indigo-700">
                {t}
                <button onClick={() => alternarTecnologia(t)} aria-label={`Quitar ${t}`}><X className="h-3 w-3" /></button>
              </span>
            ))}
            {tecnologiasFiltro.length > 1 && <span className="text-slate-400">· domina todas</span>}
            <button onClick={limpiarFiltros} className="ml-1 font-semibold text-indigo-600 hover:underline">Limpiar filtros</button>
          </div>
        )}
        <div className="-mx-5 -mb-5 overflow-x-auto border-t border-slate-100">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/60 text-left text-[11px] uppercase tracking-wider text-slate-500">
              <tr>
                {['Desarrollador', 'Tecnologías', 'Proyectos asignados', 'Horas/sem', 'Evidencias', 'Acceso', ''].map((t) => (
                  <th key={t} className="p-3 font-medium">{t}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 && (
                <tr><td colSpan={7} className="p-4 text-center text-slate-400">{hayFiltros ? 'Nadie coincide con los filtros' : 'No hay desarrolladores registrados'}</td></tr>
              )}
              {filtrados.map(({ dev: d, asignaciones: mias, horas }) => (
                <tr key={d.id} className="border-t border-slate-100 transition-colors hover:bg-slate-50/60">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-xs font-bold text-white">{iniciales(d.nombre)}</div>
                      <div className="min-w-0">
                        <p className="whitespace-nowrap font-medium text-slate-900">{d.nombre}</p>
                        <p className="truncate text-xs text-slate-500">{d.especialidad} · {d.correo}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {d.tecnologias.length === 0 && <span className="text-xs text-slate-400">—</span>}
                      {d.tecnologias.map((t) => <span key={t} className={`rounded-md px-1.5 py-0.5 text-[11px] ${tecnologiasFiltro.includes(t) ? 'bg-indigo-100 font-semibold text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>{t}</span>)}
                    </div>
                  </td>
                  <td className="p-3 text-xs">
                    {mias.length === 0 && <span className="text-slate-400">Sin proyectos</span>}
                    <div className="flex flex-wrap gap-1">
                      {mias.map((a) => {
                        const proyecto = proyectos.find((p) => p.id === a.proyectoId)
                        return proyecto ? (
                          <Link key={a.id} to={`/proyectos/${proyecto.id}`} className="rounded-md bg-indigo-50 px-1.5 py-0.5 font-medium text-indigo-700 hover:bg-indigo-100">
                            {proyecto.nombre}
                          </Link>
                        ) : null
                      })}
                    </div>
                  </td>
                  <td className="p-3">
                    <span className="font-semibold tabular-nums" style={{ color: colorCarga(horas) }}>{horas} h</span>
                  </td>
                  <td className="whitespace-nowrap p-3 text-xs">
                    {(() => {
                      const propias = evidencias.filter((e) => e.desarrolladorId === d.id)
                      if (propias.length === 0) return <span className="text-slate-400">Sin evidencias</span>
                      const validadas = propias.filter((e) => e.estado === 'validada').length
                      const pendientes = propias.filter((e) => e.estado === 'pendiente').length
                      return (
                        <span title={`${validadas} validadas · ${pendientes} por revisar`}>
                          <span className="font-semibold text-slate-900">{propias.length}</span>
                          <span className="text-slate-500"> · {validadas} validadas</span>
                          {pendientes > 0 && <span className="ml-1 rounded-full bg-amber-50 px-1.5 font-medium text-amber-700">{pendientes} por revisar</span>}
                        </span>
                      )
                    })()}
                  </td>
                  <td className="p-3 text-xs">
                    <span className={`rounded-full px-2 py-0.5 font-medium ${d.usuarioId ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {d.usuarioId ? 'Con usuario' : 'Sin usuario'}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button onClick={() => eliminar(d.id, d.nombre)} title="Eliminar desarrollador" aria-label={`Eliminar ${d.nombre}`} className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      {creando && <ModalDesarrollador onCerrar={() => setCreando(false)} />}
    </>
  )
}
