import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { CODIGO_2FA, DOMINIO_CORPORATIVO, HOY, usuarios as usuariosIniciales } from '../datos/datosEjemplo'
import type { Rol, Usuario } from '../tipos'

export interface DatosNuevoUsuario {
  nombre: string
  rol: Rol
  usuarioCorreo: string
  clave: string
}

export interface ResultadoCreacion {
  error: string | null
  usuario?: Usuario
}

interface AuthContextoValor {
  usuario: Usuario | null
  usuarios: Usuario[]
  pendiente2FA: boolean
  iniciarSesion: (correo: string, clave: string) => string | null
  verificarCodigo: (codigo: string) => string | null
  cancelar: () => void
  cerrarSesion: () => void
  crearUsuario: (datos: DatosNuevoUsuario) => ResultadoCreacion
  eliminarUsuario: (id: string) => string | null
  restablecerUsuarios: () => void
}

const AuthContext = createContext<AuthContextoValor | null>(null)

const CLAVE_SESION = 'sesionCobranzas'
const CLAVE_USUARIOS = 'cobranzasUsuariosV1'

const cargarUsuarios = (): Usuario[] => {
  try {
    const guardado = localStorage.getItem(CLAVE_USUARIOS)
    if (guardado) return JSON.parse(guardado) as Usuario[]
  } catch {
    return usuariosIniciales
  }
  return usuariosIniciales
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuarios, setUsuarios] = useState<Usuario[]>(cargarUsuarios)
  const [usuario, setUsuario] = useState<Usuario | null>(() => {
    const guardado = sessionStorage.getItem(CLAVE_SESION)
    return usuarios.find((u) => u.id === guardado) ?? null
  })
  const [candidato, setCandidato] = useState<Usuario | null>(null)

  useEffect(() => {
    try {
      localStorage.setItem(CLAVE_USUARIOS, JSON.stringify(usuarios))
    } catch {
      return
    }
  }, [usuarios])

  const iniciarSesion = (correo: string, clave: string): string | null => {
    const encontrado = usuarios.find((u) => u.correo === correo.trim().toLowerCase() && u.clave === clave)
    if (!encontrado) return 'Correo o contraseña incorrectos'
    setCandidato(encontrado)
    return null
  }

  const verificarCodigo = (codigo: string): string | null => {
    if (!candidato) return 'Primero inicia sesión'
    if (codigo.trim() !== CODIGO_2FA) return 'Código incorrecto'
    sessionStorage.setItem(CLAVE_SESION, candidato.id)
    setUsuario(candidato)
    setCandidato(null)
    return null
  }

  const cancelar = () => setCandidato(null)

  const cerrarSesion = () => {
    sessionStorage.removeItem(CLAVE_SESION)
    setUsuario(null)
    setCandidato(null)
  }

  const crearUsuario = (datos: DatosNuevoUsuario): ResultadoCreacion => {
    if (usuario?.rol !== 'administrador') return { error: 'Solo el administrador puede crear usuarios' }
    const nombre = datos.nombre.trim()
    const parteLocal = datos.usuarioCorreo.trim().toLowerCase()
    if (nombre.length < 3) return { error: 'Ingresa el nombre completo' }
    if (!/^[a-z0-9]+([._-][a-z0-9]+)*$/.test(parteLocal)) {
      return { error: 'El correo solo admite letras, números, punto, guion y guion bajo' }
    }
    if (datos.clave.length < 8) return { error: 'La contraseña temporal debe tener al menos 8 caracteres' }
    const correo = `${parteLocal}@${DOMINIO_CORPORATIVO}`
    if (usuarios.some((u) => u.correo === correo)) return { error: `Ya existe un usuario con el correo ${correo}` }

    const nuevo: Usuario = {
      id: `U${Date.now()}`,
      nombre,
      correo,
      clave: datos.clave,
      rol: datos.rol,
      fechaAlta: HOY,
    }
    setUsuarios((previos) => [...previos, nuevo])
    return { error: null, usuario: nuevo }
  }

  const eliminarUsuario = (id: string): string | null => {
    if (usuario?.rol !== 'administrador') return 'Solo el administrador puede eliminar usuarios'
    const objetivo = usuarios.find((u) => u.id === id)
    if (!objetivo) return null
    if (objetivo.id === usuario.id) return 'No puedes eliminar tu propio usuario'
    if (objetivo.rol === 'administrador' && usuarios.filter((u) => u.rol === 'administrador').length <= 1) {
      return 'Debe existir al menos un administrador'
    }
    setUsuarios((previos) => previos.filter((u) => u.id !== id))
    return null
  }

  const restablecerUsuarios = () => {
    const actual = usuarios.find((u) => u.id === usuario?.id)
    const conservar = actual && !usuariosIniciales.some((u) => u.id === actual.id) ? [actual] : []
    setUsuarios([...usuariosIniciales, ...conservar])
  }

  return (
    <AuthContext.Provider
      value={{
        usuario,
        usuarios,
        pendiente2FA: candidato !== null,
        iniciarSesion,
        verificarCodigo,
        cancelar,
        cerrarSesion,
        crearUsuario,
        eliminarUsuario,
        restablecerUsuarios,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextoValor {
  const contexto = useContext(AuthContext)
  if (!contexto) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return contexto
}