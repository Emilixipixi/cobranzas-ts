import { useEffect, useState } from 'react'
import { AlertTriangle, Download, ExternalLink, Loader2 } from 'lucide-react'
import { formatoTamano, leerArchivo } from '../../utils/archivos'
import { botonSecundario } from '../../utils/estilos'
import { formatoFecha } from '../../utils/finanzas'
import type { ArchivoAdjunto } from '../../tipos'
import Modal from '../Modal'

export type CargaArchivo = { estado: 'cargando' } | { estado: 'listo'; url: string } | { estado: 'error' }

/** Lee un adjunto de IndexedDB y entrega una URL temporal (se libera al desmontar). */
export function useUrlArchivo(archivo: ArchivoAdjunto | undefined): CargaArchivo {
  const [carga, setCarga] = useState<CargaArchivo>({ estado: 'cargando' })
  useEffect(() => {
    if (!archivo) return setCarga({ estado: 'error' })
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
  return carga
}

/** Vista previa de solo lectura de un PDF o imagen adjunta. */
export default function ModalVerArchivo({ archivo, titulo, onCerrar }: { archivo: ArchivoAdjunto; titulo: string; onCerrar: () => void }) {
  const carga = useUrlArchivo(archivo)
  return (
    <Modal titulo={titulo} onCerrar={onCerrar} ancho="max-w-4xl">
      <div className="flex min-h-[360px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
        {carga.estado === 'cargando' && (
          <div className="flex flex-1 items-center justify-center text-sm text-slate-500"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Cargando…</div>
        )}
        {carga.estado === 'error' && (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-sm text-slate-600">
            <AlertTriangle className="h-6 w-6 text-amber-500" />
            No se encontró el archivo en este navegador
          </div>
        )}
        {carga.estado === 'listo' &&
          (archivo.tipo === 'application/pdf'
            ? <iframe src={carga.url} title={titulo} className="h-[65vh] min-h-[360px] w-full flex-1 bg-white" />
            : <div className="flex flex-1 items-center justify-center overflow-auto p-4"><img src={carga.url} alt={titulo} className="max-h-[65vh] rounded-lg bg-white shadow" /></div>)}
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-900">{archivo.nombre}</p>
          <p className="text-xs text-slate-500">{formatoTamano(archivo.tamano)} · subido por {archivo.subidoPor} el {formatoFecha(archivo.fecha)}</p>
        </div>
        {carga.estado === 'listo' && (
          <div className="flex gap-2">
            <a href={carga.url} download={archivo.nombre} className={`${botonSecundario} inline-flex items-center gap-1.5`}><Download className="h-3.5 w-3.5" />Descargar</a>
            <a href={carga.url} target="_blank" rel="noopener noreferrer" className={`${botonSecundario} inline-flex items-center gap-1.5`}><ExternalLink className="h-3.5 w-3.5" />Abrir</a>
          </div>
        )}
      </div>
    </Modal>
  )
}
