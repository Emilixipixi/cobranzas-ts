import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Camera, CheckCircle2, Eye, EyeOff, KeyRound, Loader2, Trash2, UploadCloud } from 'lucide-react'
import Avatar from '../componentes/Avatar'
import { ETIQUETAS_ROL } from '../componentes/modales/ModalUsuario'
import { Encabezado, Panel } from '../componentes/Panel'
import { useAuditoria } from '../contextos/AuditoriaContext'
import { useAuth } from '../contextos/AuthContext'
import { botonPrimario, botonSecundario, entrada, etiquetaCampo } from '../utils/estilos'

const LADO_FOTO = 256
const TIPOS_FOTO = ['image/png', 'image/jpeg', 'image/webp']
const MAXIMO_ORIGINAL = 8 * 1024 * 1024

/** Recorta la imagen al centro en un cuadrado y la reduce a 256 px para guardarla liviana. */
const reducirFoto = (archivo: File): Promise<string> =>
  new Promise((resolver, rechazar) => {
    const url = URL.createObjectURL(archivo)
    const imagen = new Image()
    imagen.onload = () => {
      const lado = Math.min(imagen.width, imagen.height)
      const lienzo = document.createElement('canvas')
      lienzo.width = LADO_FOTO
      lienzo.height = LADO_FOTO
      const contexto = lienzo.getContext('2d')
      if (!contexto) return rechazar(new Error('Sin lienzo'))
      contexto.drawImage(imagen, (imagen.width - lado) / 2, (imagen.height - lado) / 2, lado, lado, 0, 0, LADO_FOTO, LADO_FOTO)
      URL.revokeObjectURL(url)
      resolver(lienzo.toDataURL('image/jpeg', 0.85))
    }
    imagen.onerror = () => {
      URL.revokeObjectURL(url)
      rechazar(new Error('Imagen inválida'))
    }
    imagen.src = url
  })

/** Nivel de seguridad orientativo de la contraseña (0 a 4). */
const fortaleza = (clave: string): number =>
  [clave.length >= 8, /[a-z]/.test(clave) && /[A-Z]/.test(clave), /\d/.test(clave), /[^A-Za-z0-9]/.test(clave) || clave.length >= 12].filter(Boolean).length

const NIVELES = [
  { texto: 'Muy débil', color: 'bg-rose-500' },
  { texto: 'Débil', color: 'bg-rose-500' },
  { texto: 'Aceptable', color: 'bg-amber-500' },
  { texto: 'Buena', color: 'bg-emerald-500' },
  { texto: 'Excelente', color: 'bg-emerald-600' },
]

function CampoClave({ etiqueta, valor, onCambio, autoComplete }: { etiqueta: string; valor: string; onCambio: (v: string) => void; autoComplete: string }) {
  const [visible, setVisible] = useState(false)
  return (
    <div>
      <label className={etiquetaCampo}>{etiqueta}</label>
      <div className="relative">
        <input className={`${entrada} pr-10`} type={visible ? 'text' : 'password'} value={valor} onChange={(e) => onCambio(e.target.value)} autoComplete={autoComplete} required />
        <button type="button" onClick={() => setVisible((v) => !v)} aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-700">
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  )
}

export default function Configuracion() {
  const { usuario, actualizarFoto, cambiarClave } = useAuth()
  const { registrar } = useAuditoria()
  const campoFoto = useRef<HTMLInputElement>(null)
  const [procesando, setProcesando] = useState(false)
  const [arrastrando, setArrastrando] = useState(false)
  const [avisoFoto, setAvisoFoto] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null)
  const [actual, setActual] = useState('')
  const [nueva, setNueva] = useState('')
  const [confirmacion, setConfirmacion] = useState('')
  const [avisoClave, setAvisoClave] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null)

  if (!usuario) return null
  const nivel = fortaleza(nueva)

  const subirFoto = async (archivo?: File) => {
    if (!archivo) return
    if (!TIPOS_FOTO.includes(archivo.type)) return setAvisoFoto({ tipo: 'error', texto: 'Usa una imagen PNG, JPG o WEBP' })
    if (archivo.size > MAXIMO_ORIGINAL) return setAvisoFoto({ tipo: 'error', texto: 'La imagen supera los 8 MB' })
    setProcesando(true)
    try {
      const foto = await reducirFoto(archivo)
      const resultado = actualizarFoto(foto)
      if (resultado) setAvisoFoto({ tipo: 'error', texto: resultado })
      else {
        registrar('Actualizó su foto de perfil', usuario.nombre)
        setAvisoFoto({ tipo: 'ok', texto: 'Foto actualizada' })
      }
    } catch {
      setAvisoFoto({ tipo: 'error', texto: 'No se pudo leer la imagen' })
    }
    setProcesando(false)
  }

  const quitarFoto = () => {
    actualizarFoto(null)
    registrar('Quitó su foto de perfil', usuario.nombre)
    setAvisoFoto({ tipo: 'ok', texto: 'Se quitó la foto; se mostrarán tus iniciales' })
  }

  const guardarClave = (e: FormEvent) => {
    e.preventDefault()
    if (nueva !== confirmacion) return setAvisoClave({ tipo: 'error', texto: 'La confirmación no coincide con la nueva contraseña' })
    const resultado = cambiarClave(actual, nueva)
    if (resultado) return setAvisoClave({ tipo: 'error', texto: resultado })
    registrar('Cambió su contraseña', usuario.nombre)
    setActual('')
    setNueva('')
    setConfirmacion('')
    setAvisoClave({ tipo: 'ok', texto: 'Contraseña actualizada. Úsala la próxima vez que inicies sesión.' })
  }

  return (
    <>
      <Encabezado titulo="Configuración" subtitulo="Tu foto de perfil y tu contraseña de acceso" />

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel titulo="Foto de perfil" subtitulo="Se muestra en la barra superior y en el menú lateral">
          <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
            <div className="relative">
              <Avatar usuario={usuario} tamano={112} className="ring-4 ring-slate-100" />
              <button
                type="button"
                onClick={() => campoFoto.current?.click()}
                aria-label="Cambiar foto"
                className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-white shadow-md ring-4 ring-white hover:bg-indigo-700"
              >
                {procesando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              </button>
            </div>
            <div className="w-full min-w-0 flex-1">
              <p className="text-base font-bold text-slate-900">{usuario.nombre}</p>
              <p className="text-sm text-slate-500">{usuario.correo} · {ETIQUETAS_ROL[usuario.rol]}</p>
              <button
                type="button"
                onClick={() => campoFoto.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setArrastrando(true) }}
                onDragLeave={() => setArrastrando(false)}
                onDrop={(e) => { e.preventDefault(); setArrastrando(false); subirFoto(e.dataTransfer.files[0]) }}
                className={`mt-4 flex w-full flex-col items-center gap-1 rounded-xl border-2 border-dashed px-4 py-4 text-center transition-colors ${arrastrando ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'}`}
              >
                <UploadCloud className="h-5 w-5 text-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Arrastra una imagen o <span className="text-indigo-600">elige un archivo</span></span>
                <span className="text-[11px] text-slate-400">PNG, JPG o WEBP · se recorta en cuadrado automáticamente</span>
              </button>
              <input ref={campoFoto} type="file" accept={TIPOS_FOTO.join(',')} className="hidden" onChange={(e) => { subirFoto(e.target.files?.[0]); e.target.value = '' }} />
              {usuario.foto && (
                <button type="button" onClick={quitarFoto} className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-rose-600 hover:underline">
                  <Trash2 className="h-3.5 w-3.5" />Quitar foto
                </button>
              )}
              {avisoFoto && (
                <p className={`mt-3 flex items-center gap-1.5 text-sm ${avisoFoto.tipo === 'ok' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {avisoFoto.tipo === 'ok' && <CheckCircle2 className="h-4 w-4" />}{avisoFoto.texto}
                </p>
              )}
            </div>
          </div>
        </Panel>

        <Panel titulo="Cambiar contraseña" subtitulo="Mínimo 8 caracteres, combinando letras y números">
          <form onSubmit={guardarClave} className="space-y-3">
            <CampoClave etiqueta="Contraseña actual" valor={actual} onCambio={setActual} autoComplete="current-password" />
            <CampoClave etiqueta="Nueva contraseña" valor={nueva} onCambio={setNueva} autoComplete="new-password" />
            {nueva && (
              <div>
                <div className="flex gap-1">
                  {[0, 1, 2, 3].map((i) => <span key={i} className={`h-1.5 flex-1 rounded-full ${i < nivel ? NIVELES[nivel].color : 'bg-slate-200'}`} />)}
                </div>
                <p className="mt-1 text-[11px] text-slate-500">Seguridad: <strong>{NIVELES[nivel].texto}</strong> · usa mayúsculas, números y algún símbolo para reforzarla</p>
              </div>
            )}
            <CampoClave etiqueta="Confirmar nueva contraseña" valor={confirmacion} onCambio={setConfirmacion} autoComplete="new-password" />
            {confirmacion && nueva !== confirmacion && <p className="text-xs text-rose-600">No coincide con la nueva contraseña</p>}
            {avisoClave && (
              <p className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm ${avisoClave.tipo === 'ok' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                {avisoClave.tipo === 'ok' && <CheckCircle2 className="h-4 w-4 shrink-0" />}{avisoClave.texto}
              </p>
            )}
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => { setActual(''); setNueva(''); setConfirmacion(''); setAvisoClave(null) }} className={botonSecundario}>Limpiar</button>
              <button className={`${botonPrimario} inline-flex items-center gap-1.5`}><KeyRound className="h-4 w-4" />Guardar contraseña</button>
            </div>
          </form>
        </Panel>
      </div>
    </>
  )
}
