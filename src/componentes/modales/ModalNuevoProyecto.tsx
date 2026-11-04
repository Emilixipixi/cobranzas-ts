import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { HOY } from '../../datos/datosEjemplo'
import { useDatos } from '../../contextos/DatosContext'
import { botonPrimario, botonSecundario, entrada, etiquetaCampo } from '../../utils/estilos'
import Modal from '../Modal'

interface Props {
  onCerrar: () => void
}

const NUEVO = 'nuevo'

export default function ModalNuevoProyecto({ onCerrar }: Props) {
  const { clientes, desarrolladores, crearProyecto } = useDatos()
  const navegar = useNavigate()
  const [clienteId, setClienteId] = useState(clientes[0]?.id ?? NUEVO)
  const [nuevoCliente, setNuevoCliente] = useState({ nombre: '', contacto: '', correo: '', telefono: '' })
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [mesesOfrecidos, setMesesOfrecidos] = useState(3)
  const [fechaInicio, setFechaInicio] = useState(HOY)
  const [monto, setMonto] = useState(0)
  const [moneda, setMoneda] = useState('USD')
  const [desarrolladorId, setDesarrolladorId] = useState(desarrolladores[0]?.id ?? '')
  const [horasSemana, setHorasSemana] = useState(20)

  const cambiarCliente = (campo: keyof typeof nuevoCliente, valor: string) =>
    setNuevoCliente((previo) => ({ ...previo, [campo]: valor }))

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    if (!desarrolladorId) return
    const id = crearProyecto({
      clienteId: clienteId === NUEVO ? null : clienteId,
      nuevoCliente,
      nombre: nombre.trim(),
      descripcion,
      mesesOfrecidos,
      fechaInicio,
      monto,
      moneda,
      desarrolladorId,
      horasSemana,
    })
    onCerrar()
    navegar(`/proyectos/${id}`)
  }

  return (
    <Modal titulo="Nuevo proyecto" onCerrar={onCerrar} ancho="max-w-xl">
      <form onSubmit={enviar} className="space-y-3">
        <div>
          <label className={etiquetaCampo}>Cliente</label>
          <select className={entrada} value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
            {clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            <option value={NUEVO}>+ Cliente nuevo</option>
          </select>
        </div>
        {clienteId === NUEVO && (
          <div className="grid grid-cols-2 gap-3 rounded-md border border-slate-200 p-3">
            <input className={entrada} placeholder="Razón social" value={nuevoCliente.nombre} onChange={(e) => cambiarCliente('nombre', e.target.value)} required />
            <input className={entrada} placeholder="Persona de contacto" value={nuevoCliente.contacto} onChange={(e) => cambiarCliente('contacto', e.target.value)} required />
            <input className={entrada} type="email" placeholder="Correo" value={nuevoCliente.correo} onChange={(e) => cambiarCliente('correo', e.target.value)} required />
            <input className={entrada} placeholder="Teléfono" value={nuevoCliente.telefono} onChange={(e) => cambiarCliente('telefono', e.target.value)} required />
          </div>
        )}
        <div>
          <label className={etiquetaCampo}>Nombre del proyecto</label>
          <input className={entrada} value={nombre} onChange={(e) => setNombre(e.target.value)} required />
        </div>
        <div>
          <label className={etiquetaCampo}>Descripción</label>
          <textarea className={entrada} rows={2} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={etiquetaCampo}>Duración ofrecida (meses)</label>
            <input className={entrada} type="number" min={1} max={24} value={mesesOfrecidos} onChange={(e) => setMesesOfrecidos(Number(e.target.value))} required />
          </div>
          <div>
            <label className={etiquetaCampo}>Fecha de inicio</label>
            <input className={entrada} type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} required />
          </div>
          <div>
            <label className={etiquetaCampo}>Monto del contrato</label>
            <input className={entrada} type="number" min={1} step="0.01" value={monto} onChange={(e) => setMonto(Number(e.target.value))} required />
          </div>
          <div>
            <label className={etiquetaCampo}>Moneda</label>
            <select className={entrada} value={moneda} onChange={(e) => setMoneda(e.target.value)}>
              <option>USD</option>
              <option>EUR</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className={etiquetaCampo}>Desarrollador asignado</label>
            <select className={entrada} value={desarrolladorId} onChange={(e) => setDesarrolladorId(e.target.value)} required>
              {desarrolladores.length === 0 && <option value="">No hay desarrolladores</option>}
              {desarrolladores.map((d) => <option key={d.id} value={d.id}>{d.nombre} · {d.especialidad}</option>)}
            </select>
          </div>
          <div>
            <label className={etiquetaCampo}>Horas/semana</label>
            <input className={entrada} type="number" min={1} max={60} value={horasSemana} onChange={(e) => setHorasSemana(Number(e.target.value))} required />
          </div>
        </div>
        {desarrolladores.length === 0 && (
          <p className="text-sm text-red-600">Todo proyecto necesita un desarrollador. Pide al administrador que cree uno primero.</p>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onCerrar} className={botonSecundario}>Cancelar</button>
          <button className={botonPrimario} disabled={desarrolladores.length === 0}>Crear proyecto</button>
        </div>
      </form>
    </Modal>
  )
}
