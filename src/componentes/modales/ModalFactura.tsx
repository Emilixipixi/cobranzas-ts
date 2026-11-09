import { useState } from 'react'
import type { FormEvent } from 'react'
import { HOY } from '../../datos/datosEjemplo'
import { useAuth } from '../../contextos/AuthContext'
import { useDatos } from '../../contextos/DatosContext'
import { guardarArchivo } from '../../utils/archivos'
import { botonPrimario, botonSecundario, entrada, etiquetaCampo } from '../../utils/estilos'
import { formatoMoneda, montoCuota, sumarDias } from '../../utils/finanzas'
import type { ArchivoAdjunto, Cuota } from '../../tipos'
import Modal from '../Modal'
import SelectorArchivo from '../SelectorArchivo'

interface Props {
  cuota: Cuota
  onCerrar: () => void
}

/** Guarda el archivo en IndexedDB y devuelve sus datos para la cuota. */
export const subirArchivoFactura = async (cuotaId: string, archivo: File, autor: string): Promise<ArchivoAdjunto> => {
  const clave = `factura-${cuotaId}-${Date.now()}`
  await guardarArchivo(clave, archivo)
  return { clave, nombre: archivo.name, tipo: archivo.type, tamano: archivo.size, subidoPor: autor, fecha: new Date().toISOString() }
}

export default function ModalFactura({ cuota, onCerrar }: Props) {
  const { usuario } = useAuth()
  const { contratos, emitirFactura } = useDatos()
  const contrato = contratos.find((k) => k.id === cuota.contratoId)
  const [numero, setNumero] = useState(`FAC-${String(Date.now()).slice(-4)}`)
  const [vencimiento, setVencimiento] = useState(sumarDias(HOY, 15))
  const [archivo, setArchivo] = useState<File | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!contrato) return null

  const enviar = async (e: FormEvent) => {
    e.preventDefault()
    setGuardando(true)
    try {
      const adjunto = archivo ? await subirArchivoFactura(cuota.id, archivo, usuario?.nombre ?? 'Sistema') : undefined
      emitirFactura(cuota.id, numero.trim(), vencimiento, adjunto)
      onCerrar()
    } catch {
      setError('No se pudo guardar el archivo en este navegador. Intenta con un archivo más liviano.')
      setGuardando(false)
    }
  }

  return (
    <Modal titulo="Registrar factura emitida" onCerrar={onCerrar}>
      <form onSubmit={enviar} className="space-y-3">
        <p className="rounded-md bg-slate-50 p-3 text-sm">
          {cuota.concepto} · <strong>{formatoMoneda(montoCuota(cuota, contrato), contrato.moneda)}</strong>
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={etiquetaCampo}>Número de factura</label>
            <input className={entrada} value={numero} onChange={(e) => setNumero(e.target.value)} required />
          </div>
          <div>
            <label className={etiquetaCampo}>Fecha de vencimiento</label>
            <input className={entrada} type="date" value={vencimiento} min={HOY} onChange={(e) => setVencimiento(e.target.value)} required />
          </div>
        </div>
        <div>
          <label className={etiquetaCampo}>Archivo de la factura (opcional)</label>
          <SelectorArchivo archivo={archivo} onCambio={setArchivo} />
        </div>
        {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onCerrar} className={botonSecundario}>Cancelar</button>
          <button className={botonPrimario} disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar factura'}</button>
        </div>
      </form>
    </Modal>
  )
}
