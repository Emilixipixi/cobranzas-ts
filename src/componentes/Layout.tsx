import { useEffect, useState } from 'react'
import { NavLink, Outlet, useMatch, useNavigate } from 'react-router-dom'
import {
  CalendarDays, FolderGit2, FolderOpen, History, Layers, LayoutDashboard, ListChecks, LogOut, Menu, MessagesSquare, PlusCircle, Receipt,
  RotateCcw, ShieldCheck, UserCog, Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useAuth } from '../contextos/AuthContext'
import { useDatos } from '../contextos/DatosContext'
import type { Rol } from '../tipos'
import ModalNuevoProyecto from './modales/ModalNuevoProyecto'

interface Enlace {
  ruta: string
  texto: string
  icono: LucideIcon
  roles: Rol[]
  grupo: 'principal' | 'administracion'
}

const TODOS: Rol[] = ['administrador', 'comercial', 'finanzas', 'desarrollador']

const enlaces: Enlace[] = [
  { ruta: '/', texto: 'Dashboard', icono: LayoutDashboard, roles: TODOS, grupo: 'principal' },
  { ruta: '/proyectos', texto: 'Proyectos', icono: FolderGit2, roles: TODOS, grupo: 'principal' },
  { ruta: '/plan-pagos', texto: 'Plan de pagos', icono: ListChecks, roles: ['administrador', 'comercial', 'finanzas'], grupo: 'principal' },
  { ruta: '/cobranza', texto: 'Control de cobranza', icono: Receipt, roles: ['administrador', 'finanzas'], grupo: 'principal' },
  { ruta: '/calendario', texto: 'Calendario financiero', icono: CalendarDays, roles: ['administrador', 'comercial', 'finanzas'], grupo: 'principal' },
  { ruta: '/reuniones', texto: 'Reuniones', icono: MessagesSquare, roles: TODOS, grupo: 'principal' },
  { ruta: '/documentos', texto: 'Documentación', icono: FolderOpen, roles: TODOS, grupo: 'principal' },
  { ruta: '/ampliaciones', texto: 'Ampliaciones', icono: Layers, roles: ['administrador', 'comercial'], grupo: 'principal' },
  { ruta: '/usuarios', texto: 'Usuarios', icono: UserCog, roles: ['administrador'], grupo: 'administracion' },
  { ruta: '/desarrolladores', texto: 'Desarrolladores', icono: Users, roles: ['administrador'], grupo: 'administracion' },
  { ruta: '/auditoria', texto: 'Auditoría', icono: History, roles: ['administrador'], grupo: 'administracion' },
]

const CONSULTA_ESCRITORIO = '(min-width: 1024px)'
const CLAVE_MENU = 'cobranzasMenuLateralV1'

const leerPreferencia = (): boolean => {
  try {
    return localStorage.getItem(CLAVE_MENU) !== 'cerrado'
  } catch {
    return true
  }
}

const guardarPreferencia = (abierto: boolean) => {
  try {
    localStorage.setItem(CLAVE_MENU, abierto ? 'abierto' : 'cerrado')
  } catch {
    return
  }
}

const iniciales = (nombre: string): string =>
  nombre.split(' ').map((parte) => parte[0]).slice(0, 2).join('').toUpperCase()

export default function Layout() {
  const { usuario, cerrarSesion } = useAuth()
  const { proyectos, restaurarDatos } = useDatos()
  const navegar = useNavigate()
  const coincidencia = useMatch('/proyectos/:id')
  const [creando, setCreando] = useState(false)
  const [esEscritorio, setEsEscritorio] = useState(() => window.matchMedia(CONSULTA_ESCRITORIO).matches)
  const [menuAbierto, setMenuAbierto] = useState(() => window.matchMedia(CONSULTA_ESCRITORIO).matches && leerPreferencia())

  useEffect(() => {
    const consulta = window.matchMedia(CONSULTA_ESCRITORIO)
    const alCambiarPantalla = (evento: MediaQueryListEvent) => {
      setEsEscritorio(evento.matches)
      setMenuAbierto(evento.matches ? leerPreferencia() : false)
    }
    consulta.addEventListener('change', alCambiarPantalla)
    return () => consulta.removeEventListener('change', alCambiarPantalla)
  }, [])

  useEffect(() => {
    if (!menuAbierto || esEscritorio) return
    const alPulsarTecla = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') setMenuAbierto(false)
    }
    document.addEventListener('keydown', alPulsarTecla)
    return () => document.removeEventListener('keydown', alPulsarTecla)
  }, [menuAbierto, esEscritorio])

  if (!usuario) return null

  const puedeCrear = usuario.rol === 'administrador' || usuario.rol === 'comercial'
  const visibles = enlaces.filter((e) => e.roles.includes(usuario.rol))
  const principales = visibles.filter((e) => e.grupo === 'principal')
  const administracion = visibles.filter((e) => e.grupo === 'administracion')

  const alternarMenu = () => {
    const siguiente = !menuAbierto
    setMenuAbierto(siguiente)
    if (esEscritorio) guardarPreferencia(siguiente)
  }

  const alElegirOpcion = () => {
    if (!esEscritorio) setMenuAbierto(false)
  }

  const renderEnlace = (e: Enlace) => {
    const Icono = e.icono
    return (
      <NavLink
        key={e.ruta}
        to={e.ruta}
        end={e.ruta === '/'}
        onClick={alElegirOpcion}
        className={({ isActive }) =>
          `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
            isActive ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`
        }
      >
        <Icono className="h-4 w-4 shrink-0" />
        {e.texto}
      </NavLink>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-800 selection:bg-indigo-500 selection:text-white">
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-900 text-white shadow-md">
        <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={alternarMenu}
              aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={menuAbierto}
              aria-controls="menu-lateral"
              className="rounded-lg border border-transparent p-2 text-slate-300 transition-colors hover:border-slate-700 hover:bg-slate-800 hover:text-white"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-emerald-500 shadow-lg shadow-indigo-500/20">
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight">Cobranzas</span>
                <span className="hidden rounded border border-indigo-500/30 bg-indigo-500/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-indigo-300 sm:inline">
                  Control & Dossier
                </span>
              </div>
              <p className="hidden text-xs text-slate-400 md:block">Control documental y cobranzas de proyectos de software</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden items-center rounded-lg border border-slate-700 bg-slate-800/90 px-3 py-1.5 transition-colors hover:bg-slate-800 xl:flex">
              <FolderGit2 className="mr-2 h-4 w-4 shrink-0 text-emerald-400" />
              <select
                aria-label="Ir a un proyecto"
                value={coincidencia?.params.id ?? ''}
                onChange={(e) => e.target.value && navegar(`/proyectos/${e.target.value}`)}
                className="max-w-[220px] cursor-pointer truncate bg-transparent text-sm font-medium text-slate-200 focus:outline-none"
              >
                <option value="" className="bg-slate-800">Ir a un proyecto…</option>
                {proyectos.map((p) => (
                  <option key={p.id} value={p.id} className="bg-slate-800">{p.codigo} · {p.nombre}</option>
                ))}
              </select>
            </div>

            {puedeCrear && (
              <button
                onClick={() => setCreando(true)}
                className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 px-3.5 py-2 text-xs font-medium text-white shadow-sm shadow-emerald-500/20 transition-all hover:from-emerald-600 hover:to-teal-700 sm:text-sm"
              >
                <PlusCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Nuevo proyecto</span>
                <span className="sm:hidden">Nuevo</span>
              </button>
            )}

            <div className="hidden text-right md:block">
              <p className="text-sm font-medium leading-tight">{usuario.nombre}</p>
              <p className="text-xs capitalize leading-tight text-slate-400">{usuario.rol}</p>
            </div>

            {usuario.rol === 'administrador' && (
              <button
                onClick={() => window.confirm('¿Restaurar los datos de demostración?') && restaurarDatos()}
                title="Restaurar datos de demostración"
                aria-label="Restaurar demo"
                className="rounded-lg border border-transparent p-2 text-slate-400 transition-colors hover:border-slate-700 hover:bg-slate-800 hover:text-slate-200"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={cerrarSesion}
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
              className="rounded-lg border border-transparent p-2 text-slate-400 transition-colors hover:border-slate-700 hover:bg-slate-800 hover:text-slate-200"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <aside
        id="menu-lateral"
        aria-label="Menú lateral"
        className={`fixed bottom-0 left-0 top-16 z-40 flex w-64 flex-col border-r border-slate-800 bg-slate-900 text-slate-200 transition-transform duration-200 ${
          menuAbierto ? 'visible translate-x-0 shadow-xl lg:shadow-none' : 'invisible -translate-x-full'
        }`}
      >
        <nav aria-label="Menú de navegación" className="flex-1 overflow-y-auto px-3 py-4">
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Principal</p>
          <div className="space-y-1">{principales.map(renderEnlace)}</div>

          {administracion.length > 0 && (
            <>
              <p className="mt-6 px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Administración</p>
              <div className="space-y-1">{administracion.map(renderEnlace)}</div>
            </>
          )}
        </nav>

        <div className="shrink-0 border-t border-slate-800 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-xs font-bold text-indigo-300">
              {iniciales(usuario.nombre)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">{usuario.nombre}</p>
              <p className="truncate text-xs capitalize text-slate-400">{usuario.rol}</p>
            </div>
          </div>
        </div>
      </aside>

      <div className={`flex min-w-0 flex-1 flex-col transition-[padding] duration-200 ${menuAbierto ? 'lg:pl-64' : ''}`}>
        <main className="mx-auto w-full max-w-7xl min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>

        <footer className="mt-8 border-t border-slate-200 bg-white py-5 text-xs text-slate-500">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 sm:flex-row sm:px-6 lg:px-8">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700">Cobranzas</span>
              <span>• Plataforma de control documental y cobranzas de software · Datos demostrativos</span>
            </div>
            <div className="flex items-center gap-4 text-[11px]">
              <span>Control de hitos</span>
              <span>Comprobantes</span>
              <span>Flujo de caja</span>
              <span>Trazabilidad</span>
            </div>
          </div>
        </footer>
      </div>

      {creando && <ModalNuevoProyecto onCerrar={() => setCreando(false)} />}
    </div>
  )
}