import { useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import { useAuth } from '../contextos/AuthContext'

export default function Login() {
  const { usuario, pendiente2FA, iniciarSesion, verificarCodigo, cancelar } = useAuth()
  const navegar = useNavigate()
  const [correo, setCorreo] = useState('')
  const [clave, setClave] = useState('')
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

  const entrada = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-900 p-4">
      <div className="mb-6 flex items-center gap-3 text-white">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-emerald-500 shadow-lg shadow-indigo-500/20">
          <ShieldCheck className="h-7 w-7 text-white" />
        </div>
        <div>
          <p className="text-2xl font-bold tracking-tight">Cobranzas</p>
          <p className="text-xs text-slate-400">Control documental y cobranzas de software</p>
        </div>
      </div>
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <h1 className="mb-1 text-xl font-bold text-slate-900">Iniciar sesión</h1>
        <p className="mb-4 text-sm text-slate-500">{pendiente2FA ? 'Ingresa el código de verificación' : 'Inicia sesión para continuar'}</p>

        {!pendiente2FA ? (
          <form onSubmit={enviarCredenciales} className="space-y-3">
            <input className={entrada} type="email" placeholder="Correo" value={correo} onChange={(e) => setCorreo(e.target.value)} required />
            <input className={entrada} type="password" placeholder="Contraseña" value={clave} onChange={(e) => setClave(e.target.value)} required />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button className="w-full rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700">Continuar</button>
          </form>
        ) : (
          <form onSubmit={enviarCodigo} className="space-y-3">
            <input className={entrada} inputMode="numeric" maxLength={6} placeholder="Código de 6 dígitos" value={codigo} onChange={(e) => setCodigo(e.target.value)} required />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button className="w-full rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700">Verificar</button>
            <button type="button" onClick={cancelar} className="w-full text-sm text-slate-500 hover:underline">Volver</button>
          </form>
        )}

        <div className="mt-5 rounded-md bg-slate-50 p-3 text-xs text-slate-500">
          <p className="mb-1 font-medium">Cuentas de prueba (clave demo1234, código 123456)</p>
          <p>admin@demo.com · comercial@demo.com</p>
          <p>finanzas@demo.com · dev@demo.com</p>
        </div>
      </div>
    </div>
  )
}
