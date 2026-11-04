import { useState } from 'react'
import type { FormEvent } from 'react'
import { HOY } from '../../datos/datosEjemplo'
import { useDatos } from '../../contextos/DatosContext'
import { botonPrimario, botonSecundario, entrada, etiquetaCampo } from '../../utils/estilos'
import { formatoMoneda, saldoCuota } from '../../utils/finanzas'
import type { Cuota } from '../../tipos'
import Modal from '../Modal'

interface Props {
  cuota: Cuota
  onCerrar: () => void
}

const MEDIOS = ['Transferencia', 'Depósito', 'Efectivo', 'Tarjeta', 'Otro']

export default function ModalCobro({ cuota, onCerrar }: Props) {
  const { contratos, cobros, registrarCobro } = useDatos()
  const contrato = contratos.find((k) => k.id === cuota.contratoId)
  const saldo = contrato ? saldoCuota(cuota, contrato, cobros) : 0

  const [fechaReal, setFechaReal] = useState(HOY)
  const [valor, setValor] = useState(saldo)
  const [medio, setMedio] = useState(MEDIOS[0])
  const [referencia, setReferencia] = useState('')
  const [comprobante, setComprobante] = useState('')
  const [error, setError] = useState<string | null>(null)

  if (!contrato) return null

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    if (valor <= 0) return setError('El valor debe ser mayor a cero')
    if (valor > saldo) return setError(`El valor no puede superar el saldo (${formatoMoneda(saldo, contrato.moneda)})`)
    registrarCobro(cuota.id, { fechaReal, valor, medio, comprobante: comprobante || 'sin-comprobante', referencia })
    onCerrar()
  }

  return (
    <Modal titulo="Registrar cobro" onCerrar={onCerrar}>
      <form onSubmit={enviar} className="space-y-3">
        <p className="rounded-md bg-slate-50 p-3 text-sm">
          {cuota.concepto} · saldo pendiente <strong>{formatoMoneda(saldo, contrato.moneda)}</strong>
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={etiquetaCampo}>Fecha real del cobro</label>
            <input className={entrada} type="date" value={fechaReal} onChange={(e) => setFechaReal(e.target.value)} required />
          </div>
          <div>
            <label className={etiquetaCampo}>Valor cobrado</label>
            <input className={entrada} type="number" step="0.01" value={valor} onChange={(e) => setValor(Number(e.target.value))} required />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={etiquetaCampo}>Medio de pago</label>
            <select className={entrada} value={medio} onChange={(e) => setMedio(e.target.value)}>
              {MEDIOS.map((m) => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className={etiquetaCampo}>Referencia bancaria</label>
            <input className={entrada} value={referencia} onChange={(e) => setReferencia(e.target.value)} placeholder="TRX-0000" />
          </div>
        </div>
        <div>
          <label className={etiquetaCampo}>Comprobante (archivo)</label>
          <input
            className={entrada}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={(e) => setComprobante(e.target.files?.[0]?.name ?? '')}
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onCerrar} className={botonSecundario}>Cancelar</button>
          <button className={botonPrimario}>Registrar cobro</button>
        </div>
      </form>
    </Modal>
  )
}
