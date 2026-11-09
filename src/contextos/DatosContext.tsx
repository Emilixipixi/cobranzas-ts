import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { almacenInicial, HOY } from '../datos/datosEjemplo'
import { esJefe, horasSemanalesDe, redondearHoras } from '../utils/equipo'
import { formatoFecha, formatoMoneda, redondear, sumarDias, sumarMeses } from '../utils/finanzas'
import { alcancesPermitidos, areasDeReunion, proyectosParaAgendar, puedeEditarReunion } from '../utils/reuniones'
import { hashValido, puedeModificar, puedeRevisar, registrablesPor } from '../utils/evidencias'
import { horasExtraDe } from '../utils/horas'
import { etiquetaSemana, inicioSemana } from '../utils/semanas'
import { useAuditoria } from './AuditoriaContext'
import { useAuth } from './AuthContext'
import type {
  Adicional, Almacen, AprobacionHorasExtra, ArchivoAdjunto, Asignacion, Cliente, Cobro, Contrato, Cuota, Desarrollador, Documento, EstadoEvidencia, Evidencia, Minuta, Proyecto, RegistroHoras, RolEquipo,
} from '../tipos'

export interface DatosCobro {
  fechaReal: string
  valor: number
  medio: string
  comprobante: string
  referencia: string
  archivoComprobante?: ArchivoAdjunto
}

export interface DatosNuevoDocumento {
  titulo: string
  categoria: Documento['categoria']
  version: string
  estado: Documento['estado']
  notas: string
  archivo?: ArchivoAdjunto
}

export type DatosEvidencia = Pick<Evidencia, 'proyectoId' | 'desarrolladorId' | 'tipo' | 'titulo' | 'descripcion' | 'fecha'> &
  Partial<Pick<Evidencia, 'enlace' | 'commit' | 'rama' | 'cuotaId' | 'horas' | 'archivo'>>

export type DatosAdicional = Pick<Adicional, 'titulo' | 'descripcion' | 'solicitadoPor' | 'fechaSolicitud' | 'montoEstimado' | 'diasEstimados'>

export interface AprobacionAdicional {
  monto: number
  dias: number
  extenderEntrega: boolean
}

export interface DatosNuevoDesarrollador {
  nombre: string
  especialidad: string
  correo: string
  tecnologias: string[]
}

export type CambiosProyecto = Partial<Omit<Proyecto, 'id' | 'codigo'>>

export interface IntegranteNuevo {
  desarrolladorId: string
  horasDiarias: number
}

export interface DatosNuevoProyecto {
  clienteId: string | null
  nuevoCliente: { nombre: string; contacto: string; correo: string; telefono: string }
  nombre: string
  descripcion: string
  mesesOfrecidos: number
  fechaInicio: string
  monto: number
  jefe: IntegranteNuevo
  colaboradores: IntegranteNuevo[]
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
  horas: RegistroHoras[]
  horasExtra: AprobacionHorasExtra[]
  evidencias: Evidencia[]
  adicionales: Adicional[]
  registrarAdicional: (proyectoId: string, datos: DatosAdicional) => string | null
  editarAdicional: (adicionalId: string, datos: DatosAdicional, cotizar?: boolean) => string | null
  aprobarAdicional: (adicionalId: string, datos: AprobacionAdicional) => string | null
  rechazarAdicional: (adicionalId: string, motivo: string) => string | null
  eliminarAdicional: (adicionalId: string) => string | null
  registrarEvidencia: (datos: DatosEvidencia) => string | null
  editarEvidencia: (evidenciaId: string, datos: DatosEvidencia) => string | null
  revisarEvidencia: (evidenciaId: string, estado: Exclude<EstadoEvidencia, 'pendiente'>, comentario: string) => string | null
  eliminarEvidencia: (evidenciaId: string) => string | null
  actualizarCuota: <C extends keyof Cuota>(id: string, campo: C, valor: Cuota[C]) => void
  agregarCuota: (contratoId: string) => void
  eliminarCuota: (cuotaId: string) => string | null
  emitirFactura: (cuotaId: string, numero: string, vencimiento: string, archivo?: ArchivoAdjunto) => void
  adjuntarFactura: (cuotaId: string, archivo: ArchivoAdjunto) => string | null
  eliminarFactura: (cuotaId: string) => string | null
  registrarCobro: (cuotaId: string, datos: DatosCobro) => void
  adjuntarComprobante: (cobroId: string, archivo: ArchivoAdjunto | null) => string | null
  agregarDocumento: (proyectoId: string, datos: DatosNuevoDocumento) => void
  adjuntarArchivoDocumento: (documentoId: string, archivo: ArchivoAdjunto | null) => string | null
  actualizarEnlaceMinuta: (documentoId: string, enlace: string) => string | null
  agregarMinuta: (proyectoId: string, titulo: string, minuta: Minuta) => string | null
  asignarDesarrollador: (proyectoId: string, desarrolladorId: string, horasDiarias: number, rol?: RolEquipo) => void
  nombrarJefe: (proyectoId: string, desarrolladorId: string) => string | null
  registrarHoras: (proyectoId: string, desarrolladorId: string, semana: string, horas: number) => string | null
  aprobarHorasExtra: (proyectoId: string, desarrolladorId: string, semana: string, horas: number) => string | null
  retirarHorasExtra: (proyectoId: string, desarrolladorId: string, semana: string) => string | null
  marcarHorasExtraVistas: (ids: string[]) => void
  quitarAsignacion: (asignacionId: string) => string | null
  crearDesarrollador: (datos: DatosNuevoDesarrollador, usuarioId?: string) => void
  eliminarDesarrollador: (desarrolladorId: string) => string | null
  desvincularUsuario: (usuarioId: string) => void
  actualizarProyecto: (proyectoId: string, cambios: CambiosProyecto) => string | null
  eliminarProyecto: (proyectoId: string) => string | null
  crearProyecto: (datos: DatosNuevoProyecto) => string
  crearCliente: (datos: Omit<Cliente, 'id'>) => string | null
  programarPrototipo: (proyectoId: string, cambios: { fechaPrototipo?: string; prototipo?: string }) => string | null
  restaurarDatos: () => void
}

const DatosContext = createContext<DatosContextoValor | null>(null)

const CLAVE_ALMACEN = 'cobranzasAlmacenV1'

const CAMPOS_SENSIBLES: (keyof Cuota)[] = ['valor', 'tipoValor', 'fechaProyectada', 'modalidad', 'estadoEntrega']

const nuevoId = (prefijo: string): string => `${prefijo}${Date.now()}${Math.floor(Math.random() * 1000)}`

const cargarAlmacen = (): Almacen => {
  try {
    const guardado = localStorage.getItem(CLAVE_ALMACEN)
    if (guardado) return { ...almacenInicial, ...(JSON.parse(guardado) as Partial<Almacen>) }
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

  // Mantiene sincronizadas varias pestañas abiertas (p. ej. administrador en una y desarrollador en otra).
  useEffect(() => {
    const alCambiarEnOtraPestana = (e: StorageEvent) => {
      if (e.key === CLAVE_ALMACEN && e.newValue) setAlmacen(cargarAlmacen())
    }
    window.addEventListener('storage', alCambiarEnOtraPestana)
    return () => window.removeEventListener('storage', alCambiarEnOtraPestana)
  }, [])

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

  const eliminarCuota = (cuotaId: string): string | null => {
    if (usuario?.rol === 'desarrollador') return 'No tienes permiso para modificar el plan de pagos'
    const cuota = almacen.cuotas.find((q) => q.id === cuotaId)
    if (!cuota) return 'La cuota ya no existe'
    if (cuota.orden === 1) return 'La primera cuota (firma del contrato) no se puede eliminar'
    if (almacen.cobros.some((b) => b.cuotaId === cuotaId)) return `«${cuota.concepto}» ya tiene cobros registrados y no se puede eliminar`
    if (cuota.numeroFactura) return `«${cuota.concepto}» ya fue facturada (${cuota.numeroFactura}) y no se puede eliminar`
    registrar('Eliminó cuota', `Contrato ${cuota.contratoId}: cuota #${cuota.orden} «${cuota.concepto}» (${cuota.tipoValor === 'porcentaje' ? `${cuota.valor} %` : formatoMoneda(cuota.valor)})`, proyectoDeCuota(cuotaId))
    setAlmacen((previo) => {
      let orden = 0
      const renumeradas = previo.cuotas
        .filter((q) => q.id !== cuotaId)
        .sort((a, b) => a.orden - b.orden)
        .map((q) => (q.contratoId === cuota.contratoId ? { ...q, orden: ++orden } : q))
      return { ...previo, cuotas: renumeradas }
    })
    return null
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

  const emitirFactura = (cuotaId: string, numero: string, vencimiento: string, archivo?: ArchivoAdjunto) => {
    const cuota = almacen.cuotas.find((q) => q.id === cuotaId)
    if (!cuota) return
    registrar('Emitió factura', `${cuota.concepto}: ${numero}, vence el ${vencimiento}${archivo ? ` · archivo ${archivo.nombre}` : ''}`, proyectoDeCuota(cuotaId))
    setAlmacen((previo) => ({
      ...previo,
      cuotas: previo.cuotas.map((q) =>
        q.id === cuotaId ? { ...q, numeroFactura: numero, fechaFactura: HOY, vencimientoFactura: vencimiento, archivoFactura: archivo } : q
      ),
    }))
  }

  const puedeOperarCobranza = () => usuario?.rol === 'administrador' || usuario?.rol === 'finanzas'

  const adjuntarFactura = (cuotaId: string, archivo: ArchivoAdjunto): string | null => {
    if (!puedeOperarCobranza()) return 'Solo finanzas o el administrador pueden adjuntar facturas'
    const cuota = almacen.cuotas.find((q) => q.id === cuotaId)
    if (!cuota?.numeroFactura) return 'La cuota no tiene una factura registrada'
    registrar('Adjuntó archivo de factura', `${cuota.concepto}: ${cuota.numeroFactura} · ${archivo.nombre}`, proyectoDeCuota(cuotaId))
    setAlmacen((previo) => ({ ...previo, cuotas: previo.cuotas.map((q) => (q.id === cuotaId ? { ...q, archivoFactura: archivo } : q)) }))
    return null
  }

  const eliminarFactura = (cuotaId: string): string | null => {
    if (!puedeOperarCobranza()) return 'Solo finanzas o el administrador pueden eliminar facturas'
    const cuota = almacen.cuotas.find((q) => q.id === cuotaId)
    if (!cuota?.numeroFactura) return 'La cuota no tiene una factura registrada'
    registrar('Eliminó factura', `${cuota.concepto}: ${cuota.numeroFactura}${cuota.archivoFactura ? ` (${cuota.archivoFactura.nombre})` : ''}`, proyectoDeCuota(cuotaId))
    setAlmacen((previo) => ({
      ...previo,
      cuotas: previo.cuotas.map((q) => {
        if (q.id !== cuotaId) return q
        const { numeroFactura: _n, fechaFactura: _f, vencimientoFactura: _v, archivoFactura: _a, ...resto } = q
        return resto
      }),
    }))
    return null
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

  /** Adjunta (o con `null` quita) el archivo del comprobante de un cobro. */
  const adjuntarComprobante = (cobroId: string, archivo: ArchivoAdjunto | null): string | null => {
    if (!puedeOperarCobranza()) return 'Solo finanzas o el administrador pueden gestionar comprobantes de cobro'
    const cobro = almacen.cobros.find((b) => b.id === cobroId)
    if (!cobro) return 'El cobro ya no existe'
    if (archivo) registrar('Adjuntó comprobante de cobro', `${cobro.numeroRecibo}: ${archivo.nombre}`, proyectoDeCuota(cobro.cuotaId))
    else registrar('Quitó comprobante de cobro', `${cobro.numeroRecibo}${cobro.archivoComprobante ? `: ${cobro.archivoComprobante.nombre}` : ''}`, proyectoDeCuota(cobro.cuotaId))
    setAlmacen((previo) => ({
      ...previo,
      cobros: previo.cobros.map((b) => {
        if (b.id !== cobroId) return b
        if (archivo) return { ...b, archivoComprobante: archivo, comprobante: archivo.nombre }
        const { archivoComprobante: _a, ...resto } = b
        return resto
      }),
    }))
    return null
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

  const puedeEditarDocumentos = () => usuario?.rol === 'administrador' || usuario?.rol === 'comercial'

  /** Adjunta (o con `null` quita) el PDF o la imagen de un documento del expediente. */
  const adjuntarArchivoDocumento = (documentoId: string, archivo: ArchivoAdjunto | null): string | null => {
    if (!puedeEditarDocumentos()) return 'Solo el administrador o el área comercial pueden modificar documentos'
    const documento = almacen.documentos.find((d) => d.id === documentoId)
    if (!documento) return 'El documento ya no existe'
    if (archivo) registrar('Adjuntó archivo a documento', `${documento.titulo}: ${archivo.nombre}`, documento.proyectoId)
    else registrar('Quitó archivo de documento', `${documento.titulo}${documento.archivo ? `: ${documento.archivo.nombre}` : ''}`, documento.proyectoId)
    setAlmacen((previo) => ({
      ...previo,
      documentos: previo.documentos.map((d) => {
        if (d.id !== documentoId) return d
        if (archivo) return { ...d, archivo }
        const { archivo: _a, ...resto } = d
        return resto
      }),
    }))
    return null
  }

  const actualizarEnlaceMinuta = (documentoId: string, enlace: string): string | null => {
    const documento = almacen.documentos.find((d) => d.id === documentoId)
    if (!documento?.minuta) return 'La reunión ya no existe'
    if (!puedeEditarReunion(usuario, documento)) return 'Solo quien organizó la reunión o el administrador pueden cambiar el enlace'
    const limpio = enlace.trim()
    registrar(limpio ? 'Actualizó enlace de reunión' : 'Quitó enlace de reunión', `${documento.titulo}${limpio ? `: ${limpio}` : ''}`, documento.proyectoId)
    setAlmacen((previo) => ({
      ...previo,
      documentos: previo.documentos.map((d) => {
        if (d.id !== documentoId || !d.minuta) return d
        const { enlace: _e, ...minuta } = d.minuta
        return { ...d, minuta: limpio ? { ...minuta, enlace: limpio } : minuta }
      }),
    }))
    return null
  }

  const validarEvidencia = (datos: DatosEvidencia, excluirId?: string): string | null => {
    if (!registrablesPor(usuario, datos.proyectoId, almacen.desarrolladores, almacen.asignaciones).some((d) => d.id === datos.desarrolladorId)) {
      return usuario?.rol === 'desarrollador'
        ? 'Solo puedes registrar evidencias propias en proyectos donde estás asignado'
        : 'Solo los desarrolladores del equipo o el administrador pueden registrar evidencias'
    }
    if (!datos.titulo.trim()) return 'Escribe un título para la evidencia'
    if (!datos.fecha || datos.fecha > HOY) return 'La fecha del trabajo no puede ser futura'
    if (datos.horas !== undefined && (datos.horas < 0 || datos.horas > 24)) return 'Las horas deben estar entre 0 y 24'
    if (datos.tipo === 'commit') {
      if (!datos.commit || !hashValido(datos.commit)) return 'Indica el hash del commit (7 a 40 caracteres, por ejemplo 8f3a2c1)'
      const hash = datos.commit.trim().toLowerCase()
      const repetido = almacen.evidencias.some(
        (e) => e.id !== excluirId && e.proyectoId === datos.proyectoId && e.commit && (e.commit.toLowerCase().startsWith(hash) || hash.startsWith(e.commit.toLowerCase()))
      )
      if (repetido) return 'Ese commit ya está registrado como evidencia en este proyecto'
    }
    if (!datos.enlace && !datos.archivo && !datos.descripcion.trim()) return 'Agrega una descripción, un enlace o un archivo como respaldo'
    return null
  }

  const limpiarEvidencia = (datos: DatosEvidencia): DatosEvidencia => ({
    ...datos,
    titulo: datos.titulo.trim(),
    descripcion: datos.descripcion.trim(),
    enlace: datos.enlace?.trim() || undefined,
    commit: datos.tipo === 'commit' ? datos.commit?.trim().toLowerCase() : undefined,
    rama: datos.tipo === 'commit' ? datos.rama?.trim() || undefined : undefined,
    cuotaId: datos.cuotaId || undefined,
  })

  const registrarEvidencia = (datos: DatosEvidencia): string | null => {
    const problema = validarEvidencia(datos)
    if (problema) return problema
    const dev = almacen.desarrolladores.find((d) => d.id === datos.desarrolladorId)
    const nueva: Evidencia = {
      ...limpiarEvidencia(datos),
      id: nuevoId('EV'),
      registradoPor: usuario?.nombre ?? 'Sistema',
      creadoEn: new Date().toISOString(),
      estado: 'pendiente',
    }
    registrar('Registró evidencia', `${dev?.nombre ?? ''}: ${nueva.titulo}${nueva.commit ? ` (commit ${nueva.commit})` : ''}`, datos.proyectoId)
    setAlmacen((previo) => ({ ...previo, evidencias: [nueva, ...previo.evidencias] }))
    return null
  }

  const editarEvidencia = (evidenciaId: string, datos: DatosEvidencia): string | null => {
    const actual = almacen.evidencias.find((e) => e.id === evidenciaId)
    if (!actual) return 'La evidencia ya no existe'
    if (!puedeModificar(usuario, actual, almacen.desarrolladores)) return 'Una evidencia validada solo la puede modificar el administrador'
    const problema = validarEvidencia({ ...datos, proyectoId: actual.proyectoId }, evidenciaId)
    if (problema) return problema
    registrar('Editó evidencia', `${datos.titulo.trim()}${actual.estado === 'observada' ? ' (vuelve a revisión)' : ''}`, actual.proyectoId)
    setAlmacen((previo) => ({
      ...previo,
      evidencias: previo.evidencias.map((e) => {
        if (e.id !== evidenciaId) return e
        const { enlace: _e, commit: _c, rama: _r, cuotaId: _q, horas: _h, archivo: _a, ...base } = e
        // Corregir una evidencia observada la devuelve a revisión.
        return { ...base, ...limpiarEvidencia({ ...datos, proyectoId: e.proyectoId }), estado: e.estado === 'observada' ? 'pendiente' : e.estado }
      }),
    }))
    return null
  }

  const revisarEvidencia = (evidenciaId: string, estado: Exclude<EstadoEvidencia, 'pendiente'>, comentario: string): string | null => {
    const evidencia = almacen.evidencias.find((e) => e.id === evidenciaId)
    if (!evidencia) return 'La evidencia ya no existe'
    if (!puedeRevisar(usuario, evidencia, almacen.desarrolladores, almacen.asignaciones)) return 'Solo el administrador o el jefe de proyecto pueden revisar evidencias de otros'
    if (estado === 'observada' && !comentario.trim()) return 'Explica qué falta o qué se debe corregir'
    const dev = almacen.desarrolladores.find((d) => d.id === evidencia.desarrolladorId)
    registrar(estado === 'validada' ? 'Validó evidencia' : 'Observó evidencia', `${dev?.nombre ?? ''}: ${evidencia.titulo}${comentario.trim() ? ` · ${comentario.trim()}` : ''}`, evidencia.proyectoId)
    setAlmacen((previo) => ({
      ...previo,
      evidencias: previo.evidencias.map((e) =>
        e.id === evidenciaId ? { ...e, estado, revision: { por: usuario?.nombre ?? 'Sistema', fecha: new Date().toISOString(), comentario: comentario.trim() } } : e
      ),
    }))
    return null
  }

  const eliminarEvidencia = (evidenciaId: string): string | null => {
    const evidencia = almacen.evidencias.find((e) => e.id === evidenciaId)
    if (!evidencia) return 'La evidencia ya no existe'
    if (!puedeModificar(usuario, evidencia, almacen.desarrolladores)) return 'Una evidencia validada solo la puede eliminar el administrador'
    registrar('Eliminó evidencia', evidencia.titulo, evidencia.proyectoId)
    setAlmacen((previo) => ({ ...previo, evidencias: previo.evidencias.filter((e) => e.id !== evidenciaId) }))
    return null
  }

  const agregarMinuta = (proyectoId: string, titulo: string, minuta: Minuta): string | null => {
    if (!proyectosParaAgendar(usuario, almacen.proyectos, almacen.desarrolladores, almacen.asignaciones).some((p) => p.id === proyectoId)) {
      return usuario?.rol === 'desarrollador'
        ? 'Solo el jefe de proyecto puede agendar reuniones de este proyecto'
        : 'No tienes permiso para agendar reuniones'
    }
    const alcance = minuta.alcance ?? 'areas'
    if (!alcancesPermitidos(usuario).includes(alcance)) return 'Las reuniones internas de desarrollo solo las agenda el jefe de proyecto o el administrador'
    if (alcance === 'areas' && !minuta.areas?.length) return 'Elige al menos un departamento invitado'
    const limpia: Minuta = {
      ...minuta,
      alcance,
      areas: alcance === 'equipo' ? undefined : minuta.areas,
      organizadorId: usuario?.id,
      organizador: usuario?.nombre,
    }
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
      minuta: limpia,
    }
    const conQuien = alcance === 'equipo' ? 'equipo de desarrollo' : areasDeReunion(nuevo).join(', ')
    registrar('Agendó reunión', `${titulo} (${conQuien}): ${minuta.acuerdos.length} acuerdos, ${minuta.pendientes.length} pendientes`, proyectoId)
    setAlmacen((previo) => ({ ...previo, documentos: [nuevo, ...previo.documentos] }))
    return null
  }

  const asignarDesarrollador = (proyectoId: string, desarrolladorId: string, horasDiarias: number, rol: RolEquipo = 'colaborador') => {
    const yaAsignado = almacen.asignaciones.some((a) => a.proyectoId === proyectoId && a.desarrolladorId === desarrolladorId)
    if (yaAsignado) return
    const dev = almacen.desarrolladores.find((d) => d.id === desarrolladorId)
    const horasSemana = horasSemanalesDe(horasDiarias)
    registrar('Asignó desarrollador', `${dev?.nombre ?? desarrolladorId} como ${rol}: ${horasDiarias} h/día (${horasSemana} h/semana)`, proyectoId)
    setAlmacen((previo) => ({
      ...previo,
      asignaciones: [...previo.asignaciones, { id: nuevoId('A'), proyectoId, desarrolladorId, rol, horasDiarias, horasSemana }],
    }))
  }

  const quitarAsignacion = (asignacionId: string): string | null => {
    const asignacion = almacen.asignaciones.find((a) => a.id === asignacionId)
    if (!asignacion) return null
    const equipo = almacen.asignaciones.filter((a) => a.proyectoId === asignacion.proyectoId)
    if (equipo.length <= 1) return 'Cada proyecto debe tener al menos un desarrollador asignado'
    if (esJefe(asignacion, equipo)) return 'Es el jefe de proyecto: nombra a otra persona como jefe antes de quitarlo'
    const dev = almacen.desarrolladores.find((d) => d.id === asignacion.desarrolladorId)
    registrar('Desasignó desarrollador', dev?.nombre ?? asignacion.desarrolladorId, asignacion.proyectoId)
    setAlmacen((previo) => ({ ...previo, asignaciones: previo.asignaciones.filter((a) => a.id !== asignacionId) }))
    return null
  }

  const nombrarJefe = (proyectoId: string, desarrolladorId: string): string | null => {
    if (usuario?.rol !== 'administrador' && usuario?.rol !== 'comercial') return 'Solo el administrador o el área comercial puede cambiar el jefe de proyecto'
    const equipo = almacen.asignaciones.filter((a) => a.proyectoId === proyectoId)
    const nuevo = equipo.find((a) => a.desarrolladorId === desarrolladorId)
    if (!nuevo) return 'Esa persona no pertenece al equipo del proyecto'
    if (esJefe(nuevo, equipo)) return null
    const anterior = equipo.find((a) => esJefe(a, equipo))
    const nombre = (id?: string) => almacen.desarrolladores.find((d) => d.id === id)?.nombre ?? 'Sin jefe'
    registrar('Nombró jefe de proyecto', `${nombre(anterior?.desarrolladorId)} deja la jefatura y la asume ${nombre(desarrolladorId)}`, proyectoId)
    setAlmacen((previo) => ({
      ...previo,
      asignaciones: previo.asignaciones.map((a) =>
        a.proyectoId === proyectoId ? { ...a, rol: a.desarrolladorId === desarrolladorId ? 'jefe' : 'colaborador' } : a
      ),
    }))
    return null
  }

  const registrarHoras = (proyectoId: string, desarrolladorId: string, semana: string, horas: number): string | null => {
    if (!usuario) return 'Inicia sesión para registrar horas'
    const dev = almacen.desarrolladores.find((d) => d.id === desarrolladorId)
    const esPropio = usuario.rol === 'desarrollador' && dev?.usuarioId === usuario.id
    if (usuario.rol !== 'administrador' && usuario.rol !== 'comercial' && !esPropio) return 'No tienes permiso para registrar las horas de otra persona'
    if (!almacen.asignaciones.some((a) => a.proyectoId === proyectoId && a.desarrolladorId === desarrolladorId)) return 'Esa persona no está asignada al proyecto'
    if (semana > inicioSemana(HOY)) return 'No se pueden registrar horas de semanas futuras'
    if (!(horas >= 0) || horas > 80) return 'Las horas de una semana deben estar entre 0 y 80'
    const total = redondearHoras(horas)
    const asignacion = almacen.asignaciones.find((a) => a.proyectoId === proyectoId && a.desarrolladorId === desarrolladorId)!
    const extra = horasExtraDe(almacen.horasExtra, proyectoId, desarrolladorId, semana)
    const limite = redondearHoras(asignacion.horasSemana + extra)
    if (total > limite) {
      return extra > 0
        ? `${dev?.nombre ?? 'Esta persona'} puede registrar hasta ${limite} h esa semana (${asignacion.horasSemana} h planificadas + ${extra} h extra aprobadas)`
        : `Las horas planificadas de ${dev?.nombre ?? 'esta persona'} son ${asignacion.horasSemana} h por semana. Para registrar más, el administrador debe aprobar horas extra`
    }
    const coincide = (h: RegistroHoras) => h.proyectoId === proyectoId && h.desarrolladorId === desarrolladorId && h.semana === semana
    const existente = almacen.horas.find(coincide)
    const anterior = existente?.horas ?? 0
    if (anterior === total) return null
    registrar('Registró horas', `${dev?.nombre ?? desarrolladorId}: semana del ${etiquetaSemana(semana)}, de ${anterior} h a ${total} h`, proyectoId)
    setAlmacen((previo) => {
      const resto = previo.horas.filter((h) => !coincide(h))
      if (total === 0) return { ...previo, horas: resto }
      const nuevo: RegistroHoras = {
        id: existente?.id ?? nuevoId('H'),
        proyectoId,
        desarrolladorId,
        semana,
        horas: total,
        registradoPor: usuario.nombre,
        fecha: HOY,
      }
      return { ...previo, horas: [...resto, nuevo] }
    })
    return null
  }

  const aprobarHorasExtra = (proyectoId: string, desarrolladorId: string, semana: string, horas: number): string | null => {
    if (usuario?.rol !== 'administrador') return 'Solo el administrador puede aprobar horas extra'
    if (!almacen.asignaciones.some((a) => a.proyectoId === proyectoId && a.desarrolladorId === desarrolladorId)) return 'Esa persona no está asignada al proyecto'
    if (!(horas > 0) || horas > 40) return 'Las horas extra deben estar entre 0 y 40 por semana'
    const cantidad = redondearHoras(horas)
    const coincide = (x: AprobacionHorasExtra) => x.proyectoId === proyectoId && x.desarrolladorId === desarrolladorId && x.semana === semana
    const existente = almacen.horasExtra.find(coincide)
    if (existente?.horas === cantidad) return null
    const asignacion = almacen.asignaciones.find((a) => a.proyectoId === proyectoId && a.desarrolladorId === desarrolladorId)!
    const registradas = almacen.horas.find((h) => h.proyectoId === proyectoId && h.desarrolladorId === desarrolladorId && h.semana === semana)?.horas ?? 0
    if (registradas > asignacion.horasSemana + cantidad) return `Ya hay ${registradas} h registradas esa semana: aprueba al menos ${redondearHoras(registradas - asignacion.horasSemana)} h extra`
    const dev = almacen.desarrolladores.find((d) => d.id === desarrolladorId)
    registrar(
      existente ? 'Modificó horas extra' : 'Aprobó horas extra',
      `${dev?.nombre ?? desarrolladorId}: semana del ${etiquetaSemana(semana)}, ${existente ? `de ${existente.horas} h a ` : ''}${cantidad} h extra`,
      proyectoId
    )
    const nueva: AprobacionHorasExtra = {
      id: existente?.id ?? nuevoId('X'),
      proyectoId,
      desarrolladorId,
      semana,
      horas: cantidad,
      aprobadoPor: usuario.nombre,
      fecha: new Date().toISOString(),
      vista: false,
    }
    setAlmacen((previo) => ({ ...previo, horasExtra: [...previo.horasExtra.filter((x) => !coincide(x)), nueva] }))
    return null
  }

  const retirarHorasExtra = (proyectoId: string, desarrolladorId: string, semana: string): string | null => {
    if (usuario?.rol !== 'administrador') return 'Solo el administrador puede retirar horas extra'
    const coincide = (x: AprobacionHorasExtra) => x.proyectoId === proyectoId && x.desarrolladorId === desarrolladorId && x.semana === semana
    const existente = almacen.horasExtra.find(coincide)
    if (!existente) return null
    const asignacion = almacen.asignaciones.find((a) => a.proyectoId === proyectoId && a.desarrolladorId === desarrolladorId)
    const registradas = almacen.horas.find((h) => h.proyectoId === proyectoId && h.desarrolladorId === desarrolladorId && h.semana === semana)?.horas ?? 0
    if (asignacion && registradas > asignacion.horasSemana) return `No se puede retirar: ya hay ${registradas} h registradas y el plan es de ${asignacion.horasSemana} h. Corrige primero las horas de esa semana`
    const dev = almacen.desarrolladores.find((d) => d.id === desarrolladorId)
    registrar('Retiró horas extra', `${dev?.nombre ?? desarrolladorId}: semana del ${etiquetaSemana(semana)}, ${existente.horas} h`, proyectoId)
    setAlmacen((previo) => ({ ...previo, horasExtra: previo.horasExtra.filter((x) => !coincide(x)) }))
    return null
  }

  const marcarHorasExtraVistas = (ids: string[]) =>
    setAlmacen((previo) => ({ ...previo, horasExtra: previo.horasExtra.map((x) => (ids.includes(x.id) ? { ...x, vista: true } : x)) }))

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
    const comoJefe = almacen.proyectos.filter((p) => {
      const equipo = almacen.asignaciones.filter((a) => a.proyectoId === p.id)
      const propia = equipo.find((a) => a.desarrolladorId === desarrolladorId)
      return propia && equipo.length > 1 && esJefe(propia, equipo)
    })
    if (comoJefe.length > 0) {
      return `No se puede eliminar: es el jefe de proyecto de ${comoJefe.map((p) => p.nombre).join(', ')}. Nombra otro jefe primero.`
    }
    registrar('Eliminó desarrollador', dev.nombre)
    setAlmacen((previo) => ({
      ...previo,
      desarrolladores: previo.desarrolladores.filter((d) => d.id !== desarrolladorId),
      asignaciones: previo.asignaciones.filter((a) => a.desarrolladorId !== desarrolladorId),
      horas: previo.horas.filter((h) => h.desarrolladorId !== desarrolladorId),
      horasExtra: previo.horasExtra.filter((x) => x.desarrolladorId !== desarrolladorId),
      evidencias: previo.evidencias.filter((e) => e.desarrolladorId !== desarrolladorId),
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
    const horasProyecto = redondearHoras(almacen.horas.filter((h) => h.proyectoId === proyectoId).reduce((suma, h) => suma + h.horas, 0))
    registrar(
      'Eliminó proyecto',
      `${proyecto.codigo} ${proyecto.nombre}: ${idsCuotas.length} cuotas, ${cobrosProyecto.length} cobros (${formatoMoneda(totalCobrado)}), ${documentosProyecto.length} documentos, ${horasProyecto} horas registradas`
    )
    setAlmacen((previo) => ({
      ...previo,
      proyectos: previo.proyectos.filter((p) => p.id !== proyectoId),
      contratos: previo.contratos.filter((k) => k.proyectoId !== proyectoId),
      cuotas: previo.cuotas.filter((q) => !idsCuotas.includes(q.id)),
      cobros: previo.cobros.filter((b) => !idsCuotas.includes(b.cuotaId)),
      documentos: previo.documentos.filter((d) => d.proyectoId !== proyectoId),
      asignaciones: previo.asignaciones.filter((a) => a.proyectoId !== proyectoId),
      horas: previo.horas.filter((h) => h.proyectoId !== proyectoId),
      horasExtra: previo.horasExtra.filter((x) => x.proyectoId !== proyectoId),
      evidencias: previo.evidencias.filter((e) => e.proyectoId !== proyectoId),
      adicionales: previo.adicionales.filter((a) => a.proyectoId !== proyectoId),
    }))
    return null
  }

  const puedeGestionarComercial = () => usuario?.rol === 'administrador' || usuario?.rol === 'comercial'

  // ----- Adicionales y ampliaciones -----
  const validarAdicional = (datos: DatosAdicional): string | null => {
    if (!datos.titulo.trim()) return 'Describe brevemente el adicional'
    if (!datos.solicitadoPor.trim()) return 'Indica quién del cliente lo solicitó'
    if (datos.montoEstimado < 0 || datos.diasEstimados < 0) return 'El monto y los días no pueden ser negativos'
    if (datos.fechaSolicitud > HOY) return 'La fecha de solicitud no puede ser futura'
    return null
  }

  const registrarAdicional = (proyectoId: string, datos: DatosAdicional): string | null => {
    if (!puedeGestionarComercial()) return 'Solo el administrador o el área comercial pueden registrar adicionales'
    const proyecto = almacen.proyectos.find((p) => p.id === proyectoId)
    if (!proyecto) return 'El proyecto ya no existe'
    const problema = validarAdicional(datos)
    if (problema) return problema
    const nuevo: Adicional = {
      ...datos,
      titulo: datos.titulo.trim(),
      descripcion: datos.descripcion.trim(),
      solicitadoPor: datos.solicitadoPor.trim(),
      id: nuevoId('AD'),
      proyectoId,
      estado: datos.montoEstimado > 0 ? 'cotizado' : 'solicitado',
      registradoPor: usuario?.nombre ?? 'Sistema',
      creadoEn: new Date().toISOString(),
    }
    registrar('Registró adicional', `${nuevo.titulo} · pedido por ${nuevo.solicitadoPor}${nuevo.montoEstimado ? ` · ${formatoMoneda(nuevo.montoEstimado)}` : ''}`, proyectoId)
    setAlmacen((previo) => ({ ...previo, adicionales: [nuevo, ...previo.adicionales] }))
    return null
  }

  const editarAdicional = (adicionalId: string, datos: DatosAdicional, cotizar = false): string | null => {
    if (!puedeGestionarComercial()) return 'Solo el administrador o el área comercial pueden modificar adicionales'
    const actual = almacen.adicionales.find((a) => a.id === adicionalId)
    if (!actual) return 'El adicional ya no existe'
    if (actual.estado === 'aprobado' || actual.estado === 'rechazado') return 'Un adicional ya decidido no se puede modificar'
    const problema = validarAdicional(datos)
    if (problema) return problema
    if (cotizar && datos.montoEstimado <= 0) return 'Para cotizar indica el monto del adicional'
    const estado = cotizar || (actual.estado === 'cotizado' && datos.montoEstimado > 0) ? 'cotizado' : 'solicitado'
    registrar(cotizar ? 'Cotizó adicional' : 'Editó adicional', `${datos.titulo.trim()} · ${formatoMoneda(datos.montoEstimado)} · ${datos.diasEstimados} días`, actual.proyectoId)
    setAlmacen((previo) => ({
      ...previo,
      adicionales: previo.adicionales.map((a) =>
        a.id === adicionalId ? { ...a, ...datos, titulo: datos.titulo.trim(), descripcion: datos.descripcion.trim(), solicitadoPor: datos.solicitadoPor.trim(), estado } : a
      ),
    }))
    return null
  }

  /** Al aprobar se crea un contrato de ampliación con su propio cronograma: no se mezcla con el original (RF-52). */
  const aprobarAdicional = (adicionalId: string, datos: AprobacionAdicional): string | null => {
    if (!puedeGestionarComercial()) return 'Solo el administrador o el área comercial pueden aprobar adicionales'
    const adicional = almacen.adicionales.find((a) => a.id === adicionalId)
    if (!adicional) return 'El adicional ya no existe'
    if (adicional.estado === 'aprobado' || adicional.estado === 'rechazado') return 'Este adicional ya fue decidido'
    if (datos.monto <= 0) return 'Indica el monto aprobado por el cliente'
    if (datos.dias < 0 || datos.dias > 365) return 'Los días adicionales deben estar entre 0 y 365'
    const proyecto = almacen.proyectos.find((p) => p.id === adicional.proyectoId)
    if (!proyecto) return 'El proyecto ya no existe'
    const delProyecto = almacen.contratos.filter((k) => k.proyectoId === proyecto.id)
    const original = delProyecto.find((k) => k.tipo === 'original') ?? delProyecto[0]
    const base = original?.numero ?? proyecto.codigo
    const numero = `${base}-A${delProyecto.filter((k) => k.tipo === 'ampliacion').length + 1}`
    const contratoId = nuevoId('K')
    const nuevaEntrega = datos.extenderEntrega && datos.dias > 0 ? sumarDias(proyecto.fechaEntrega, datos.dias) : proyecto.fechaEntrega
    const contrato: Contrato = { id: contratoId, proyectoId: proyecto.id, numero, tipo: 'ampliacion', moneda: original?.moneda ?? 'USD', monto: redondear(datos.monto) }
    // Una cuota única del 100 %: comercial puede dividirla después en el plan de pagos.
    const cuota: Cuota = {
      id: nuevoId('Q'), contratoId, orden: 1, concepto: `Adicional: ${adicional.titulo}`, modalidad: 'hito', tipoValor: 'porcentaje', valor: 100,
      fechaProyectada: nuevaEntrega, fechaOriginal: nuevaEntrega, entregable: adicional.titulo, estadoEntrega: 'Pendiente', facturaRequerida: true,
    }
    registrar(
      'Aprobó adicional',
      `${adicional.titulo}: contrato ${numero} por ${formatoMoneda(contrato.monto, contrato.moneda)}${nuevaEntrega !== proyecto.fechaEntrega ? `; entrega de ${formatoFecha(proyecto.fechaEntrega)} a ${formatoFecha(nuevaEntrega)}` : ''}`,
      proyecto.id
    )
    setAlmacen((previo) => ({
      ...previo,
      contratos: [...previo.contratos, contrato],
      cuotas: [...previo.cuotas, cuota],
      proyectos: previo.proyectos.map((p) => (p.id === proyecto.id ? { ...p, fechaEntrega: nuevaEntrega } : p)),
      adicionales: previo.adicionales.map((a) =>
        a.id === adicionalId
          ? {
              ...a,
              montoEstimado: contrato.monto,
              diasEstimados: datos.dias,
              estado: 'aprobado',
              contratoId,
              decision: {
                por: usuario?.nombre ?? 'Sistema',
                fecha: new Date().toISOString(),
                ...(nuevaEntrega !== proyecto.fechaEntrega ? { fechaEntregaAnterior: proyecto.fechaEntrega, fechaEntregaNueva: nuevaEntrega } : {}),
              },
            }
          : a
      ),
    }))
    return null
  }

  const rechazarAdicional = (adicionalId: string, motivo: string): string | null => {
    if (!puedeGestionarComercial()) return 'Solo el administrador o el área comercial pueden rechazar adicionales'
    const adicional = almacen.adicionales.find((a) => a.id === adicionalId)
    if (!adicional) return 'El adicional ya no existe'
    if (adicional.estado === 'aprobado' || adicional.estado === 'rechazado') return 'Este adicional ya fue decidido'
    if (!motivo.trim()) return 'Indica el motivo del rechazo'
    registrar('Rechazó adicional', `${adicional.titulo}: ${motivo.trim()}`, adicional.proyectoId)
    setAlmacen((previo) => ({
      ...previo,
      adicionales: previo.adicionales.map((a) =>
        a.id === adicionalId ? { ...a, estado: 'rechazado', decision: { por: usuario?.nombre ?? 'Sistema', fecha: new Date().toISOString(), motivo: motivo.trim() } } : a
      ),
    }))
    return null
  }

  const eliminarAdicional = (adicionalId: string): string | null => {
    if (!puedeGestionarComercial()) return 'Solo el administrador o el área comercial pueden eliminar adicionales'
    const adicional = almacen.adicionales.find((a) => a.id === adicionalId)
    if (!adicional) return 'El adicional ya no existe'
    if (adicional.estado === 'aprobado') return 'Un adicional aprobado ya tiene contrato de ampliación; no se puede eliminar'
    registrar('Eliminó adicional', adicional.titulo, adicional.proyectoId)
    setAlmacen((previo) => ({ ...previo, adicionales: previo.adicionales.filter((a) => a.id !== adicionalId) }))
    return null
  }

  const crearCliente = (datos: Omit<Cliente, 'id'>): string | null => {
    if (!puedeGestionarComercial()) return 'Solo el administrador o el área comercial pueden registrar clientes'
    const nombre = datos.nombre.trim()
    if (!nombre || !datos.contacto.trim()) return 'Indica la razón social y la persona de contacto'
    if (almacen.clientes.some((c) => c.nombre.trim().toLowerCase() === nombre.toLowerCase())) return 'Ya existe un cliente con ese nombre'
    const nuevo: Cliente = { id: nuevoId('C'), nombre, contacto: datos.contacto.trim(), correo: datos.correo.trim(), telefono: datos.telefono.trim() }
    registrar('Registró cliente', `${nuevo.nombre} · ${nuevo.contacto}`)
    setAlmacen((previo) => ({ ...previo, clientes: [...previo.clientes, nuevo] }))
    return null
  }

  /** Comercial agenda la presentación del prototipo y actualiza su estado sin tocar el resto del proyecto. */
  const programarPrototipo = (proyectoId: string, cambios: { fechaPrototipo?: string; prototipo?: string }): string | null => {
    if (!puedeGestionarComercial()) return 'Solo el administrador o el área comercial pueden programar prototipos'
    const proyecto = almacen.proyectos.find((p) => p.id === proyectoId)
    if (!proyecto) return 'El proyecto ya no existe'
    const detalle = [
      cambios.fechaPrototipo !== undefined ? `presentación ${cambios.fechaPrototipo ? formatoFecha(cambios.fechaPrototipo) : 'sin fecha'}` : '',
      cambios.prototipo ? `estado ${cambios.prototipo}` : '',
    ].filter(Boolean).join(', ')
    registrar('Programó prototipo', `${proyecto.nombre}: ${detalle}`, proyectoId)
    setAlmacen((previo) => ({
      ...previo,
      proyectos: previo.proyectos.map((p) => {
        if (p.id !== proyectoId) return p
        const { fechaPrototipo: _f, ...resto } = p
        const fecha = cambios.fechaPrototipo === undefined ? p.fechaPrototipo : cambios.fechaPrototipo
        return { ...resto, ...(fecha ? { fechaPrototipo: fecha } : {}), prototipo: cambios.prototipo ?? p.prototipo }
      }),
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
      moneda: 'USD',
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

    const integrantes = [
      { ...datos.jefe, rol: 'jefe' as RolEquipo },
      ...datos.colaboradores.map((c) => ({ ...c, rol: 'colaborador' as RolEquipo })),
    ]
    const nuevasAsignaciones: Asignacion[] = integrantes.map((i) => ({
      id: nuevoId('A'),
      proyectoId,
      desarrolladorId: i.desarrolladorId,
      rol: i.rol,
      horasDiarias: i.horasDiarias,
      horasSemana: horasSemanalesDe(i.horasDiarias),
    }))
    const nombreDev = (id: string) => almacen.desarrolladores.find((d) => d.id === id)?.nombre ?? id
    const nombreCliente = datos.clienteId ? almacen.clientes.find((c) => c.id === datos.clienteId)?.nombre : datos.nuevoCliente.nombre
    const horasEquipo = redondearHoras(nuevasAsignaciones.reduce((suma, a) => suma + a.horasSemana, 0))
    const detalleColaboradores = datos.colaboradores.length
      ? datos.colaboradores.map((c) => `${nombreDev(c.desarrolladorId)} (${c.horasDiarias} h/día)`).join(', ')
      : 'ninguno'

    const oracion = (texto: string) => (texto.endsWith('.') ? texto : `${texto}.`)
    registrar(
      'Creó proyecto',
      [
        `${proyecto.codigo} ${proyecto.nombre}`,
        `Cliente: ${nombreCliente}`,
        `Contrato: ${formatoMoneda(datos.monto, 'USD')} USD`,
        `Duración: ${datos.mesesOfrecidos} meses, entrega ${formatoFecha(proyecto.fechaEntrega)}`,
        `Jefe de proyecto: ${nombreDev(datos.jefe.desarrolladorId)} (${datos.jefe.horasDiarias} h/día)`,
        `Colaboradores: ${detalleColaboradores}`,
        `Equipo: ${nuevasAsignaciones.length} personas, ${horasEquipo} h/semana`,
      ]
        .map(oracion)
        .join(' '),
      proyectoId
    )
    setAlmacen((previo) => ({
      ...previo,
      clientes: cliente ? [...previo.clientes, cliente] : previo.clientes,
      proyectos: [proyecto, ...previo.proyectos],
      contratos: [...previo.contratos, contrato],
      cuotas: [...previo.cuotas, cuotaFirma],
      asignaciones: [...previo.asignaciones, ...nuevasAsignaciones],
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
        registrarEvidencia,
        editarEvidencia,
        revisarEvidencia,
        eliminarEvidencia,
        actualizarCuota,
        agregarCuota,
        eliminarCuota,
        emitirFactura,
        adjuntarFactura,
        eliminarFactura,
        registrarCobro,
        adjuntarComprobante,
        agregarDocumento,
        adjuntarArchivoDocumento,
        actualizarEnlaceMinuta,
        agregarMinuta,
        asignarDesarrollador,
        nombrarJefe,
        registrarHoras,
        aprobarHorasExtra,
        retirarHorasExtra,
        marcarHorasExtraVistas,
        quitarAsignacion,
        crearDesarrollador,
        eliminarDesarrollador,
        desvincularUsuario,
        actualizarProyecto,
        eliminarProyecto,
        crearProyecto,
        crearCliente,
        registrarAdicional,
        editarAdicional,
        aprobarAdicional,
        rechazarAdicional,
        eliminarAdicional,
        programarPrototipo,
        restaurarDatos,
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