import { useState } from 'react'
import type { FormEvent } from 'react'
import { useDatos } from '../../contextos/DatosContext'
import { PAIS_PREDETERMINADO } from '../../datos/paises'
import { botonPrimario, botonSecundario, entrada, etiquetaCampo } from '../../utils/estilos'
import CampoTelefono, { telefonoCompleto } from '../CampoTelefono'
import Modal from '../Modal'

export default function ModalCliente({ onCerrar }: { onCerrar: () => void }) {
  const { crearCliente } = useDatos()
  const [nombre, setNombre] = useState('')
  const [contacto, setContacto] = useState('')
  const [correo, setCorreo] = useState('')
  const [pais, setPais] = useState(PAIS_PREDETERMINADO)
  const [telefono, setTelefono] = useState('')
  const [error, setError] = useState<string | null>(null)

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    const digitos = telefono.replace(/\D/g, '')
    if (digitos && (digitos.length < 6 || digitos.length > 14)) return setError('El teléfono debe tener entre 6 y 14 dígitos')
    const resultado = crearCliente({ nombre, contacto, correo, telefono: digitos ? telefonoCompleto(pais, telefono) : '' })
    if (resultado) return setError(resultado)
    onCerrar()
  }

  return (
    <Modal titulo="Nuevo cliente" onCerrar={onCerrar}>
      <form onSubmit={enviar} className="space-y-3">
        <div>
          <label className={etiquetaCampo}>Razón social</label>
          <input className={entrada} value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej.: Clínica Vista Hermosa" required autoFocus />
        </div>
        <div>
          <label className={etiquetaCampo}>Persona de contacto</label>
          <input className={entrada} value={contacto} onChange={(e) => setContacto(e.target.value)} required />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={etiquetaCampo}>Correo</label>
            <input className={entrada} type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} />
          </div>
          <div>
            <label className={etiquetaCampo}>Teléfono</label>
            <CampoTelefono iso={pais} numero={telefono} onCambio={(iso, numero) => { setPais(iso); setTelefono(numero) }} />
          </div>
        </div>
        <p className="text-[11px] text-slate-400">Queda en «Alta comercial» hasta que le crees un proyecto con su cotización.</p>
        {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onCerrar} className={botonSecundario}>Cancelar</button>
          <button className={botonPrimario}>Registrar cliente</button>
        </div>
      </form>
    </Modal>
  )
}
