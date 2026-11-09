import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertOctagon, AlertTriangle, Bell, BellOff, CheckCheck, CheckCircle2, Info } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useAlertas } from '../contextos/AlertasContext'
import { useAuth } from '../contextos/AuthContext'
import { useDatos } from '../contextos/DatosContext'
import { formatoFecha } from '../utils/finanzas'
import { ETIQUETAS_DEPARTAMENTO, notificacionesPara } from '../utils/notificaciones'
import type { Departamento, Notificacion, Prioridad } from '../utils/notificaciones'

const ESTILOS: Record<Prioridad, { icono: LucideIcon; caja: string }> = {
  peligro: { icono: AlertOctagon, caja: 'bg-rose-100 text-rose-600' },
  alerta: { icono: AlertTriangle, caja: 'bg-amber-100 text-amber-600' },
  exito: { icono: CheckCircle2, caja: 'bg-emerald-100 text-emerald-600' },
  info: { icono: Info, caja: 'bg-indigo-100 text-indigo-600' },
}

const COLOR_DEPARTAMENTO: Record<Departamento, string> = {
  direccion: 'bg-slate-900 text-white',
  finanzas: 'bg-emerald-50 text-emerald-700',
  comercial: 'bg-sky-50 text-sky-700',
  desarrollador: 'bg-violet-50 text-violet-700',
}

const claveLeidas = (usuarioId: string) => `cobranzasNotificacionesLeidasV1:${usuarioId}`

const leerLeidas = (usuarioId: string): Set<string> => {
  try {
    return new Set(JSON.parse(localStorage.getItem(claveLeidas(usuarioId)) ?? '[]') as string[])
  } catch {
    return new Set()
  }
}

const guardarLeidas = (usuarioId: string, leidas: Set<string>) => {
  try {
    localStorage.setItem(claveLeidas(usuarioId), JSON.stringify([...leidas]))
  } catch {
    return
  }
}

type Filtro = 'todas' | Departamento

export default function Campana() {
  const { usuario } = useAuth()
  const datos = useDatos()
  const { notificar } = useAlertas()
  const navegar = useNavigate()
  const [abierto, setAbierto] = useState(false)
  const [filtro, setFiltro] = useState<Filtro>('todas')
  const [soloSinLeer, setSoloSinLeer] = useState(false)
  const [leidas, setLeidas] = useState<Set<string>>(() => (usuario ? leerLeidas(usuario.id) : new Set()))
  const contenedor = useRef<HTMLDivElement>(null)
  const avisado = useRef<string | null>(null)

  const { proyectos, contratos, cuotas, cobros, documentos, desarrolladores, asignaciones, horas, horasExtra, evidencias, adicionales, clientes, marcarHorasExtraVistas } = datos
  const todas = useMemo(
    () => (usuario ? notificacionesPara({ proyectos, contratos, cuotas, cobros, documentos, desarrolladores, asignaciones, horas, horasExtra, evidencias, adicionales, clientes }, usuario) : []),
    [usuario, proyectos, contratos, cuotas, cobros, documentos, desarrolladores, asignaciones, horas, horasExtra, evidencias, adicionales, clientes]
  )

  useEffect(() => {
    if (usuario) setLeidas(leerLeidas(usuario.id))
  }, [usuario])

  const estaLeida = (n: Notificacion) =>
    leidas.has(n.id) || (n.horasExtraId !== undefined && horasExtra.some((x) => x.id === n.horasExtraId && x.vista))

  const sinLeer = todas.filter((n) => !estaLeida(n))
  const esAdministrador = usuario?.rol === 'administrador'

  // Aviso emergente al entrar, una sola vez por sesión de cada usuario.
  useEffect(() => {
    if (!usuario || avisado.current === usuario.id) return
    avisado.current = usuario.id
    if (sinLeer.length === 0) return
    const urgentes = sinLeer.filter((n) => n.prioridad === 'peligro').length
    const primera = sinLeer[0]!
    notificar(
      sinLeer.length === 1 ? primera.titulo : `Tienes ${sinLeer.length} notificaciones sin leer`,
      sinLeer.length === 1 ? primera.detalle : urgentes > 0 ? `${urgentes} requieren atención urgente. Revisa la campana.` : 'Revisa la campana de notificaciones.',
      urgentes > 0 ? 'peligro' : 'info'
    )
  }, [usuario, sinLeer, notificar])

  useEffect(() => {
    if (!abierto) return
    const cerrar = (e: MouseEvent) => !contenedor.current?.contains(e.target as Node) && setAbierto(false)
    const escape = (e: KeyboardEvent) => e.key === 'Escape' && setAbierto(false)
    document.addEventListener('mousedown', cerrar)
    document.addEventListener('keydown', escape)
    return () => {
      document.removeEventListener('mousedown', cerrar)
      document.removeEventListener('keydown', escape)
    }
  }, [abierto])

  if (!usuario) return null

  const marcar = (lista: Notificacion[]) => {
    const nuevas = new Set(leidas)
    lista.forEach((n) => nuevas.add(n.id))
    setLeidas(nuevas)
    guardarLeidas(usuario.id, nuevas)
    // Solo el propio desarrollador confirma que vio sus horas extra.
    if (usuario.rol === 'desarrollador') {
      const ids = lista.flatMap((n) => (n.horasExtraId ? [n.horasExtraId] : []))
      if (ids.length) marcarHorasExtraVistas(ids)
    }
  }

  const abrirNotificacion = (n: Notificacion) => {
    marcar([n])
    setAbierto(false)
    navegar(n.ruta)
  }

  const departamentos = [...new Set(todas.map((n) => n.departamento))]
  const visibles = todas
    .filter((n) => filtro === 'todas' || n.departamento === filtro)
    .filter((n) => !soloSinLeer || !estaLeida(n))
  const sinLeerVisibles = visibles.filter((n) => !estaLeida(n))

  return (
    <div ref={contenedor} className="relative">
      <button
        onClick={() => setAbierto((v) => !v)}
        title="Notificaciones"
        aria-label={`Notificaciones: ${sinLeer.length} sin leer`}
        aria-expanded={abierto}
        className={`relative rounded-lg border p-2 transition-colors ${abierto ? 'border-slate-700 bg-slate-800 text-white' : 'border-transparent text-slate-300 hover:border-slate-700 hover:bg-slate-800 hover:text-white'}`}
      >
        <Bell className={`h-5 w-5 ${sinLeer.length > 0 ? 'origin-top animate-[campana_1.2s_ease-in-out_2]' : ''}`} />
        {sinLeer.length > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white ring-2 ring-slate-900">
            {sinLeer.length > 99 ? '99+' : sinLeer.length}
          </span>
        )}
      </button>

      {abierto && (
        <div className="fixed inset-x-3 top-[70px] z-50 flex max-h-[calc(100vh-90px)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-800 shadow-2xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[420px]">
          <div className="border-b border-slate-100 p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-bold text-slate-900">Notificaciones</p>
                <p className="text-xs text-slate-500">
                  {esAdministrador ? 'Avisos de todos los departamentos' : `Avisos de ${ETIQUETAS_DEPARTAMENTO[usuario.rol === 'desarrollador' ? 'desarrollador' : usuario.rol === 'finanzas' ? 'finanzas' : 'comercial']}`}
                  {' · '}{sinLeer.length} sin leer
                </p>
              </div>
              {sinLeerVisibles.length > 0 && (
                <button onClick={() => marcar(sinLeerVisibles)} className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50">
                  <CheckCheck className="h-3.5 w-3.5" />
                  Marcar como leídas
                </button>
              )}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-1">
              {esAdministrador && departamentos.length > 1 && (
                <>
                  {(['todas', ...departamentos] as Filtro[]).map((f) => {
                    const cantidad = (f === 'todas' ? todas : todas.filter((n) => n.departamento === f)).filter((n) => !estaLeida(n)).length
                    return (
                      <button
                        key={f}
                        onClick={() => setFiltro(f)}
                        className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${filtro === f ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                      >
                        {f === 'todas' ? 'Todas' : ETIQUETAS_DEPARTAMENTO[f]}
                        {cantidad > 0 && <span className={`ml-1 ${filtro === f ? 'text-indigo-100' : 'text-rose-600'}`}>{cantidad}</span>}
                      </button>
                    )
                  })}
                </>
              )}
              <label className="ml-auto flex cursor-pointer items-center gap-1.5 text-[11px] text-slate-500">
                <input type="checkbox" checked={soloSinLeer} onChange={(e) => setSoloSinLeer(e.target.checked)} className="h-3.5 w-3.5 accent-indigo-600" />
                Solo sin leer
              </label>
            </div>
          </div>

          <ul className="flex-1 overflow-y-auto">
            {visibles.length === 0 && (
              <li className="flex flex-col items-center gap-2 px-4 py-10 text-center text-sm text-slate-400">
                <BellOff className="h-6 w-6" />
                {soloSinLeer ? 'Estás al día: no hay notificaciones sin leer' : 'No hay notificaciones por ahora'}
              </li>
            )}
            {visibles.map((n) => {
              const leida = estaLeida(n)
              const { icono: Icono, caja } = ESTILOS[n.prioridad]
              return (
                <li key={n.id} className="border-b border-slate-50 last:border-0">
                  <button
                    onClick={() => abrirNotificacion(n)}
                    className={`flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 ${leida ? 'opacity-60' : 'bg-indigo-50/30'}`}
                  >
                    <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${caja}`}>
                      <Icono className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-2">
                        <span className={`text-sm leading-snug ${leida ? 'font-medium text-slate-700' : 'font-semibold text-slate-900'}`}>{n.titulo}</span>
                        {!leida && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-indigo-600" />}
                      </span>
                      <span className="mt-0.5 block text-xs text-slate-500">{n.detalle}</span>
                      <span className="mt-1.5 flex items-center gap-2 text-[10px]">
                        {esAdministrador && <span className={`rounded px-1.5 py-0.5 font-semibold uppercase tracking-wider ${COLOR_DEPARTAMENTO[n.departamento]}`}>{ETIQUETAS_DEPARTAMENTO[n.departamento]}</span>}
                        <span className="text-slate-400">{formatoFecha(n.fecha)}</span>
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
