import { useState } from 'react'
import { useDatos } from '../../contextos/DatosContext'
import { botonSecundario } from '../../utils/estilos'
import { formatoFecha } from '../../utils/finanzas'
import EtiquetaEstado from '../EtiquetaEstado'
import ModalDocumento from '../modales/ModalDocumento'
import ModalMinuta from '../modales/ModalMinuta'
import type { CategoriaDocumento } from '../../tipos'

interface Props {
  proyectoId: string
  puedeEditar: boolean
}

export const ETIQUETAS_CATEGORIA: Record<CategoriaDocumento, string> = {
  contrato: 'Contrato',
  cotizacion: 'Cotización',
  acta: 'Acta de entrega-recepción',
  anexo: 'Anexo',
  minuta: 'Minuta de reunión',
}

export default function PestanaDocumentos({ proyectoId, puedeEditar }: Props) {
  const { documentos } = useDatos()
  const [modal, setModal] = useState<'documento' | 'minuta' | null>(null)
  const lista = documentos.filter((d) => d.proyectoId === proyectoId).sort((a, b) => b.fecha.localeCompare(a.fecha))

  return (
    <>
      {puedeEditar && (
        <div className="mb-3 flex gap-2">
          <button className={botonSecundario} onClick={() => setModal('documento')}>+ Documento</button>
          <button className={botonSecundario} onClick={() => setModal('minuta')}>+ Minuta de reunión</button>
        </div>
      )}
      <div className="space-y-3">
        {lista.length === 0 && <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-400">Aún no hay documentos en el expediente</p>}
        {lista.map((d) => (
          <div key={d.id} className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-medium">{d.titulo}</p>
                <p className="text-xs text-slate-500">
                  {ETIQUETAS_CATEGORIA[d.categoria]} · {d.version} · {formatoFecha(d.fecha)} · {d.autor}
                </p>
              </div>
              <EtiquetaEstado estado={d.estado} />
            </div>
            {d.notas && <p className="mt-2 text-slate-600">{d.notas}</p>}
            {d.minuta && (
              <details className="mt-2">
                <summary className="cursor-pointer text-blue-700">Ver acuerdos y compromisos</summary>
                <p className="mt-2 text-xs text-slate-500">Asistentes: {d.minuta.asistentes.join(', ') || '—'}</p>
                <ul className="mt-1 list-disc pl-5">
                  {d.minuta.acuerdos.map((a, i) => <li key={i}>{a}</li>)}
                </ul>
                {d.minuta.pendientes.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {d.minuta.pendientes.map((p, i) => (
                      <li key={i} className="rounded bg-slate-50 px-2 py-1 text-xs">
                        {p.tarea} · {p.responsable} · {formatoFecha(p.fecha)}
                      </li>
                    ))}
                  </ul>
                )}
              </details>
            )}
          </div>
        ))}
      </div>
      {modal === 'documento' && <ModalDocumento proyectoId={proyectoId} onCerrar={() => setModal(null)} />}
      {modal === 'minuta' && <ModalMinuta proyectoId={proyectoId} onCerrar={() => setModal(null)} />}
    </>
  )
}
