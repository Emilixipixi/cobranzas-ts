import { useState } from 'react'
import { CalendarPlus, Eye, FilePlus2, FileText, Paperclip } from 'lucide-react'
import { useAuth } from '../../contextos/AuthContext'
import { useDatos } from '../../contextos/DatosContext'
import { proyectosParaAgendar, puedeEditarReunion, puedeVerReunion } from '../../utils/reuniones'
import InsigniaReunion from '../InsigniaReunion'
import { formatoFecha } from '../../utils/finanzas'
import EtiquetaEstado from '../EtiquetaEstado'
import ModalDocumento from '../modales/ModalDocumento'
import ModalMinuta from '../modales/ModalMinuta'
import ModalVerDocumento from '../modales/ModalVerDocumento'
import EnlaceReunion from './EnlaceReunion'
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
  const { usuario } = useAuth()
  const { documentos, proyectos, desarrolladores, asignaciones } = useDatos()
  const [modal, setModal] = useState<'documento' | 'minuta' | null>(null)
  const [viendo, setViendo] = useState<string | null>(null)
  const puedeAgendar = proyectosParaAgendar(usuario, proyectos, desarrolladores, asignaciones).some((p) => p.id === proyectoId)
  const lista = documentos
    .filter((d) => d.proyectoId === proyectoId && puedeVerReunion(usuario, d, desarrolladores, asignaciones))
    .sort((a, b) => b.fecha.localeCompare(a.fecha))

  return (
    <>
      {(puedeEditar || puedeAgendar) && (
        <div className="mb-3 flex gap-2">
          {puedeEditar && (
            <button
              onClick={() => setModal('documento')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-sky-700"
            >
              <FilePlus2 className="h-4 w-4" />Documento
            </button>
          )}
          {puedeAgendar && (
            <button
              onClick={() => setModal('minuta')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700"
            >
              <CalendarPlus className="h-4 w-4" />Agendar una reunión
            </button>
          )}
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
                  {ETIQUETAS_CATEGORIA[d.categoria]} · {d.version} · {formatoFecha(d.fecha)}{d.minuta?.hora ? ` ${d.minuta.hora}` : ''} · {d.autor}
                </p>
                {d.minuta && <div className="mt-1.5"><InsigniaReunion documento={d} /></div>}
              </div>
              <div className="flex items-center gap-2">
                {d.categoria !== 'minuta' && (d.archivo || puedeEditar) && (
                  <button
                    onClick={() => setViendo(d.id)}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${d.archivo ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100' : 'border border-dashed border-slate-300 text-slate-600 hover:border-indigo-300 hover:text-indigo-700'}`}
                  >
                    {d.archivo ? <Eye className="h-3.5 w-3.5" /> : <Paperclip className="h-3.5 w-3.5" />}
                    {d.archivo ? (d.archivo.tipo === 'application/pdf' ? 'Ver PDF' : 'Ver archivo') : 'Adjuntar PDF'}
                  </button>
                )}
                <EtiquetaEstado estado={d.estado} />
              </div>
            </div>
            {d.notas && <p className="mt-2 text-slate-600">{d.notas}</p>}
            {d.archivo && (
              <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-slate-500">
                <FileText className="h-3.5 w-3.5 text-slate-400" />
                {d.archivo.nombre}
              </p>
            )}
            {d.minuta && <EnlaceReunion documento={d} puedeEditar={puedeEditarReunion(usuario, d)} />}
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
      {viendo && <ModalVerDocumento documentoId={viendo} puedeEditar={puedeEditar} onCerrar={() => setViendo(null)} />}
    </>
  )
}
