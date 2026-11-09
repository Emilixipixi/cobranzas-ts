import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { HOY } from '../../datos/datosEjemplo'
import { useDatos } from '../../contextos/DatosContext'
import { botonPrimario, botonSecundario, entrada, etiquetaCampo } from '../../utils/estilos'
import { horasSemanalesDe } from '../../utils/equipo'
import { aNumero, soloDecimales, soloEnteros } from '../../utils/numeros'
import CampoTelefono, { telefonoCompleto } from '../CampoTelefono'
import { PAIS_PREDETERMINADO } from '../../datos/paises'
import Modal from '../Modal'

interface Props {
  onCerrar: () => void
}

const NUEVO = 'nuevo'
const MAXIMO_HORAS_DIA = 12
const MAXIMO_MESES = 60
const HORAS_DIA_INICIAL = '4'

const horasValidas = (texto: string): boolean => aNumero(texto) > 0 && aNumero(texto) <= MAXIMO_HORAS_DIA

export default function ModalNuevoProyecto({ onCerrar }: Props) {
  const { clientes, desarrolladores, crearProyecto } = useDatos()
  const navegar = useNavigate()
  const [clienteId, setClienteId] = useState(clientes[0]?.id ?? NUEVO)
  const [nuevoCliente, setNuevoCliente] = useState({ nombre: '', contacto: '', correo: '', telefono: '' })
  const [paisTelefono, setPaisTelefono] = useState(PAIS_PREDETERMINADO)
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [meses, setMeses] = useState('3')
  const [fechaInicio, setFechaInicio] = useState(HOY)
  const [monto, setMonto] = useState('')
  const [jefeId, setJefeId] = useState(desarrolladores[0]?.id ?? '')
  const [horasJefe, setHorasJefe] = useState(HORAS_DIA_INICIAL)
  const [colaboradores, setColaboradores] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)

  const candidatos = desarrolladores.filter((d) => d.id !== jefeId)
  const seleccionados = Object.keys(colaboradores)
  const horasSemanalesJefe = horasSemanalesDe(aNumero(horasJefe))
  const horasSemanalesEquipo = horasSemanalesDe(
    aNumero(horasJefe) + seleccionados.reduce((suma, id) => suma + aNumero(colaboradores[id]), 0)
  )

  const cambiarCliente = (campo: keyof typeof nuevoCliente, valor: string) =>
    setNuevoCliente((previo) => ({ ...previo, [campo]: valor }))

  const cambiarJefe = (id: string) => {
    setJefeId(id)
    setColaboradores((previos) => {
      const { [id]: _quitado, ...resto } = previos
      return resto
    })
  }

  const alternarColaborador = (id: string) =>
    setColaboradores((previos) => {
      if (id in previos) {
        const { [id]: _quitado, ...resto } = previos
        return resto
      }
      return { ...previos, [id]: HORAS_DIA_INICIAL }
    })

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    const mesesNumero = aNumero(meses)
    if (mesesNumero < 1 || mesesNumero > MAXIMO_MESES) return setError(`La duración debe ser un número de meses entre 1 y ${MAXIMO_MESES}`)
    if (!(aNumero(monto) > 0)) return setError('Ingresa el monto del contrato (mayor a cero)')
    if (clienteId === NUEVO) {
      const digitos = nuevoCliente.telefono.replace(/\D/g, '').length
      if (digitos < 6 || digitos > 14) return setError('Revisa el teléfono del cliente: debe tener entre 6 y 14 dígitos, sin el prefijo del país')
    }
    if (!jefeId) return setError('Selecciona al jefe de proyecto')
    if (!horasValidas(horasJefe)) return setError(`Las horas diarias del jefe de proyecto deben ser mayores a 0 y de máximo ${MAXIMO_HORAS_DIA}`)
    const sinHoras = seleccionados.find((id) => !horasValidas(colaboradores[id]))
    if (sinHoras) {
      const persona = desarrolladores.find((d) => d.id === sinHoras)?.nombre ?? 'un colaborador'
      return setError(`Revisa las horas diarias de ${persona}: deben ser mayores a 0 y de máximo ${MAXIMO_HORAS_DIA}`)
    }
    const id = crearProyecto({
      clienteId: clienteId === NUEVO ? null : clienteId,
      nuevoCliente: { ...nuevoCliente, telefono: telefonoCompleto(paisTelefono, nuevoCliente.telefono) },
      nombre: nombre.trim(),
      descripcion,
      mesesOfrecidos: mesesNumero,
      fechaInicio,
      monto: aNumero(monto),
      jefe: { desarrolladorId: jefeId, horasDiarias: aNumero(horasJefe) },
      colaboradores: seleccionados.map((dev) => ({ desarrolladorId: dev, horasDiarias: aNumero(colaboradores[dev]) })),
    })
    onCerrar()
    navegar(`/proyectos/${id}`)
  }

  return (
    <Modal titulo="Nuevo proyecto" onCerrar={onCerrar} ancho="max-w-2xl">
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
            <CampoTelefono
              iso={paisTelefono}
              numero={nuevoCliente.telefono}
              onCambio={(iso, numero) => {
                setPaisTelefono(iso)
                cambiarCliente('telefono', numero)
              }}
              required
            />
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
            <input
              className={entrada}
              inputMode="numeric"
              placeholder="Ej. 3"
              value={meses}
              onChange={(e) => setMeses(soloEnteros(e.target.value, 2))}
              required
            />
          </div>
          <div>
            <label className={etiquetaCampo}>Fecha de inicio</label>
            <input className={entrada} type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} required />
          </div>
          <div>
            <label className={etiquetaCampo}>Monto del contrato</label>
            <div className="flex items-stretch overflow-hidden rounded-lg border border-slate-300 bg-white focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100">
              <span className="flex items-center border-r border-slate-200 bg-slate-50 px-3 text-sm text-slate-500">$</span>
              <input
                className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm outline-none"
                inputMode="decimal"
                placeholder="0.00"
                value={monto}
                onChange={(e) => setMonto(soloDecimales(e.target.value))}
                required
              />
            </div>
          </div>
          <div>
            <label className={etiquetaCampo}>Moneda</label>
            <input className={`${entrada} bg-slate-100 text-slate-600`} value="USD (dólares estadounidenses)" readOnly tabIndex={-1} aria-label="Moneda" />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 p-3">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Equipo del proyecto</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className={etiquetaCampo}>Jefe de proyecto</label>
              <select className={entrada} value={jefeId} onChange={(e) => cambiarJefe(e.target.value)} required>
                {desarrolladores.length === 0 && <option value="">No hay desarrolladores</option>}
                {desarrolladores.map((d) => <option key={d.id} value={d.id}>{d.nombre} · {d.especialidad}</option>)}
              </select>
            </div>
            <div>
              <label className={etiquetaCampo}>Horas diarias</label>
              <input
                className={entrada}
                inputMode="decimal"
                placeholder="Ej. 4"
                value={horasJefe}
                onChange={(e) => setHorasJefe(soloDecimales(e.target.value, 1, 2))}
                aria-label="Horas diarias del jefe de proyecto"
              />
            </div>
            <div>
              <label className={etiquetaCampo}>Horas por semana</label>
              <input
                className={`${entrada} bg-slate-100 text-slate-600`}
                value={horasSemanalesJefe}
                readOnly
                tabIndex={-1}
                aria-label="Horas por semana del jefe de proyecto"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className={etiquetaCampo}>Colaboradores</label>
            <p className="mb-2 text-xs text-slate-500">Selecciona a las demás personas que acompañarán el proyecto. El jefe de proyecto no aparece en esta lista.</p>
            <div className="max-h-48 divide-y divide-slate-100 overflow-y-auto rounded-lg border border-slate-200">
              {candidatos.length === 0 && <p className="p-3 text-sm text-slate-400">No hay más desarrolladores disponibles</p>}
              {candidatos.map((d) => {
                const activo = d.id in colaboradores
                return (
                  <div key={d.id} className="flex flex-wrap items-center gap-3 px-3 py-2 text-sm">
                    <input
                      id={`colaborador-${d.id}`}
                      type="checkbox"
                      checked={activo}
                      onChange={() => alternarColaborador(d.id)}
                      className="h-4 w-4 accent-indigo-600"
                    />
                    <label htmlFor={`colaborador-${d.id}`} className="min-w-0 flex-1 cursor-pointer">
                      <span className="font-medium text-slate-900">{d.nombre}</span>
                      <span className="ml-2 text-xs text-slate-500">{d.especialidad}</span>
                    </label>
                    {activo && (
                      <div className="flex items-center gap-2">
                        <input
                          aria-label={`Horas diarias de ${d.nombre}`}
                          inputMode="decimal"
                          className="w-16 rounded-md border border-slate-300 px-2 py-1 text-sm outline-none focus:border-indigo-500"
                          value={colaboradores[d.id]}
                          onChange={(e) => setColaboradores((previos) => ({ ...previos, [d.id]: soloDecimales(e.target.value, 1, 2) }))}
                        />
                        <span className="text-xs text-slate-500">h/día = {horasSemanalesDe(aNumero(colaboradores[d.id]))} h/sem</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Equipo: <strong className="text-slate-700">{1 + seleccionados.length} {seleccionados.length === 0 ? 'persona' : 'personas'}</strong>
            {' · '}
            <strong className="text-slate-700">{horasSemanalesEquipo} h/semana</strong> en total (5 días laborables por semana)
          </p>
        </div>

        {desarrolladores.length === 0 && (
          <p className="text-sm text-rose-600">Todo proyecto necesita un jefe de proyecto. Pide al administrador que cree un desarrollador primero.</p>
        )}
        {error && <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onCerrar} className={botonSecundario}>Cancelar</button>
          <button className={botonPrimario} disabled={desarrolladores.length === 0}>Crear proyecto</button>
        </div>
      </form>
    </Modal>
  )
}