import { useState } from 'react'
import { CheckCircle2, Clock4 } from 'lucide-react'
import { HOY } from '../../datos/datosEjemplo'
import { useAuth } from '../../contextos/AuthContext'
import { useDatos } from '../../contextos/DatosContext'
import { equipoDeProyecto, esJefe, redondearHoras } from '../../utils/equipo'
import {
  cumplimiento, horasExtraDe, idsConHoras, planificadoALaFecha, semanasDelProyecto, totalDeDesarrollador, totalDeProyecto, totalDeSemana, VENTANA_SEMANAS, horasDe,
} from '../../utils/horas'
import { aNumero, soloDecimales } from '../../utils/numeros'
import { etiquetaCortaSemana, etiquetaSemana, inicioSemana } from '../../utils/semanas'
import { formatoFecha } from '../../utils/finanzas'
import TarjetaMetrica from '../TarjetaMetrica'
import ControlHorasExtra from './ControlHorasExtra'
import type { Proyecto } from '../../tipos'

const formatoHoras = (n: number): string => `${n} h`

export default function PestanaHoras({ proyecto }: { proyecto: Proyecto }) {
  const { usuario } = useAuth()
  const { asignaciones, desarrolladores, horas, horasExtra, registrarHoras } = useDatos()
  const [error, setError] = useState<string | null>(null)

  const equipo = equipoDeProyecto(asignaciones, proyecto.id)
  const idsPersonas = idsConHoras(horas, proyecto.id, equipo)
  const todasLasSemanas = semanasDelProyecto(proyecto)
  const semanas = todasLasSemanas.slice(-VENTANA_SEMANAS)
  const semanaActual = inicioSemana(HOY)

  const filas = idsPersonas.map((id) => {
    const dev = desarrolladores.find((d) => d.id === id)
    const asignacion = equipo.find((a) => a.desarrolladorId === id)
    const invertido = totalDeDesarrollador(horas, proyecto.id, id)
    const planificado = asignacion ? planificadoALaFecha(asignacion, proyecto) : 0
    return { id, dev, asignacion, jefe: asignacion ? esJefe(asignacion, equipo) : false, invertido, planificado, avance: cumplimiento(invertido, planificado) }
  })

  const totalInvertido = totalDeProyecto(horas, proyecto.id)
  const totalPlanificado = redondearHoras(filas.reduce((suma, f) => suma + f.planificado, 0))
  const avanceEquipo = cumplimiento(totalInvertido, totalPlanificado)
  const totalSemanaActual = totalDeSemana(horas, proyecto.id, semanaActual)
  const esAdministrador = usuario?.rol === 'administrador'
  const extrasProyecto = horasExtra
    .filter((x) => x.proyectoId === proyecto.id)
    .sort((a, b) => b.semana.localeCompare(a.semana))
  const totalExtra = redondearHoras(extrasProyecto.reduce((suma, x) => suma + x.horas, 0))

  const puedeEditar = (desarrolladorId: string): boolean => {
    if (!usuario) return false
    if (usuario.rol === 'administrador' || usuario.rol === 'comercial') return true
    const dev = desarrolladores.find((d) => d.id === desarrolladorId)
    return usuario.rol === 'desarrollador' && dev?.usuarioId === usuario.id
  }

  const hayCasillasEditables = filas.some((f) => Boolean(f.asignacion) && puedeEditar(f.id))

  const confirmar = (desarrolladorId: string, semana: string, campo: HTMLInputElement) => {
    const nuevo = aNumero(soloDecimales(campo.value, 2, 2))
    const resultado = registrarHoras(proyecto.id, desarrolladorId, semana, nuevo)
    setError(resultado)
    campo.value = resultado ? campo.defaultValue : nuevo === 0 ? '' : String(nuevo)
  }

  if (todasLasSemanas.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
        El proyecto inicia el {formatoFecha(proyecto.fechaInicio)}. Las horas se registran por semana desde su primera semana de trabajo.
      </div>
    )
  }

  return (
    <>
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <TarjetaMetrica titulo="Horas invertidas" valor={formatoHoras(totalInvertido)} detalle={`${filas.length} ${filas.length === 1 ? 'persona' : 'personas'} en conjunto`} />
        <TarjetaMetrica titulo="Horas planificadas a la fecha" valor={formatoHoras(totalPlanificado)} detalle="Según horas diarias asignadas" />
        <TarjetaMetrica
          titulo="Cumplimiento de horas"
          valor={avanceEquipo === null ? '—' : `${avanceEquipo} %`}
          tono={avanceEquipo !== null && avanceEquipo >= 90 ? 'ok' : 'alerta'}
          detalle="Invertidas frente a planificadas"
        />
        <TarjetaMetrica titulo="Semana actual" valor={formatoHoras(totalSemanaActual)} detalle={etiquetaSemana(semanaActual)} />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-indigo-100 bg-indigo-50/50 px-4 py-3 text-sm text-slate-700">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white"><Clock4 className="h-4 w-4" /></span>
        <p className="min-w-0 flex-1">
          Las horas planificadas del equipo son fijas: nadie puede registrar más horas que su plan semanal.
          {esAdministrador
            ? ' Para permitir horas extra, haz clic en «+ extra» bajo la semana de la persona, marca la aprobación e indica la cantidad.'
            : ' Si necesitas más horas, el administrador debe aprobar horas extra para esa semana.'}
        </p>
        <span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-semibold text-indigo-700 shadow-sm">{totalExtra} h extra aprobadas</span>
      </div>

      {error && <p className="mb-3 rounded-lg bg-red-100 px-3 py-2 text-sm text-red-800">{error}</p>}

      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="p-4">
          <h3 className="text-sm font-semibold">Contabilidad de horas por semana</h3>
          <p className="text-xs text-slate-500">
            Cada persona registra sus horas de la semana (de lunes a domingo).
            {hayCasillasEditables
              ? ' Las casillas con borde son editables: escribe o borra el valor y confirma al salir de la casilla.'
              : ' Estás en modo de solo lectura: tu rol no puede modificar estas horas.'}
            {todasLasSemanas.length > semanas.length && ` Se muestran las últimas ${VENTANA_SEMANAS} semanas; los totales incluyen todo el historial.`}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-slate-500">
              <tr>
                <th className="sticky left-0 z-10 bg-slate-50 p-3 text-left font-medium">Persona</th>
                <th className="p-3 text-right font-medium">Plan h/sem</th>
                {semanas.map((semana) => (
                  <th key={semana} title={etiquetaSemana(semana)} className={`whitespace-nowrap p-3 text-right font-medium ${semana === semanaActual ? 'text-indigo-600' : ''}`}>
                    {etiquetaCortaSemana(semana)}
                  </th>
                ))}
                <th className="p-3 text-right font-medium">Total invertido</th>
                <th className="p-3 text-right font-medium">Planificado</th>
                <th className="p-3 text-right font-medium">Cumplimiento</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((fila) => (
                <tr key={fila.id} className="border-t border-slate-100">
                  <td className="sticky left-0 z-10 whitespace-nowrap bg-white p-3">
                    <span className="font-medium text-slate-900">{fila.dev?.nombre ?? fila.id}</span>
                    {fila.jefe && <span className="ml-2 rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700">Jefe</span>}
                    {!fila.asignacion && <span className="ml-2 text-[11px] text-slate-400">Ya no está en el equipo</span>}
                  </td>
                  <td className="p-3 text-right tabular-nums text-slate-500">{fila.asignacion?.horasSemana ?? '—'}</td>
                  {semanas.map((semana) => {
                    const valor = horasDe(horas, proyecto.id, fila.id, semana)
                    const editable = Boolean(fila.asignacion) && puedeEditar(fila.id)
                    const extra = horasExtraDe(horasExtra, proyecto.id, fila.id, semana)
                    const limite = fila.asignacion ? redondearHoras(fila.asignacion.horasSemana + extra) : 0
                    return (
                      <td key={semana} className={`p-1.5 text-right align-top ${semana === semanaActual ? 'bg-indigo-50/40' : ''}`}>
                        <div className="flex flex-col items-end">
                        {editable ? (
                          <input
                            key={`${fila.id}-${semana}-${valor}`}
                            inputMode="decimal"
                            placeholder="0"
                            defaultValue={valor === 0 ? '' : String(valor)}
                            aria-label={`Horas de ${fila.dev?.nombre} en la semana del ${etiquetaSemana(semana)}`}
                            title={`Máximo ${limite} h`}
                            onBlur={(e) => confirmar(fila.id, semana, e.currentTarget)}
                            className="w-16 rounded-md border border-slate-300 bg-white px-2 py-1 text-right text-sm tabular-nums outline-none hover:border-indigo-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                          />
                        ) : (
                          <span className="block px-2 py-1 tabular-nums text-slate-700">{valor === 0 ? '—' : valor}</span>
                        )}
                        {fila.asignacion && (
                          <ControlHorasExtra
                            key={`${fila.id}-${semana}-${extra}`}
                            proyectoId={proyecto.id}
                            desarrolladorId={fila.id}
                            nombre={fila.dev?.nombre ?? fila.id}
                            semana={semana}
                            plan={fila.asignacion.horasSemana}
                            extra={extra}
                            esAdministrador={esAdministrador}
                            onError={setError}
                          />
                        )}
                        </div>
                      </td>
                    )
                  })}
                  <td className="p-3 text-right font-semibold tabular-nums text-slate-900">{formatoHoras(fila.invertido)}</td>
                  <td className="p-3 text-right tabular-nums text-slate-500">{formatoHoras(fila.planificado)}</td>
                  <td className={`p-3 text-right font-medium tabular-nums ${fila.avance !== null && fila.avance < 80 ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {fila.avance === null ? '—' : `${fila.avance} %`}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-200 bg-slate-50 font-semibold">
                <td className="sticky left-0 z-10 bg-slate-50 p-3">Total del equipo</td>
                <td className="p-3 text-right tabular-nums text-slate-500">{redondearHoras(equipo.reduce((suma, a) => suma + a.horasSemana, 0))}</td>
                {semanas.map((semana) => (
                  <td key={semana} className="p-3 text-right tabular-nums">{totalDeSemana(horas, proyecto.id, semana) || '—'}</td>
                ))}
                <td className="p-3 text-right tabular-nums text-slate-900" data-total-equipo>{formatoHoras(totalInvertido)}</td>
                <td className="p-3 text-right tabular-nums text-slate-500">{formatoHoras(totalPlanificado)}</td>
                <td className="p-3 text-right tabular-nums">{avanceEquipo === null ? '—' : `${avanceEquipo} %`}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {extrasProyecto.length > 0 && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold">Horas extra aprobadas</h3>
          <ul className="divide-y divide-slate-100">
            {extrasProyecto.map((x) => (
              <li key={x.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span className="font-medium text-slate-900">{desarrolladores.find((d) => d.id === x.desarrolladorId)?.nombre ?? x.desarrolladorId}</span>
                  <span className="text-slate-500">· semana del {etiquetaSemana(x.semana)}</span>
                </span>
                <span className="flex items-center gap-3 text-xs text-slate-500">
                  Aprobó {x.aprobadoPor}
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700">+{x.horas} h</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="mb-3 text-sm font-semibold">Reparto de horas invertidas</h3>
        <ul className="space-y-3">
          {filas.map((fila) => {
            const porcentaje = totalInvertido > 0 ? Math.round((fila.invertido / totalInvertido) * 100) : 0
            return (
              <li key={fila.id}>
                <div className="mb-1 flex justify-between text-xs text-slate-600">
                  <span className="font-medium text-slate-800">{fila.dev?.nombre ?? fila.id}</span>
                  <span className="tabular-nums">{formatoHoras(fila.invertido)} · {porcentaje} %</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div className="h-2 rounded-full bg-indigo-500" style={{ width: `${porcentaje}%` }} />
                </div>
              </li>
            )
          })}
        </ul>
        <p className="mt-4 border-t border-slate-100 pt-3 text-sm text-slate-600">
          Total invertido por todo el equipo en conjunto: <strong className="text-slate-900">{formatoHoras(totalInvertido)}</strong>
        </p>
      </div>
    </>
  )
}