export type Rol = 'administrador' | 'comercial' | 'finanzas' | 'desarrollador'

export interface Usuario {
  id: string
  nombre: string
  correo: string
  clave: string
  rol: Rol
  fechaAlta?: string
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
}

export interface Cobro {
  id: string
  cuotaId: string
  fechaReal: string
  valor: number
  medio: string
  comprobante: string
  referencia: string
  numeroRecibo: string
  registradoPor: string
}

export type CategoriaDocumento = 'contrato' | 'cotizacion' | 'acta' | 'anexo' | 'minuta'
export type EstadoDocumento = 'borrador' | 'en revisión' | 'firmado' | 'aprobado'

export interface PendienteMinuta {
  tarea: string
  responsable: string
  fecha: string
}

export interface Minuta {
  fecha: string
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
}
