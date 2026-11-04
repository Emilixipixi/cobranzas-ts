import { useState } from 'react'
import type { FormEvent } from 'react'
import { HOY } from '../../datos/datosEjemplo'
import { useDatos } from '../../contextos/DatosContext'
import { botonPrimario, botonSecundario, entrada, etiquetaCampo } from '../../utils/estilos'
import type { PendienteMinuta } from '../../tipos'
import Modal from '../Modal'

interface Props {
  proyectoId: string
  onCerrar: () => void
}

const lineas = (texto: string): string[] => texto.split('\n').map((l) => l.trim()).filter(Boolean)

export default function ModalMinuta({ proyectoId, onCerrar }: Props) {
  const { agregarMinuta } = useDatos()
  const [titulo, setTitulo] = useState('Minuta: ')
  const [fecha, setFecha] = useState(HOY)
  const [asistentes, setAsistentes] = useState('')
  const [acuerdos, setAcuerdos] = useState('')
  const [tarea, setTarea] = useState('')
  const [responsable, setResponsable] = useState('')
  const [fechaTarea, setFechaTarea] = useState(HOY)
  const [pendientes, setPendientes] = useState<PendienteMinuta[]>([])

  const agregarPendiente = () => {
    if (!tarea.trim() || !responsable.trim()) return
    setPendientes((previos) => [...previos, { tarea: tarea.trim(), responsable: responsable.trim(), fecha: fechaTarea }])
    setTarea('')
    setResponsable('')
  }

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    agregarMinuta(proyectoId, titulo.trim(), {
      fecha,
      asistentes: asistentes.split(',').map((a) => a.trim()).filter(Boolean),
      acuerdos: lineas(acuerdos),
      pendientes,
    })
    onCerrar()
  }

  return (
    <Modal titulo="Registrar minuta de reunión" onCerrar={onCerrar} ancho="max-w-xl">
      <form onSubmit={enviar} className="space-y-3">
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className={etiquetaCampo}>Título</label>
            <input className={entrada} value={titulo} onChange={(e) => setTitulo(e.target.value)} required />
          </div>
          <div>
            <label className={etiquetaCampo}>Fecha</label>
            <input className={entrada} type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
          </div>
        </div>
        <div>
          <label className={etiquetaCampo}>Asistentes (separados por coma)</label>
          <input className={entrada} value={asistentes} onChange={(e) => setAsistentes(e.target.value)} />
        </div>
        <div>
          <label className={etiquetaCampo}>Acuerdos (uno por línea)</label>
          <textarea className={entrada} rows={3} value={acuerdos} onChange={(e) => setAcuerdos(e.target.value)} />
        </div>
        <div className="rounded-md border border-slate-200 p-3">
          <label className={etiquetaCampo}>Compromisos pendientes</label>
          {pendientes.map((p, i) => (
            <p key={i} className="text-sm text-slate-700">• {p.tarea} — {p.responsable} ({p.fecha})</p>
          ))}
          <div className="mt-2 grid grid-cols-6 gap-2">
            <input className={`${entrada} col-span-3`} placeholder="Tarea" value={tarea} onChange={(e) => setTarea(e.target.value)} />
            <input className={`${entrada} col-span-2`} placeholder="Responsable" value={responsable} onChange={(e) => setResponsable(e.target.value)} />
            <input className={entrada} type="date" value={fechaTarea} onChange={(e) => setFechaTarea(e.target.value)} />
          </div>
          <button type="button" onClick={agregarPendiente} className={`${botonSecundario} mt-2`}>+ Agregar compromiso</button>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onCerrar} className={botonSecundario}>Cancelar</button>
          <button className={botonPrimario}>Guardar minuta</button>
        </div>
      </form>
    </Modal>
  )
}
