import { useState } from 'react'
import type { FormEvent } from 'react'
import { Sparkles } from 'lucide-react'
import { useDatos } from '../../contextos/DatosContext'
import { catalogoCompleto, CATALOGO_TECNOLOGIAS } from '../../datos/tecnologias'
import { botonPrimario, botonSecundario, entrada, etiquetaCampo } from '../../utils/estilos'
import Modal from '../Modal'
import SelectorTecnologias from '../SelectorTecnologias'

interface Props {
  onCerrar: () => void
}

export const ESPECIALIDADES = ['Fullstack', 'Backend', 'Frontend / UI', 'Móvil', 'QA', 'DevOps']

export default function ModalDesarrollador({ onCerrar }: Props) {
  const { crearDesarrollador, desarrolladores } = useDatos()
  const [nombre, setNombre] = useState('')
  const [especialidad, setEspecialidad] = useState(ESPECIALIDADES[0])
  const [correo, setCorreo] = useState('')
  const [tecnologias, setTecnologias] = useState<string[]>([])

  const enUso = desarrolladores.flatMap((d) => d.tecnologias)
  const catalogo = catalogoCompleto(enUso)
  const popularidad = enUso.reduce<Record<string, number>>((acc, t) => ({ ...acc, [t]: (acc[t] ?? 0) + 1 }), {})
  const precargadas = new Set(CATALOGO_TECNOLOGIAS.map((t) => t.nombre))
  const nuevas = tecnologias.filter((t) => !catalogo.includes(t))
  // Sugerencias rápidas: las más usadas por el equipo y, si faltan, del catálogo.
  const rapidas = [...new Set([...Object.keys(popularidad).sort((a, b) => popularidad[b] - popularidad[a]), ...precargadas])]
    .filter((t) => !tecnologias.includes(t))
    .slice(0, 8)

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    crearDesarrollador({ nombre: nombre.trim(), especialidad, correo: correo.trim(), tecnologias })
    onCerrar()
  }

  return (
    <Modal titulo="Nuevo desarrollador" onCerrar={onCerrar} ancho="max-w-xl">
      <form onSubmit={enviar} className="space-y-3">
        <div>
          <label className={etiquetaCampo}>Nombre completo</label>
          <input className={entrada} value={nombre} onChange={(e) => setNombre(e.target.value)} required autoFocus />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={etiquetaCampo}>Rol / especialidad</label>
            <select className={entrada} value={especialidad} onChange={(e) => setEspecialidad(e.target.value)}>
              {ESPECIALIDADES.map((e) => <option key={e}>{e}</option>)}
            </select>
          </div>
          <div>
            <label className={etiquetaCampo}>Correo</label>
            <input className={entrada} type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} required />
          </div>
        </div>
        <div>
          <label className={etiquetaCampo}>Tecnologías</label>
          <SelectorTecnologias seleccion={tecnologias} onCambio={setTecnologias} catalogo={catalogo} popularidad={popularidad} />
          {rapidas.length > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-slate-400">Rápidas:</span>
              {rapidas.map((t) => (
                <button key={t} type="button" onClick={() => setTecnologias((previas) => [...previas, t])} className="rounded-full border border-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-600 hover:border-indigo-300 hover:text-indigo-700">
                  + {t}
                </button>
              ))}
            </div>
          )}
          {nuevas.length > 0 && (
            <p className="mt-2 inline-flex items-center gap-1 text-[11px] text-emerald-700">
              <Sparkles className="h-3 w-3" />
              {nuevas.join(', ')} {nuevas.length === 1 ? 'es nueva y se sumará' : 'son nuevas y se sumarán'} al catálogo del equipo.
            </p>
          )}
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onCerrar} className={botonSecundario}>Cancelar</button>
          <button className={botonPrimario}>Crear desarrollador</button>
        </div>
      </form>
    </Modal>
  )
}
