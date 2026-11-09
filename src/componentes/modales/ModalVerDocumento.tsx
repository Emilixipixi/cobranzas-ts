import { useEffect, useState } from 'react'
import { AlertTriangle, Download, ExternalLink, FileText, Loader2, Trash2, UploadCloud } from 'lucide-react'
import { useAuth } from '../../contextos/AuthContext'
import { useDatos } from '../../contextos/DatosContext'
import { borrarArchivo, formatoTamano, guardarArchivo, leerArchivo } from '../../utils/archivos'
import { botonPrimario, botonSecundario } from '../../utils/estilos'
import { formatoFecha } from '../../utils/finanzas'
import type { ArchivoAdjunto } from '../../tipos'
import EtiquetaEstado from '../EtiquetaEstado'
import { ETIQUETAS_CATEGORIA } from '../expediente/PestanaDocumentos'
import { puedeVerCategoria } from '../../utils/permisosDocumentos'
import Modal from '../Modal'
import SelectorArchivo from '../SelectorArchivo'

interface Props {
  documentoId: string
  puedeEditar: boolean
  onCerrar: () => void
}

type Carga = { estado: 'cargando' } | { estado: 'listo'; url: string } | { estado: 'sin-archivo' } | { estado: 'error' }

/** Guarda el archivo de un documento en IndexedDB y devuelve sus datos. */
export const subirArchivoDocumento = async (documentoId: string, archivo: File, autor: string): Promise<ArchivoAdjunto> => {
  const clave = `documento-${documentoId}-${Date.now()}`
  await guardarArchivo(clave, archivo)
  return { clave, nombre: archivo.name, tipo: archivo.type, tamano: archivo.size, subidoPor: autor, fecha: new Date().toISOString() }
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="flex justify-between gap-3 text-sm">
      <span className="text-slate-500">{etiqueta}</span>
      <span className="text-right font-medium text-slate-900">{valor}</span>
    </div>
  )
}

export default function ModalVerDocumento({ documentoId, puedeEditar, onCerrar }: Props) {
  const { usuario } = useAuth()
  const { documentos, proyectos, adjuntarArchivoDocumento, permisosDocumentos } = useDatos()
  const encontrado = documentos.find((d) => d.id === documentoId)
  const documento = encontrado && puedeVerCategoria(usuario?.rol, encontrado.categoria, permisosDocumentos) ? encontrado : undefined
  const proyecto = proyectos.find((p) => p.id === documento?.proyectoId)
  const archivo = documento?.archivo
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

  if (!documento) return null

  const subir = async () => {
    if (!nuevoArchivo) return
    setOcupado(true)
    setError(null)
    try {
      const adjunto = await subirArchivoDocumento(documento.id, nuevoArchivo, usuario?.nombre ?? 'Sistema')
      const resultado = adjuntarArchivoDocumento(documento.id, adjunto)
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

  const quitar = async () => {
    const resultado = adjuntarArchivoDocumento(documento.id, null)
    if (resultado) return setError(resultado)
    if (archivo) await borrarArchivo(archivo.clave).catch(() => undefined)
    setConfirmando(false)
  }

  const mostrarSubida = puedeEditar && (carga.estado === 'sin-archivo' || carga.estado === 'error' || reemplazando)

  return (
    <Modal titulo={documento.titulo} onCerrar={onCerrar} ancho="max-w-5xl">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
        {/* Vista previa */}
        <div className="flex min-h-[420px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
          {carga.estado === 'cargando' && (
            <div className="flex flex-1 items-center justify-center text-sm text-slate-500"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Cargando documento…</div>
          )}
          {carga.estado === 'listo' && archivo && (
            archivo.tipo === 'application/pdf'
              ? <iframe src={carga.url} title={documento.titulo} className="h-[65vh] min-h-[420px] w-full flex-1 bg-white" />
              : <div className="flex flex-1 items-center justify-center overflow-auto p-4"><img src={carga.url} alt={documento.titulo} className="max-h-[65vh] rounded-lg bg-white shadow" /></div>
          )}
          {(carga.estado === 'sin-archivo' || carga.estado === 'error') && (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
                {carga.estado === 'error' ? <AlertTriangle className="h-6 w-6 text-amber-500" /> : <FileText className="h-6 w-6" />}
              </span>
              <p className="text-sm font-medium text-slate-700">{carga.estado === 'error' ? 'No se encontró el archivo en este navegador' : 'Este documento aún no tiene PDF adjunto'}</p>
              <p className="max-w-xs text-xs text-slate-500">
                {puedeEditar ? 'Sube el PDF o la imagen del documento desde el panel de la derecha.' : 'El administrador o el área comercial pueden adjuntarlo.'}
              </p>
            </div>
          )}
        </div>

        {/* Detalle y acciones */}
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-slate-200 p-4">
            <div className="mb-3 flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-900">{ETIQUETAS_CATEGORIA[documento.categoria]}</p>
                <p className="truncate text-xs text-slate-500">{proyecto?.nombre}</p>
              </div>
              <EtiquetaEstado estado={documento.estado} />
            </div>
            <div className="space-y-2 border-t border-slate-100 pt-3">
              <Dato etiqueta="Versión" valor={documento.version} />
              <Dato etiqueta="Fecha" valor={formatoFecha(documento.fecha)} />
              <Dato etiqueta="Autor" valor={documento.autor} />
            </div>
            {documento.notas && <p className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-600">{documento.notas}</p>}
          </div>

          {archivo && carga.estado === 'listo' && (
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="truncate text-sm font-medium text-slate-900" title={archivo.nombre}>{archivo.nombre}</p>
              <p className="text-xs text-slate-500">{formatoTamano(archivo.tamano)} · subido por {archivo.subidoPor} el {formatoFecha(archivo.fecha)}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <a href={carga.url} download={archivo.nombre} className={`${botonSecundario} inline-flex items-center gap-1.5`}><Download className="h-3.5 w-3.5" />Descargar</a>
                <a href={carga.url} target="_blank" rel="noopener noreferrer" className={`${botonSecundario} inline-flex items-center gap-1.5`}><ExternalLink className="h-3.5 w-3.5" />Abrir</a>
                {puedeEditar && !reemplazando && (
                  <button onClick={() => setReemplazando(true)} className={`${botonSecundario} inline-flex items-center gap-1.5`}><UploadCloud className="h-3.5 w-3.5" />Reemplazar</button>
                )}
              </div>
            </div>
          )}

          {mostrarSubida && (
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">{archivo && carga.estado === 'listo' ? 'Reemplazar archivo' : 'Adjuntar archivo'}</p>
              <SelectorArchivo archivo={nuevoArchivo} onCambio={setNuevoArchivo} queSube="el documento" />
              <div className="mt-2 flex justify-end gap-2">
                {reemplazando && <button onClick={() => { setReemplazando(false); setNuevoArchivo(null) }} className={botonSecundario}>Cancelar</button>}
                <button onClick={subir} disabled={!nuevoArchivo || ocupado} className={botonPrimario}>{ocupado ? 'Guardando…' : 'Guardar archivo'}</button>
              </div>
            </div>
          )}

          {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

          {puedeEditar && archivo && (
            <div className="mt-auto rounded-xl border border-rose-200 bg-rose-50/40 p-4">
              {!confirmando ? (
                <>
                  <p className="text-sm font-semibold text-rose-700">¿Archivo equivocado?</p>
                  <p className="mt-0.5 text-xs text-slate-600">Quita el archivo; el documento se mantiene en el expediente.</p>
                  <button onClick={() => setConfirmando(true)} className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-sm font-medium text-rose-700 transition-colors hover:bg-rose-600 hover:text-white">
                    <Trash2 className="h-3.5 w-3.5" />Quitar archivo
                  </button>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold text-rose-700">¿Quitar {archivo.nombre}?</p>
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => setConfirmando(false)} className={botonSecundario}>Cancelar</button>
                    <button onClick={quitar} className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-rose-700">
                      <Trash2 className="h-3.5 w-3.5" />Sí, quitar
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
