import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import PanelCobranza from '../../componentes/PanelCobranza'
import TarjetaMetrica from '../../componentes/TarjetaMetrica'
import { useAuth } from '../../contextos/AuthContext'
import { useDatos } from '../../contextos/DatosContext'
import { HOY } from '../../datos/datosEjemplo'
import { formatoMoneda, redondear } from '../../utils/finanzas'
import { antiguedadCartera, filasCartera, proximosVencimientos, resumenFinanciero } from '../../utils/indicadores'

export default function DashboardFinanzas() {
  const { usuario } = useAuth()
  const { proyectos, clientes, contratos, cuotas, cobros } = useDatos()

  const resumen = resumenFinanciero(contratos, cuotas, cobros)
  const filas = filasCartera(proyectos, clientes, contratos, cuotas, cobros)
  const vencidas = filas.filter((f) => f.estado === 'Vencida')
  const proximas = proximosVencimientos(filas, 30)
  const antiguedad = antiguedadCartera(filas)
  const cobradoMes = redondear(cobros.filter((b) => b.fechaReal.startsWith(HOY.slice(0, 7))).reduce((suma, b) => suma + b.valor, 0))
  const puedeOperar = usuario?.rol === 'finanzas' || usuario?.rol === 'administrador'

  return (
    <>
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <TarjetaMetrica titulo="Por facturar" valor={formatoMoneda(resumen.porFacturar)} tono={resumen.porFacturar > 0 ? 'alerta' : 'neutro'} detalle="Entregado y sin factura" />
        <TarjetaMetrica titulo="Facturado por cobrar" valor={formatoMoneda(resumen.facturadoPendiente)} />
        <TarjetaMetrica titulo="Cartera vencida" valor={formatoMoneda(resumen.vencido)} tono={resumen.vencido > 0 ? 'peligro' : 'neutro'} detalle={`${vencidas.length} cuotas`} />
        <TarjetaMetrica titulo="Cobrado este mes" valor={formatoMoneda(cobradoMes)} tono="ok" />
      </div>

      <div className="mb-5 rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="mb-3 text-sm font-medium text-slate-600">Antigüedad de la cartera vencida</h3>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={antiguedad}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="rango" />
              <YAxis />
              <Tooltip formatter={(valor) => formatoMoneda(Number(valor))} />
              <Bar dataKey="Vencido" fill="#dc2626" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <h3 className="mb-2 text-sm font-medium text-slate-600">Cartera vencida</h3>
      <div className="mb-5">
        <PanelCobranza cuotas={vencidas.map((f) => f.cuota)} puedeOperar={puedeOperar} vacio="No hay cuotas vencidas" />
      </div>

      <h3 className="mb-2 text-sm font-medium text-slate-600">Próximos vencimientos (30 días)</h3>
      <PanelCobranza cuotas={proximas.map((f) => f.cuota)} puedeOperar={puedeOperar} vacio="No hay vencimientos en los próximos 30 días" />
    </>
  )
}
