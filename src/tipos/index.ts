export type Rol = 'administrador' | 'comercial' | 'finanzas' | 'desarrollador'

export type RolEquipo = 'jefe' | 'colaborador'

export interface Usuario {
  id: string
  nombre: string
  correo: string
  clave: string
  rol: Rol
  fechaAlta?: string
  /** Foto de perfil reducida (data URL JPEG) */
  foto?: string
}



export interface Cliente {
  id: string
  nombre: string
  contacto: string
  correo: string
  telefono: string
}

export interface Proyecto {
  id: string
  codigo: string
  nombre: string
  descripcion: string
  clienteId: string
  responsableId: string
  mesesOfrecidos: number
  fechaInicio: string
  fechaEntrega: string
  diasContingencia: number
  estado: string
  prototipo: string
  /** Fecha prevista para presentar el prototipo al cliente */
  fechaPrototipo?: string
  urlPrototipo: string
  repositorio: string
}

export interface Contrato {
  id: string
  proyectoId: string
  numero: string
  tipo: 'original' | 'ampliacion' | 'nuevo'
  moneda: string
  monto: number
}

export type Modalidad = 'fecha' | 'hito' | 'mixta'
export type TipoValor = 'porcentaje' | 'fijo'
export type EstadoEntrega = 'Pendiente' | 'Entregado' | 'Observado' | 'Atraso cliente' | 'Atraso interno'
export type EstadoCuota =
  | 'Pendiente'
  | 'Habilitada para cobro'
  | 'Facturada'
  | 'Parcialmente cobrada'
  | 'Cobrada'
  | 'Vencida'

export interface Cuota {
  id: string
  contratoId: string
  orden: number
  concepto: string
  modalidad: Modalidad
  tipoValor: TipoValor
  valor: number
  fechaProyectada: string | null
  fechaOriginal: string | null
  entregable: string
  estadoEntrega: EstadoEntrega
  facturaRequerida: boolean
  numeroFactura?: string
  fechaFactura?: string
  vencimientoFactura?: string
  archivoFactura?: ArchivoAdjunto
}

export interface ArchivoAdjunto {
  /** Clave del archivo en IndexedDB */
  clave: string
  nombre: string
  tipo: string
  tamano: number
  subidoPor: string
  fecha: string
}

export interface Cobro {
  id: string
  cuotaId: string
  fechaReal: string
  valor: number
  medio: string
  /** Nombre del comprobante declarado al registrar el cobro */
  comprobante: string
  referencia: string
  numeroRecibo: string
  registradoPor: string
  /** Archivo del comprobante (transferencia, depósito…) guardado en IndexedDB */
  archivoComprobante?: ArchivoAdjunto
}

export type CategoriaDocumento = 'contrato' | 'cotizacion' | 'acta' | 'anexo' | 'minuta'
export type EstadoDocumento = 'borrador' | 'en revisión' | 'firmado' | 'aprobado'

export interface PendienteMinuta {
  tarea: string
  responsable: string
  fecha: string
}

/** equipo: solo desarrolladores del proyecto y administración · areas: con los departamentos invitados */
export type AlcanceReunion = 'equipo' | 'areas'
export type AreaReunion = 'direccion' | 'comercial' | 'finanzas' | 'desarrollo'

export interface Minuta {
  fecha: string
  hora?: string
  enlace?: string
  alcance?: AlcanceReunion
  areas?: AreaReunion[]
  organizadorId?: string
  organizador?: string
  asistentes: string[]
  acuerdos: string[]
  pendientes: PendienteMinuta[]
}

export interface Documento {
  id: string
  proyectoId: string
  titulo: string
  categoria: CategoriaDocumento
  version: string
  estado: EstadoDocumento
  fecha: string
  autor: string
  notas: string
  minuta?: Minuta
  archivo?: ArchivoAdjunto
}

export interface Desarrollador {
  id: string
  nombre: string
  especialidad: string
  correo: string
  tecnologias: string[]
  usuarioId?: string
}

export interface Asignacion {
  id: string
  proyectoId: string
  desarrolladorId: string
  horasSemana: number
  horasDiarias?: number
  rol?: RolEquipo
}

export interface RegistroAuditoria {
  id: string
  fecha: string
  usuario: string
  rol: Rol
  accion: string
  detalle: string
  proyectoId?: string
}

export interface ItemFlujo {
  cuota: Cuota
  importe: number
  cobro?: Cobro
}

export type FlujoPorProyecto = Record<string, Record<string, ItemFlujo[]>>

export interface Almacen {
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
}

export interface AprobacionHorasExtra {
  id: string
  proyectoId: string
  desarrolladorId: string
  semana: string
  horas: number
  aprobadoPor: string
  fecha: string
  vista: boolean
}

export interface RegistroHoras {
  id: string
  proyectoId: string
  desarrolladorId: string
  semana: string
  horas: number
  registradoPor: string
  fecha: string
}

export type TipoEvidencia = 'commit' | 'actividad' | 'entrega' | 'captura' | 'documento'
export type EstadoEvidencia = 'pendiente' | 'validada' | 'observada'

/** Prueba de trabajo que un desarrollador deja en el proyecto (commit, actividad, captura, etc.). */
export interface Evidencia {
  id: string
  proyectoId: string
  desarrolladorId: string
  tipo: TipoEvidencia
  titulo: string
  descripcion: string
  /** Día en que se hizo el trabajo */
  fecha: string
  enlace?: string
  /** Hash del commit (solo tipo commit) */
  commit?: string
  rama?: string
  /** Cuota cuyo entregable avanza esta evidencia */
  cuotaId?: string
  horas?: number
  archivo?: ArchivoAdjunto
  registradoPor: string
  creadoEn: string
  estado: EstadoEvidencia
  revision?: { por: string; fecha: string; comentario: string }
}

export type EstadoAdicional = 'solicitado' | 'cotizado' | 'aprobado' | 'rechazado'

/** Trabajo extra que el cliente pide sobre un proyecto en curso. Al aprobarse genera un contrato de ampliación. */
export interface Adicional {
  id: string
  proyectoId: string
  titulo: string
  descripcion: string
  /** Persona del cliente que lo pidió */
  solicitadoPor: string
  fechaSolicitud: string
  montoEstimado: number
  diasEstimados: number
  estado: EstadoAdicional
  registradoPor: string
  creadoEn: string
  /** Contrato de ampliación generado al aprobar */
  contratoId?: string
  decision?: { por: string; fecha: string; motivo?: string; fechaEntregaAnterior?: string; fechaEntregaNueva?: string }
}
