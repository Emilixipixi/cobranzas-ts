import { Link } from 'react-router-dom'
import EtiquetaEstado from '../../componentes/EtiquetaEstado'
import TarjetaMetrica from '../../componentes/TarjetaMetrica'
import { useDatos } from '../../contextos/DatosContext'
import { HOY } from '../../datos/datosEjemplo'
import { diasEntre, formatoFecha } from '../../utils/finanzas'
import { datosDeProyecto, progresoEntrega } from '../../utils/indicadores'
import type { Desarrollador } from '../../tipos'

export default function DashboardDesarrollador({ desarrollador }: { desarrollador?: Desarrollador }) {
  const { proyectos, contratos, cuotas, asignaciones } = useDatos()

  if (!desarrollador) {
    return <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500">Tu usuario aún no está vinculado a un perfil de desarrollador.</p>
  }

  const mias = asignaciones.filter((a) => a.desarrolladorId === desarrollador.id)
  const misProyectos = mias.flatMap((a) => {
    const proyecto = proyectos.find((p) => p.id === a.proyectoId)
    return proyecto ? [{ proyecto, horas: a.horasSemana }] : []
  })
  const entregables = misProyectos.flatMap(({ proyecto }) =>
    datosDeProyecto(proyecto.id, contratos, cuotas).cuotas
      .filter((q) => q.entregable !== '' && q.estadoEntrega !== 'Entregado')
      .map((q) => ({ cuota: q, proyecto }))
  )
  const atrasados = entregables.filter((e) => e.cuota.estadoEntrega.startsWith('Atraso'))
  const horas = mias.reduce((suma, a) => suma + a.horasSemana, 0)

  return (
    <>
      <p className="mb-4 text-sm text-slate-600">{desarrollador.nombre} · {desarrollador.especialidad} · {desarrollador.tecnologias.join(', ')}</p>
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <TarjetaMetrica titulo="Mis proyectos" valor={String(misProyectos.length)} />
        <TarjetaMetrica titulo="Dedicación semanal" valor={`${horas} h`} tono={horas > 40 ? 'alerta' : 'neutro'} detalle={horas > 40 ? 'Supera 40 h/semana' : 'Dentro de la jornada'} />
        <TarjetaMetrica titulo="Entregables pendientes" valor={String(entregables.length)} />
        <TarjetaMetrica titulo="Con atraso" valor={String(atrasados.length)} tono={atrasados.length > 0 ? 'peligro' : 'ok'} />
      </div>

      <div className="mb-5 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <h3 className="p-4 text-sm font-medium text-slate-600">Mis proyectos</h3>
        <table className="w-full text-sm">
          <thead className="text-left text-slate-500">
            <tr>
              {['Proyecto', 'Etapa', 'Mis horas', 'Avance de entregables', 'Entrega', 'Enlaces'].map((t) => <th key={t} className="p-3 font-medium">{t}</th>)}
            </tr>
          </thead>
          <tbody>
            {misProyectos.map(({ proyecto, horas: h }) => {
              const avance = progresoEntrega(datosDeProyecto(proyecto.id, contratos, cuotas).cuotas)
              return (
                <tr key={proyecto.id} className="border-t border-slate-100">
                  <td className="p-3"><Link to={`/proyectos/${proyecto.id}`} className="text-blue-700 hover:underline">{proyecto.nombre}</Link></td>
                  <td className="p-3"><EtiquetaEstado estado={proyecto.estado} /></td>
                  <td className="p-3">{h} h/sem</td>
                  <td className="p-3">
                    <div className="h-2 w-32 rounded-full bg-slate-100">
                      <div className="h-2 rounded-full bg-blue-600" style={{ width: `${avance}%` }} />
                    </div>
                    <span className="text-xs text-slate-500">{avance} %</span>
                  </td>
                  <td className="whitespace-nowrap p-3">{formatoFecha(proyecto.fechaEntrega)} <span className="text-xs text-slate-500">({diasEntre(HOY, proyecto.fechaEntrega)} d)</span></td>
                  <td className="p-3 text-xs">
                    {proyecto.urlPrototipo && <a href={proyecto.urlPrototipo} target="_blank" rel="noreferrer" className="mr-2 text-blue-700 hover:underline">Prototipo</a>}
                    {proyecto.repositorio && <a href={proyecto.repositorio} target="_blank" rel="noreferrer" className="text-blue-700 hover:underline">Repositorio</a>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <h3 className="p-4 text-sm font-medium text-slate-600">Entregables por cumplir</h3>
        <table className="w-full text-sm">
          <thead className="text-left text-slate-500">
            <tr>
              {['Proyecto', 'Hito', 'Entregable', 'Fecha prevista', 'Estado'].map((t) => <th key={t} className="p-3 font-medium">{t}</th>)}
            </tr>
          </thead>
          <tbody>
            {entregables.length === 0 && <tr><td colSpan={5} className="p-4 text-center text-slate-400">No tienes entregables pendientes</td></tr>}
            {entregables.map(({ cuota, proyecto }) => (
              <tr key={cuota.id} className="border-t border-slate-100">
                <td className="p-3">{proyecto.nombre}</td>
                <td className="p-3">{cuota.concepto}</td>
                <td className="p-3">{cuota.entregable}</td>
                <td className="p-3">{formatoFecha(cuota.fechaProyectada)}</td>
                <td className="p-3"><EtiquetaEstado estado={cuota.estadoEntrega} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
