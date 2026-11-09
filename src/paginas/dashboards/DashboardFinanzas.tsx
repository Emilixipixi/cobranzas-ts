import GraficoAntiguedad, { COLORES_TRAMO } from '../../componentes/graficos/GraficoAntiguedad'
import { Panel } from '../../componentes/Panel'
import PanelCobranza from '../../componentes/PanelCobranza'
import RespaldoCobranza from '../../componentes/RespaldoCobranza'
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
  const totalVencido = redondear(antiguedad.reduce((suma, t) => suma + t.Vencido, 0))
  const moraPromedio = vencidas.length ? Math.round(vencidas.reduce((suma, f) => suma + f.diasMora, 0) / vencidas.length) : 0
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

      <Panel titulo="Antigüedad de la cartera vencida" subtitulo="Saldo vencido según los días de mora" className="mb-5">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <GraficoAntiguedad datos={antiguedad} />
          </div>
          <div className="flex flex-col justify-center">
            <div className="mb-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Total vencido</p>
              <p className="text-2xl font-bold tracking-tight text-slate-900">{formatoMoneda(totalVencido)}</p>
              <p className="text-xs text-slate-500">{vencidas.length} {vencidas.length === 1 ? 'cuota' : 'cuotas'} · mora promedio {moraPromedio} días</p>
            </div>
            <div className="mb-4 flex h-2.5 overflow-hidden rounded-full bg-slate-100">
              {antiguedad.map((t, i) => (
                totalVencido > 0 && t.Vencido > 0 && <div key={t.rango} title={`${t.rango}: ${formatoMoneda(t.Vencido)}`} style={{ width: `${(t.Vencido / totalVencido) * 100}%`, backgroundColor: COLORES_TRAMO[i] }} />
              ))}
            </div>
            <ul className="space-y-2.5">
              {antiguedad.map((t, i) => (
                <li key={t.rango} className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex items-center gap-2 text-slate-600">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORES_TRAMO[i] }} />
                    {t.rango}
                    <span className="text-[11px] text-slate-400">{t.cuotas} {t.cuotas === 1 ? 'cuota' : 'cuotas'}</span>
                  </span>
                  <span className="text-right">
                    <span className="font-semibold tabular-nums text-slate-900">{formatoMoneda(t.Vencido)}</span>
                    <span className="ml-2 inline-block w-10 text-[11px] tabular-nums text-slate-400">{totalVencido > 0 ? Math.round((t.Vencido / totalVencido) * 100) : 0} %</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Panel>

      <div className="mb-5">
        <RespaldoCobranza puedeOperar={puedeOperar} compacto />
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
