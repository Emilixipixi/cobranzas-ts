import { useState } from 'react'
import { FileDown, Loader2 } from 'lucide-react'
import { useAlertas } from '../contextos/AlertasContext'
import { useAuditoria } from '../contextos/AuditoriaContext'
import { useAuth } from '../contextos/AuthContext'
import { useDatos } from '../contextos/DatosContext'
import { generarInformeProyecto } from '../utils/informeProyecto'
import type { Proyecto } from '../tipos'

interface Props {
  proyecto: Proyecto
  variante?: 'icono' | 'boton'
}

export default function BotonInforme({ proyecto, variante = 'boton' }: Props) {
  const { usuario, usuarios } = useAuth()
  const { registros, registrar } = useAuditoria()
  const { notificar } = useAlertas()
  const { clientes, contratos, cuotas, cobros, documentos, asignaciones, desarrolladores, horas } = useDatos()
  const [generando, setGenerando] = useState(false)

  if (usuario?.rol !== 'administrador') return null

  const generar = async () => {
    setGenerando(true)
    try {
      const contratosProyecto = contratos.filter((k) => k.proyectoId === proyecto.id)
      const archivo = await generarInformeProyecto({
        proyecto,
        cliente: clientes.find((c) => c.id === proyecto.clienteId),
        responsable: usuarios.find((u) => u.id === proyecto.responsableId),
        contratos: contratosProyecto,
        cuotas: cuotas.filter((q) => contratosProyecto.some((k) => k.id === q.contratoId)),
        cobros,
        documentos: documentos.filter((d) => d.proyectoId === proyecto.id),
        asignaciones,
        desarrolladores,
        horas,
        registros,
        generadoPor: usuario.nombre,
      })
      registrar('Generó informe del proyecto', `${proyecto.codigo} ${proyecto.nombre}: se descargó el documento ${archivo}`, proyecto.id)
    } catch (error) {
      notificar('No se pudo generar el informe', error instanceof Error ? error.message : 'Ocurrió un error inesperado', 'peligro')
    } finally {
      setGenerando(false)
    }
  }

  const Icono = generando ? Loader2 : FileDown

  if (variante === 'icono') {
    return (
      <button
        onClick={generar}
        disabled={generando}
        title="Generar documento del proyecto"
        aria-label={`Generar documento de ${proyecto.nombre}`}
        className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-50"
      >
        <Icono className={`h-4 w-4 ${generando ? 'animate-spin' : ''}`} />
      </button>
    )
  }

  return (
    <button
      onClick={generar}
      disabled={generando}
      className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
    >
      <Icono className={`h-4 w-4 ${generando ? 'animate-spin' : ''}`} />
      {generando ? 'Generando...' : 'Generar documento'}
    </button>
  )
}