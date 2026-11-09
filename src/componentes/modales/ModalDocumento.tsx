import { useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from '../../contextos/AuthContext'
import { useDatos } from '../../contextos/DatosContext'
import { botonPrimario, botonSecundario, entrada, etiquetaCampo } from '../../utils/estilos'
import type { CategoriaDocumento, EstadoDocumento } from '../../tipos'
import { puedeVerCategoria } from '../../utils/permisosDocumentos'
import Modal from '../Modal'
import SelectorArchivo from '../SelectorArchivo'
import { subirArchivoDocumento } from './ModalVerDocumento'

interface Props {
  proyectoId: string
  onCerrar: () => void
}

const CATEGORIAS: { id: CategoriaDocumento; etiqueta: string }[] = [
  { id: 'cotizacion', etiqueta: 'Cotización' },
  { id: 'contrato', etiqueta: 'Contrato' },
  { id: 'acta', etiqueta: 'Acta de entrega-recepción' },
  { id: 'anexo', etiqueta: 'Anexo' },
]

const ESTADOS: EstadoDocumento[] = ['borrador', 'en revisión', 'firmado', 'aprobado']

export default function ModalDocumento({ proyectoId, onCerrar }: Props) {
  const { usuario } = useAuth()
  const { agregarDocumento, permisosDocumentos } = useDatos()
  const categorias = CATEGORIAS.filter((c) => puedeVerCategoria(usuario?.rol, c.id, permisosDocumentos))
  const [titulo, setTitulo] = useState('')
  const [categoria, setCategoria] = useState<CategoriaDocumento>(categorias[0]?.id ?? 'anexo')
  const [version, setVersion] = useState('v1.0')
  const [estado, setEstado] = useState<EstadoDocumento>('borrador')
  const [notas, setNotas] = useState('')
  const [archivo, setArchivo] = useState<File | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const enviar = async (e: FormEvent) => {
    e.preventDefault()
    setGuardando(true)
    try {
      const adjunto = archivo ? await subirArchivoDocumento(`${proyectoId}-nuevo`, archivo, usuario?.nombre ?? 'Sistema') : undefined
      agregarDocumento(proyectoId, { titulo: titulo.trim(), categoria, version, estado, notas, archivo: adjunto })
      onCerrar()
    } catch {
      setError('No se pudo guardar el archivo en este navegador. Intenta con un archivo más liviano.')
      setGuardando(false)
    }
  }

  return (
    <Modal titulo="Agregar documento" onCerrar={onCerrar}>
      <form onSubmit={enviar} className="space-y-3">
        <div>
          <label className={etiquetaCampo}>Título</label>
          <input className={entrada} value={titulo} onChange={(e) => setTitulo(e.target.value)} required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={etiquetaCampo}>Categoría</label>
            <select className={entrada} value={categoria} onChange={(e) => setCategoria(e.target.value as CategoriaDocumento)}>
              {categorias.map((c) => <option key={c.id} value={c.id}>{c.etiqueta}</option>)}
            </select>
          </div>
          <div>
            <label className={etiquetaCampo}>Estado</label>
            <select className={entrada} value={estado} onChange={(e) => setEstado(e.target.value as EstadoDocumento)}>
              {ESTADOS.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className={etiquetaCampo}>Versión</label>
          <input className={entrada} value={version} onChange={(e) => setVersion(e.target.value)} required />
        </div>
        <div>
          <label className={etiquetaCampo}>Observaciones</label>
          <textarea className={entrada} rows={3} value={notas} onChange={(e) => setNotas(e.target.value)} />
        </div>
        <div>
          <label className={etiquetaCampo}>Archivo del documento (PDF o imagen, opcional)</label>
          <SelectorArchivo archivo={archivo} onCambio={setArchivo} queSube="el documento" />
        </div>
        {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onCerrar} className={botonSecundario}>Cancelar</button>
          <button className={botonPrimario} disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar documento'}</button>
        </div>
      </form>
    </Modal>
  )
}
