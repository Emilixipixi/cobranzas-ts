import { useState } from 'react'
import PanelCobranza from '../componentes/PanelCobranza'
import TarjetaMetrica from '../componentes/TarjetaMetrica'
import { useAuth } from '../contextos/AuthContext'
import { useDatos } from '../contextos/DatosContext'
import { entrada } from '../utils/estilos'
import { formatoMoneda } from '../utils/finanzas'
import { filasCartera, resumenFinanciero } from '../utils/indicadores'

const ESTADOS = ['Todos', 'Vencida', 'Facturada', 'Habilitada para cobro', 'Parcialmente cobrada', 'Pendiente', 'Cobrada']

export default function Cobranza() {
  const { usuario } = useAuth()
  const { proyectos, clientes, contratos, cuotas, cobros } = useDatos()
  const [estado, setEstado] = useState('Todos')
  const [proyectoId, setProyectoId] = useState('todos')

  const filas = filasCartera(proyectos, clientes, contratos, cuotas, cobros)
  const filtradas = filas.filter(
    (f) => (estado === 'Todos' || f.estado === estado) && (proyectoId === 'todos' || f.proyecto.id === proyectoId)
  )
  const resumen = resumenFinanciero(contratos, cuotas, cobros)
  const puedeOperar = usuario?.rol === 'administrador' || usuario?.rol === 'finanzas'

  return (
    <>
      <h2 className="mb-4 text-xl font-semibold">Control de cobranza</h2>
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <TarjetaMetrica titulo="Por facturar" valor={formatoMoneda(resumen.porFacturar)} />
        <TarjetaMetrica titulo="Facturado por cobrar" valor={formatoMoneda(resumen.facturadoPendiente)} />
        <TarjetaMetrica titulo="Vencido" valor={formatoMoneda(resumen.vencido)} tono={resumen.vencido > 0 ? 'peligro' : 'neutro'} />
        <TarjetaMetrica titulo="Cobrado" valor={formatoMoneda(resumen.cobrado)} tono="ok" />
      </div>
      <div className="mb-3 flex flex-wrap gap-2">
        <select className={`${entrada} max-w-xs`} value={estado} onChange={(e) => setEstado(e.target.value)}>
          {ESTADOS.map((e) => <option key={e}>{e}</option>)}
        </select>
        <select className={`${entrada} max-w-xs`} value={proyectoId} onChange={(e) => setProyectoId(e.target.value)}>
          <option value="todos">Todos los proyectos</option>
          {proyectos.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
        </select>
      </div>
      <PanelCobranza cuotas={filtradas.map((f) => f.cuota)} puedeOperar={puedeOperar} />
    </>
  )
}
