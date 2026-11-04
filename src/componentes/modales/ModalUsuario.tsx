import { useState } from 'react'
import type { FormEvent } from 'react'
import { CheckCircle2, Copy, RefreshCw } from 'lucide-react'
import { useAuth } from '../../contextos/AuthContext'
import { useAuditoria } from '../../contextos/AuditoriaContext'
import { useDatos } from '../../contextos/DatosContext'
import { DOMINIO_CORPORATIVO } from '../../datos/datosEjemplo'
import { botonPrimario, botonSecundario, entrada, etiquetaCampo } from '../../utils/estilos'
import type { Rol, Usuario } from '../../tipos'
import Modal from '../Modal'

interface Props {
  onCerrar: () => void
}

export const ETIQUETAS_ROL: Record<Rol, string> = {
  administrador: 'Administrador',
  comercial: 'Comercial',
  finanzas: 'Finanzas',
  desarrollador: 'Desarrollador',
}

const ROLES: Rol[] = ['administrador', 'comercial', 'finanzas', 'desarrollador']
const ESPECIALIDADES = ['Fullstack', 'Backend', 'Frontend / UI', 'Móvil', 'QA', 'DevOps']
const CARACTERES = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'

const generarClave = (): string =>
  Array.from({ length: 10 }, () => CARACTERES[Math.floor(Math.random() * CARACTERES.length)]).join('')

export default function ModalUsuario({ onCerrar }: Props) {
  const { crearUsuario } = useAuth()
  const { registrar } = useAuditoria()
  const { crearDesarrollador } = useDatos()
  const [nombre, setNombre] = useState('')
  const [rol, setRol] = useState<Rol>('comercial')
  const [usuarioCorreo, setUsuarioCorreo] = useState('')
  const [clave, setClave] = useState(generarClave)
  const [especialidad, setEspecialidad] = useState(ESPECIALIDADES[0])
  const [error, setError] = useState<string | null>(null)
  const [creado, setCreado] = useState<Usuario | null>(null)
  const [copiado, setCopiado] = useState(false)

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    const resultado = crearUsuario({ nombre, rol, usuarioCorreo, clave })
    if (resultado.error || !resultado.usuario) return setError(resultado.error)
    registrar('Creó usuario', `${resultado.usuario.nombre} (${ETIQUETAS_ROL[resultado.usuario.rol]}): ${resultado.usuario.correo}`)
    if (resultado.usuario.rol === 'desarrollador') {
      crearDesarrollador(
        { nombre: resultado.usuario.nombre, especialidad, correo: resultado.usuario.correo, tecnologias: [] },
        resultado.usuario.id
      )
    }
    setError(null)
    setCreado(resultado.usuario)
  }

  const copiar = async () => {
    if (!creado) return
    try {
      await navigator.clipboard.writeText(`Correo: ${creado.correo}\nContraseña temporal: ${creado.clave}`)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      setCopiado(false)
    }
  }

  if (creado) {
    return (
      <Modal titulo="Usuario creado" onCerrar={onCerrar}>
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            <p>
              Se creó la cuenta de <strong>{creado.nombre}</strong> ({ETIQUETAS_ROL[creado.rol]}). Entrega estas credenciales a la persona: la contraseña es temporal.
            </p>
          </div>
          <dl className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
            <div className="flex justify-between gap-3"><dt className="text-slate-500">Correo corporativo</dt><dd className="font-mono font-semibold">{creado.correo}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-slate-500">Contraseña temporal</dt><dd className="font-mono font-semibold">{creado.clave}</dd></div>
          </dl>
          <div className="flex justify-end gap-2">
            <button onClick={copiar} className={`${botonSecundario} inline-flex items-center gap-1.5`}>
              <Copy className="h-4 w-4" />
              {copiado ? 'Copiado' : 'Copiar credenciales'}
            </button>
            <button onClick={onCerrar} className={botonPrimario}>Listo</button>
          </div>
        </div>
      </Modal>
    )
  }

  return (
    <Modal titulo="Nuevo usuario" onCerrar={onCerrar}>
      <form onSubmit={enviar} className="space-y-3">
        <div>
          <label className={etiquetaCampo}>Nombre completo</label>
          <input className={entrada} value={nombre} onChange={(e) => setNombre(e.target.value)} required />
        </div>
        <div>
          <label className={etiquetaCampo}>Área (rol en el sistema)</label>
          <select className={entrada} value={rol} onChange={(e) => setRol(e.target.value as Rol)}>
            {ROLES.map((r) => <option key={r} value={r}>{ETIQUETAS_ROL[r]}</option>)}
          </select>
        </div>
        <div>
          <label className={etiquetaCampo}>Correo corporativo</label>
          <div className="flex items-stretch overflow-hidden rounded-lg border border-slate-300 bg-white focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100">
            <input
              className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm outline-none"
              value={usuarioCorreo}
              onChange={(e) => setUsuarioCorreo(e.target.value)}
              placeholder="nombre.apellido"
              required
            />
            <span className="flex items-center border-l border-slate-200 bg-slate-50 px-3 text-sm text-slate-500">@{DOMINIO_CORPORATIVO}</span>
          </div>
        </div>
        {rol === 'desarrollador' && (
          <div>
            <label className={etiquetaCampo}>Especialidad</label>
            <select className={entrada} value={especialidad} onChange={(e) => setEspecialidad(e.target.value)}>
              {ESPECIALIDADES.map((e) => <option key={e}>{e}</option>)}
            </select>
          </div>
        )}
        <div>
          <label className={etiquetaCampo}>Contraseña temporal</label>
          <div className="flex gap-2">
            <input className={`${entrada} font-mono`} value={clave} onChange={(e) => setClave(e.target.value)} required />
            <button type="button" onClick={() => setClave(generarClave())} className={`${botonSecundario} inline-flex shrink-0 items-center gap-1.5`}>
              <RefreshCw className="h-4 w-4" />
              Generar
            </button>
          </div>
        </div>
        {error && <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onCerrar} className={botonSecundario}>Cancelar</button>
          <button className={botonPrimario}>Crear usuario</button>
        </div>
      </form>
    </Modal>
  )
}