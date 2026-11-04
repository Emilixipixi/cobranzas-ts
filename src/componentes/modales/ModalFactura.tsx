import { useState } from 'react'
import type { FormEvent } from 'react'
import { HOY } from '../../datos/datosEjemplo'
import { useDatos } from '../../contextos/DatosContext'
import { botonPrimario, botonSecundario, entrada, etiquetaCampo } from '../../utils/estilos'
import { formatoMoneda, montoCuota, sumarDias } from '../../utils/finanzas'
import type { Cuota } from '../../tipos'
import Modal from '../Modal'

interface Props {
  cuota: Cuota
  onCerrar: () => void
}

export default function ModalFactura({ cuota, onCerrar }: Props) {
  const { contratos, emitirFactura } = useDatos()
  const contrato = contratos.find((k) => k.id === cuota.contratoId)
  const [numero, setNumero] = useState(`FAC-${String(Date.now()).slice(-4)}`)
  const [vencimiento, setVencimiento] = useState(sumarDias(HOY, 15))

  if (!contrato) return null

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    emitirFactura(cuota.id, numero.trim(), vencimiento)
    onCerrar()
  }

  return (
    <Modal titulo="Registrar factura emitida" onCerrar={onCerrar}>
      <form onSubmit={enviar} className="space-y-3">
        <p className="rounded-md bg-slate-50 p-3 text-sm">
          {cuota.concepto} · <strong>{formatoMoneda(montoCuota(cuota, contrato), contrato.moneda)}</strong>
        </p>
        <div>
          <label className={etiquetaCampo}>Número de factura</label>
          <input className={entrada} value={numero} onChange={(e) => setNumero(e.target.value)} required />
        </div>
        <div>
          <label className={etiquetaCampo}>Fecha de vencimiento</label>
          <input className={entrada} type="date" value={vencimiento} min={HOY} onChange={(e) => setVencimiento(e.target.value)} required />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onCerrar} className={botonSecundario}>Cancelar</button>
          <button className={botonPrimario}>Guardar factura</button>
        </div>
      </form>
    </Modal>
  )
}
