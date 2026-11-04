import { useState } from 'react'
import { Link } from 'react-router-dom'
import ModalDesarrollador from '../componentes/modales/ModalDesarrollador'
import { useDatos } from '../contextos/DatosContext'
import { botonPrimario } from '../utils/estilos'

export default function Desarrolladores() {
  const { desarrolladores, asignaciones, proyectos, eliminarDesarrollador } = useDatos()
  const [creando, setCreando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const eliminar = (id: string, nombre: string) => {
    if (!window.confirm(`¿Eliminar a ${nombre}? Se quitará de todos sus proyectos.`)) return
    setError(eliminarDesarrollador(id))
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-semibold">Desarrolladores</h2>
        <button className={botonPrimario} onClick={() => setCreando(true)}>+ Nuevo desarrollador</button>
      </div>

      {error && <div className="mb-3 rounded-lg bg-red-100 px-4 py-2 text-sm text-red-800">{error}</div>}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="text-left text-slate-500">
            <tr>
              {['Nombre', 'Especialidad', 'Correo', 'Tecnologías', 'Proyectos asignados', 'Horas/sem', 'Acceso', ''].map((t) => (
                <th key={t} className="p-3 font-medium">{t}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {desarrolladores.length === 0 && (
              <tr><td colSpan={8} className="p-4 text-center text-slate-400">No hay desarrolladores registrados</td></tr>
            )}
            {desarrolladores.map((d) => {
              const mias = asignaciones.filter((a) => a.desarrolladorId === d.id)
              const horas = mias.reduce((suma, a) => suma + a.horasSemana, 0)
              return (
                <tr key={d.id} className="border-t border-slate-100">
                  <td className="whitespace-nowrap p-3 font-medium">{d.nombre}</td>
                  <td className="p-3">{d.especialidad}</td>
                  <td className="p-3">{d.correo}</td>
                  <td className="p-3 text-xs text-slate-600">{d.tecnologias.join(', ') || '—'}</td>
                  <td className="p-3 text-xs">
                    {mias.length === 0 && <span className="text-slate-400">Sin proyectos</span>}
                    {mias.map((a) => {
                      const proyecto = proyectos.find((p) => p.id === a.proyectoId)
                      return proyecto ? (
                        <Link key={a.id} to={`/proyectos/${proyecto.id}`} className="mr-2 text-blue-700 hover:underline">{proyecto.nombre}</Link>
                      ) : null
                    })}
                  </td>
                  <td className={`p-3 tabular-nums ${horas > 40 ? 'font-semibold text-amber-700' : ''}`}>{horas}</td>
                  <td className="p-3 text-xs">{d.usuarioId ? 'Con usuario' : 'Sin usuario'}</td>
                  <td className="p-3 text-right">
                    <button className="text-xs text-red-700 hover:underline" onClick={() => eliminar(d.id, d.nombre)}>Eliminar</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {creando && <ModalDesarrollador onCerrar={() => setCreando(false)} />}
    </>
  )
}
