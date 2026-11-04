import { useState } from 'react'
import type { FormEvent } from 'react'
import { AlertTriangle } from 'lucide-react'
import { useDatos } from '../../contextos/DatosContext'
import { botonSecundario, entrada, etiquetaCampo } from '../../utils/estilos'
import { formatoMoneda, redondear } from '../../utils/finanzas'
import { datosDeProyecto } from '../../utils/indicadores'
import type { Proyecto } from '../../tipos'
import Modal from '../Modal'

interface Props {
  proyecto: Proyecto
  onCerrar: () => void
  onEliminado?: () => void
}

export default function ModalEliminarProyecto({ proyecto, onCerrar, onEliminado }: Props) {
  const { contratos, cuotas, cobros, documentos, asignaciones, eliminarProyecto } = useDatos()
  const [confirmacion, setConfirmacion] = useState('')
  const [error, setError] = useState<string | null>(null)

  const datos = datosDeProyecto(proyecto.id, contratos, cuotas)
  const cobrosProyecto = cobros.filter((b) => datos.cuotas.some((q) => q.id === b.cuotaId))
  const totalCobrado = redondear(cobrosProyecto.reduce((suma, b) => suma + b.valor, 0))
  const cantidadDocumentos = documentos.filter((d) => d.proyectoId === proyecto.id).length
  const cantidadEquipo = asignaciones.filter((a) => a.proyectoId === proyecto.id).length
  const coincide = confirmacion.trim().toUpperCase() === proyecto.codigo.toUpperCase()

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    if (!coincide) return
    const resultado = eliminarProyecto(proyecto.id)
    if (resultado) return setError(resultado)
    onCerrar()
    onEliminado?.()
  }

  const elementos: [string, string][] = [
    ['Contratos', String(datos.contratos.length)],
    ['Cuotas del plan de pagos', String(datos.cuotas.length)],
    ['Cobros registrados', `${cobrosProyecto.length} (${formatoMoneda(totalCobrado)})`],
    ['Documentos y minutas', String(cantidadDocumentos)],
    ['Asignaciones del equipo', String(cantidadEquipo)],
  ]

  return (
    <Modal titulo="Eliminar proyecto" onCerrar={onCerrar}>
      <form onSubmit={enviar} className="space-y-4">
        <div className="flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <p>
            Vas a eliminar <strong>{proyecto.codigo} · {proyecto.nombre}</strong> y todo lo que depende de él. Esta acción no se puede deshacer.
          </p>
        </div>
        <dl className="divide-y divide-slate-100 rounded-lg border border-slate-200 text-sm">
          {elementos.map(([nombre, valor]) => (
            <div key={nombre} className="flex justify-between px-3 py-2">
              <dt className="text-slate-500">{nombre}</dt>
              <dd className="font-semibold text-slate-900">{valor}</dd>
            </div>
          ))}
        </dl>
        <div>
          <label className={etiquetaCampo}>Escribe {proyecto.codigo} para confirmar</label>
          <input className={entrada} value={confirmacion} onChange={(e) => setConfirmacion(e.target.value)} autoComplete="off" />
        </div>
        {error && <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onCerrar} className={botonSecundario}>Cancelar</button>
          <button
            disabled={!coincide}
            className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Eliminar definitivamente
          </button>
        </div>
      </form>
    </Modal>
  )
}