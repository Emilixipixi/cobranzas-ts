import { useState } from 'react'
import { HOY } from '../../datos/datosEjemplo'
import { useDatos } from '../../contextos/DatosContext'
import { botonSecundario } from '../../utils/estilos'
import { diasEntre, formatoFecha, sumarDias } from '../../utils/finanzas'
import { datosDeProyecto, progresoEntrega } from '../../utils/indicadores'
import EtiquetaEstado from '../EtiquetaEstado'
import ModalAsignarDesarrollador from '../modales/ModalAsignarDesarrollador'
import TarjetaMetrica from '../TarjetaMetrica'
import type { Proyecto } from '../../tipos'

interface Props {
  proyecto: Proyecto
  puedeEditar: boolean
}

export default function PestanaEquipo({ proyecto, puedeEditar }: Props) {
  const { asignaciones, desarrolladores, contratos, cuotas, quitarAsignacion } = useDatos()
  const [asignando, setAsignando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const equipo = asignaciones.filter((a) => a.proyectoId === proyecto.id)
  const horasTotales = equipo.reduce((suma, a) => suma + a.horasSemana, 0)
  const entregables = datosDeProyecto(proyecto.id, contratos, cuotas).cuotas.filter((q) => q.entregable !== '')
  const limite = sumarDias(proyecto.fechaEntrega, proyecto.diasContingencia)
  const diasRestantes = diasEntre(HOY, proyecto.fechaEntrega)

  return (
    <>
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <TarjetaMetrica titulo="Inicio" valor={formatoFecha(proyecto.fechaInicio)} />
        <TarjetaMetrica titulo="Entrega ofrecida" valor={formatoFecha(proyecto.fechaEntrega)} detalle={`${proyecto.mesesOfrecidos} meses`} />
        <TarjetaMetrica titulo="Límite con contingencia" valor={formatoFecha(limite)} detalle={`${proyecto.diasContingencia} días de margen`} />
        <TarjetaMetrica
          titulo="Días para la entrega"
          valor={diasRestantes >= 0 ? String(diasRestantes) : `${Math.abs(diasRestantes)} de atraso`}
          tono={diasRestantes < 0 ? 'peligro' : diasRestantes <= 15 ? 'alerta' : 'neutro'}
          detalle={`Avance de entregables: ${progresoEntrega(entregables)} %`}
        />
      </div>

      <div className="mb-4 rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between p-4">
          <h3 className="text-sm font-semibold">Equipo asignado · {horasTotales} h/semana</h3>
          {puedeEditar && <button className={botonSecundario} onClick={() => setAsignando(true)}>+ Asignar</button>}
        </div>
        {error && <p className="mx-4 mb-3 rounded-lg bg-red-100 px-3 py-2 text-sm text-red-800">{error}</p>}
        <table className="w-full text-sm">
          <thead className="text-left text-slate-500">
            <tr>
              <th className="p-3 font-medium">Desarrollador</th>
              <th className="p-3 font-medium">Especialidad</th>
              <th className="p-3 font-medium">Tecnologías</th>
              <th className="p-3 text-right font-medium">Horas/sem</th>
              {puedeEditar && <th className="p-3" />}
            </tr>
          </thead>
          <tbody>
            {equipo.length === 0 && <tr><td colSpan={5} className="p-4 text-center text-slate-400">Sin desarrolladores asignados</td></tr>}
            {equipo.map((a) => {
              const dev = desarrolladores.find((d) => d.id === a.desarrolladorId)
              return (
                <tr key={a.id} className="border-t border-slate-100">
                  <td className="p-3">{dev?.nombre}</td>
                  <td className="p-3">{dev?.especialidad}</td>
                  <td className="p-3 text-xs text-slate-600">{dev?.tecnologias.join(', ')}</td>
                  <td className="p-3 text-right tabular-nums">{a.horasSemana}</td>
                  {puedeEditar && (
                    <td className="p-3 text-right">
                      <button className="text-xs text-red-700 hover:underline" onClick={() => setError(quitarAsignacion(a.id))}>Quitar</button>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white">
        <h3 className="p-4 text-sm font-semibold">Entregables comprometidos</h3>
        <table className="w-full text-sm">
          <thead className="text-left text-slate-500">
            <tr>
              <th className="p-3 font-medium">Hito</th>
              <th className="p-3 font-medium">Entregable</th>
              <th className="p-3 font-medium">Fecha prevista</th>
              <th className="p-3 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody>
            {entregables.map((q) => (
              <tr key={q.id} className="border-t border-slate-100">
                <td className="p-3">{q.concepto}</td>
                <td className="p-3">{q.entregable}</td>
                <td className="p-3">{formatoFecha(q.fechaProyectada)}</td>
                <td className="p-3"><EtiquetaEstado estado={q.estadoEntrega} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {asignando && <ModalAsignarDesarrollador proyectoId={proyecto.id} onCerrar={() => setAsignando(false)} />}
    </>
  )
}
