import { useState } from 'react'
import type { FormEvent } from 'react'
import { useDatos } from '../../contextos/DatosContext'
import { botonPrimario, botonSecundario, entrada, etiquetaCampo } from '../../utils/estilos'
import { horasSemanalesDe } from '../../utils/equipo'
import { aNumero, soloDecimales } from '../../utils/numeros'
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
  const [horasDiarias, setHorasDiarias] = useState('4')
  const [error, setError] = useState<string | null>(null)

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    const horas = aNumero(horasDiarias)
    if (!desarrolladorId) return
    if (!(horas > 0 && horas <= 12)) return setError('Las horas diarias deben ser mayores a 0 y de máximo 12')
    asignarDesarrollador(proyectoId, desarrolladorId, horas, 'colaborador')
    onCerrar()
  }

  return (
    <Modal titulo="Agregar colaborador" onCerrar={onCerrar}>
      {disponibles.length === 0 ? (
        <p className="text-sm text-slate-600">Todos los desarrolladores ya forman parte de este proyecto.</p>
      ) : (
        <form onSubmit={enviar} className="space-y-3">
          <div>
            <label className={etiquetaCampo}>Colaborador</label>
            <select className={entrada} value={desarrolladorId} onChange={(e) => setDesarrolladorId(e.target.value)}>
              {disponibles.map((d) => (
                <option key={d.id} value={d.id}>{d.nombre} · {d.especialidad}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={etiquetaCampo}>Horas diarias</label>
              <input className={entrada} inputMode="decimal" value={horasDiarias} onChange={(e) => setHorasDiarias(soloDecimales(e.target.value, 1, 2))} placeholder="Ej. 4" />
            </div>
            <div>
              <label className={etiquetaCampo}>Horas por semana</label>
              <input className={`${entrada} bg-slate-100 text-slate-600`} value={horasSemanalesDe(aNumero(horasDiarias))} readOnly tabIndex={-1} aria-label="Horas por semana" />
            </div>
          </div>
          {error && <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onCerrar} className={botonSecundario}>Cancelar</button>
            <button className={botonPrimario}>Agregar</button>
          </div>
        </form>
      )}
    </Modal>
  )
}