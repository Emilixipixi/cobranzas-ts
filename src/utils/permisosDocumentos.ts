import type { Asignacion, CategoriaControlada, Desarrollador, Documento, PermisosDocumentos, Rol, Usuario } from '../tipos'
import { puedeVerReunion } from './reuniones'

/** Categorías cuya visibilidad decide el administrador. Las minutas se controlan por reunión (equipo o áreas invitadas). */
export const CATEGORIAS_CONTROLADAS: { id: CategoriaControlada; etiqueta: string; detalle: string }[] = [
  { id: 'contrato', etiqueta: 'Contratos', detalle: 'Montos, condiciones y firmas' },
  { id: 'cotizacion', etiqueta: 'Cotizaciones', detalle: 'Precios y alcance ofertado' },
  { id: 'acta', etiqueta: 'Actas de entrega', detalle: 'Conformidad del cliente' },
  { id: 'anexo', etiqueta: 'Anexos', detalle: 'Documentos de soporte' },
]

/** Roles a los que se les puede dar o quitar acceso. El administrador siempre ve todo. */
export const ROLES_CONTROLADOS: { id: Exclude<Rol, 'administrador'>; etiqueta: string }[] = [
  { id: 'comercial', etiqueta: 'Comercial' },
  { id: 'finanzas', etiqueta: 'Finanzas' },
  { id: 'desarrollador', etiqueta: 'Desarrollo' },
]

/** Por defecto, el equipo de desarrollo no ve contratos ni cotizaciones porque contienen montos. */
export const PERMISOS_DOCUMENTOS_INICIALES: PermisosDocumentos = {
  contrato: ['comercial', 'finanzas'],
  cotizacion: ['comercial', 'finanzas'],
  acta: ['comercial', 'finanzas', 'desarrollador'],
  anexo: ['comercial', 'finanzas', 'desarrollador'],
}

const esControlada = (categoria: Documento['categoria']): categoria is CategoriaControlada => categoria !== 'minuta'

export const puedeVerCategoria = (rol: Rol | undefined, categoria: Documento['categoria'], permisos: PermisosDocumentos): boolean => {
  if (!rol) return false
  if (rol === 'administrador' || !esControlada(categoria)) return true
  return (permisos[categoria] ?? PERMISOS_DOCUMENTOS_INICIALES[categoria]).includes(rol)
}

/** Regla única para mostrar un documento: permiso de su categoría y, si es minuta, la audiencia de la reunión. */
export const puedeVerDocumento = (
  usuario: Usuario | null,
  d: Documento,
  permisos: PermisosDocumentos,
  desarrolladores: Desarrollador[],
  asignaciones: Asignacion[]
): boolean => puedeVerCategoria(usuario?.rol, d.categoria, permisos) && puedeVerReunion(usuario, d, desarrolladores, asignaciones)
