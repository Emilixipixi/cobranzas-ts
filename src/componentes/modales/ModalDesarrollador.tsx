import { useState } from 'react'
import type { FormEvent } from 'react'
import { useDatos } from '../../contextos/DatosContext'
import { botonPrimario, botonSecundario, entrada, etiquetaCampo } from '../../utils/estilos'
import Modal from '../Modal'

interface Props {
  onCerrar: () => void
}

const ESPECIALIDADES = ['Fullstack', 'Backend', 'Frontend / UI', 'Móvil', 'QA', 'DevOps']

export default function ModalDesarrollador({ onCerrar }: Props) {
  const { crearDesarrollador } = useDatos()
  const [nombre, setNombre] = useState('')
  const [especialidad, setEspecialidad] = useState(ESPECIALIDADES[0])
  const [correo, setCorreo] = useState('')
  const [tecnologias, setTecnologias] = useState('')

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    crearDesarrollador({
      nombre: nombre.trim(),
      especialidad,
      correo: correo.trim(),
      tecnologias: tecnologias.split(',').map((t) => t.trim()).filter(Boolean),
    })
    onCerrar()
  }

  return (
    <Modal titulo="Nuevo desarrollador" onCerrar={onCerrar}>
      <form onSubmit={enviar} className="space-y-3">
        <div>
          <label className={etiquetaCampo}>Nombre completo</label>
          <input className={entrada} value={nombre} onChange={(e) => setNombre(e.target.value)} required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={etiquetaCampo}>Especialidad</label>
            <select className={entrada} value={especialidad} onChange={(e) => setEspecialidad(e.target.value)}>
              {ESPECIALIDADES.map((e) => <option key={e}>{e}</option>)}
            </select>
          </div>
          <div>
            <label className={etiquetaCampo}>Correo</label>
            <input className={entrada} type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} required />
          </div>
        </div>
        <div>
          <label className={etiquetaCampo}>Tecnologías (separadas por coma)</label>
          <input className={entrada} value={tecnologias} onChange={(e) => setTecnologias(e.target.value)} placeholder="React, Node.js, PostgreSQL" />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onCerrar} className={botonSecundario}>Cancelar</button>
          <button className={botonPrimario}>Crear desarrollador</button>
        </div>
      </form>
    </Modal>
  )
}
