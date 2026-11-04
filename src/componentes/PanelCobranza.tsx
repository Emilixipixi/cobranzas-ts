import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useDatos } from '../contextos/DatosContext'
import { botonSecundario } from '../utils/estilos'
import { formatoFecha, formatoMoneda } from '../utils/finanzas'
import { filasCartera } from '../utils/indicadores'
import type { Cuota } from '../tipos'
import EtiquetaEstado from './EtiquetaEstado'
import ModalCobro from './modales/ModalCobro'
import ModalFactura from './modales/ModalFactura'
import ModalRecordatorio from './modales/ModalRecordatorio'

interface Props {
  cuotas: Cuota[]
  puedeOperar: boolean
  mostrarProyecto?: boolean
  vacio?: string
}

type Accion = { tipo: 'factura' | 'cobro' | 'recordatorio'; cuota: Cuota }

export default function PanelCobranza({ cuotas, puedeOperar, mostrarProyecto = true, vacio = 'No hay cuotas para mostrar' }: Props) {
  const { proyectos, clientes, contratos, cobros } = useDatos()
  const [accion, setAccion] = useState<Accion | null>(null)

  const ids = new Set(cuotas.map((q) => q.id))
  const filas = filasCartera(proyectos, clientes, contratos, cuotas, cobros)
    .filter((f) => ids.has(f.cuota.id))
    .sort((a, b) => (a.fecha ?? '9999').localeCompare(b.fecha ?? '9999'))

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="text-left text-slate-500">
            <tr>
              {mostrarProyecto && <th className="p-3 font-medium">Proyecto</th>}
              <th className="p-3 font-medium">Concepto</th>
              <th className="p-3 font-medium">Vence</th>
              <th className="p-3 text-right font-medium">Monto</th>
              <th className="p-3 text-right font-medium">Cobrado</th>
              <th className="p-3 text-right font-medium">Saldo</th>
              <th className="p-3 font-medium">Estado</th>
              <th className="p-3 font-medium">Factura</th>
              {puedeOperar && <th className="p-3 font-medium">Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {filas.length === 0 && (
              <tr><td colSpan={9} className="p-4 text-center text-slate-400">{vacio}</td></tr>
            )}
            {filas.map((f) => {
              const puedeFacturar = f.cuota.facturaRequerida && !f.cuota.numeroFactura && f.monto > 0
              const puedeCobrar = f.saldo > 0
              const puedeRecordar = f.saldo > 0 && (f.estado === 'Vencida' || f.estado === 'Facturada' || f.estado === 'Parcialmente cobrada')
              return (
                <tr key={f.cuota.id} className="border-t border-slate-100">
                  {mostrarProyecto && (
                    <td className="whitespace-nowrap p-3">
                      <Link to={`/proyectos/${f.proyecto.id}`} className="text-blue-700 hover:underline">{f.proyecto.nombre}</Link>
                    </td>
                  )}
                  <td className="whitespace-nowrap p-3">{f.cuota.concepto}</td>
                  <td className="whitespace-nowrap p-3">
                    {formatoFecha(f.fecha)}
                    {f.estado === 'Vencida' && <span className="ml-1 text-xs text-red-700">({f.diasMora} d)</span>}
                  </td>
                  <td className="p-3 text-right tabular-nums">{formatoMoneda(f.monto, f.contrato.moneda)}</td>
                  <td className="p-3 text-right tabular-nums">{formatoMoneda(f.cobrado, f.contrato.moneda)}</td>
                  <td className="p-3 text-right font-medium tabular-nums">{formatoMoneda(f.saldo, f.contrato.moneda)}</td>
                  <td className="p-3"><EtiquetaEstado estado={f.estado} /></td>
                  <td className="whitespace-nowrap p-3 text-xs text-slate-600">
                    {f.cuota.numeroFactura ?? (f.cuota.facturaRequerida ? 'Por emitir' : 'No requerida')}
                  </td>
                  {puedeOperar && (
                    <td className="whitespace-nowrap p-3">
                      <div className="flex gap-1">
                        {puedeFacturar && <button className={botonSecundario} onClick={() => setAccion({ tipo: 'factura', cuota: f.cuota })}>Facturar</button>}
                        {puedeCobrar && <button className={botonSecundario} onClick={() => setAccion({ tipo: 'cobro', cuota: f.cuota })}>Cobrar</button>}
                        {puedeRecordar && <button className={botonSecundario} onClick={() => setAccion({ tipo: 'recordatorio', cuota: f.cuota })}>Recordar</button>}
                      </div>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {accion?.tipo === 'factura' && <ModalFactura cuota={accion.cuota} onCerrar={() => setAccion(null)} />}
      {accion?.tipo === 'cobro' && <ModalCobro cuota={accion.cuota} onCerrar={() => setAccion(null)} />}
      {accion?.tipo === 'recordatorio' && <ModalRecordatorio cuota={accion.cuota} onCerrar={() => setAccion(null)} />}
    </>
  )
}
