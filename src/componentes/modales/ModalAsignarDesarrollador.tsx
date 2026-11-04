import { useState } from 'react'
import type { FormEvent } from 'react'
import { useDatos } from '../../contextos/DatosContext'
import { botonPrimario, botonSecundario, entrada, etiquetaCampo } from '../../utils/estilos'
import Modal from '../Modal'

interface Props {
  proyectoId: string
  onCerrar: () => void
}

export default function ModalAsignarDesarrollador({ proyectoId, onCerrar }: Props) {
  const { desarrolladores, asignaciones, asignarDesarrollador } = useDatos()
  const disponibles = desarrolladores.filter(
    (d) => !asignaciones.some((a) => a.proyectoId === proyectoId && a.desarrolladorId === d.id)
  )
  const [desarrolladorId, setDesarrolladorId] = useState(disponibles[0]?.id ?? '')
  const [horas, setHoras] = useState(20)

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    if (!desarrolladorId) return
    asignarDesarrollador(proyectoId, desarrolladorId, horas)
    onCerrar()
  }

  return (
    <Modal titulo="Asignar desarrollador" onCerrar={onCerrar}>
      {disponibles.length === 0 ? (
        <p className="text-sm text-slate-600">Todos los desarrolladores ya están asignados a este proyecto.</p>
      ) : (
        <form onSubmit={enviar} className="space-y-3">
          <div>
            <label className={etiquetaCampo}>Desarrollador</label>
            <select className={entrada} value={desarrolladorId} onChange={(e) => setDesarrolladorId(e.target.value)}>
              {disponibles.map((d) => (
                <option key={d.id} value={d.id}>{d.nombre} · {d.especialidad}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={etiquetaCampo}>Horas por semana</label>
            <input className={entrada} type="number" min={1} max={60} value={horas} onChange={(e) => setHoras(Number(e.target.value))} required />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onCerrar} className={botonSecundario}>Cancelar</button>
            <button className={botonPrimario}>Asignar</button>
          </div>
        </form>
      )}
    </Modal>
  )
}
