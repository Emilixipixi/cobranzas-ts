import { useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from '../../contextos/AuthContext'
import { useDatos } from '../../contextos/DatosContext'
import { botonPrimario, botonSecundario, entrada, etiquetaCampo } from '../../utils/estilos'
import { diasEntre } from '../../utils/finanzas'
import type { Proyecto } from '../../tipos'
import Modal from '../Modal'

interface Props {
  proyecto: Proyecto
  onCerrar: () => void
}

export const ESTADOS_PROYECTO = ['Prototipo', 'En desarrollo', 'En entrega', 'Cerrado']
export const ESTADOS_PROTOTIPO = ['Pendiente', 'Presentado', 'Validado']

export default function ModalEditarProyecto({ proyecto, onCerrar }: Props) {
  const { usuarios } = useAuth()
  const { clientes, actualizarProyecto } = useDatos()
  const [formulario, setFormulario] = useState({ ...proyecto })
  const [error, setError] = useState<string | null>(null)

  const responsables = usuarios.filter((u) => u.rol === 'administrador' || u.rol === 'comercial')

  const cambiar = <C extends keyof Proyecto>(campo: C, valor: Proyecto[C]) =>
    setFormulario((previo) => ({ ...previo, [campo]: valor }))

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    if (formulario.fechaEntrega < formulario.fechaInicio) return setError('La fecha de entrega no puede ser anterior al inicio')
    const mesesOfrecidos = Math.max(1, Math.round(diasEntre(formulario.fechaInicio, formulario.fechaEntrega) / 30))
    const resultado = actualizarProyecto(proyecto.id, {
      nombre: formulario.nombre.trim(),
      descripcion: formulario.descripcion,
      clienteId: formulario.clienteId,
      responsableId: formulario.responsableId,
      estado: formulario.estado,
      prototipo: formulario.prototipo,
      fechaPrototipo: formulario.fechaPrototipo || undefined,
      fechaInicio: formulario.fechaInicio,
      fechaEntrega: formulario.fechaEntrega,
      mesesOfrecidos,
      diasContingencia: formulario.diasContingencia,
      urlPrototipo: formulario.urlPrototipo.trim(),
      repositorio: formulario.repositorio.trim(),
    })
    if (resultado) return setError(resultado)
    onCerrar()
  }

  return (
    <Modal titulo={`Editar proyecto ${proyecto.codigo}`} onCerrar={onCerrar} ancho="max-w-2xl">
      <form onSubmit={enviar} className="space-y-3">
        <div>
          <label className={etiquetaCampo}>Nombre del proyecto</label>
          <input className={entrada} value={formulario.nombre} onChange={(e) => cambiar('nombre', e.target.value)} required />
        </div>
        <div>
          <label className={etiquetaCampo}>Descripción</label>
          <textarea className={entrada} rows={2} value={formulario.descripcion} onChange={(e) => cambiar('descripcion', e.target.value)} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={etiquetaCampo}>Cliente</label>
            <select className={entrada} value={formulario.clienteId} onChange={(e) => cambiar('clienteId', e.target.value)}>
              {clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className={etiquetaCampo}>Responsable</label>
            <select className={entrada} value={formulario.responsableId} onChange={(e) => cambiar('responsableId', e.target.value)}>
              {!responsables.some((u) => u.id === formulario.responsableId) && <option value={formulario.responsableId}>Sin asignar</option>}
              {responsables.map((u) => <option key={u.id} value={u.id}>{u.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className={etiquetaCampo}>Estado del proyecto</label>
            <select className={entrada} value={formulario.estado} onChange={(e) => cambiar('estado', e.target.value)}>
              {ESTADOS_PROYECTO.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className={etiquetaCampo}>Estado del prototipo</label>
            <select className={entrada} value={formulario.prototipo} onChange={(e) => cambiar('prototipo', e.target.value)}>
              {ESTADOS_PROTOTIPO.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className={etiquetaCampo}>Presentación del prototipo</label>
            <input className={entrada} type="date" value={formulario.fechaPrototipo ?? ''} onChange={(e) => cambiar('fechaPrototipo', e.target.value || undefined)} />
          </div>
          <div>
            <label className={etiquetaCampo}>Fecha de inicio</label>
            <input className={entrada} type="date" value={formulario.fechaInicio} onChange={(e) => cambiar('fechaInicio', e.target.value)} required />
          </div>
          <div>
            <label className={etiquetaCampo}>Fecha de entrega</label>
            <input className={entrada} type="date" value={formulario.fechaEntrega} onChange={(e) => cambiar('fechaEntrega', e.target.value)} required />
          </div>
          <div>
            <label className={etiquetaCampo}>Días de contingencia</label>
            <input className={entrada} type="number" min={0} max={90} value={formulario.diasContingencia} onChange={(e) => cambiar('diasContingencia', Number(e.target.value))} required />
          </div>
          <div>
            <label className={etiquetaCampo}>URL del prototipo</label>
            <input className={entrada} value={formulario.urlPrototipo} onChange={(e) => cambiar('urlPrototipo', e.target.value)} placeholder="https://" />
          </div>
        </div>
        <div>
          <label className={etiquetaCampo}>Repositorio</label>
          <input className={entrada} value={formulario.repositorio} onChange={(e) => cambiar('repositorio', e.target.value)} placeholder="https://" />
        </div>
        {error && <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onCerrar} className={botonSecundario}>Cancelar</button>
          <button className={botonPrimario}>Guardar cambios</button>
        </div>
      </form>
    </Modal>
  )
}