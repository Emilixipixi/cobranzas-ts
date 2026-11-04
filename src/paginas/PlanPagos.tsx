import { useState } from 'react'
import { useDatos } from '../contextos/DatosContext'
import { formatoMoneda, montoCuota, resumenPlan } from '../utils/finanzas'
import type { Modalidad, TipoValor } from '../tipos'

export default function PlanPagos() {
  const { proyectos, contratos, cuotas, actualizarCuota, agregarCuota } = useDatos()
  const [contratoId, setContratoId] = useState(contratos[0].id)

  const contrato = contratos.find((k) => k.id === contratoId)!
  const lista = cuotas.filter((q) => q.contratoId === contratoId).sort((a, b) => a.orden - b.orden)
  const resumen = resumenPlan(contrato, cuotas)

  const entrada = 'rounded-md border border-slate-300 bg-white px-2 py-1 text-sm disabled:bg-slate-100'

  return (
    <>
      <h2 className="mb-4 text-xl font-semibold">Plan de pagos</h2>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <select className={entrada} value={contratoId} onChange={(e) => setContratoId(e.target.value)}>
          {contratos.map((k) => (
            <option key={k.id} value={k.id}>
              {k.numero} · {proyectos.find((p) => p.id === k.proyectoId)?.nombre} · {formatoMoneda(k.monto, k.moneda)}
            </option>
          ))}
        </select>
        <button onClick={() => agregarCuota(contratoId)} className="rounded-md border border-slate-300 bg-white px-3 py-1 text-sm hover:bg-slate-50">
          + Agregar cuota
        </button>
      </div>

      {resumen.estado === 'completo' && (
        <div className="mb-3 rounded-lg bg-green-100 px-4 py-2 text-sm text-green-800">Plan completo: cubre el 100 % del contrato.</div>
      )}
      {resumen.estado === 'incompleto' && (
        <div className="mb-3 rounded-lg bg-amber-100 px-4 py-2 text-sm text-amber-800">
          Plan incompleto: cubre {resumen.porcentaje} %. Faltan {formatoMoneda(resumen.diferencia, contrato.moneda)}.
        </div>
      )}
      {resumen.estado === 'excedido' && (
        <div className="mb-3 rounded-lg bg-red-100 px-4 py-2 text-sm text-red-800">
          Plan excedido por {formatoMoneda(-resumen.diferencia, contrato.moneda)}.
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="text-left text-slate-500">
            <tr>
              {['#', 'Concepto', 'Modalidad', 'Tipo', 'Valor'].map((t) => <th key={t} className="p-3 font-medium">{t}</th>)}
              <th className="p-3 text-right font-medium">Importe</th>
              <th className="p-3 font-medium">Fecha esperada</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((q) => (
              <tr key={q.id} className="border-t border-slate-100">
                <td className="p-3">{q.orden}</td>
                <td className="p-3">
                  <input
                    key={q.id + q.concepto}
                    className={entrada}
                    defaultValue={q.concepto}
                    disabled={q.orden === 1}
                    onBlur={(e) => actualizarCuota(q.id, 'concepto', e.target.value)}
                  />
                </td>
                <td className="p-3">
                  <select className={entrada} value={q.modalidad} onChange={(e) => actualizarCuota(q.id, 'modalidad', e.target.value as Modalidad)}>
                    <option value="fecha">Por fecha</option>
                    <option value="hito">Por hito</option>
                    <option value="mixta">Mixta</option>
                  </select>
                </td>
                <td className="p-3">
                  <select className={entrada} value={q.tipoValor} onChange={(e) => actualizarCuota(q.id, 'tipoValor', e.target.value as TipoValor)}>
                    <option value="porcentaje">%</option>
                    <option value="fijo">Monto fijo</option>
                  </select>
                </td>
                <td className="p-3">
                  <input
                    key={q.id + q.valor}
                    type="number"
                    step="any"
                    className={entrada + ' w-24'}
                    defaultValue={q.valor}
                    onBlur={(e) => actualizarCuota(q.id, 'valor', Number(e.target.value))}
                  />
                </td>
                <td className="p-3 text-right tabular-nums">{formatoMoneda(montoCuota(q, contrato), contrato.moneda)}</td>
                <td className="p-3">
                  <input
                    type="date"
                    className={entrada}
                    value={q.fechaProyectada ?? ''}
                    onChange={(e) => actualizarCuota(q.id, 'fechaProyectada', e.target.value || null)}
                  />
                </td>
              </tr>
            ))}
            <tr className="border-t border-slate-200 font-semibold">
              <td className="p-3" colSpan={5}>Total</td>
              <td className="p-3 text-right tabular-nums">{formatoMoneda(resumen.total, contrato.moneda)}</td>
              <td />
            </tr>
          </tbody>
        </table>
      </div>
    </>
  )
}
