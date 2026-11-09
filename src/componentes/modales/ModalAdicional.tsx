import { useState } from 'react'
import type { FormEvent } from 'react'
import { useDatos } from '../../contextos/DatosContext'
import { HOY } from '../../datos/datosEjemplo'
import { botonPrimario, botonSecundario, entrada, etiquetaCampo } from '../../utils/estilos'
import { formatoFecha, formatoMoneda, sumarDias } from '../../utils/finanzas'
import { aNumero, soloDecimales, soloEnteros } from '../../utils/numeros'
import type { Adicional } from '../../tipos'
import Modal from '../Modal'

interface Props {
  proyectoId: string
  /** Si llega, se edita o se cotiza ese adicional. */
  adicional?: Adicional
  modo?: 'registrar' | 'editar' | 'cotizar'
  onCerrar: () => void
}

/** Registrar, editar o cotizar una solicitud de adicional. */
export function ModalAdicional({ proyectoId, adicional, modo = 'registrar', onCerrar }: Props) {
  const { proyectos, clientes, registrarAdicional, editarAdicional } = useDatos()
  const proyecto = proyectos.find((p) => p.id === proyectoId)
  const contacto = clientes.find((c) => c.id === proyecto?.clienteId)?.contacto ?? ''
  const [titulo, setTitulo] = useState(adicional?.titulo ?? '')
  const [descripcion, setDescripcion] = useState(adicional?.descripcion ?? '')
  const [solicitadoPor, setSolicitadoPor] = useState(adicional?.solicitadoPor ?? contacto)
  const [fechaSolicitud, setFechaSolicitud] = useState(adicional?.fechaSolicitud ?? HOY)
  const [monto, setMonto] = useState(adicional?.montoEstimado ? String(adicional.montoEstimado) : '')
  const [dias, setDias] = useState(adicional?.diasEstimados ? String(adicional.diasEstimados) : '')
  const [error, setError] = useState<string | null>(null)

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    const datos = { titulo, descripcion, solicitadoPor, fechaSolicitud, montoEstimado: aNumero(monto), diasEstimados: aNumero(dias) }
    const resultado = adicional ? editarAdicional(adicional.id, datos, modo === 'cotizar') : registrarAdicional(proyectoId, datos)
    if (resultado) return setError(resultado)
    onCerrar()
  }

  const tituloModal = modo === 'cotizar' ? 'Cotizar adicional' : adicional ? 'Editar adicional' : 'Registrar adicional'

  return (
    <Modal titulo={tituloModal} onCerrar={onCerrar} ancho="max-w-xl">
      <form onSubmit={enviar} className="space-y-3">
        {modo === 'cotizar' ? (
          <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700"><strong>{titulo}</strong> · pedido por {solicitadoPor} el {formatoFecha(fechaSolicitud)}</p>
        ) : (
          <>
            <div>
              <label className={etiquetaCampo}>¿Qué pidió el cliente?</label>
              <input className={entrada} value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ej.: Recordatorios por WhatsApp" required autoFocus />
            </div>
            <div>
              <label className={etiquetaCampo}>Detalle</label>
              <textarea className={entrada} rows={3} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Alcance, pantallas o funciones nuevas que implica" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={etiquetaCampo}>Solicitado por</label>
                <input className={entrada} value={solicitadoPor} onChange={(e) => setSolicitadoPor(e.target.value)} required />
              </div>
              <div>
                <label className={etiquetaCampo}>Fecha de la solicitud</label>
                <input className={entrada} type="date" value={fechaSolicitud} max={HOY} onChange={(e) => setFechaSolicitud(e.target.value)} required />
              </div>
            </div>
          </>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={etiquetaCampo}>Monto {modo === 'cotizar' ? 'cotizado' : 'estimado (opcional)'}</label>
            <input className={entrada} inputMode="decimal" value={monto} onChange={(e) => setMonto(soloDecimales(e.target.value, 2, 9))} placeholder="0,00" required={modo === 'cotizar'} autoFocus={modo === 'cotizar'} />
          </div>
          <div>
            <label className={etiquetaCampo}>Días de trabajo extra</label>
            <input className={entrada} inputMode="numeric" value={dias} onChange={(e) => setDias(soloEnteros(e.target.value, 3))} placeholder="0" />
          </div>
        </div>
        {modo === 'registrar' && <p className="text-[11px] text-slate-400">Si ya tiene monto, queda como «Cotizado»; si no, como «Solicitado» para cotizarlo después.</p>}
        {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onCerrar} className={botonSecundario}>Cancelar</button>
          <button className={botonPrimario}>{modo === 'cotizar' ? 'Guardar cotización' : adicional ? 'Guardar cambios' : 'Registrar adicional'}</button>
        </div>
      </form>
    </Modal>
  )
}

/** Aprobación: genera el contrato de ampliación y, si se pide, corre la fecha de entrega. */
export function ModalAprobarAdicional({ adicional, onCerrar }: { adicional: Adicional; onCerrar: () => void }) {
  const { proyectos, contratos, aprobarAdicional } = useDatos()
  const proyecto = proyectos.find((p) => p.id === adicional.proyectoId)
  const delProyecto = contratos.filter((k) => k.proyectoId === adicional.proyectoId)
  const original = delProyecto.find((k) => k.tipo === 'original') ?? delProyecto[0]
  const numero = `${original?.numero ?? proyecto?.codigo ?? ''}-A${delProyecto.filter((k) => k.tipo === 'ampliacion').length + 1}`
  const [monto, setMonto] = useState(adicional.montoEstimado ? String(adicional.montoEstimado) : '')
  const [dias, setDias] = useState(adicional.diasEstimados ? String(adicional.diasEstimados) : '0')
  const [extender, setExtender] = useState(adicional.diasEstimados > 0)
  const [error, setError] = useState<string | null>(null)
  if (!proyecto) return null
  const diasNum = aNumero(dias)
  const nuevaEntrega = extender && diasNum > 0 ? sumarDias(proyecto.fechaEntrega, diasNum) : proyecto.fechaEntrega

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    const resultado = aprobarAdicional(adicional.id, { monto: aNumero(monto), dias: diasNum, extenderEntrega: extender })
    if (resultado) return setError(resultado)
    onCerrar()
  }

  return (
    <Modal titulo="Aprobar adicional" onCerrar={onCerrar} ancho="max-w-xl">
      <form onSubmit={enviar} className="space-y-4">
        <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700"><strong>{adicional.titulo}</strong> · {proyecto.nombre}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={etiquetaCampo}>Monto aprobado por el cliente</label>
            <input className={entrada} inputMode="decimal" value={monto} onChange={(e) => setMonto(soloDecimales(e.target.value, 2, 9))} required autoFocus />
          </div>
          <div>
            <label className={etiquetaCampo}>Días de trabajo extra</label>
            <input className={entrada} inputMode="numeric" value={dias} onChange={(e) => setDias(soloEnteros(e.target.value, 3))} />
          </div>
        </div>
        <label className="flex items-start gap-2.5 rounded-xl border border-slate-200 p-3 text-sm">
          <input type="checkbox" className="mt-0.5 h-4 w-4 accent-indigo-600" checked={extender} onChange={(e) => setExtender(e.target.checked)} />
          <span>
            <span className="block font-medium text-slate-900">Extender la fecha de entrega del proyecto</span>
            <span className="block text-xs text-slate-500">
              {extender && diasNum > 0 ? `Pasa del ${formatoFecha(proyecto.fechaEntrega)} al ${formatoFecha(nuevaEntrega)}. La fecha anterior queda registrada.` : `Se mantiene el ${formatoFecha(proyecto.fechaEntrega)}.`}
            </span>
          </span>
        </label>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 text-sm text-emerald-900">
          <p className="font-semibold">Se creará el contrato de ampliación {numero}</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-5 text-xs text-emerald-800">
            <li>Por {formatoMoneda(aNumero(monto), original?.moneda)}, separado del contrato original y con su propio cronograma.</li>
            <li>Con una cuota del 100 % que vence el {formatoFecha(nuevaEntrega)}; puedes dividirla en «Plan de pagos».</li>
            <li>Finanzas lo verá en el control de cobranza para facturarlo.</li>
          </ul>
        </div>
        {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onCerrar} className={botonSecundario}>Cancelar</button>
          <button className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700">Aprobar y crear contrato</button>
        </div>
      </form>
    </Modal>
  )
}
