import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Eye, FolderGit2, Pencil, Rocket, Trash2 } from 'lucide-react'
import BotonInforme from '../componentes/BotonInforme'
import EtiquetaEstado from '../componentes/EtiquetaEstado'
import DonutGrafico from '../componentes/graficos/DonutGrafico'
import { BarraAvance, COLORES_ESTADO, Encabezado, Leyenda, Panel } from '../componentes/Panel'
import SelectorEstado from '../componentes/SelectorEstado'
import TarjetaMetrica from '../componentes/TarjetaMetrica'
import ModalEditarProyecto, { ESTADOS_PROYECTO } from '../componentes/modales/ModalEditarProyecto'
import ModalEliminarProyecto from '../componentes/modales/ModalEliminarProyecto'
import ModalNuevoProyecto from '../componentes/modales/ModalNuevoProyecto'
import { useAuth } from '../contextos/AuthContext'
import { useDatos } from '../contextos/DatosContext'
import { botonPrimario } from '../utils/estilos'
import { equipoDeProyecto } from '../utils/equipo'
import { HOY } from '../datos/datosEjemplo'
import { diasEntre, formatoFecha, formatoMoneda } from '../utils/finanzas'
import { datosDeProyecto, progresoEntrega, proyectosEnAtencion, resumenFinanciero } from '../utils/indicadores'
import type { Proyecto } from '../tipos'

type Accion = { tipo: 'editar' | 'eliminar'; proyecto: Proyecto }

export default function Proyectos() {
  const { usuario } = useAuth()
  const { clientes, proyectos, contratos, cuotas, cobros, asignaciones, desarrolladores } = useDatos()
  const [busqueda, setBusqueda] = useState('')
  const [estado, setEstado] = useState('Todos')
  const [creando, setCreando] = useState(false)
  const [accion, setAccion] = useState<Accion | null>(null)

  const esAdministrador = usuario?.rol === 'administrador'
  const puedeCrear = esAdministrador || usuario?.rol === 'comercial'
  const verDinero = usuario?.rol !== 'desarrollador'
  const nombreCliente = (clienteId: string) => clientes.find((c) => c.id === clienteId)?.nombre ?? '—'

  const equipoDe = (proyectoId: string) => {
    const equipo = equipoDeProyecto(asignaciones, proyectoId)
    const jefe = desarrolladores.find((d) => d.id === equipo[0]?.desarrolladorId)?.nombre ?? 'Sin asignar'
    return { jefe, colaboradores: Math.max(0, equipo.length - 1) }
  }

  const filtrados = proyectos.filter(
    (p) =>
      (estado === 'Todos' || p.estado === estado) &&
      `${p.nombre} ${p.codigo} ${nombreCliente(p.clienteId)} ${p.estado}`.toLowerCase().includes(busqueda.toLowerCase())
  )

  const global = resumenFinanciero(contratos, cuotas, cobros)
  const atencion = proyectosEnAtencion(proyectos, contratos, cuotas, cobros)
  const activos = proyectos.filter((p) => p.estado !== 'Cerrado')
  const proximas = activos
    .filter((p) => p.fechaEntrega >= HOY)
    .sort((a, b) => a.fechaEntrega.localeCompare(b.fechaEntrega))
    .slice(0, 5)
  const segmentosEstado = ESTADOS_PROYECTO.map((e) => ({ nombre: e, valor: proyectos.filter((p) => p.estado === e).length, color: COLORES_ESTADO[e] }))
  const avance = activos.map((p) => ({ proyecto: p, entrega: progresoEntrega(datosDeProyecto(p.id, contratos, cuotas).cuotas) }))
  const avancePromedio = avance.length ? Math.round(avance.reduce((s, a) => s + a.entrega, 0) / avance.length) : 0

  return (
    <>
      <Encabezado titulo="Proyectos" subtitulo="Cartera de proyectos, estado y avance de entregables">
        {puedeCrear && <button className={botonPrimario} onClick={() => setCreando(true)}>+ Nuevo proyecto</button>}
      </Encabezado>

      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <TarjetaMetrica titulo="Proyectos" valor={String(proyectos.length)} detalle={`${activos.length} activos · ${proyectos.length - activos.length} cerrados`} icono={FolderGit2} />
        <TarjetaMetrica titulo="En desarrollo" valor={String(proyectos.filter((p) => p.estado === 'En desarrollo').length)} detalle={`${proyectos.filter((p) => p.estado === 'Prototipo').length} en prototipo · ${proyectos.filter((p) => p.estado === 'En entrega').length} en entrega`} icono={Rocket} />
        <TarjetaMetrica titulo="Avance entregables" valor={`${avancePromedio} %`} tono={avancePromedio >= 50 ? 'ok' : 'neutro'} detalle="Promedio de proyectos activos" />
        <TarjetaMetrica titulo="Requieren atención" valor={String(atencion.length)} tono={atencion.length > 0 ? 'peligro' : 'ok'} detalle={verDinero ? `${formatoMoneda(global.vencido)} vencido` : 'Atrasos o planes incompletos'} icono={AlertTriangle} />
      </div>

      <div className="mb-5 grid gap-5 lg:grid-cols-3">
        <Panel titulo="Proyectos por estado" subtitulo={esAdministrador ? 'Clic para filtrar · cambia el estado en la tabla' : 'Clic para filtrar el listado'}>
          <DonutGrafico datos={segmentosEstado} centroValor={String(proyectos.length)} centroEtiqueta="Proyectos" />
          <div className="mt-4 space-y-1 border-t border-slate-100 pt-3">
            {segmentosEstado.map((s) => (
              <button key={s.nombre} onClick={() => setEstado(estado === s.nombre ? 'Todos' : s.nombre)} className={`block w-full rounded-lg px-2 py-1 transition-colors ${estado === s.nombre ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}>
                <Leyenda color={s.color} nombre={s.nombre} valor={String(s.valor)} />
              </button>
            ))}
          </div>
        </Panel>

        <Panel titulo="Avance de entregables" subtitulo="Proyectos activos">
          {avance.length === 0 && <p className="text-sm text-slate-400">No hay proyectos activos</p>}
          <div className="space-y-3.5">
            {avance.map(({ proyecto, entrega }) => (
              <Link key={proyecto.id} to={`/proyectos/${proyecto.id}`} className="block hover:opacity-80">
                <BarraAvance etiqueta={`${proyecto.codigo} · ${proyecto.nombre}`} porcentaje={entrega} color={COLORES_ESTADO[proyecto.estado] ?? '#6366f1'} />
              </Link>
            ))}
          </div>
        </Panel>

        <Panel titulo="Próximas entregas" subtitulo="Fechas comprometidas con el cliente">
          {proximas.length === 0 && <p className="text-sm text-slate-400">Sin entregas próximas</p>}
          <ul className="space-y-3">
            {proximas.map((p) => {
              const dias = diasEntre(HOY, p.fechaEntrega)
              return (
                <li key={p.id} className="flex items-center gap-3">
                  <div className={`flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl text-white ${dias <= 15 ? 'bg-rose-500' : dias <= 45 ? 'bg-amber-500' : 'bg-slate-900'}`}>
                    <span className="text-sm font-bold leading-none">{dias}</span>
                    <span className="text-[9px] uppercase">días</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link to={`/proyectos/${p.id}`} className="block truncate text-sm font-semibold text-slate-900 hover:text-indigo-600">{p.nombre}</Link>
                    <p className="text-xs text-slate-500">{formatoFecha(p.fechaEntrega)} · {nombreCliente(p.clienteId)}</p>
                  </div>
                </li>
              )
            })}
          </ul>
        </Panel>
      </div>

      <Panel titulo={`Listado de proyectos (${filtrados.length})`} subtitulo={esAdministrador ? 'Haz clic en el estado de un proyecto para cambiarlo' : 'Busca y filtra por estado'}>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <input
          className="w-full max-w-sm rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          placeholder="Buscar por cliente, proyecto o estado"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <div className="flex flex-wrap gap-1 rounded-lg bg-slate-100 p-1">
          {['Todos', ...ESTADOS_PROYECTO].map((e) => (
            <button
              key={e}
              onClick={() => setEstado(e)}
              className={`rounded px-3 py-1 text-xs font-medium ${estado === e ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:bg-white/60'}`}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      <div className="-mx-5 -mb-5 overflow-x-auto border-t border-slate-100">
        <table className="w-full text-sm">
          <thead className="bg-slate-50/60 text-left text-[11px] uppercase tracking-wider text-slate-500">
            <tr>
              {['Código', 'Proyecto', 'Cliente', 'Jefe de proyecto', 'Estado', 'Entrega'].map((t) => <th key={t} className="p-3 font-medium">{t}</th>)}
              {verDinero && <th className="p-3 text-right font-medium">Saldo</th>}
              {esAdministrador && <th className="p-3 text-right font-medium">Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 && (
              <tr><td colSpan={9} className="p-4 text-center text-slate-400">No hay proyectos con ese filtro</td></tr>
            )}
            {filtrados.map((p) => {
              const d = datosDeProyecto(p.id, contratos, cuotas)
              const resumen = resumenFinanciero(d.contratos, d.cuotas, cobros)
              return (
                <tr key={p.id} className="border-t border-slate-100 transition-colors hover:bg-slate-50/60">
                  <td className="p-3 font-mono text-xs text-slate-500">{p.codigo}</td>
                  <td className="p-3"><Link to={`/proyectos/${p.id}`} className="font-medium text-slate-900 hover:text-indigo-600">{p.nombre}</Link></td>
                  <td className="p-3">{nombreCliente(p.clienteId)}</td>
                  <td className="whitespace-nowrap p-3">
                    {equipoDe(p.id).jefe}
                    {equipoDe(p.id).colaboradores > 0 && (
                      <span className="ml-1.5 text-xs text-slate-500">+{equipoDe(p.id).colaboradores} {equipoDe(p.id).colaboradores === 1 ? 'colaborador' : 'colaboradores'}</span>
                    )}
                  </td>
                  <td className="p-3">{esAdministrador ? <SelectorEstado proyecto={p} /> : <EtiquetaEstado estado={p.estado} />}</td>
                  <td className="whitespace-nowrap p-3">{formatoFecha(p.fechaEntrega)}</td>
                  {verDinero && <td className="p-3 text-right tabular-nums">{formatoMoneda(resumen.porCobrar)}</td>}
                  {esAdministrador && (
                    <td className="p-3">
                      <div className="flex justify-end gap-1">
                        <Link to={`/proyectos/${p.id}`} title="Ver expediente" aria-label={`Ver ${p.nombre}`} className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600">
                          <Eye className="h-4 w-4" />
                        </Link>
                        <BotonInforme proyecto={p} variante="icono" />
                        <button onClick={() => setAccion({ tipo: 'editar', proyecto: p })} title="Editar proyecto" aria-label={`Editar ${p.nombre}`} className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => setAccion({ tipo: 'eliminar', proyecto: p })} title="Eliminar proyecto" aria-label={`Eliminar ${p.nombre}`} className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      </Panel>
      {creando && <ModalNuevoProyecto onCerrar={() => setCreando(false)} />}
      {accion?.tipo === 'editar' && <ModalEditarProyecto proyecto={accion.proyecto} onCerrar={() => setAccion(null)} />}
      {accion?.tipo === 'eliminar' && <ModalEliminarProyecto proyecto={accion.proyecto} onCerrar={() => setAccion(null)} />}
    </>
  )
}