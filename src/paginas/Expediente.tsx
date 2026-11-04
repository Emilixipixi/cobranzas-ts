import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Building2, CalendarClock, ExternalLink, FolderOpen, History, Layers, Pencil, Receipt, Sparkles, Trash2, UserRound, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import EtiquetaEstado from '../componentes/EtiquetaEstado'
import PestanaAuditoria from '../componentes/expediente/PestanaAuditoria'
import PestanaDocumentos from '../componentes/expediente/PestanaDocumentos'
import PestanaEquipo from '../componentes/expediente/PestanaEquipo'
import ModalEditarProyecto from '../componentes/modales/ModalEditarProyecto'
import ModalEliminarProyecto from '../componentes/modales/ModalEliminarProyecto'
import ModalRecordatorio from '../componentes/modales/ModalRecordatorio'
import PanelCobranza from '../componentes/PanelCobranza'
import TarjetaMetrica from '../componentes/TarjetaMetrica'
import { useAuditoria } from '../contextos/AuditoriaContext'
import { useAuth } from '../contextos/AuthContext'
import { useDatos } from '../contextos/DatosContext'
import { HOY } from '../datos/datosEjemplo'
import { diasEntre, formatoFecha, formatoMoneda, resumenPlan } from '../utils/finanzas'
import { datosDeProyecto, filasCartera, progresoEntrega, resumenFinanciero } from '../utils/indicadores'

type Pestana = 'cobranzas' | 'documentos' | 'equipo' | 'auditoria'

const limitar = (n: number): number => Math.max(0, Math.min(100, n))

function CuadroInfo({ icono: Icono, titulo, children }: { icono: LucideIcon; titulo: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 text-sm">
      <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        <Icono className="h-3.5 w-3.5 text-indigo-500" />
        {titulo}
      </div>
      {children}
    </div>
  )
}

export default function Expediente() {
  const { id } = useParams()
  const { usuario, usuarios } = useAuth()
  const navegar = useNavigate()
  const { registros } = useAuditoria()
  const { proyectos, clientes, contratos, cuotas, cobros, documentos, asignaciones } = useDatos()
  const [pestana, setPestana] = useState<Pestana>(usuario?.rol === 'desarrollador' ? 'equipo' : 'cobranzas')
  const [recordando, setRecordando] = useState(false)
  const [accion, setAccion] = useState<'editar' | 'eliminar' | null>(null)

  const proyecto = proyectos.find((p) => p.id === id)
  if (!usuario) return null
  if (!proyecto) return <Navigate to="/proyectos" replace />

  const rol = usuario.rol
  const verDinero = rol !== 'desarrollador'
  const esAdministrador = rol === 'administrador'
  const puedeEditar = rol === 'administrador' || rol === 'comercial'
  const puedeOperarCobros = rol === 'administrador' || rol === 'finanzas'
  const cliente = clientes.find((c) => c.id === proyecto.clienteId)
  const responsable = usuarios.find((u) => u.id === proyecto.responsableId)
  const datos = datosDeProyecto(proyecto.id, contratos, cuotas)
  const resumen = resumenFinanciero(datos.contratos, datos.cuotas, cobros)

  const entregables = datos.cuotas.filter((q) => q.entregable !== '')
  const entregados = entregables.filter((q) => q.estadoEntrega === 'Entregado').length
  const avance = progresoEntrega(datos.cuotas)
  const diasTotales = Math.max(1, diasEntre(proyecto.fechaInicio, proyecto.fechaEntrega))
  const transcurrido = limitar(Math.round((diasEntre(proyecto.fechaInicio, HOY) / diasTotales) * 100))
  const conAtraso = datos.cuotas.some((q) => q.estadoEntrega.startsWith('Atraso')) || (proyecto.estado !== 'Cerrado' && proyecto.fechaEntrega < HOY)

  const filas = filasCartera(proyectos, clientes, contratos, datos.cuotas, cobros)
  const prioritaria =
    filas.find((f) => f.estado === 'Vencida') ?? filas.find((f) => f.estado === 'Facturada' || f.estado === 'Parcialmente cobrada')

  const pestanas: { id: Pestana; titulo: string; icono: LucideIcon; cantidad: number; visible: boolean }[] = [
    { id: 'cobranzas', titulo: 'Cobranzas e hitos', icono: Receipt, cantidad: datos.cuotas.length, visible: verDinero },
    { id: 'documentos', titulo: 'Expediente documental', icono: FolderOpen, cantidad: documentos.filter((d) => d.proyectoId === proyecto.id).length, visible: true },
    { id: 'equipo', titulo: 'Equipo y plazos', icono: Users, cantidad: asignaciones.filter((a) => a.proyectoId === proyecto.id).length, visible: true },
    { id: 'auditoria', titulo: 'Auditoría', icono: History, cantidad: registros.filter((r) => r.proyectoId === proyecto.id).length, visible: verDinero },
  ]

  return (
    <>
      <Link to="/proyectos" className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:underline">
        <ArrowLeft className="h-4 w-4" />
        Proyectos
      </Link>

      <div className="mb-5 mt-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="rounded border border-slate-200 bg-slate-100 px-2 py-0.5 font-mono text-xs font-semibold text-slate-700">{proyecto.codigo}</span>
              <EtiquetaEstado estado={proyecto.estado} />
              <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${conAtraso ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
                {conAtraso ? 'Cronograma con atraso' : 'Cronograma en tiempo'}
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">Prototipo <EtiquetaEstado estado={proyecto.prototipo} /></span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">{proyecto.nombre}</h2>
            <p className="mt-1 max-w-3xl text-sm text-slate-500">{proyecto.descripcion}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {puedeOperarCobros && prioritaria && (
              <button
                onClick={() => setRecordando(true)}
                className="flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3.5 py-2 text-sm font-medium text-amber-800 transition-colors hover:bg-amber-100"
              >
                <Sparkles className="h-4 w-4" />
                Generar recordatorio de cobro
              </button>
            )}
            {esAdministrador && (
              <>
                <button
                  onClick={() => setAccion('editar')}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                >
                  <Pencil className="h-4 w-4" />
                  Editar proyecto
                </button>
                <button
                  onClick={() => setAccion('eliminar')}
                  className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2 text-sm font-medium text-rose-700 transition-colors hover:bg-rose-100"
                >
                  <Trash2 className="h-4 w-4" />
                  Eliminar
                </button>
              </>
            )}
          </div>
        </div>

        <div className="mt-4 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2 lg:grid-cols-4">
          <CuadroInfo icono={Building2} titulo="Cliente">
            <p className="font-bold text-slate-900">{cliente?.nombre}</p>
            <p className="mt-1 text-slate-700">{cliente?.contacto}</p>
            <p className="text-xs text-slate-500">{cliente?.correo}</p>
            <p className="text-xs text-slate-500">{cliente?.telefono}</p>
          </CuadroInfo>

          <CuadroInfo icono={UserRound} titulo="Responsable">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                {(responsable?.nombre ?? '?').split(' ').map((p) => p[0]).slice(0, 2).join('')}
              </div>
              <div className="min-w-0">
                <p className="truncate font-bold text-slate-900">{responsable?.nombre ?? 'Sin asignar'}</p>
                <p className="text-xs capitalize text-slate-500">{responsable?.rol}</p>
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-500">{responsable?.correo}</p>
          </CuadroInfo>

          <CuadroInfo icono={CalendarClock} titulo="Plazo comprometido">
            <div className="space-y-1 text-xs">
              <p className="flex justify-between"><span className="text-slate-500">Inicio</span><strong>{formatoFecha(proyecto.fechaInicio)}</strong></p>
              <p className="flex justify-between"><span className="text-slate-500">Entrega ofrecida</span><strong>{formatoFecha(proyecto.fechaEntrega)}</strong></p>
              <p className="flex justify-between"><span className="text-slate-500">Colchón</span><strong className="text-amber-700">+{proyecto.diasContingencia} días</strong></p>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-slate-200">
              <div className="h-1.5 rounded-full bg-indigo-600" style={{ width: `${transcurrido}%` }} />
            </div>
            <p className="mt-1 flex justify-between text-[11px] text-slate-500"><span>Transcurrido: {transcurrido} %</span><span>{diasTotales} días</span></p>
          </CuadroInfo>

          <CuadroInfo icono={Layers} titulo="Prototipo y evidencias">
            <div className="space-y-1.5">
              {proyecto.urlPrototipo && (
                <a href={proyecto.urlPrototipo} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
                  Prototipo <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                </a>
              )}
              {proyecto.repositorio && (
                <a href={proyecto.repositorio} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
                  Repositorio <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                </a>
              )}
              {!proyecto.urlPrototipo && !proyecto.repositorio && <p className="text-xs text-slate-400">Sin enlaces registrados</p>}
            </div>
          </CuadroInfo>
        </div>

        <div className={`mt-4 grid gap-3 ${verDinero ? 'md:grid-cols-2' : ''}`}>
          <div className="rounded-lg border border-indigo-100 bg-indigo-50/60 p-3">
            <div className="mb-1.5 flex justify-between text-xs font-semibold text-indigo-900">
              <span>Avance de entregables</span>
              <span>{entregados} de {entregables.length} hitos ({avance} %)</span>
            </div>
            <div className="h-2 rounded-full bg-indigo-100">
              <div className="h-2 rounded-full bg-indigo-600" style={{ width: `${avance}%` }} />
            </div>
          </div>
          {verDinero && (
            <div className="rounded-lg border border-emerald-100 bg-emerald-50/60 p-3">
              <div className="mb-1.5 flex justify-between text-xs font-semibold text-emerald-900">
                <span>Cobranza vs. presupuesto</span>
                <span>{formatoMoneda(resumen.cobrado)} ({resumen.progresoCobro} %)</span>
              </div>
              <div className="h-2 rounded-full bg-emerald-100">
                <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${limitar(resumen.progresoCobro)}%` }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {verDinero && (
        <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <TarjetaMetrica titulo="Total contratado" valor={formatoMoneda(resumen.contratado)} detalle={`${datos.contratos.length} contrato(s)`} />
          <TarjetaMetrica titulo="Cobrado efectivo" valor={formatoMoneda(resumen.cobrado)} tono="ok" detalle={`${resumen.progresoCobro} % del total`} />
          <TarjetaMetrica titulo="Por cobrar" valor={formatoMoneda(resumen.porCobrar)} detalle="Saldo pendiente del contrato" />
          <TarjetaMetrica titulo="Cartera vencida" valor={formatoMoneda(resumen.vencido)} tono={resumen.vencido > 0 ? 'peligro' : 'neutro'} detalle={resumen.vencido > 0 ? 'Requiere gestión de cobro' : 'Sin cuotas vencidas'} />
        </div>
      )}

      <div className="mb-5 flex gap-1 overflow-x-auto border-b border-slate-200">
        {pestanas.filter((p) => p.visible).map((p) => {
          const Icono = p.icono
          const activa = pestana === p.id
          return (
            <button
              key={p.id}
              onClick={() => setPestana(p.id)}
              className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-3.5 py-3 text-sm font-semibold transition-all ${activa ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'}`}
            >
              <Icono className="h-4 w-4" />
              {p.titulo}
              <span className={`rounded-full px-1.5 text-[11px] font-bold ${activa ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>{p.cantidad}</span>
            </button>
          )
        })}
      </div>

      {pestana === 'cobranzas' && verDinero && (
        <>
          {datos.contratos.map((k) => {
            const plan = resumenPlan(k, cuotas)
            return plan.estado === 'completo' ? null : (
              <div key={k.id} className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
                {k.numero}: plan {plan.estado}, cubre {plan.porcentaje} % del contrato.
              </div>
            )
          })}
          <PanelCobranza cuotas={datos.cuotas} puedeOperar={puedeOperarCobros} mostrarProyecto={false} />
        </>
      )}
      {pestana === 'documentos' && <PestanaDocumentos proyectoId={proyecto.id} puedeEditar={puedeEditar} />}
      {pestana === 'equipo' && <PestanaEquipo proyecto={proyecto} puedeEditar={puedeEditar} />}
      {pestana === 'auditoria' && verDinero && <PestanaAuditoria proyectoId={proyecto.id} />}
      {recordando && prioritaria && <ModalRecordatorio cuota={prioritaria.cuota} onCerrar={() => setRecordando(false)} />}
      {accion === 'editar' && <ModalEditarProyecto proyecto={proyecto} onCerrar={() => setAccion(null)} />}
      {accion === 'eliminar' && <ModalEliminarProyecto proyecto={proyecto} onCerrar={() => setAccion(null)} onEliminado={() => navegar('/proyectos')} />}
    </>
  )
}