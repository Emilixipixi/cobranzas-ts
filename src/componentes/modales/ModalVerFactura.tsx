import { useEffect, useState } from 'react'
import { AlertTriangle, Download, ExternalLink, FileText, Loader2, Receipt, Trash2, UploadCloud } from 'lucide-react'
import { useAuth } from '../../contextos/AuthContext'
import { useDatos } from '../../contextos/DatosContext'
import { borrarArchivo, formatoTamano, leerArchivo } from '../../utils/archivos'
import { botonPrimario, botonSecundario } from '../../utils/estilos'
import { cobradoCuota, formatoFecha, formatoMoneda, montoCuota } from '../../utils/finanzas'
import Modal from '../Modal'
import SelectorArchivo from '../SelectorArchivo'
import { subirArchivoFactura } from './ModalFactura'

interface Props {
  cuotaId: string
  puedeOperar: boolean
  onCerrar: () => void
}

type Carga = { estado: 'cargando' } | { estado: 'listo'; url: string } | { estado: 'sin-archivo' } | { estado: 'error' }

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="flex justify-between gap-3 text-sm">
      <span className="text-slate-500">{etiqueta}</span>
      <span className="text-right font-medium text-slate-900">{valor}</span>
    </div>
  )
}

export default function ModalVerFactura({ cuotaId, puedeOperar, onCerrar }: Props) {
  const { usuario } = useAuth()
  const { cuotas, contratos, proyectos, cobros, adjuntarFactura, eliminarFactura } = useDatos()
  const cuota = cuotas.find((q) => q.id === cuotaId)
  const contrato = contratos.find((k) => k.id === cuota?.contratoId)
  const proyecto = proyectos.find((p) => p.id === contrato?.proyectoId)
  const archivo = cuota?.archivoFactura
  const [carga, setCarga] = useState<Carga>({ estado: 'cargando' })
  const [nuevoArchivo, setNuevoArchivo] = useState<File | null>(null)
  const [reemplazando, setReemplazando] = useState(false)
  const [confirmando, setConfirmando] = useState(false)
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!archivo) {
      setCarga({ estado: 'sin-archivo' })
      return
    }
    let url: string | null = null
    let vigente = true
    setCarga({ estado: 'cargando' })
    leerArchivo(archivo.clave)
      .then((blob) => {
        if (!vigente) return
        if (!blob) return setCarga({ estado: 'error' })
        url = URL.createObjectURL(blob)
        setCarga({ estado: 'listo', url })
      })
      .catch(() => vigente && setCarga({ estado: 'error' }))
    return () => {
      vigente = false
      if (url) URL.revokeObjectURL(url)
    }
  }, [archivo])

  if (!cuota || !contrato || !cuota.numeroFactura) return null

  const monto = montoCuota(cuota, contrato)
  const cobrado = cobradoCuota(cuota.id, cobros)
  const tieneCobros = cobros.some((b) => b.cuotaId === cuota.id)

  const subir = async () => {
    if (!nuevoArchivo) return
    setOcupado(true)
    setError(null)
    try {
      const adjunto = await subirArchivoFactura(cuota.id, nuevoArchivo, usuario?.nombre ?? 'Sistema')
      const resultado = adjuntarFactura(cuota.id, adjunto)
      if (resultado) {
        await borrarArchivo(adjunto.clave)
        setError(resultado)
      } else {
        if (archivo) await borrarArchivo(archivo.clave).catch(() => undefined)
        setNuevoArchivo(null)
        setReemplazando(false)
      }
    } catch {
      setError('No se pudo guardar el archivo en este navegador')
    }
    setOcupado(false)
  }

  const eliminar = async () => {
    const resultado = eliminarFactura(cuota.id)
    if (resultado) return setError(resultado)
    if (archivo) await borrarArchivo(archivo.clave).catch(() => undefined)
    onCerrar()
  }

  const mostrarSubida = puedeOperar && (carga.estado === 'sin-archivo' || carga.estado === 'error' || reemplazando)

  return (
    <Modal titulo={`Factura ${cuota.numeroFactura}`} onCerrar={onCerrar} ancho="max-w-5xl">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
        {/* Vista previa */}
        <div className="flex min-h-[420px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
          {carga.estado === 'cargando' && (
            <div className="flex flex-1 items-center justify-center text-sm text-slate-500"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Cargando factura…</div>
          )}
          {carga.estado === 'listo' && archivo && (
            archivo.tipo === 'application/pdf'
              ? <iframe src={carga.url} title={`Factura ${cuota.numeroFactura}`} className="h-[65vh] min-h-[420px] w-full flex-1 bg-white" />
              : <div className="flex flex-1 items-center justify-center overflow-auto p-4"><img src={carga.url} alt={`Factura ${cuota.numeroFactura}`} className="max-h-[65vh] rounded-lg bg-white shadow" /></div>
          )}
          {(carga.estado === 'sin-archivo' || carga.estado === 'error') && (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
                {carga.estado === 'error' ? <AlertTriangle className="h-6 w-6 text-amber-500" /> : <FileText className="h-6 w-6" />}
              </span>
              <p className="text-sm font-medium text-slate-700">{carga.estado === 'error' ? 'No se encontró el archivo en este navegador' : 'Esta factura no tiene archivo adjunto'}</p>
              <p className="max-w-xs text-xs text-slate-500">
                {puedeOperar ? 'Sube el PDF o la imagen de la factura desde el panel de la derecha.' : 'Finanzas o el administrador pueden adjuntarlo.'}
              </p>
            </div>
          )}
        </div>

        {/* Detalle y acciones */}
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-slate-200 p-4">
            <div className="mb-3 flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600"><Receipt className="h-4 w-4" /></span>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-900">{cuota.concepto}</p>
                <p className="truncate text-xs text-slate-500">{proyecto?.nombre} · {contrato.numero}</p>
              </div>
            </div>
            <div className="space-y-2 border-t border-slate-100 pt-3">
              <Dato etiqueta="Monto" valor={formatoMoneda(monto, contrato.moneda)} />
              <Dato etiqueta="Cobrado" valor={formatoMoneda(cobrado, contrato.moneda)} />
              <Dato etiqueta="Emitida" valor={formatoFecha(cuota.fechaFactura)} />
              <Dato etiqueta="Vence" valor={formatoFecha(cuota.vencimientoFactura)} />
            </div>
          </div>

          {archivo && carga.estado === 'listo' && (
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="truncate text-sm font-medium text-slate-900" title={archivo.nombre}>{archivo.nombre}</p>
              <p className="text-xs text-slate-500">{formatoTamano(archivo.tamano)} · subido por {archivo.subidoPor} el {formatoFecha(archivo.fecha)}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <a href={carga.url} download={archivo.nombre} className={`${botonSecundario} inline-flex items-center gap-1.5`}><Download className="h-3.5 w-3.5" />Descargar</a>
                <a href={carga.url} target="_blank" rel="noopener noreferrer" className={`${botonSecundario} inline-flex items-center gap-1.5`}><ExternalLink className="h-3.5 w-3.5" />Abrir</a>
                {puedeOperar && !reemplazando && (
                  <button onClick={() => setReemplazando(true)} className={`${botonSecundario} inline-flex items-center gap-1.5`}><UploadCloud className="h-3.5 w-3.5" />Reemplazar</button>
                )}
              </div>
            </div>
          )}

          {mostrarSubida && (
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">{archivo && carga.estado === 'listo' ? 'Reemplazar archivo' : 'Adjuntar archivo'}</p>
              <SelectorArchivo archivo={nuevoArchivo} onCambio={setNuevoArchivo} />
              <div className="mt-2 flex justify-end gap-2">
                {reemplazando && <button onClick={() => { setReemplazando(false); setNuevoArchivo(null) }} className={botonSecundario}>Cancelar</button>}
                <button onClick={subir} disabled={!nuevoArchivo || ocupado} className={botonPrimario}>{ocupado ? 'Guardando…' : 'Guardar archivo'}</button>
              </div>
            </div>
          )}

          {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

          {puedeOperar && (
            <div className="mt-auto rounded-xl border border-rose-200 bg-rose-50/40 p-4">
              {!confirmando ? (
                <>
                  <p className="text-sm font-semibold text-rose-700">¿Factura equivocada?</p>
                  <p className="mt-0.5 text-xs text-slate-600">Elimínala y vuelve a registrar la correcta desde «Facturar».</p>
                  <button onClick={() => setConfirmando(true)} className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-sm font-medium text-rose-700 transition-colors hover:bg-rose-600 hover:text-white">
                    <Trash2 className="h-3.5 w-3.5" />Eliminar factura
                  </button>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold text-rose-700">¿Eliminar {cuota.numeroFactura}?</p>
                  <p className="mt-0.5 text-xs text-slate-600">
                    Se borrarán el número, las fechas y el archivo adjunto. La cuota volverá a quedar por facturar.
                    {tieneCobros && ' Los cobros ya registrados de esta cuota se mantienen.'}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => setConfirmando(false)} className={botonSecundario}>Cancelar</button>
                    <button onClick={eliminar} className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-rose-700">
                      <Trash2 className="h-3.5 w-3.5" />Sí, eliminar
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
