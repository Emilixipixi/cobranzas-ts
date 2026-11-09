import { useState } from 'react'
import type { FormEvent } from 'react'
import { FileText, GitCommitHorizontal, ImageIcon, ListChecks, Rocket, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { HOY } from '../../datos/datosEjemplo'
import { useAuth } from '../../contextos/AuthContext'
import { useDatos } from '../../contextos/DatosContext'
import { borrarArchivo, guardarArchivo } from '../../utils/archivos'
import { botonPrimario, botonSecundario, entrada, etiquetaCampo } from '../../utils/estilos'
import { COLOR_TIPO, hashDesdeEnlace, registrablesPor, TIPOS_EVIDENCIA } from '../../utils/evidencias'
import { aNumero, soloDecimales } from '../../utils/numeros'
import { datosDeProyecto } from '../../utils/indicadores'
import type { ArchivoAdjunto, Evidencia, TipoEvidencia } from '../../tipos'
import Modal from '../Modal'
import SelectorArchivo from '../SelectorArchivo'
import { enlaceValido } from './ModalMinuta'

export const ICONO_TIPO: Record<TipoEvidencia, LucideIcon> = {
  commit: GitCommitHorizontal,
  actividad: ListChecks,
  entrega: Rocket,
  captura: ImageIcon,
  documento: FileText,
}

interface Props {
  proyectoId: string
  /** Si llega, se edita esa evidencia. */
  evidencia?: Evidencia
  onCerrar: () => void
}

export default function ModalEvidencia({ proyectoId, evidencia, onCerrar }: Props) {
  const { usuario } = useAuth()
  const { desarrolladores, asignaciones, contratos, cuotas, registrarEvidencia, editarEvidencia } = useDatos()
  const opciones = registrablesPor(usuario, proyectoId, desarrolladores, asignaciones)
  const entregables = datosDeProyecto(proyectoId, contratos, cuotas).cuotas.filter((q) => q.entregable !== '')

  const [desarrolladorId, setDesarrolladorId] = useState(evidencia?.desarrolladorId ?? opciones[0]?.id ?? '')
  const [tipo, setTipo] = useState<TipoEvidencia>(evidencia?.tipo ?? 'commit')
  const [titulo, setTitulo] = useState(evidencia?.titulo ?? '')
  const [descripcion, setDescripcion] = useState(evidencia?.descripcion ?? '')
  const [fecha, setFecha] = useState(evidencia?.fecha ?? HOY)
  const [enlace, setEnlace] = useState(evidencia?.enlace ?? '')
  const [commit, setCommit] = useState(evidencia?.commit ?? '')
  const [rama, setRama] = useState(evidencia?.rama ?? '')
  const [cuotaId, setCuotaId] = useState(evidencia?.cuotaId ?? '')
  const [horas, setHoras] = useState(evidencia?.horas !== undefined ? String(evidencia.horas) : '')
  const [archivoActual, setArchivoActual] = useState<ArchivoAdjunto | undefined>(evidencia?.archivo)
  const [archivo, setArchivo] = useState<File | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cambiarEnlace = (valor: string) => {
    setEnlace(valor)
    const hash = hashDesdeEnlace(valor)
    if (tipo === 'commit' && hash && !commit) setCommit(hash)
  }

  const enviar = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (enlace.trim() && !enlaceValido(enlace.trim())) return setError('El enlace debe empezar con https://')
    setGuardando(true)
    let adjunto = archivoActual
    let claveNueva: string | null = null
    try {
      if (archivo) {
        claveNueva = `evidencia-${proyectoId}-${Date.now()}`
        await guardarArchivo(claveNueva, archivo)
        adjunto = { clave: claveNueva, nombre: archivo.name, tipo: archivo.type, tamano: archivo.size, subidoPor: usuario?.nombre ?? 'Sistema', fecha: new Date().toISOString() }
      }
    } catch {
      setGuardando(false)
      return setError('No se pudo guardar el archivo en este navegador. Intenta con uno más liviano.')
    }
    const datos = {
      proyectoId, desarrolladorId, tipo, titulo, descripcion, fecha,
      enlace: enlace || undefined, commit: commit || undefined, rama: rama || undefined, cuotaId: cuotaId || undefined,
      horas: horas.trim() ? aNumero(horas) : undefined,
      archivo: adjunto,
    }
    const resultado = evidencia ? editarEvidencia(evidencia.id, datos) : registrarEvidencia(datos)
    if (resultado) {
      if (claveNueva) await borrarArchivo(claveNueva).catch(() => undefined)
      setGuardando(false)
      return setError(resultado)
    }
    // El archivo anterior ya no se usa si se reemplazó o se quitó.
    if (evidencia?.archivo && evidencia.archivo.clave !== adjunto?.clave) await borrarArchivo(evidencia.archivo.clave).catch(() => undefined)
    onCerrar()
  }

  return (
    <Modal titulo={evidencia ? 'Editar evidencia' : 'Registrar evidencia de trabajo'} onCerrar={onCerrar} ancho="max-w-2xl">
      {opciones.length === 0 ? (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">Solo los desarrolladores asignados a este proyecto (o el administrador) pueden registrar evidencias.</p>
      ) : (
        <form onSubmit={enviar} className="space-y-4">
          {evidencia?.estado === 'observada' && evidencia.revision?.comentario && (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              <strong>Observación de {evidencia.revision.por}:</strong> {evidencia.revision.comentario}. Al guardar, la evidencia vuelve a revisión.
            </p>
          )}

          <div>
            <label className={etiquetaCampo}>Tipo de evidencia</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {TIPOS_EVIDENCIA.map((t) => {
                const Icono = ICONO_TIPO[t.id]
                const activo = tipo === t.id
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTipo(t.id)}
                    className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-2.5 text-xs font-medium transition-all ${activo ? 'border-indigo-400 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-100' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
                  >
                    <Icono className="h-4 w-4" style={{ color: activo ? undefined : COLOR_TIPO[t.id] }} />
                    {t.etiqueta}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_10rem]">
            <div>
              <label className={etiquetaCampo}>Título</label>
              <input className={entrada} value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder={tipo === 'commit' ? 'Ej.: Validación de horarios en la API' : 'Ej.: Pruebas del módulo de pagos'} required />
            </div>
            <div>
              <label className={etiquetaCampo}>Fecha del trabajo</label>
              <input className={entrada} type="date" value={fecha} max={HOY} onChange={(e) => setFecha(e.target.value)} required />
            </div>
          </div>

          {opciones.length > 1 && (
            <div>
              <label className={etiquetaCampo}>Desarrollador</label>
              <select className={entrada} value={desarrolladorId} onChange={(e) => setDesarrolladorId(e.target.value)} disabled={Boolean(evidencia)}>
                {opciones.map((d) => <option key={d.id} value={d.id}>{d.nombre}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className={etiquetaCampo}>Enlace {tipo === 'commit' ? 'del commit o pull request' : '(repositorio, tablero, demo…)'}</label>
            <input className={entrada} value={enlace} onChange={(e) => cambiarEnlace(e.target.value)} placeholder={tipo === 'commit' ? 'https://github.com/empresa/repo/commit/8f3a2c1' : 'https://…'} />
          </div>

          {tipo === 'commit' && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={etiquetaCampo}>Hash del commit</label>
                <input className={`${entrada} font-mono`} value={commit} onChange={(e) => setCommit(e.target.value.replace(/[^0-9a-f]/gi, '').slice(0, 40))} placeholder="8f3a2c1" />
              </div>
              <div>
                <label className={etiquetaCampo}>Rama (opcional)</label>
                <input className={`${entrada} font-mono`} value={rama} onChange={(e) => setRama(e.target.value)} placeholder="feature/agenda" />
              </div>
            </div>
          )}

          <div>
            <label className={etiquetaCampo}>Descripción de lo realizado</label>
            <textarea className={entrada} rows={3} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Qué se hizo, qué se probó y qué queda pendiente" />
          </div>

          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_8rem]">
            <div>
              <label className={etiquetaCampo}>Entregable al que aporta (opcional)</label>
              <select className={entrada} value={cuotaId} onChange={(e) => setCuotaId(e.target.value)}>
                <option value="">Sin entregable específico</option>
                {entregables.map((q) => <option key={q.id} value={q.id}>{q.entregable} · {q.estadoEntrega}</option>)}
              </select>
            </div>
            <div>
              <label className={etiquetaCampo}>Horas</label>
              <input className={entrada} inputMode="decimal" value={horas} onChange={(e) => setHoras(soloDecimales(e.target.value, 2, 2))} placeholder="0" />
            </div>
          </div>

          <div>
            <label className={etiquetaCampo}>Captura o archivo de respaldo (opcional)</label>
            {archivoActual && !archivo ? (
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <FileText className="h-5 w-5 text-indigo-500" />
                <p className="min-w-0 flex-1 truncate text-sm text-slate-700">{archivoActual.nombre}</p>
                <button type="button" onClick={() => setArchivoActual(undefined)} aria-label="Quitar archivo" className="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-rose-600"><X className="h-4 w-4" /></button>
              </div>
            ) : (
              <SelectorArchivo archivo={archivo} onCambio={setArchivo} queSube="la captura" />
            )}
          </div>

          {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button type="button" onClick={onCerrar} className={botonSecundario}>Cancelar</button>
            <button className={botonPrimario} disabled={guardando}>{guardando ? 'Guardando…' : evidencia ? 'Guardar cambios' : 'Registrar evidencia'}</button>
          </div>
        </form>
      )}
    </Modal>
  )
}
