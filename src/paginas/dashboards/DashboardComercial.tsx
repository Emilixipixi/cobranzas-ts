import { Link } from 'react-router-dom'
import EtiquetaEstado from '../../componentes/EtiquetaEstado'
import TarjetaMetrica from '../../componentes/TarjetaMetrica'
import { useDatos } from '../../contextos/DatosContext'
import { HOY } from '../../datos/datosEjemplo'
import { diasEntre, formatoFecha, formatoMoneda, resumenPlan } from '../../utils/finanzas'

const ETAPAS = ['Prototipo', 'En desarrollo', 'En entrega', 'Cerrado']

export default function DashboardComercial() {
  const { proyectos, clientes, contratos, cuotas } = useDatos()

  const activos = proyectos.filter((p) => p.estado !== 'Cerrado')
  const valorCartera = contratos.reduce((suma, k) => suma + k.monto, 0)
  const planes = contratos.map((k) => ({ contrato: k, plan: resumenPlan(k, cuotas) }))
  const incompletos = planes.filter((p) => p.plan.estado !== 'completo')
  const plazoPromedio = proyectos.length ? Math.round((proyectos.reduce((suma, p) => suma + p.mesesOfrecidos, 0) / proyectos.length) * 10) / 10 : 0

  return (
    <>
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <TarjetaMetrica titulo="Proyectos activos" valor={String(activos.length)} detalle={`${proyectos.length} en total`} />
        <TarjetaMetrica titulo="Valor contratado" valor={formatoMoneda(valorCartera)} />
        <TarjetaMetrica titulo="Planes por completar" valor={String(incompletos.length)} tono={incompletos.length > 0 ? 'alerta' : 'ok'} detalle="No suman el 100 % del contrato" />
        <TarjetaMetrica titulo="Plazo promedio ofrecido" valor={`${plazoPromedio} meses`} />
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {ETAPAS.map((etapa) => (
          <div key={etapa} className="rounded-xl border border-slate-200 bg-white p-4">
            <EtiquetaEstado estado={etapa} />
            <strong className="mt-2 block text-2xl">{proyectos.filter((p) => p.estado === etapa).length}</strong>
            <span className="text-xs text-slate-500">proyectos</span>
          </div>
        ))}
      </div>

      <div className="mb-5 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <h3 className="p-4 text-sm font-medium text-slate-600">Cartera de proyectos</h3>
        <table className="w-full text-sm">
          <thead className="text-left text-slate-500">
            <tr>
              {['Proyecto', 'Cliente', 'Etapa', 'Prototipo', 'Entrega ofrecida', 'Plan de pagos'].map((t) => <th key={t} className="p-3 font-medium">{t}</th>)}
            </tr>
          </thead>
          <tbody>
            {proyectos.map((p) => {
              const planesProyecto = planes.filter((x) => x.contrato.proyectoId === p.id)
              const dias = diasEntre(HOY, p.fechaEntrega)
              return (
                <tr key={p.id} className="border-t border-slate-100">
                  <td className="p-3"><Link to={`/proyectos/${p.id}`} className="text-blue-700 hover:underline">{p.nombre}</Link></td>
                  <td className="p-3">{clientes.find((c) => c.id === p.clienteId)?.nombre}</td>
                  <td className="p-3"><EtiquetaEstado estado={p.estado} /></td>
                  <td className="p-3"><EtiquetaEstado estado={p.prototipo} /></td>
                  <td className="whitespace-nowrap p-3">
                    {formatoFecha(p.fechaEntrega)}
                    <span className={`ml-1 text-xs ${dias < 0 ? 'text-red-700' : 'text-slate-500'}`}>
                      ({dias < 0 ? `${Math.abs(dias)} d de atraso` : `en ${dias} d`})
                    </span>
                  </td>
                  <td className="p-3 text-xs">
                    {planesProyecto.length === 0 && <span className="text-slate-400">Sin contrato</span>}
                    {planesProyecto.map((x) => (
                      <span key={x.contrato.id} className={x.plan.estado === 'completo' ? 'text-green-700' : 'text-amber-700'}>
                        {x.contrato.numero}: {x.plan.porcentaje} %
                      </span>
                    ))}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="mb-3 text-sm font-medium text-slate-600">Planes de pago por completar</h3>
        {incompletos.length === 0 && <p className="text-sm text-slate-400">Todos los planes cubren el contrato</p>}
        <ul className="space-y-2 text-sm">
          {incompletos.map(({ contrato, plan }) => (
            <li key={contrato.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-amber-50 px-3 py-2">
              <span>
                {contrato.numero} · {proyectos.find((p) => p.id === contrato.proyectoId)?.nombre}: cubre {plan.porcentaje} %, faltan {formatoMoneda(Math.abs(plan.diferencia), contrato.moneda)}
              </span>
              <Link to="/plan-pagos" className="text-blue-700 hover:underline">Ir al plan de pagos</Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}
