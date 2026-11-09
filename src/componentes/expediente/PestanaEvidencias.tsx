import { useMemo, useState } from 'react'
import {
  BadgeCheck, CheckCircle2, Clock4, ExternalLink, GitBranch, Layers, MessageSquareWarning, Paperclip, Pencil, Plus, Search, ShieldCheck, Trash2,
} from 'lucide-react'
import { HOY } from '../../datos/datosEjemplo'
import { useAuth } from '../../contextos/AuthContext'
import { useDatos } from '../../contextos/DatosContext'
import { borrarArchivo } from '../../utils/archivos'
import { equipoDeProyecto, esJefe, redondearHoras } from '../../utils/equipo'
import { entradaCompacta } from '../../utils/estilos'
import {
  COLOR_TIPO, ESTADOS_EVIDENCIA, ETIQUETA_TIPO, puedeModificar, puedeRevisar, registrablesPor, TIPOS_EVIDENCIA,
} from '../../utils/evidencias'
import { diasEntre, formatoFecha, sumarDias } from '../../utils/finanzas'
import { etiquetaCortaSemana, inicioSemana } from '../../utils/semanas'
import type { EstadoEvidencia, Evidencia, Proyecto, TipoEvidencia } from '../../tipos'
import DonutGrafico from '../graficos/DonutGrafico'
import ModalEvidencia, { ICONO_TIPO } from '../modales/ModalEvidencia'
import ModalVerArchivo from '../modales/ModalVerArchivo'
import { Leyenda, Panel } from '../Panel'
import TarjetaMetrica from '../TarjetaMetrica'

const SEMANAS_ACTIVIDAD = 8

const iniciales = (nombre: string) => nombre.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()

const haceCuanto = (fecha: string): string => {
  const dias = diasEntre(fecha, HOY)
  return dias <= 0 ? 'hoy' : dias === 1 ? 'ayer' : `hace ${dias} días`
}

function TarjetaEvidencia({ evidencia, onEditar, onVerArchivo }: { evidencia: Evidencia; onEditar: () => void; onVerArchivo: () => void }) {
  const { usuario } = useAuth()
  const { desarrolladores, asignaciones, cuotas, revisarEvidencia, eliminarEvidencia } = useDatos()
  const [observando, setObservando] = useState(false)
  const [comentario, setComentario] = useState('')
  const [confirmando, setConfirmando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const dev = desarrolladores.find((d) => d.id === evidencia.desarrolladorId)
  const cuota = cuotas.find((q) => q.id === evidencia.cuotaId)
  const Icono = ICONO_TIPO[evidencia.tipo]
  const estado = ESTADOS_EVIDENCIA[evidencia.estado]
  const revisa = puedeRevisar(usuario, evidencia, desarrolladores, asignaciones)
  const modifica = puedeModificar(usuario, evidencia, desarrolladores)

  const revisar = (nuevo: 'validada' | 'observada') => {
    const resultado = revisarEvidencia(evidencia.id, nuevo, nuevo === 'observada' ? comentario : '')
    setError(resultado)
    if (!resultado) {
      setObservando(false)
      setComentario('')
    }
  }

  const eliminar = async () => {
    const resultado = eliminarEvidencia(evidencia.id)
    if (resultado) return setError(resultado)
    if (evidencia.archivo) await borrarArchivo(evidencia.archivo.clave).catch(() => undefined)
  }

  return (
    <article className="relative flex gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${COLOR_TIPO[evidencia.tipo]}1a`, color: COLOR_TIPO[evidencia.tipo] }}>
        <Icono className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold text-slate-900">{evidencia.titulo}</p>
            <p className="text-xs text-slate-500">
              <span className="font-medium text-slate-700">{dev?.nombre ?? 'Desarrollador'}</span> · {ETIQUETA_TIPO[evidencia.tipo]} · {formatoFecha(evidencia.fecha)}
              {evidencia.horas ? ` · ${evidencia.horas} h` : ''}
              {evidencia.registradoPor !== dev?.nombre && ` · registró ${evidencia.registradoPor}`}
            </p>
          </div>
          <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${estado.clase}`}>
            {evidencia.estado === 'validada' ? <BadgeCheck className="h-3 w-3" /> : evidencia.estado === 'observada' ? <MessageSquareWarning className="h-3 w-3" /> : <Clock4 className="h-3 w-3" />}
            {estado.etiqueta}
          </span>
        </div>

        {evidencia.descripcion && <p className="mt-2 whitespace-pre-line text-sm text-slate-600">{evidencia.descripcion}</p>}

        <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-xs">
          {evidencia.commit && (
            <span className="inline-flex items-center gap-1 rounded-md bg-slate-900 px-2 py-0.5 font-mono text-[11px] text-slate-100">{evidencia.commit.slice(0, 7)}</span>
          )}
          {evidencia.rama && (
            <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-0.5 font-mono text-[11px] text-slate-600"><GitBranch className="h-3 w-3" />{evidencia.rama}</span>
          )}
          {cuota && (
            <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-indigo-700"><Layers className="h-3 w-3" />{cuota.entregable}</span>
          )}
          {evidencia.enlace && (
            <a href={evidencia.enlace} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-0.5 font-medium text-slate-700 hover:border-indigo-300 hover:text-indigo-700">
              <ExternalLink className="h-3 w-3" />{evidencia.tipo === 'commit' ? 'Ver commit' : 'Abrir enlace'}
            </a>
          )}
          {evidencia.archivo && (
            <button onClick={onVerArchivo} className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-0.5 font-medium text-slate-700 hover:border-indigo-300 hover:text-indigo-700">
              <Paperclip className="h-3 w-3" />{evidencia.archivo.tipo === 'application/pdf' ? 'Ver PDF' : 'Ver captura'}
            </button>
          )}
        </div>

        {evidencia.revision && evidencia.estado === 'observada' && (
          <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
            <strong>{evidencia.revision.por}:</strong> {evidencia.revision.comentario}
          </p>
        )}
        {evidencia.revision && evidencia.estado === 'validada' && (
          <p className="mt-2 text-[11px] text-emerald-700">
            Validada por {evidencia.revision.por} el {formatoFecha(evidencia.revision.fecha)}{evidencia.revision.comentario ? ` · «${evidencia.revision.comentario}»` : ''}
          </p>
        )}

        {observando && (
          <div className="mt-3 flex flex-wrap gap-2">
            <input autoFocus className={`${entradaCompacta} min-w-[14rem] flex-1`} value={comentario} onChange={(e) => setComentario(e.target.value)} placeholder="¿Qué falta o qué se debe corregir?" onKeyDown={(e) => e.key === 'Enter' && revisar('observada')} />
            <button onClick={() => revisar('observada')} className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-rose-700">Enviar observación</button>
            <button onClick={() => setObservando(false)} className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100">Cancelar</button>
          </div>
        )}

        {(revisa || modifica) && !observando && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-3">
            {revisa && evidencia.estado !== 'validada' && (
              <button onClick={() => revisar('validada')} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" />Validar
              </button>
            )}
            {revisa && evidencia.estado !== 'observada' && (
              <button onClick={() => setObservando(true)} className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50">
                <MessageSquareWarning className="h-3.5 w-3.5" />Observar
              </button>
            )}
            <span className="flex-1" />
            {modifica && !confirmando && (
              <>
                <button onClick={onEditar} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100">
                  <Pencil className="h-3.5 w-3.5" />{evidencia.estado === 'observada' ? 'Corregir' : 'Editar'}
                </button>
                <button onClick={() => setConfirmando(true)} aria-label="Eliminar evidencia" className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </>
            )}
            {confirmando && (
              <span className="inline-flex items-center gap-1.5 text-xs">
                <span className="text-rose-700">¿Eliminar evidencia?</span>
                <button onClick={eliminar} className="rounded-lg bg-rose-600 px-2.5 py-1 font-medium text-white hover:bg-rose-700">Sí</button>
                <button onClick={() => setConfirmando(false)} className="rounded-lg px-2.5 py-1 font-medium text-slate-600 hover:bg-slate-100">No</button>
              </span>
            )}
          </div>
        )}
        {error && <p className="mt-2 text-xs text-rose-600">{error}</p>}
      </div>
    </article>
  )
}

export default function PestanaEvidencias({ proyecto }: { proyecto: Proyecto }) {
  const { usuario } = useAuth()
  const { evidencias, desarrolladores, asignaciones } = useDatos()
  const [modal, setModal] = useState<{ evidencia?: Evidencia } | null>(null)
  const [viendo, setViendo] = useState<Evidencia | null>(null)
  const [persona, setPersona] = useState('todas')
  const [tipo, setTipo] = useState<TipoEvidencia | 'todos'>('todos')
  const [estado, setEstado] = useState<EstadoEvidencia | 'todos'>('todos')
  const [busqueda, setBusqueda] = useState('')

  const delProyecto = useMemo(
    () => evidencias.filter((e) => e.proyectoId === proyecto.id).sort((a, b) => b.fecha.localeCompare(a.fecha) || b.creadoEn.localeCompare(a.creadoEn)),
    [evidencias, proyecto.id]
  )
  const equipo = equipoDeProyecto(asignaciones, proyecto.id)
  const puedeRegistrar = registrablesPor(usuario, proyecto.id, desarrolladores, asignaciones).length > 0

  const validadas = delProyecto.filter((e) => e.estado === 'validada').length
  const pendientes = delProyecto.filter((e) => e.estado === 'pendiente').length
  const observadas = delProyecto.filter((e) => e.estado === 'observada').length
  const commits = delProyecto.filter((e) => e.tipo === 'commit').length
  const horasRespaldadas = redondearHoras(delProyecto.reduce((s, e) => s + (e.horas ?? 0), 0))

  const semanas = Array.from({ length: SEMANAS_ACTIVIDAD }, (_, i) => inicioSemana(sumarDias(HOY, -7 * (SEMANAS_ACTIVIDAD - 1 - i))))
  const personas = equipo.map((a) => {
    const dev = desarrolladores.find((d) => d.id === a.desarrolladorId)
    const propias = delProyecto.filter((e) => e.desarrolladorId === a.desarrolladorId)
    const porSemana = semanas.map((s) => propias.filter((e) => inicioSemana(e.fecha) === s).length)
    return {
      id: a.desarrolladorId,
      nombre: dev?.nombre ?? 'Desarrollador',
      jefe: esJefe(a, equipo),
      total: propias.length,
      validadas: propias.filter((e) => e.estado === 'validada').length,
      pendientes: propias.filter((e) => e.estado === 'pendiente').length,
      observadas: propias.filter((e) => e.estado === 'observada').length,
      horas: redondearHoras(propias.reduce((s, e) => s + (e.horas ?? 0), 0)),
      ultima: propias[0]?.fecha,
      porSemana,
    }
  })
  const maxSemana = Math.max(1, ...personas.flatMap((p) => p.porSemana))

  const segmentosTipo = TIPOS_EVIDENCIA.map((t) => ({ nombre: t.etiqueta, valor: delProyecto.filter((e) => e.tipo === t.id).length, color: t.color }))

  const texto = busqueda.trim().toLowerCase()
  const lista = delProyecto.filter(
    (e) =>
      (persona === 'todas' || e.desarrolladorId === persona) &&
      (tipo === 'todos' || e.tipo === tipo) &&
      (estado === 'todos' || e.estado === estado) &&
      (!texto || `${e.titulo} ${e.descripcion} ${e.commit ?? ''} ${e.rama ?? ''}`.toLowerCase().includes(texto))
  )

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900">Evidencias de trabajo</h3>
          <p className="text-sm text-slate-500">Commits, actividades y capturas que respaldan el avance de cada desarrollador.</p>
        </div>
        {puedeRegistrar && (
          <button onClick={() => setModal({})} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700">
            <Plus className="h-4 w-4" />Registrar evidencia
          </button>
        )}
      </div>

      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <TarjetaMetrica titulo="Evidencias" valor={String(delProyecto.length)} detalle={`${commits} commit(s) registrados`} icono={Layers} />
        <TarjetaMetrica titulo="Validadas" valor={String(validadas)} tono="ok" detalle={delProyecto.length ? `${Math.round((validadas / delProyecto.length) * 100)} % del total` : 'Sin evidencias aún'} icono={ShieldCheck} />
        <TarjetaMetrica titulo="Por revisar" valor={String(pendientes)} tono={pendientes > 0 ? 'alerta' : 'neutro'} detalle={observadas ? `${observadas} con observación` : 'Sin observaciones abiertas'} icono={Clock4} />
        <TarjetaMetrica titulo="Horas respaldadas" valor={`${horasRespaldadas} h`} detalle="Declaradas en las evidencias" />
      </div>

      <div className="mb-5 grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Panel titulo="Aporte por desarrollador" subtitulo={`Evidencias de las últimas ${SEMANAS_ACTIVIDAD} semanas · clic para filtrar`}>
          {personas.length === 0 && <p className="text-sm text-slate-400">El proyecto aún no tiene equipo asignado.</p>}
          <div className="space-y-2">
            {personas.map((p) => {
              const activa = persona === p.id
              return (
                <button
                  key={p.id}
                  onClick={() => setPersona(activa ? 'todas' : p.id)}
                  className={`flex w-full flex-wrap items-center gap-3 rounded-xl border p-3 text-left transition-all sm:flex-nowrap ${activa ? 'border-indigo-300 bg-indigo-50/60 ring-2 ring-indigo-100' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'}`}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-emerald-500 text-xs font-bold text-white">{iniciales(p.nombre)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 truncate text-sm font-semibold text-slate-900">
                      {p.nombre}
                      {p.jefe && <span className="rounded-full bg-indigo-100 px-1.5 text-[10px] font-semibold text-indigo-700">Jefe</span>}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {p.total} evidencia(s) · {p.horas} h · {p.ultima ? `última ${haceCuanto(p.ultima)}` : 'sin actividad registrada'}
                    </p>
                    <div className="mt-1.5 flex h-1.5 overflow-hidden rounded-full bg-slate-100">
                      {p.total > 0 && (
                        <>
                          <span style={{ width: `${(p.validadas / p.total) * 100}%`, backgroundColor: ESTADOS_EVIDENCIA.validada.color }} />
                          <span style={{ width: `${(p.pendientes / p.total) * 100}%`, backgroundColor: ESTADOS_EVIDENCIA.pendiente.color }} />
                          <span style={{ width: `${(p.observadas / p.total) * 100}%`, backgroundColor: ESTADOS_EVIDENCIA.observada.color }} />
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex h-9 items-end gap-0.5" title="Evidencias por semana">
                    {p.porSemana.map((n, i) => (
                      <span
                        key={semanas[i]}
                        title={`Semana del ${etiquetaCortaSemana(semanas[i])}: ${n}`}
                        className={`w-2 rounded-sm ${n ? 'bg-indigo-500' : 'bg-slate-200'}`}
                        style={{ height: `${n ? 25 + (n / maxSemana) * 75 : 12}%` }}
                      />
                    ))}
                  </div>
                </button>
              )
            })}
          </div>
          <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-slate-500">
            {(Object.keys(ESTADOS_EVIDENCIA) as EstadoEvidencia[]).map((s) => (
              <span key={s} className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: ESTADOS_EVIDENCIA[s].color }} />{ESTADOS_EVIDENCIA[s].etiqueta}</span>
            ))}
          </div>
        </Panel>

        <Panel titulo="Tipo de evidencia" subtitulo="Clic en un tipo para filtrar">
          <DonutGrafico datos={segmentosTipo} centroValor={String(delProyecto.length)} centroEtiqueta="evidencias" alto={170} />
          <div className="mt-3 space-y-1">
            {segmentosTipo.map((s, i) => {
              const id = TIPOS_EVIDENCIA[i].id
              return (
                <button key={id} onClick={() => setTipo(tipo === id ? 'todos' : id)} className={`block w-full rounded-lg px-2 py-1 ${tipo === id ? 'bg-slate-100' : 'hover:bg-slate-50'}`}>
                  <Leyenda color={s.color} nombre={s.nombre} valor={String(s.valor)} />
                </button>
              )
            })}
          </div>
        </Panel>
      </div>

      <Panel
        titulo="Bitácora de evidencias"
        subtitulo={`${lista.length} de ${delProyecto.length} evidencia(s)`}
        accion={
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input className={`${entradaCompacta} w-52 pl-8`} placeholder="Buscar título o commit" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
            </div>
            <select className={`${entradaCompacta} w-auto`} value={persona} onChange={(e) => setPersona(e.target.value)}>
              <option value="todas">Todo el equipo</option>
              {personas.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
            <select className={`${entradaCompacta} w-auto`} value={estado} onChange={(e) => setEstado(e.target.value as EstadoEvidencia | 'todos')}>
              <option value="todos">Todos los estados</option>
              {(Object.keys(ESTADOS_EVIDENCIA) as EstadoEvidencia[]).map((s) => <option key={s} value={s}>{ESTADOS_EVIDENCIA[s].etiqueta}</option>)}
            </select>
          </div>
        }
      >
        {lista.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
            <p className="text-sm font-medium text-slate-600">{delProyecto.length ? 'Ninguna evidencia coincide con los filtros' : 'Aún no hay evidencias en este proyecto'}</p>
            {puedeRegistrar && !delProyecto.length && <p className="mt-1 text-xs text-slate-400">Registra tu primer commit o actividad con el botón «Registrar evidencia».</p>}
          </div>
        ) : (
          <div className="space-y-3">
            {lista.map((e) => (
              <TarjetaEvidencia key={e.id} evidencia={e} onEditar={() => setModal({ evidencia: e })} onVerArchivo={() => setViendo(e)} />
            ))}
          </div>
        )}
      </Panel>

      {modal && <ModalEvidencia proyectoId={proyecto.id} evidencia={modal.evidencia} onCerrar={() => setModal(null)} />}
      {viendo?.archivo && <ModalVerArchivo archivo={viendo.archivo} titulo={viendo.titulo} onCerrar={() => setViendo(null)} />}
    </>
  )
}
