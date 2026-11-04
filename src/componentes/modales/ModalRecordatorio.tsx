import { useState } from 'react'
import { useAuth } from '../../contextos/AuthContext'
import { useDatos } from '../../contextos/DatosContext'
import { botonPrimario, botonSecundario, entrada } from '../../utils/estilos'
import { diasMora, formatoFecha, formatoMoneda, fechaVencimiento, saldoCuota } from '../../utils/finanzas'
import type { Cuota } from '../../tipos'
import Modal from '../Modal'

interface Props {
  cuota: Cuota
  onCerrar: () => void
}

type Tono = 'amable' | 'vence_hoy' | 'mora'

const TONOS: { id: Tono; etiqueta: string }[] = [
  { id: 'amable', etiqueta: 'Amable (preventivo)' },
  { id: 'vence_hoy', etiqueta: 'Vence hoy' },
  { id: 'mora', etiqueta: 'Mora / urgente' },
]

export default function ModalRecordatorio({ cuota, onCerrar }: Props) {
  const { usuario } = useAuth()
  const { contratos, proyectos, clientes, cobros } = useDatos()
  const contrato = contratos.find((k) => k.id === cuota.contratoId)
  const proyecto = proyectos.find((p) => p.id === contrato?.proyectoId)
  const cliente = clientes.find((c) => c.id === proyecto?.clienteId)

  const [tono, setTono] = useState<Tono>(diasMora(cuota) > 0 ? 'mora' : 'amable')
  const [copiado, setCopiado] = useState(false)

  if (!contrato || !proyecto || !cliente) return null

  const saldo = formatoMoneda(saldoCuota(cuota, contrato, cobros), contrato.moneda)
  const vence = formatoFecha(fechaVencimiento(cuota))
  const documento = cuota.numeroFactura ? `la factura ${cuota.numeroFactura}` : 'el pago'
  const firma = usuario?.nombre ?? 'Equipo de cobranzas'

  const mensajes: Record<Tono, string> = {
    amable: `Estimado/a ${cliente.contacto},\n\nEsperamos que se encuentre muy bien. Le escribimos por el proyecto "${proyecto.nombre}".\n\nLe compartimos un recordatorio cordial sobre ${documento} correspondiente a "${cuota.concepto}" por ${saldo}, con vencimiento el ${vence}.\n\nAgradeceremos confirmarnos la fecha de pago o enviarnos el comprobante una vez realizada la transferencia.\n\nQuedamos atentos a cualquier consulta.\n\nSaludos cordiales,\n${firma}`,
    vence_hoy: `Estimado/a ${cliente.contacto},\n\nLe informamos que hoy vence el plazo de ${documento} del proyecto "${proyecto.nombre}" (${cuota.concepto}) por ${saldo}.\n\nLe solicitamos amablemente enviarnos el comprobante de la operación para continuar sin interrupciones con el siguiente hito.\n\nMuchas gracias por su gestión.\n\nSaludos cordiales,\n${firma}`,
    mora: `AVISO DE COBRANZA: PAGO VENCIDO\n\nAtención: ${cliente.contacto} (${cliente.nombre})\nProyecto: ${proyecto.nombre}\n\nSolicitamos su atención prioritaria sobre ${documento} (${cuota.concepto}) por ${saldo}, vencido desde el ${vence} (${diasMora(cuota)} días).\n\nSegún el cronograma de pagos del contrato ${contrato.numero}, la regularización de saldos vencidos es necesaria para continuar con el desarrollo.\n\nLe agradecemos regularizar el pago a la brevedad y enviarnos el comprobante.\n\nAtentamente,\n${firma}`,
  }

  const mensaje = mensajes[tono]
  const telefono = cliente.telefono.replace(/[^0-9]/g, '')
  const enlaceWhatsapp = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`
  const enlaceCorreo = `mailto:${cliente.correo}?subject=${encodeURIComponent(`Recordatorio de pago: ${proyecto.nombre}`)}&body=${encodeURIComponent(mensaje)}`

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(mensaje)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      setCopiado(false)
    }
  }

  return (
    <Modal titulo="Recordatorio de cobranza" onCerrar={onCerrar} ancho="max-w-2xl">
      <div className="mb-3 flex flex-wrap gap-2">
        {TONOS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTono(t.id)}
            className={`rounded-md border px-3 py-1 text-sm ${tono === t.id ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 bg-white hover:bg-slate-50'}`}
          >
            {t.etiqueta}
          </button>
        ))}
      </div>
      <textarea className={`${entrada} h-64 font-mono text-xs`} value={mensaje} readOnly />
      <div className="mt-3 flex flex-wrap justify-end gap-2">
        <button onClick={copiar} className={botonSecundario}>{copiado ? 'Copiado' : 'Copiar mensaje'}</button>
        <a href={enlaceCorreo} className={botonSecundario}>Abrir en correo</a>
        <a href={enlaceWhatsapp} target="_blank" rel="noreferrer" className={botonPrimario}>Enviar por WhatsApp</a>
      </div>
    </Modal>
  )
}
