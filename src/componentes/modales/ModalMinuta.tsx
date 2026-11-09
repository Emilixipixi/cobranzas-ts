import { useMemo, useState } from 'react'
import { Building2, Check, Lock, Video, X } from 'lucide-react'
import type { FormEvent } from 'react'
import { HOY } from '../../datos/datosEjemplo'
import { useAuth } from '../../contextos/AuthContext'
import { useDatos } from '../../contextos/DatosContext'
import { equipoDeProyecto } from '../../utils/equipo'
import { botonPrimario, botonSecundario, entrada, etiquetaCampo } from '../../utils/estilos'
import { alcancesPermitidos, AREAS_REUNION, areaDeRol, proyectosParaAgendar } from '../../utils/reuniones'
import type { AlcanceReunion, AreaReunion, PendienteMinuta } from '../../tipos'
import Modal from '../Modal'

interface Props {
  proyectoId?: string
  onCerrar: () => void
}

export const enlaceValido = (texto: string): boolean => {
  try {
    const url = new URL(texto)
    return url.protocol === 'https:' || url.protocol === 'http:'
  } catch {
    return false
  }
}

const lineas = (texto: string): string[] => texto.split('\n').map((l) => l.trim()).filter(Boolean)

export default function ModalMinuta({ proyectoId, onCerrar }: Props) {
  const { usuario, usuarios } = useAuth()
  const { agregarMinuta, proyectos, desarrolladores, asignaciones } = useDatos()
  const permitidos = proyectosParaAgendar(usuario, proyectos, desarrolladores, asignaciones)
  const alcances = alcancesPermitidos(usuario)
  const miArea = usuario ? areaDeRol(usuario.rol) : 'direccion'

  const [proyecto, setProyecto] = useState(proyectoId && permitidos.some((p) => p.id === proyectoId) ? proyectoId : permitidos.length === 1 ? permitidos[0].id : '')
  const [alcance, setAlcance] = useState<AlcanceReunion>(alcances[0] ?? 'areas')
  const [areas, setAreas] = useState<AreaReunion[]>([miArea])
  const [enlace, setEnlace] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [titulo, setTitulo] = useState('Reunión: ')
  const [fecha, setFecha] = useState(HOY)
  const [hora, setHora] = useState('')
  const [asistentes, setAsistentes] = useState<string[]>(usuario ? [usuario.nombre] : [])
  const [otroAsistente, setOtroAsistente] = useState('')
  const [acuerdos, setAcuerdos] = useState('')
  const [tarea, setTarea] = useState('')
  const [responsable, setResponsable] = useState('')
  const [fechaTarea, setFechaTarea] = useState(HOY)
  const [pendientes, setPendientes] = useState<PendienteMinuta[]>([])

  // Personas que se pueden invitar con un clic según el alcance elegido.
  const sugeridos = useMemo(() => {
    const equipo = proyecto
      ? equipoDeProyecto(asignaciones, proyecto).map((a) => desarrolladores.find((d) => d.id === a.desarrolladorId)?.nombre).filter((n): n is string => Boolean(n))
      : []
    const admins = usuarios.filter((u) => u.rol === 'administrador').map((u) => u.nombre)
    if (alcance === 'equipo') return [...new Set([...equipo, ...admins])]
    const deAreas = usuarios.filter((u) => u.rol !== 'desarrollador' && areas.includes(areaDeRol(u.rol))).map((u) => u.nombre)
    return [...new Set([...(areas.includes('desarrollo') ? equipo : []), ...deAreas])]
  }, [proyecto, alcance, areas, asignaciones, desarrolladores, usuarios])

  if (!usuario) return null

  const alternarArea = (area: AreaReunion) => {
    if (area === miArea) return
    setAreas((previas) => (previas.includes(area) ? previas.filter((a) => a !== area) : [...previas, area]))
  }

  const alternarAsistente = (nombre: string) =>
    setAsistentes((previos) => (previos.includes(nombre) ? previos.filter((n) => n !== nombre) : [...previos, nombre]))

  const agregarOtro = () => {
    const nombres = otroAsistente.split(',').map((n) => n.trim()).filter(Boolean)
    if (nombres.length) setAsistentes((previos) => [...new Set([...previos, ...nombres])])
    setOtroAsistente('')
  }

  const agregarPendiente = () => {
    if (!tarea.trim() || !responsable.trim()) return
    setPendientes((previos) => [...previos, { tarea: tarea.trim(), responsable: responsable.trim(), fecha: fechaTarea }])
    setTarea('')
    setResponsable('')
  }

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    if (!proyecto) return setError('Selecciona el proyecto de la reunión')
    const link = enlace.trim()
    if (link && !enlaceValido(link)) return setError('El enlace debe empezar con https:// (por ejemplo, https://meet.google.com/...)')
    const resultado = agregarMinuta(proyecto, titulo.trim(), {
      fecha,
      ...(hora ? { hora } : {}),
      ...(link ? { enlace: link } : {}),
      alcance,
      ...(alcance === 'areas' ? { areas } : {}),
      asistentes,
      acuerdos: lineas(acuerdos),
      pendientes,
    })
    if (resultado) return setError(resultado)
    onCerrar()
  }

  if (permitidos.length === 0 || alcances.length === 0) {
    return (
      <Modal titulo="Agendar una reunión" onCerrar={onCerrar}>
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {usuario.rol === 'desarrollador' ? 'Solo el jefe de proyecto puede agendar reuniones del equipo.' : 'Tu rol no puede agendar reuniones.'}
        </p>
      </Modal>
    )
  }

  return (
    <Modal titulo="Agendar una reunión" onCerrar={onCerrar} ancho="max-w-2xl">
      <form onSubmit={enviar} className="space-y-4">
        {error && <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}

        {(!proyectoId || !permitidos.some((p) => p.id === proyectoId)) && (
          <div>
            <label className={etiquetaCampo}>Proyecto</label>
            <select className={entrada} value={proyecto} onChange={(e) => setProyecto(e.target.value)} required>
              <option value="">Selecciona un proyecto</option>
              {permitidos.map((p) => <option key={p.id} value={p.id}>{p.codigo} · {p.nombre}</option>)}
            </select>
            {usuario.rol === 'desarrollador' && <p className="mt-1 text-[11px] text-slate-400">Aparecen los proyectos donde eres jefe de proyecto.</p>}
          </div>
        )}

        <div>
          <label className={etiquetaCampo}>¿Con quién es la reunión?</label>
          <div className={`grid gap-2 ${alcances.length > 1 ? 'sm:grid-cols-2' : ''}`}>
            {alcances.includes('equipo') && (
              <button
                type="button"
                onClick={() => setAlcance('equipo')}
                className={`flex items-start gap-3 rounded-xl border p-3 text-left transition-all ${alcance === 'equipo' ? 'border-violet-400 bg-violet-50 ring-2 ring-violet-100' : 'border-slate-200 hover:border-slate-300'}`}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-700"><Lock className="h-4 w-4" /></span>
                <span>
                  <span className="block text-sm font-semibold text-slate-900">Equipo de desarrollo</span>
                  <span className="block text-xs text-slate-500">Privada: solo la ven los desarrolladores del proyecto y el administrador.</span>
                </span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setAlcance('areas')}
              className={`flex items-start gap-3 rounded-xl border p-3 text-left transition-all ${alcance === 'areas' ? 'border-sky-400 bg-sky-50 ring-2 ring-sky-100' : 'border-slate-200 hover:border-slate-300'}`}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-700"><Building2 className="h-4 w-4" /></span>
              <span>
                <span className="block text-sm font-semibold text-slate-900">Con otras áreas</span>
                <span className="block text-xs text-slate-500">Elige los departamentos invitados; solo ellos la verán.</span>
              </span>
            </button>
          </div>
        </div>

        {alcance === 'areas' && (
          <div>
            <label className={etiquetaCampo}>Departamentos invitados</label>
            <div className="flex flex-wrap gap-2">
              {AREAS_REUNION.map((a) => {
                const activa = areas.includes(a.id)
                const fija = a.id === miArea
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => alternarArea(a.id)}
                    disabled={fija}
                    title={fija ? 'Tu área siempre participa' : undefined}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${activa ? 'text-white shadow-sm' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'} ${fija ? 'cursor-default' : ''}`}
                    style={activa ? { backgroundColor: a.color, borderColor: a.color } : undefined}
                  >
                    {activa ? <Check className="h-3.5 w-3.5" /> : <span className="h-2 w-2 rounded-full" style={{ backgroundColor: a.color }} />}
                    {a.etiqueta}
                    {fija && <span className="font-normal opacity-80">(tu área)</span>}
                  </button>
                )
              })}
            </div>
            {areas.includes('desarrollo') && <p className="mt-1 text-[11px] text-slate-400">En Desarrollo solo la ven los desarrolladores asignados a este proyecto.</p>}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-[minmax(0,1fr)_10rem_7rem]">
          <div className="col-span-2 sm:col-span-1">
            <label className={etiquetaCampo}>Título</label>
            <input className={entrada} value={titulo} onChange={(e) => setTitulo(e.target.value)} required />
          </div>
          <div>
            <label className={etiquetaCampo}>Fecha</label>
            <input className={entrada} type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
          </div>
          <div>
            <label className={etiquetaCampo}>Hora</label>
            <input className={entrada} type="time" value={hora} onChange={(e) => setHora(e.target.value)} />
          </div>
        </div>

        <div>
          <label className={etiquetaCampo}>Enlace de la reunión</label>
          <div className="relative">
            <Video className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input className={`${entrada} pl-9`} type="url" placeholder="https://meet.google.com/abc-defg-hij" value={enlace} onChange={(e) => setEnlace(e.target.value)} />
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Google Meet, Zoom, Teams u otra plataforma (opcional)</p>
        </div>

        <div>
          <label className={etiquetaCampo}>Asistentes</label>
          {sugeridos.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {sugeridos.map((n) => {
                const activo = asistentes.includes(n)
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => alternarAsistente(n)}
                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${activo ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
                  >
                    {activo ? <Check className="h-3 w-3" /> : '+'} {n}
                  </button>
                )
              })}
            </div>
          )}
          {asistentes.filter((n) => !sugeridos.includes(n)).length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {asistentes.filter((n) => !sugeridos.includes(n)).map((n) => (
                <span key={n} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700">
                  {n}
                  <button type="button" onClick={() => alternarAsistente(n)} aria-label={`Quitar ${n}`} className="text-slate-400 hover:text-rose-600"><X className="h-3 w-3" /></button>
                </span>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input
              className={entrada}
              placeholder={alcance === 'equipo' ? 'Otro desarrollador (opcional)' : 'Otra persona, por ejemplo del cliente'}
              value={otroAsistente}
              onChange={(e) => setOtroAsistente(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  agregarOtro()
                }
              }}
            />
            <button type="button" onClick={agregarOtro} className={botonSecundario}>Agregar</button>
          </div>
        </div>

        <div>
          <label className={etiquetaCampo}>Acuerdos u orden del día (uno por línea)</label>
          <textarea className={entrada} rows={3} value={acuerdos} onChange={(e) => setAcuerdos(e.target.value)} />
        </div>

        <div className="rounded-xl border border-slate-200 p-3">
          <label className={etiquetaCampo}>Compromisos pendientes</label>
          {pendientes.map((p, i) => (
            <p key={i} className="flex items-center justify-between gap-2 text-sm text-slate-700">
              <span>• {p.tarea} — {p.responsable} ({p.fecha})</span>
              <button type="button" onClick={() => setPendientes((previos) => previos.filter((_, j) => j !== i))} aria-label="Quitar compromiso" className="text-slate-400 hover:text-rose-600"><X className="h-3.5 w-3.5" /></button>
            </p>
          ))}
          <div className="mt-2 grid grid-cols-6 gap-2">
            <input className={`${entrada} col-span-6 sm:col-span-3`} placeholder="Tarea" value={tarea} onChange={(e) => setTarea(e.target.value)} />
            <input className={`${entrada} col-span-4 sm:col-span-2`} placeholder="Responsable" list="responsables-reunion" value={responsable} onChange={(e) => setResponsable(e.target.value)} />
            <input className={`${entrada} col-span-2 sm:col-span-1`} type="date" value={fechaTarea} onChange={(e) => setFechaTarea(e.target.value)} />
            <datalist id="responsables-reunion">
              {asistentes.map((n) => <option key={n} value={n} />)}
            </datalist>
          </div>
          <button type="button" onClick={agregarPendiente} className={`${botonSecundario} mt-2`}>+ Agregar compromiso</button>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
          <button type="button" onClick={onCerrar} className={botonSecundario}>Cancelar</button>
          <button className={botonPrimario}>Agendar reunión</button>
        </div>
      </form>
    </Modal>
  )
}
