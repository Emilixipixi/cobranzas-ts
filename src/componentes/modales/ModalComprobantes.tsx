import { useState } from 'react'
import { Eye, FileCheck2, FileWarning, Trash2, UploadCloud } from 'lucide-react'
import { useAuth } from '../../contextos/AuthContext'
import { useDatos } from '../../contextos/DatosContext'
import { borrarArchivo, formatoTamano } from '../../utils/archivos'
import { botonPrimario, botonSecundario } from '../../utils/estilos'
import { cobradoCuota, formatoFecha, formatoMoneda, montoCuota } from '../../utils/finanzas'
import type { Cobro } from '../../tipos'
import Modal from '../Modal'
import SelectorArchivo from '../SelectorArchivo'
import { subirComprobante } from './ModalCobro'
import ModalVerArchivo from './ModalVerArchivo'

interface Props {
  cuotaId: string
  puedeOperar: boolean
  onCerrar: () => void
}

function FilaCobro({ cobro, moneda, puedeOperar, onVer }: { cobro: Cobro; moneda: string; puedeOperar: boolean; onVer: () => void }) {
  const { usuario } = useAuth()
  const { adjuntarComprobante } = useDatos()
  const [subiendo, setSubiendo] = useState(false)
  const [archivo, setArchivo] = useState<File | null>(null)
  const [confirmando, setConfirmando] = useState(false)
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const adjunto = cobro.archivoComprobante

  const guardar = async () => {
    if (!archivo) return
    setOcupado(true)
    setError(null)
    try {
      const nuevo = await subirComprobante(cobro.id, archivo, usuario?.nombre ?? 'Sistema')
      const resultado = adjuntarComprobante(cobro.id, nuevo)
      if (resultado) {
        await borrarArchivo(nuevo.clave)
        setError(resultado)
      } else {
        if (adjunto) await borrarArchivo(adjunto.clave).catch(() => undefined)
        setArchivo(null)
        setSubiendo(false)
      }
    } catch {
      setError('No se pudo guardar el archivo en este navegador')
    }
    setOcupado(false)
  }

  const quitar = async () => {
    const resultado = adjuntarComprobante(cobro.id, null)
    if (resultado) return setError(resultado)
    if (adjunto) await borrarArchivo(adjunto.clave).catch(() => undefined)
    setConfirmando(false)
  }

  return (
    <li className="rounded-xl border border-slate-200 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${adjunto ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
            {adjunto ? <FileCheck2 className="h-4 w-4" /> : <FileWarning className="h-4 w-4" />}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900">{cobro.numeroRecibo} · {formatoMoneda(cobro.valor, moneda)}</p>
            <p className="text-xs text-slate-500">
              {formatoFecha(cobro.fechaReal)} · {cobro.medio}{cobro.referencia ? ` · ref. ${cobro.referencia}` : ''} · registró {cobro.registradoPor}
            </p>
            {adjunto ? (
              <p className="mt-1 truncate text-xs text-slate-600" title={adjunto.nombre}>{adjunto.nombre} · {formatoTamano(adjunto.tamano)}</p>
            ) : (
              <p className="mt-1 text-xs text-amber-700">
                Sin archivo adjunto{cobro.comprobante && cobro.comprobante !== 'sin-comprobante' ? ` (declarado: ${cobro.comprobante})` : ''}
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {adjunto && (
            <button onClick={onVer} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-2.5 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100">
              <Eye className="h-3.5 w-3.5" />Ver comprobante
            </button>
          )}
          {puedeOperar && !subiendo && !confirmando && (
            <button onClick={() => setSubiendo(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
              <UploadCloud className="h-3.5 w-3.5" />{adjunto ? 'Reemplazar' : 'Adjuntar'}
            </button>
          )}
          {puedeOperar && adjunto && !subiendo && !confirmando && (
            <button onClick={() => setConfirmando(true)} aria-label="Quitar comprobante" title="Quitar comprobante" className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {confirmando && (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">
          ¿Quitar el archivo? El cobro se mantiene registrado.
          <span className="flex-1" />
          <button onClick={() => setConfirmando(false)} className={botonSecundario}>Cancelar</button>
          <button onClick={quitar} className="rounded-lg bg-rose-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-rose-700">Sí, quitar</button>
        </div>
      )}

      {subiendo && (
        <div className="mt-3">
          <SelectorArchivo archivo={archivo} onCambio={setArchivo} queSube="el comprobante" />
          <div className="mt-2 flex justify-end gap-2">
            <button onClick={() => { setSubiendo(false); setArchivo(null) }} className={botonSecundario}>Cancelar</button>
            <button onClick={guardar} disabled={!archivo || ocupado} className={botonPrimario}>{ocupado ? 'Guardando…' : 'Guardar comprobante'}</button>
          </div>
        </div>
      )}
      {error && <p className="mt-2 text-xs text-rose-600">{error}</p>}
    </li>
  )
}

/** Comprobantes (evidencias de cobro) de una cuota: ver, adjuntar, reemplazar o quitar. */
export default function ModalComprobantes({ cuotaId, puedeOperar, onCerrar }: Props) {
  const { cuotas, contratos, proyectos, cobros } = useDatos()
  const [viendo, setViendo] = useState<Cobro | null>(null)
  const cuota = cuotas.find((q) => q.id === cuotaId)
  const contrato = contratos.find((k) => k.id === cuota?.contratoId)
  const proyecto = proyectos.find((p) => p.id === contrato?.proyectoId)
  if (!cuota || !contrato) return null

  const lista = cobros.filter((b) => b.cuotaId === cuota.id).sort((a, b) => b.fechaReal.localeCompare(a.fechaReal))
  const conArchivo = lista.filter((b) => b.archivoComprobante).length

  return (
    <>
      <Modal titulo={`Comprobantes de cobro · ${cuota.concepto}`} onCerrar={onCerrar} ancho="max-w-2xl">
        <div className="mb-4 grid grid-cols-3 gap-3 rounded-xl bg-slate-50 p-3 text-sm">
          <div><p className="text-[11px] uppercase tracking-wider text-slate-500">Proyecto</p><p className="truncate font-medium text-slate-900">{proyecto?.nombre}</p></div>
          <div><p className="text-[11px] uppercase tracking-wider text-slate-500">Cobrado</p><p className="font-medium text-slate-900">{formatoMoneda(cobradoCuota(cuota.id, cobros), contrato.moneda)} de {formatoMoneda(montoCuota(cuota, contrato), contrato.moneda)}</p></div>
          <div><p className="text-[11px] uppercase tracking-wider text-slate-500">Con respaldo</p><p className={`font-medium ${conArchivo === lista.length ? 'text-emerald-600' : 'text-amber-600'}`}>{conArchivo} de {lista.length}</p></div>
        </div>
        {lista.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">Esta cuota aún no tiene cobros registrados. Usa «Cobrar» para registrar el primero con su comprobante.</p>
        ) : (
          <ul className="space-y-3">
            {lista.map((b) => <FilaCobro key={b.id} cobro={b} moneda={contrato.moneda} puedeOperar={puedeOperar} onVer={() => setViendo(b)} />)}
          </ul>
        )}
      </Modal>
      {viendo?.archivoComprobante && <ModalVerArchivo archivo={viendo.archivoComprobante} titulo={`Comprobante ${viendo.numeroRecibo}`} onCerrar={() => setViendo(null)} />}
    </>
  )
}
