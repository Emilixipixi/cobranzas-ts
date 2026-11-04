import { useState } from 'react'
import { Link } from 'react-router-dom'
import EtiquetaEstado from '../componentes/EtiquetaEstado'
import { ETIQUETAS_CATEGORIA } from '../componentes/expediente/PestanaDocumentos'
import { useDatos } from '../contextos/DatosContext'
import { entrada } from '../utils/estilos'
import { formatoFecha } from '../utils/finanzas'

export default function Documentos() {
  const { documentos, proyectos } = useDatos()
  const [categoria, setCategoria] = useState('todas')
  const lista = documentos
    .filter((d) => categoria === 'todas' || d.categoria === categoria)
    .sort((a, b) => b.fecha.localeCompare(a.fecha))

  return (
    <>
      <h2 className="mb-4 text-xl font-semibold">Documentación</h2>
      <select className={`${entrada} mb-3 max-w-xs`} value={categoria} onChange={(e) => setCategoria(e.target.value)}>
        <option value="todas">Todas las categorías</option>
        {Object.entries(ETIQUETAS_CATEGORIA).map(([id, texto]) => <option key={id} value={id}>{texto}</option>)}
      </select>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="text-left text-slate-500">
            <tr>
              {['Documento', 'Proyecto', 'Categoría', 'Versión', 'Fecha', 'Estado'].map((t) => <th key={t} className="p-3 font-medium">{t}</th>)}
            </tr>
          </thead>
          <tbody>
            {lista.map((d) => {
              const proyecto = proyectos.find((p) => p.id === d.proyectoId)
              return (
                <tr key={d.id} className="border-t border-slate-100">
                  <td className="p-3">{d.titulo}</td>
                  <td className="p-3">{proyecto && <Link to={`/proyectos/${proyecto.id}`} className="text-blue-700 hover:underline">{proyecto.nombre}</Link>}</td>
                  <td className="p-3">{ETIQUETAS_CATEGORIA[d.categoria]}</td>
                  <td className="p-3">{d.version}</td>
                  <td className="whitespace-nowrap p-3">{formatoFecha(d.fecha)}</td>
                  <td className="p-3"><EtiquetaEstado estado={d.estado} /></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}
