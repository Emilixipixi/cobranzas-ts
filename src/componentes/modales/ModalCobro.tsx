import { useState } from 'react'
import type { FormEvent } from 'react'
import { HOY } from '../../datos/datosEjemplo'
import { useAuth } from '../../contextos/AuthContext'
import { useDatos } from '../../contextos/DatosContext'
import { guardarArchivo } from '../../utils/archivos'
import { botonPrimario, botonSecundario, entrada, etiquetaCampo } from '../../utils/estilos'
import { formatoMoneda, saldoCuota } from '../../utils/finanzas'
import type { ArchivoAdjunto, Cuota } from '../../tipos'
import Modal from '../Modal'
import SelectorArchivo from '../SelectorArchivo'

interface Props {
  cuota: Cuota
  onCerrar: () => void
}

const MEDIOS = ['Transferencia', 'Depósito', 'Efectivo', 'Tarjeta', 'Otro']

/** Guarda el comprobante de un cobro en IndexedDB y devuelve sus datos. */
export const subirComprobante = async (referencia: string, archivo: File, autor: string): Promise<ArchivoAdjunto> => {
  const clave = `comprobante-${referencia}-${Date.now()}`
  await guardarArchivo(clave, archivo)
  return { clave, nombre: archivo.name, tipo: archivo.type, tamano: archivo.size, subidoPor: autor, fecha: new Date().toISOString() }
}

export default function ModalCobro({ cuota, onCerrar }: Props) {
  const { usuario } = useAuth()
  const { contratos, cobros, registrarCobro } = useDatos()
  const contrato = contratos.find((k) => k.id === cuota.contratoId)
  const saldo = contrato ? saldoCuota(cuota, contrato, cobros) : 0

  const [fechaReal, setFechaReal] = useState(HOY)
  const [valor, setValor] = useState(saldo)
  const [medio, setMedio] = useState(MEDIOS[0])
  const [referencia, setReferencia] = useState('')
  const [archivo, setArchivo] = useState<File | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!contrato) return null

  const enviar = async (e: FormEvent) => {
    e.preventDefault()
    if (valor <= 0) return setError('El valor debe ser mayor a cero')
    if (valor > saldo) return setError(`El valor no puede superar el saldo (${formatoMoneda(saldo, contrato.moneda)})`)
    setGuardando(true)
    try {
      const adjunto = archivo ? await subirComprobante(cuota.id, archivo, usuario?.nombre ?? 'Sistema') : undefined
      registrarCobro(cuota.id, { fechaReal, valor, medio, comprobante: adjunto?.nombre ?? 'sin-comprobante', referencia, archivoComprobante: adjunto })
      onCerrar()
    } catch {
      setGuardando(false)
      setError('No se pudo guardar el comprobante en este navegador. Intenta con un archivo más liviano.')
    }
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
          <label className={etiquetaCampo}>Comprobante del pago</label>
          <SelectorArchivo archivo={archivo} onCambio={setArchivo} queSube="el comprobante" />
          {!archivo && <p className="mt-1 text-[11px] text-slate-400">Puedes adjuntarlo después desde «Comprobantes» en el control de cobranza.</p>}
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onCerrar} className={botonSecundario}>Cancelar</button>
          <button className={botonPrimario} disabled={guardando}>{guardando ? 'Guardando…' : 'Registrar cobro'}</button>
        </div>
      </form>
    </Modal>
  )
}
