import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, Pencil, Trash2 } from 'lucide-react'
import EtiquetaEstado from '../componentes/EtiquetaEstado'
import ModalEditarProyecto, { ESTADOS_PROYECTO } from '../componentes/modales/ModalEditarProyecto'
import ModalEliminarProyecto from '../componentes/modales/ModalEliminarProyecto'
import ModalNuevoProyecto from '../componentes/modales/ModalNuevoProyecto'
import { useAuth } from '../contextos/AuthContext'
import { useDatos } from '../contextos/DatosContext'
import { botonPrimario } from '../utils/estilos'
import { formatoFecha, formatoMoneda } from '../utils/finanzas'
import { datosDeProyecto, resumenFinanciero } from '../utils/indicadores'
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

  const nombresDesarrolladores = (proyectoId: string): string =>
    asignaciones
      .filter((a) => a.proyectoId === proyectoId)
      .map((a) => desarrolladores.find((d) => d.id === a.desarrolladorId)?.nombre)
      .filter(Boolean)
      .join(', ') || 'Sin asignar'

  const filtrados = proyectos.filter(
    (p) =>
      (estado === 'Todos' || p.estado === estado) &&
      `${p.nombre} ${p.codigo} ${nombreCliente(p.clienteId)} ${p.estado}`.toLowerCase().includes(busqueda.toLowerCase())
  )

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-semibold">Listado de proyectos</h2>
        {puedeCrear && <button className={botonPrimario} onClick={() => setCreando(true)}>+ Nuevo proyecto</button>}
      </div>

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

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="text-left text-slate-500">
            <tr>
              {['Código', 'Proyecto', 'Cliente', 'Desarrollador', 'Estado', 'Entrega'].map((t) => <th key={t} className="p-3 font-medium">{t}</th>)}
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
                <tr key={p.id} className="border-t border-slate-100">
                  <td className="p-3">{p.codigo}</td>
                  <td className="p-3"><Link to={`/proyectos/${p.id}`} className="text-indigo-700 hover:underline">{p.nombre}</Link></td>
                  <td className="p-3">{nombreCliente(p.clienteId)}</td>
                  <td className="p-3">{nombresDesarrolladores(p.id)}</td>
                  <td className="p-3"><EtiquetaEstado estado={p.estado} /></td>
                  <td className="whitespace-nowrap p-3">{formatoFecha(p.fechaEntrega)}</td>
                  {verDinero && <td className="p-3 text-right tabular-nums">{formatoMoneda(resumen.porCobrar)}</td>}
                  {esAdministrador && (
                    <td className="p-3">
                      <div className="flex justify-end gap-1">
                        <Link to={`/proyectos/${p.id}`} title="Ver expediente" aria-label={`Ver ${p.nombre}`} className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600">
                          <Eye className="h-4 w-4" />
                        </Link>
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
      {creando && <ModalNuevoProyecto onCerrar={() => setCreando(false)} />}
      {accion?.tipo === 'editar' && <ModalEditarProyecto proyecto={accion.proyecto} onCerrar={() => setAccion(null)} />}
      {accion?.tipo === 'eliminar' && <ModalEliminarProyecto proyecto={accion.proyecto} onCerrar={() => setAccion(null)} />}
    </>
  )
}