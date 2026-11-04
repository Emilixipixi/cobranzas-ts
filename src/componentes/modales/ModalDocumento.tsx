import { useState } from 'react'
import type { FormEvent } from 'react'
import { useDatos } from '../../contextos/DatosContext'
import { botonPrimario, botonSecundario, entrada, etiquetaCampo } from '../../utils/estilos'
import type { CategoriaDocumento, EstadoDocumento } from '../../tipos'
import Modal from '../Modal'

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
  const { agregarDocumento } = useDatos()
  const [titulo, setTitulo] = useState('')
  const [categoria, setCategoria] = useState<CategoriaDocumento>('cotizacion')
  const [version, setVersion] = useState('v1.0')
  const [estado, setEstado] = useState<EstadoDocumento>('borrador')
  const [notas, setNotas] = useState('')

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    agregarDocumento(proyectoId, { titulo: titulo.trim(), categoria, version, estado, notas })
    onCerrar()
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
              {CATEGORIAS.map((c) => <option key={c.id} value={c.id}>{c.etiqueta}</option>)}
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
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onCerrar} className={botonSecundario}>Cancelar</button>
          <button className={botonPrimario}>Guardar documento</button>
        </div>
      </form>
    </Modal>
  )
}
