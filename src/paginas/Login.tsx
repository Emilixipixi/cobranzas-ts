import { useRef, useState } from 'react'
import type { ClipboardEvent, FormEvent, KeyboardEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, ArrowRight, BadgeCheck, BellRing, Briefcase, CalendarCheck2, Code2, Eye, EyeOff, FileCheck2, Landmark, Lock, Mail, ShieldCheck, TrendingUp, UserCog,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import Logotipo from '../componentes/Logotipo'
import { useAuth } from '../contextos/AuthContext'

const CUENTAS: { correo: string; rol: string; icono: LucideIcon; color: string }[] = [
  { correo: 'admin@demo.com', rol: 'Dirección', icono: UserCog, color: 'text-indigo-600 bg-indigo-50' },
  { correo: 'finanzas@demo.com', rol: 'Finanzas', icono: Landmark, color: 'text-emerald-600 bg-emerald-50' },
  { correo: 'comercial@demo.com', rol: 'Comercial', icono: Briefcase, color: 'text-sky-600 bg-sky-50' },
  { correo: 'dev@demo.com', rol: 'Desarrollo', icono: Code2, color: 'text-violet-600 bg-violet-50' },
]

const BENEFICIOS: { icono: LucideIcon; titulo: string; detalle: string }[] = [
  { icono: CalendarCheck2, titulo: 'Planes de pago por hito', detalle: 'Cuotas atadas a entregables y fechas reales' },
  { icono: FileCheck2, titulo: 'Expediente completo', detalle: 'Contratos, actas y minutas en un solo lugar' },
  { icono: BellRing, titulo: 'Alertas por departamento', detalle: 'Cada área recibe solo lo que le importa' },
]

const LARGO_CODIGO = 6

function VistaPrevia() {
  return (
    <div className="relative mx-auto h-[300px] w-full max-w-md select-none" aria-hidden="true">
      {/* Tarjeta principal: flujo de caja */}
      <div className="absolute inset-x-0 top-6 rounded-2xl border border-white/10 bg-white/[0.06] p-5 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Flujo de caja</p>
            <p className="mt-1 text-2xl font-bold text-white">$48.250<span className="text-sm text-slate-400">,00</span></p>
          </div>
          <span className="flex items-center gap-1 rounded-full bg-emerald-400/15 px-2 py-1 text-xs font-semibold text-emerald-300">
            <TrendingUp className="h-3.5 w-3.5" /> +18 %
          </span>
        </div>
        <svg viewBox="0 0 320 90" className="mt-4 h-24 w-full">
          <defs>
            <linearGradient id="loginArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="loginArea2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[22, 45, 68].map((y) => <line key={y} x1="0" x2="320" y1={y} y2={y} stroke="white" strokeOpacity="0.06" strokeDasharray="4 4" />)}
          <path d="M0 62 C40 58 60 40 100 44 S160 22 200 30 S270 12 320 16 L320 90 L0 90Z" fill="url(#loginArea2)" />
          <path d="M0 62 C40 58 60 40 100 44 S160 22 200 30 S270 12 320 16" fill="none" stroke="#818cf8" strokeWidth="2" />
          <path d="M0 74 C40 70 70 60 100 62 S170 40 210 46 S280 28 320 30 L320 90 L0 90Z" fill="url(#loginArea)" />
          <path d="M0 74 C40 70 70 60 100 62 S170 40 210 46 S280 28 320 30" fill="none" stroke="#34d399" strokeWidth="2.5" className="login-trazo" />
          <circle cx="320" cy="30" r="4" fill="#34d399" />
        </svg>
        <div className="mt-2 flex gap-4 text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-indigo-400" />Proyectado</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-400" />Ejecutado</span>
        </div>
      </div>

      {/* Tarjeta flotante: anillo de cobranza */}
      <div className="login-flotar absolute -bottom-10 -left-6 flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/80 p-3 pr-4 shadow-xl backdrop-blur-xl">
        <svg viewBox="0 0 36 36" className="h-11 w-11 -rotate-90">
          <circle cx="18" cy="18" r="15" fill="none" stroke="white" strokeOpacity="0.1" strokeWidth="4" />
          <circle cx="18" cy="18" r="15" fill="none" stroke="#34d399" strokeWidth="4" strokeLinecap="round" strokeDasharray="94.2" strokeDashoffset="26" />
        </svg>
        <div>
          <p className="text-sm font-bold text-white">72 %</p>
          <p className="text-[11px] text-slate-400">Proyecto realizado</p>
        </div>
      </div>

      {/* Tarjeta flotante: notificación */}
      <div className="login-flotar-lento absolute -right-4 -top-2 flex items-center gap-2.5 rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2 shadow-xl backdrop-blur-xl">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-300"><BadgeCheck className="h-4 w-4" /></span>
        <div>
          <p className="text-xs font-semibold text-white">Cobro registrado</p>
          <p className="text-[10px] text-slate-400">Avance mensual 2 · $1.200</p>
        </div>
      </div>
    </div>
  )
}

function CampoCodigo({ valor, onCambio }: { valor: string; onCambio: (v: string) => void }) {
  const casillas = useRef<(HTMLInputElement | null)[]>([])
  const digitos = valor.padEnd(LARGO_CODIGO, ' ').slice(0, LARGO_CODIGO).split('')

  const enfocar = (i: number) => casillas.current[Math.max(0, Math.min(LARGO_CODIGO - 1, i))]?.focus()

  const escribir = (i: number, texto: string) => {
    const limpio = texto.replace(/\D/g, '')
    if (!limpio) return
    const nuevo = (valor.slice(0, i) + limpio).slice(0, LARGO_CODIGO)
    onCambio(nuevo)
    enfocar(nuevo.length)
  }

  const teclas = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault()
      const hasta = digitos[i]?.trim() ? i : i - 1
      onCambio(valor.slice(0, Math.max(0, hasta)))
      enfocar(hasta)
    } else if (e.key === 'ArrowLeft') enfocar(i - 1)
    else if (e.key === 'ArrowRight') enfocar(i + 1)
  }

  const pegar = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const limpio = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, LARGO_CODIGO)
    onCambio(limpio)
    enfocar(limpio.length)
  }

  return (
    <div className="flex justify-between gap-2" role="group" aria-label="Código de verificación">
      {digitos.map((d, i) => (
        <input
          key={i}
          ref={(el) => { casillas.current[i] = el }}
          autoFocus={i === 0}
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={LARGO_CODIGO}
          aria-label={`Dígito ${i + 1}`}
          value={d.trim()}
          onChange={(e) => escribir(i, e.target.value)}
          onKeyDown={(e) => teclas(i, e)}
          onPaste={pegar}
          onFocus={(e) => e.target.select()}
          className={`h-12 w-full min-w-0 rounded-xl border text-center text-lg font-bold tabular-nums text-slate-900 outline-none transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 ${d.trim() ? 'border-indigo-300 bg-indigo-50/50' : 'border-slate-200 bg-white'}`}
        />
      ))}
    </div>
  )
}

export default function Login() {
  const { usuario, pendiente2FA, iniciarSesion, verificarCodigo, cancelar } = useAuth()
  const navegar = useNavigate()
  const [correo, setCorreo] = useState('')
  const [clave, setClave] = useState('')
  const [verClave, setVerClave] = useState(false)
  const [codigo, setCodigo] = useState('')
  const [error, setError] = useState<string | null>(null)

  if (usuario) return <Navigate to="/" replace />

  const enviarCredenciales = (e: FormEvent) => {
    e.preventDefault()
    setError(iniciarSesion(correo, clave))
  }

  const enviarCodigo = (e: FormEvent) => {
    e.preventDefault()
    const resultado = verificarCodigo(codigo)
    setError(resultado)
    if (!resultado) navegar('/')
  }

  const usarCuenta = (cuenta: string) => {
    setCorreo(cuenta)
    setClave('demo1234')
    setError(null)
  }

  const volver = () => {
    cancelar()
    setCodigo('')
    setError(null)
  }

  const entrada =
    'w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100'
  const botonPrincipal =
    'group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:from-indigo-700 hover:to-indigo-600 hover:shadow-indigo-500/40 active:scale-[0.99] disabled:opacity-50'

  return (
    <div className="flex min-h-screen bg-slate-900">
      {/* Panel de marca */}
      <aside className="relative hidden flex-1 overflow-hidden lg:flex">
        <div className="login-cuadricula absolute inset-0" />
        <div className="login-mancha absolute -left-24 top-1/4 h-96 w-96 rounded-full bg-indigo-600/30 blur-3xl" />
        <div className="login-mancha-lenta absolute -bottom-24 right-0 h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl" />

        <div className="relative z-10 flex w-full flex-col justify-between p-10 xl:p-14">
          <Logotipo tamano={44} lema="Seguimiento de proyectos de software" />

          <div className="mx-auto w-full max-w-lg py-10">
            <h2 className="text-4xl font-bold leading-tight tracking-tight text-white xl:text-[2.75rem]">
              Cada entregable, <br />
              <span className="bg-gradient-to-r from-indigo-300 via-sky-300 to-emerald-300 bg-clip-text text-transparent">cada cobro</span>, bajo control.
            </h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-400">
              Sigue cada proyecto de software de principio a fin: avance de entregables, equipo y horas, documentos y cobros, todo en un mismo expediente.
            </p>
            <div className="mt-10">
              <VistaPrevia />
            </div>
          </div>

          <ul className="grid gap-4 xl:grid-cols-3">
            {BENEFICIOS.map(({ icono: Icono, titulo, detalle }) => (
              <li key={titulo} className="flex gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-emerald-300">
                  <Icono className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">{titulo}</p>
                  <p className="text-xs text-slate-400">{detalle}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* Formulario */}
      <main className="relative flex w-full items-center justify-center overflow-hidden px-4 py-10 lg:w-[520px] lg:shrink-0 lg:bg-slate-50 xl:w-[560px]">
        <div className="login-mancha absolute -top-32 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-indigo-600/30 blur-3xl lg:hidden" />

        <div className="relative w-full max-w-[400px]">
          <Logotipo tamano={44} lema="Seguimiento de proyectos de software" className="mb-8 lg:hidden" />

          <div className="rounded-3xl border border-slate-200/80 bg-white p-7 shadow-2xl shadow-slate-900/10 sm:p-8 lg:shadow-xl">
            {!pendiente2FA ? (
              <>
                <div className="mb-6">
                  <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> Acceso seguro
                  </span>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">Bienvenido de nuevo</h1>
                  <p className="mt-1 text-sm text-slate-500">Ingresa con tu cuenta corporativa para continuar.</p>
                </div>

                <form onSubmit={enviarCredenciales} className="space-y-4">
                  <div>
                    <label htmlFor="correo" className="mb-1.5 block text-xs font-semibold text-slate-700">Correo electrónico</label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input id="correo" className={entrada} type="email" autoComplete="email" placeholder="nombre@empresa.com" value={correo} onChange={(e) => setCorreo(e.target.value)} required />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="clave" className="mb-1.5 block text-xs font-semibold text-slate-700">Contraseña</label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        id="clave"
                        className={`${entrada} pr-11`}
                        type={verClave ? 'text' : 'password'}
                        autoComplete="current-password"
                        placeholder="••••••••"
                        value={clave}
                        onChange={(e) => setClave(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setVerClave((v) => !v)}
                        aria-label={verClave ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                      >
                        {verClave ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

                  <button className={botonPrincipal}>
                    Continuar
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </button>
                </form>

                <div className="mt-7">
                  <div className="mb-3 flex items-center gap-3">
                    <span className="h-px flex-1 bg-slate-200" />
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Cuentas de prueba</span>
                    <span className="h-px flex-1 bg-slate-200" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {CUENTAS.map(({ correo: c, rol, icono: Icono, color }) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => usarCuenta(c)}
                        className={`flex items-center gap-2.5 rounded-xl border p-2.5 text-left transition-all hover:-translate-y-0.5 hover:shadow-md ${correo === c ? 'border-indigo-300 bg-indigo-50/40 ring-2 ring-indigo-100' : 'border-slate-200 hover:border-slate-300'}`}
                      >
                        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${color}`}><Icono className="h-4 w-4" /></span>
                        <span className="min-w-0">
                          <span className="block text-xs font-semibold text-slate-800">{rol}</span>
                          <span className="block truncate text-[10px] text-slate-400">{c}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                  <p className="mt-3 text-center text-[11px] text-slate-400">
                    Clave <span className="font-mono font-semibold text-slate-600">demo1234</span> · código <span className="font-mono font-semibold text-slate-600">123456</span>
                  </p>
                </div>
              </>
            ) : (
              <>
                <button type="button" onClick={volver} className="mb-5 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 transition-colors hover:text-indigo-600">
                  <ArrowLeft className="h-3.5 w-3.5" /> Usar otra cuenta
                </button>
                <div className="mb-6">
                  <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-emerald-500 text-white shadow-lg shadow-indigo-500/30">
                    <ShieldCheck className="h-6 w-6" />
                  </span>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">Verifica tu identidad</h1>
                  <p className="mt-1 text-sm text-slate-500">
                    Ingresa el código de {LARGO_CODIGO} dígitos enviado a <strong className="font-semibold text-slate-700">{correo || 'tu correo'}</strong>.
                  </p>
                </div>
                <form onSubmit={enviarCodigo} className="space-y-5">
                  <CampoCodigo valor={codigo} onCambio={setCodigo} />
                  {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
                  <button className={botonPrincipal} disabled={codigo.length < LARGO_CODIGO}>
                    Verificar y entrar
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </button>
                </form>
                <p className="mt-5 text-center text-[11px] text-slate-400">Código de prueba: <span className="font-mono font-semibold text-slate-600">123456</span></p>
              </>
            )}
          </div>

          <p className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-slate-400 lg:text-slate-500">
            <Lock className="h-3 w-3" /> Acceso protegido con verificación en dos pasos
          </p>
        </div>
      </main>
    </div>
  )
}
