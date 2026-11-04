import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { almacenInicial, HOY } from '../datos/datosEjemplo'
import { formatoMoneda, sumarMeses } from '../utils/finanzas'
import { useAuditoria } from './AuditoriaContext'
import { useAuth } from './AuthContext'
import type {
  Almacen, Asignacion, Cliente, Cobro, Contrato, Cuota, Desarrollador, Documento, Minuta, Proyecto,
} from '../tipos'

export interface DatosCobro {
  fechaReal: string
  valor: number
  medio: string
  comprobante: string
  referencia: string
}

export interface DatosNuevoDocumento {
  titulo: string
  categoria: Documento['categoria']
  version: string
  estado: Documento['estado']
  notas: string
}

export interface DatosNuevoDesarrollador {
  nombre: string
  especialidad: string
  correo: string
  tecnologias: string[]
}
export type CambiosProyecto = Partial<Omit<Proyecto,'id'|'codigo'>>

export interface DatosNuevoProyecto {
  clienteId: string | null
  nuevoCliente: { nombre: string; contacto: string; correo: string; telefono: string }
  nombre: string
  descripcion: string
  mesesOfrecidos: number
  fechaInicio: string
  monto: number
  moneda: string
  desarrolladorId: string
  horasSemana: number
}

interface DatosContextoValor {
  clientes: Cliente[]
  proyectos: Proyecto[]
  contratos: Contrato[]
  cuotas: Cuota[]
  cobros: Cobro[]
  documentos: Documento[]
  desarrolladores: Desarrollador[]
  asignaciones: Asignacion[]
  actualizarCuota: <C extends keyof Cuota>(id: string, campo: C, valor: Cuota[C]) => void
  agregarCuota: (contratoId: string) => void
  emitirFactura: (cuotaId: string, numero: string, vencimiento: string) => void
  registrarCobro: (cuotaId: string, datos: DatosCobro) => void
  agregarDocumento: (proyectoId: string, datos: DatosNuevoDocumento) => void
  agregarMinuta: (proyectoId: string, titulo: string, minuta: Minuta) => void
  asignarDesarrollador: (proyectoId: string, desarrolladorId: string, horasSemana: number) => void
  quitarAsignacion: (asignacionId: string) => string | null
  crearDesarrollador: (datos: DatosNuevoDesarrollador, usuarioId?: string) => void
  eliminarDesarrollador: (desarrolladorId: string) => string | null
  desvincularUsuario: (usuarioId: string) => void
  actualizarProyecto: (proyectoId: string, cambios: CambiosProyecto) => string | null
  eliminarProyecto: (proyectoId: string) => string | null
  crearProyecto: (datos: DatosNuevoProyecto) => string
  restaurarDatos: () => void
}

const DatosContext = createContext<DatosContextoValor | null>(null)

const CLAVE_ALMACEN = 'cobranzasAlmacenV1'

const CAMPOS_SENSIBLES: (keyof Cuota)[] = ['valor', 'tipoValor', 'fechaProyectada', 'modalidad', 'estadoEntrega']

const nuevoId = (prefijo: string): string => `${prefijo}${Date.now()}${Math.floor(Math.random() * 1000)}`

const cargarAlmacen = (): Almacen => {
  try {
    const guardado = localStorage.getItem(CLAVE_ALMACEN)
    if (guardado) return JSON.parse(guardado) as Almacen
  } catch {
    return almacenInicial
  }
  return almacenInicial
}

export function DatosProvider({ children }: { children: ReactNode }) {
  const { registrar, limpiar } = useAuditoria()
    const { usuario, usuarios, restablecerUsuarios } = useAuth()
  const [almacen, setAlmacen] = useState<Almacen>(cargarAlmacen)

  useEffect(() => {
    try {
      localStorage.setItem(CLAVE_ALMACEN, JSON.stringify(almacen))
    } catch {
      return
    }
  }, [almacen])

  const proyectoDeCuota = (cuotaId: string): string | undefined => {
    const cuota = almacen.cuotas.find((q) => q.id === cuotaId)
    return almacen.contratos.find((k) => k.id === cuota?.contratoId)?.proyectoId
  }

  const actualizarCuota: DatosContextoValor['actualizarCuota'] = (id, campo, valor) => {
    const actual = almacen.cuotas.find((q) => q.id === id)
    if (!actual || actual[campo] === valor) return

    if (CAMPOS_SENSIBLES.includes(campo)) {
      registrar(
        'Modificó cuota',
        `${actual.concepto}: ${String(campo)} de ${String(actual[campo] ?? '—')} a ${String(valor ?? '—')}`,
        proyectoDeCuota(id)
      )
    }

    setAlmacen((previo) => ({
      ...previo,
      cuotas: previo.cuotas.map((q) => {
        if (q.id !== id) return q
        const cambio: Cuota = { ...q, [campo]: valor }
        if (campo === 'fechaProyectada' && q.fechaOriginal === null) cambio.fechaOriginal = valor as string | null
        return cambio
      }),
    }))
  }

  const agregarCuota = (contratoId: string) => {
    const orden = almacen.cuotas.filter((q) => q.contratoId === contratoId).length + 1
    const nueva: Cuota = {
      id: nuevoId('Q'),
      contratoId,
      orden,
      concepto: 'Nueva cuota',
      modalidad: 'fecha',
      tipoValor: 'porcentaje',
      valor: 0,
      fechaProyectada: null,
      fechaOriginal: null,
      entregable: '',
      estadoEntrega: 'Pendiente',
      facturaRequerida: false,
    }
    registrar('Agregó cuota', `Contrato ${contratoId}: cuota #${orden}`, almacen.contratos.find((k) => k.id === contratoId)?.proyectoId)
    setAlmacen((previo) => ({ ...previo, cuotas: [...previo.cuotas, nueva] }))
  }

  const emitirFactura = (cuotaId: string, numero: string, vencimiento: string) => {
    const cuota = almacen.cuotas.find((q) => q.id === cuotaId)
    if (!cuota) return
    registrar('Emitió factura', `${cuota.concepto}: ${numero}, vence el ${vencimiento}`, proyectoDeCuota(cuotaId))
    setAlmacen((previo) => ({
      ...previo,
      cuotas: previo.cuotas.map((q) =>
        q.id === cuotaId ? { ...q, numeroFactura: numero, fechaFactura: HOY, vencimientoFactura: vencimiento } : q
      ),
    }))
  }

  const registrarCobro = (cuotaId: string, datos: DatosCobro) => {
    const cuota = almacen.cuotas.find((q) => q.id === cuotaId)
    if (!cuota) return
    const nuevo: Cobro = {
      id: nuevoId('B'),
      cuotaId,
      ...datos,
      numeroRecibo: `REC-${String(almacen.cobros.length + 1).padStart(4, '0')}`,
      registradoPor: usuario?.nombre ?? 'Sistema',
    }
    registrar('Registró cobro', `${cuota.concepto}: ${formatoMoneda(datos.valor)} por ${datos.medio} (ref. ${datos.referencia || 's/n'})`, proyectoDeCuota(cuotaId))
    setAlmacen((previo) => ({ ...previo, cobros: [...previo.cobros, nuevo] }))
  }

  const agregarDocumento = (proyectoId: string, datos: DatosNuevoDocumento) => {
    const nuevo: Documento = {
      id: nuevoId('D'),
      proyectoId,
      ...datos,
      fecha: HOY,
      autor: usuario?.nombre ?? 'Sistema',
    }
    registrar('Agregó documento', `${nuevo.titulo} (${nuevo.categoria}, ${nuevo.version})`, proyectoId)
    setAlmacen((previo) => ({ ...previo, documentos: [nuevo, ...previo.documentos] }))
  }

  const agregarMinuta = (proyectoId: string, titulo: string, minuta: Minuta) => {
    const nuevo: Documento = {
      id: nuevoId('D'),
      proyectoId,
      titulo,
      categoria: 'minuta',
      version: 'v1.0',
      estado: 'aprobado',
      fecha: minuta.fecha,
      autor: usuario?.nombre ?? 'Sistema',
      notas: '',
      minuta,
    }
    registrar('Registró minuta', `${titulo}: ${minuta.acuerdos.length} acuerdos, ${minuta.pendientes.length} pendientes`, proyectoId)
    setAlmacen((previo) => ({ ...previo, documentos: [nuevo, ...previo.documentos] }))
  }

  const asignarDesarrollador = (proyectoId: string, desarrolladorId: string, horasSemana: number) => {
    const yaAsignado = almacen.asignaciones.some((a) => a.proyectoId === proyectoId && a.desarrolladorId === desarrolladorId)
    if (yaAsignado) return
    const dev = almacen.desarrolladores.find((d) => d.id === desarrolladorId)
    registrar('Asignó desarrollador', `${dev?.nombre ?? desarrolladorId}: ${horasSemana} h/semana`, proyectoId)
    setAlmacen((previo) => ({
      ...previo,
      asignaciones: [...previo.asignaciones, { id: nuevoId('A'), proyectoId, desarrolladorId, horasSemana }],
    }))
  }

  const quitarAsignacion = (asignacionId: string): string | null => {
    const asignacion = almacen.asignaciones.find((a) => a.id === asignacionId)
    if (!asignacion) return null
    const equipo = almacen.asignaciones.filter((a) => a.proyectoId === asignacion.proyectoId)
    if (equipo.length <= 1) return 'Cada proyecto debe tener al menos un desarrollador asignado'
    const dev = almacen.desarrolladores.find((d) => d.id === asignacion.desarrolladorId)
    registrar('Desasignó desarrollador', dev?.nombre ?? asignacion.desarrolladorId, asignacion.proyectoId)
    setAlmacen((previo) => ({ ...previo, asignaciones: previo.asignaciones.filter((a) => a.id !== asignacionId) }))
    return null
  }

  const crearDesarrollador = (datos: DatosNuevoDesarrollador, usuarioId?: string) => {
   const nuevo: Desarrollador = { id: nuevoId('DEV'), ...datos, ...(usuarioId ? { usuarioId } : {}) }
  registrar('Creó desarrollador', `${nuevo.nombre} (${nuevo.especialidad})`)
  setAlmacen((previo) => ({ ...previo, desarrolladores: [...previo.desarrolladores, nuevo] }))
  }

  const eliminarDesarrollador = (desarrolladorId: string): string | null => {
    const dev = almacen.desarrolladores.find((d) => d.id === desarrolladorId)
    if (!dev) return null
    const sinRespaldo = almacen.proyectos.filter((p) => {
      const equipo = almacen.asignaciones.filter((a) => a.proyectoId === p.id)
      return equipo.length === 1 && equipo[0].desarrolladorId === desarrolladorId
    })
    if (sinRespaldo.length > 0) {
      return `No se puede eliminar: es el único desarrollador de ${sinRespaldo.map((p) => p.nombre).join(', ')}. Asigna otro desarrollador primero.`
    }
    registrar('Eliminó desarrollador', dev.nombre)
    setAlmacen((previo) => ({
      ...previo,
      desarrolladores: previo.desarrolladores.filter((d) => d.id !== desarrolladorId),
      asignaciones: previo.asignaciones.filter((a) => a.desarrolladorId !== desarrolladorId),
    }))
    return null
  }

    const desvincularUsuario = (usuarioId: string) => {
    setAlmacen((previo) => ({
      ...previo,
      desarrolladores: previo.desarrolladores.map((d) => (d.usuarioId === usuarioId ? { ...d, usuarioId: undefined } : d)),
    }))
  }

  const describirValor = (campo: string, valor: unknown): string => {
    if (campo === 'clienteId') return almacen.clientes.find((c) => c.id === valor)?.nombre ?? String(valor)
    if (campo === 'responsableId') return usuarios.find((u) => u.id === valor)?.nombre ?? String(valor)
    return String(valor === '' || valor === undefined ? '—' : valor)
  }

  const actualizarProyecto = (proyectoId: string, cambios: CambiosProyecto): string | null => {
    if (usuario?.rol !== 'administrador') return 'Solo el administrador puede editar proyectos'
    const actual = almacen.proyectos.find((p) => p.id === proyectoId)
    if (!actual) return 'El proyecto ya no existe'
    const diferencias = (Object.keys(cambios) as (keyof CambiosProyecto)[])
      .filter((campo) => cambios[campo] !== actual[campo])
      .map((campo) => `${String(campo)} de ${describirValor(String(campo), actual[campo])} a ${describirValor(String(campo), cambios[campo])}`)
    if (diferencias.length === 0) return null
    registrar('Actualizó proyecto', `${actual.codigo}: ${diferencias.join('; ')}`, proyectoId)
    setAlmacen((previo) => ({
      ...previo,
      proyectos: previo.proyectos.map((p) => (p.id === proyectoId ? { ...p, ...cambios } : p)),
    }))
    return null
  }

  const eliminarProyecto = (proyectoId: string): string | null => {
    if (usuario?.rol !== 'administrador') return 'Solo el administrador puede eliminar proyectos'
    const proyecto = almacen.proyectos.find((p) => p.id === proyectoId)
    if (!proyecto) return 'El proyecto ya no existe'
    const idsContratos = almacen.contratos.filter((k) => k.proyectoId === proyectoId).map((k) => k.id)
    const idsCuotas = almacen.cuotas.filter((q) => idsContratos.includes(q.contratoId)).map((q) => q.id)
    const cobrosProyecto = almacen.cobros.filter((b) => idsCuotas.includes(b.cuotaId))
    const totalCobrado = cobrosProyecto.reduce((suma, b) => suma + b.valor, 0)
    const documentosProyecto = almacen.documentos.filter((d) => d.proyectoId === proyectoId)
    registrar(
      'Eliminó proyecto',
      `${proyecto.codigo} ${proyecto.nombre}: ${idsCuotas.length} cuotas, ${cobrosProyecto.length} cobros (${formatoMoneda(totalCobrado)}), ${documentosProyecto.length} documentos`
    )
    setAlmacen((previo) => ({
      ...previo,
      proyectos: previo.proyectos.filter((p) => p.id !== proyectoId),
      contratos: previo.contratos.filter((k) => k.proyectoId !== proyectoId),
      cuotas: previo.cuotas.filter((q) => !idsCuotas.includes(q.id)),
      cobros: previo.cobros.filter((b) => !idsCuotas.includes(b.cuotaId)),
      documentos: previo.documentos.filter((d) => d.proyectoId !== proyectoId),
      asignaciones: previo.asignaciones.filter((a) => a.proyectoId !== proyectoId),
    }))
    return null
  }

  const crearProyecto = (datos: DatosNuevoProyecto): string => {
    const proyectoId = nuevoId('P')
    const clienteId = datos.clienteId ?? nuevoId('C')
    const numero = almacen.proyectos.length + 1
    const contratoId = nuevoId('K')

    const cliente: Cliente | null = datos.clienteId ? null : { id: clienteId, ...datos.nuevoCliente }
    const proyecto: Proyecto = {
      id: proyectoId,
      codigo: `PRY-${String(numero).padStart(3, '0')}`,
      nombre: datos.nombre,
      descripcion: datos.descripcion,
      clienteId,
      responsableId: usuario?.id ?? '',
      mesesOfrecidos: datos.mesesOfrecidos,
      fechaInicio: datos.fechaInicio,
      fechaEntrega: sumarMeses(datos.fechaInicio, datos.mesesOfrecidos),
      diasContingencia: 15,
      estado: 'Prototipo',
      prototipo: 'Pendiente',
      urlPrototipo: '',
      repositorio: '',
    }
    const contrato: Contrato = {
      id: contratoId,
      proyectoId,
      numero: `CT-2026-${String(almacen.contratos.length + 1).padStart(2, '0')}`,
      tipo: 'original',
      moneda: datos.moneda,
      monto: datos.monto,
    }
    const cuotaFirma: Cuota = {
      id: nuevoId('Q'),
      contratoId,
      orden: 1,
      concepto: 'Firma del contrato',
      modalidad: 'hito',
      tipoValor: 'porcentaje',
      valor: 0,
      fechaProyectada: null,
      fechaOriginal: null,
      entregable: 'Contrato firmado',
      estadoEntrega: 'Pendiente',
      facturaRequerida: false,
    }

    const asignacion: Asignacion = {
      id: nuevoId('A'),
      proyectoId,
      desarrolladorId: datos.desarrolladorId,
      horasSemana: datos.horasSemana,
    }
    const dev = almacen.desarrolladores.find((d) => d.id === datos.desarrolladorId)

    registrar(
      'Creó proyecto',
      `${proyecto.codigo} ${proyecto.nombre}: contrato de ${formatoMoneda(datos.monto, datos.moneda)}, desarrollador ${dev?.nombre ?? datos.desarrolladorId}`,
      proyectoId
    )
    setAlmacen((previo) => ({
      ...previo,
      clientes: cliente ? [...previo.clientes, cliente] : previo.clientes,
      proyectos: [proyecto, ...previo.proyectos],
      contratos: [...previo.contratos, contrato],
      cuotas: [...previo.cuotas, cuotaFirma],
      asignaciones: [...previo.asignaciones, asignacion],
    }))
    return proyectoId
  }

  const restaurarDatos = () => {
    localStorage.removeItem(CLAVE_ALMACEN)
    limpiar()
    restablecerUsuarios()
    setAlmacen(almacenInicial)
  }

  return (
    <DatosContext.Provider
      value={{
        ...almacen,
        actualizarCuota,
        agregarCuota,
        emitirFactura,
        registrarCobro,
        agregarDocumento,
        agregarMinuta,
        asignarDesarrollador,
        quitarAsignacion,
        crearDesarrollador,
        eliminarDesarrollador,
        crearProyecto,
        restaurarDatos,
        desvincularUsuario,
        actualizarProyecto,
        eliminarProyecto,
      }}
    >
      {children}
    </DatosContext.Provider>
  )
}

export function useDatos(): DatosContextoValor {
  const contexto = useContext(DatosContext)
  if (!contexto) throw new Error('useDatos debe usarse dentro de DatosProvider')
  return contexto
}
