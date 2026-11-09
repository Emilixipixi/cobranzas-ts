import { diasLaborablesTranscurridos, semanasEntre, inicioSemana } from '../utils/semanas'
import type { Almacen, Asignacion, Cliente, Cobro, Contrato, Cuota, Desarrollador, Documento, Proyecto, RegistroHoras, Usuario, Evidencia, Adicional } from '../tipos'
export const HOY = '2026-10-29'

export const CODIGO_2FA = '123456'

export const DOMINIO_CORPORATIVO = 'demo.com'

export const usuarios: Usuario[] = [
  { id: 'U1', nombre: 'Ana Dirección', correo: 'admin@demo.com', clave: 'demo1234', rol: 'administrador', fechaAlta: '2026-10-01' },
  { id: 'U2', nombre: 'Carlos Comercial', correo: 'comercial@demo.com', clave: 'demo1234', rol: 'comercial', fechaAlta: '2026-10-01' },
  { id: 'U3', nombre: 'Fernanda Finanzas', correo: 'finanzas@demo.com', clave: 'demo1234', rol: 'finanzas', fechaAlta: '2026-10-01' },
  { id: 'U4', nombre: 'Diego Developer', correo: 'dev@demo.com', clave: 'demo1234', rol: 'desarrollador', fechaAlta: '2026-10-01' },
]

export const clientes: Cliente[] = [
  { id: 'C1', nombre: 'Cafetería Andina S.A.', contacto: 'María Torres', correo: 'maria@andina.demo', telefono: '+593 99 100 0001' },
  { id: 'C2', nombre: 'Logística Pichincha', contacto: 'Luis Paredes', correo: 'luis@pichincha.demo', telefono: '+593 99 100 0002' },
  { id: 'C3', nombre: 'Clínica Vista Hermosa', contacto: 'Dra. Elena Ruiz', correo: 'elena@vistahermosa.demo', telefono: '+593 99 100 0003' },
]

export const proyectos: Proyecto[] = [
  {
    id: 'P1', codigo: 'PRY-001', nombre: 'App de pedidos', descripcion: 'Aplicación móvil para pedidos y seguimiento de entregas de cafeterías.',
    clienteId: 'C1', responsableId: 'U2', mesesOfrecidos: 3, fechaInicio: '2026-10-20', fechaEntrega: '2027-01-20', diasContingencia: 15,
    estado: 'En desarrollo', prototipo: 'Validado', urlPrototipo: 'https://prototipo.demo/app-pedidos', repositorio: 'https://github.com/demo/app-pedidos',
  },
  {
    id: 'P2', codigo: 'PRY-002', nombre: 'Panel de rutas', descripcion: 'Panel web para planificar y monitorear rutas de reparto.',
    clienteId: 'C2', responsableId: 'U2', mesesOfrecidos: 2, fechaInicio: '2026-10-05', fechaEntrega: '2026-12-20', diasContingencia: 10,
    estado: 'En desarrollo', prototipo: 'Validado', urlPrototipo: 'https://prototipo.demo/panel-rutas', repositorio: 'https://github.com/demo/panel-rutas',
  },
  {
    id: 'P3', codigo: 'PRY-003', nombre: 'Portal de proveedores', descripcion: 'Portal para registro y cotización de proveedores.',
    clienteId: 'C1', responsableId: 'U2', mesesOfrecidos: 5, fechaInicio: '2026-11-15', fechaEntrega: '2027-04-15', diasContingencia: 20,
    estado: 'Prototipo', prototipo: 'Presentado', fechaPrototipo: '2026-11-06', urlPrototipo: 'https://prototipo.demo/portal-proveedores', repositorio: '',
  },
  {
    id: 'P4', codigo: 'PRY-004', nombre: 'Sistema de citas', descripcion: 'Sistema web de agendamiento de citas y recordatorios para pacientes.',
    clienteId: 'C3', responsableId: 'U2', mesesOfrecidos: 4, fechaInicio: '2026-08-15', fechaEntrega: '2026-12-15', diasContingencia: 15,
    estado: 'En entrega', prototipo: 'Validado', urlPrototipo: 'https://prototipo.demo/sistema-citas', repositorio: 'https://github.com/demo/sistema-citas',
  },
]

export const contratos: Contrato[] = [
  { id: 'K1', proyectoId: 'P1', numero: 'CT-2026-01', tipo: 'original', moneda: 'USD', monto: 10000 },
  { id: 'K2', proyectoId: 'P2', numero: 'CT-2026-02', tipo: 'original', moneda: 'USD', monto: 4000 },
  { id: 'K3', proyectoId: 'P4', numero: 'CT-2026-03', tipo: 'original', moneda: 'USD', monto: 6000 },
]

export const cuotasIniciales: Cuota[] = [
  { id: 'Q1', contratoId: 'K1', orden: 1, concepto: 'Firma del contrato', modalidad: 'hito', tipoValor: 'porcentaje', valor: 10, fechaProyectada: '2026-10-01', fechaOriginal: '2026-10-01', entregable: 'Contrato firmado', estadoEntrega: 'Entregado', facturaRequerida: true, numeroFactura: 'FAC-0038', fechaFactura: '2026-10-01', vencimientoFactura: '2026-10-10' },
  { id: 'Q2', contratoId: 'K1', orden: 2, concepto: 'Primer mes', modalidad: 'fecha', tipoValor: 'porcentaje', valor: 30, fechaProyectada: '2026-11-15', fechaOriginal: '2026-11-10', entregable: 'Avance mensual 1', estadoEntrega: 'Atraso interno', facturaRequerida: true },
  { id: 'Q3', contratoId: 'K1', orden: 3, concepto: 'Fin del proyecto', modalidad: 'hito', tipoValor: 'porcentaje', valor: 30, fechaProyectada: '2027-01-20', fechaOriginal: '2027-01-20', entregable: 'Acta de entrega', estadoEntrega: 'Pendiente', facturaRequerida: true },
  { id: 'Q4', contratoId: 'K1', orden: 4, concepto: 'Subida a tiendas', modalidad: 'hito', tipoValor: 'porcentaje', valor: 5, fechaProyectada: '2027-02-05', fechaOriginal: '2027-02-05', entregable: 'Publicación', estadoEntrega: 'Pendiente', facturaRequerida: false },
  { id: 'Q5', contratoId: 'K1', orden: 5, concepto: 'Por asignar', modalidad: 'mixta', tipoValor: 'porcentaje', valor: 0, fechaProyectada: null, fechaOriginal: null, entregable: '', estadoEntrega: 'Pendiente', facturaRequerida: false },
  { id: 'Q6', contratoId: 'K2', orden: 1, concepto: 'Firma del contrato', modalidad: 'hito', tipoValor: 'fijo', valor: 1000, fechaProyectada: '2026-10-05', fechaOriginal: '2026-10-05', entregable: 'Contrato firmado', estadoEntrega: 'Entregado', facturaRequerida: false },
  { id: 'Q7', contratoId: 'K2', orden: 2, concepto: 'Entrega final', modalidad: 'hito', tipoValor: 'fijo', valor: 3000, fechaProyectada: '2026-12-20', fechaOriginal: '2026-12-20', entregable: 'Acta de entrega', estadoEntrega: 'Atraso cliente', facturaRequerida: true },
  { id: 'Q8', contratoId: 'K3', orden: 1, concepto: 'Firma del contrato', modalidad: 'hito', tipoValor: 'porcentaje', valor: 20, fechaProyectada: '2026-08-15', fechaOriginal: '2026-08-15', entregable: 'Contrato firmado', estadoEntrega: 'Entregado', facturaRequerida: true, numeroFactura: 'FAC-0031', fechaFactura: '2026-08-15', vencimientoFactura: '2026-08-25' },
  { id: 'Q9', contratoId: 'K3', orden: 2, concepto: 'Avance 50 %', modalidad: 'hito', tipoValor: 'porcentaje', valor: 40, fechaProyectada: '2026-09-01', fechaOriginal: '2026-09-01', entregable: 'Módulo de agenda', estadoEntrega: 'Entregado', facturaRequerida: true, numeroFactura: 'FAC-0040', fechaFactura: '2026-09-01', vencimientoFactura: '2026-09-10' },
  { id: 'Q10', contratoId: 'K3', orden: 3, concepto: 'Entrega final', modalidad: 'hito', tipoValor: 'porcentaje', valor: 40, fechaProyectada: '2026-12-15', fechaOriginal: '2026-12-15', entregable: 'Acta de entrega', estadoEntrega: 'Pendiente', facturaRequerida: true },
]

export const cobrosIniciales: Cobro[] = [
  { id: 'B1', cuotaId: 'Q1', fechaReal: '2026-10-02', valor: 1000, medio: 'Transferencia', comprobante: 'transf-001.pdf', referencia: 'TRX-88231', numeroRecibo: 'REC-0001', registradoPor: 'Fernanda Finanzas' },
  { id: 'B2', cuotaId: 'Q6', fechaReal: '2026-10-08', valor: 600, medio: 'Transferencia', comprobante: 'transf-002.pdf', referencia: 'TRX-88902', numeroRecibo: 'REC-0002', registradoPor: 'Fernanda Finanzas' },
  { id: 'B3', cuotaId: 'Q8', fechaReal: '2026-08-16', valor: 1200, medio: 'Transferencia', comprobante: 'transf-003.pdf', referencia: 'TRX-77410', numeroRecibo: 'REC-0003', registradoPor: 'Fernanda Finanzas' },
  { id: 'B4', cuotaId: 'Q9', fechaReal: '2026-10-05', valor: 1000, medio: 'Depósito', comprobante: 'deposito-004.pdf', referencia: 'DEP-5521', numeroRecibo: 'REC-0004', registradoPor: 'Fernanda Finanzas' },
]

export const documentosIniciales: Documento[] = [
  { id: 'D1', proyectoId: 'P1', titulo: 'Cotización App de pedidos', categoria: 'cotizacion', version: 'v2.0', estado: 'aprobado', fecha: '2026-09-10', autor: 'Carlos Comercial', notas: 'Versión aprobada por el cliente.' },
  { id: 'D2', proyectoId: 'P1', titulo: 'Contrato CT-2026-01', categoria: 'contrato', version: 'v1.0', estado: 'firmado', fecha: '2026-09-28', autor: 'Carlos Comercial', notas: 'Firmado por ambas partes.' },
  {
    id: 'D3', proyectoId: 'P1', titulo: 'Minuta: reunión de arranque', categoria: 'minuta', version: 'v1.0', estado: 'aprobado', fecha: '2026-10-15', autor: 'Carlos Comercial', notas: '',
    minuta: {
      fecha: '2026-10-15',
      enlace: 'https://meet.google.com/abc-defg-hij',
      alcance: 'areas',
      areas: ['direccion', 'comercial', 'desarrollo'],
      organizadorId: 'U2',
      organizador: 'Carlos Comercial',
      asistentes: ['María Torres', 'Carlos Comercial', 'Diego Developer'],
      acuerdos: ['El cobro del primer mes depende del avance mensual 1', 'Las revisiones del cliente se responden en 3 días hábiles'],
      pendientes: [
        { tarea: 'Enviar accesos al entorno de pruebas', responsable: 'Diego Developer', fecha: '2026-10-22' },
        { tarea: 'Confirmar logo y paleta de la marca', responsable: 'María Torres', fecha: '2026-10-25' },
      ],
    },
  },
  { id: 'D8', proyectoId: 'P3', titulo: 'Cotización Portal de proveedores', categoria: 'cotizacion', version: 'v1.2', estado: 'en revisión', fecha: '2026-10-22', autor: 'Carlos Comercial', notas: 'El cliente pidió ajustar el alcance del módulo de licitaciones.' },
  { id: 'D4', proyectoId: 'P2', titulo: 'Contrato CT-2026-02', categoria: 'contrato', version: 'v1.0', estado: 'firmado', fecha: '2026-10-03', autor: 'Carlos Comercial', notas: '' },
  { id: 'D5', proyectoId: 'P4', titulo: 'Contrato CT-2026-03', categoria: 'contrato', version: 'v1.1', estado: 'firmado', fecha: '2026-08-14', autor: 'Carlos Comercial', notas: 'Incluye anexo de soporte.' },
  {
    id: 'D7', proyectoId: 'P1', titulo: 'Reunión técnica: integración de pagos', categoria: 'minuta', version: 'v1.0', estado: 'aprobado', fecha: '2026-10-30', autor: 'Diego Developer', notas: '',
    minuta: {
      fecha: '2026-10-30',
      hora: '10:00',
      enlace: 'https://meet.google.com/xyz-pagos-dev',
      alcance: 'equipo',
      organizadorId: 'U4',
      organizador: 'Diego Developer',
      asistentes: ['Diego Developer', 'Sofía Backend'],
      acuerdos: ['Usar la pasarela en modo pruebas hasta la entrega del avance 1'],
      pendientes: [{ tarea: 'Documentar los endpoints de pago', responsable: 'Sofía Backend', fecha: '2026-11-04' }],
    },
  },
  { id: 'D6', proyectoId: 'P4', titulo: 'Acta de conformidad: módulo de agenda', categoria: 'acta', version: 'v1.0', estado: 'firmado', fecha: '2026-09-01', autor: 'Carlos Comercial', notas: 'Firmada por la Dra. Elena Ruiz.' },
]

export const desarrolladores: Desarrollador[] = [
  { id: 'DEV1', nombre: 'Diego Developer', especialidad: 'Fullstack', correo: 'dev@demo.com', tecnologias: ['React', 'TypeScript', 'Node.js'], usuarioId: 'U4' },
  { id: 'DEV2', nombre: 'Sofía Backend', especialidad: 'Backend', correo: 'sofia@demo.com', tecnologias: ['Node.js', 'Prisma', 'PostgreSQL'] },
  { id: 'DEV3', nombre: 'Mateo Interfaces', especialidad: 'Frontend / UI', correo: 'mateo@demo.com', tecnologias: ['React', 'Tailwind', 'Figma'] },
]

export const asignacionesIniciales: Asignacion[] = [
  { id: 'A1', proyectoId: 'P1', desarrolladorId: 'DEV1', rol: 'jefe', horasDiarias: 4, horasSemana: 20 },
  { id: 'A2', proyectoId: 'P1', desarrolladorId: 'DEV2', rol: 'colaborador', horasDiarias: 4, horasSemana: 20 },
  { id: 'A3', proyectoId: 'P2', desarrolladorId: 'DEV1', rol: 'colaborador', horasDiarias: 2, horasSemana: 10 },
  { id: 'A4', proyectoId: 'P2', desarrolladorId: 'DEV3', rol: 'jefe', horasDiarias: 6, horasSemana: 30 },
  { id: 'A5', proyectoId: 'P3', desarrolladorId: 'DEV3', rol: 'jefe', horasDiarias: 2, horasSemana: 10 },
  { id: 'A6', proyectoId: 'P4', desarrolladorId: 'DEV2', rol: 'jefe', horasDiarias: 3, horasSemana: 15 },
  { id: 'A7', proyectoId: 'P4', desarrolladorId: 'DEV1', rol: 'colaborador', horasDiarias: 2, horasSemana: 10 },
]

const generarHorasIniciales = (): RegistroHoras[] => {
  const registros: RegistroHoras[] = []
  const semanaActual = inicioSemana(HOY)
  const diasTranscurridos = diasLaborablesTranscurridos(HOY)
  asignacionesIniciales.forEach((asignacion, indiceAsignacion) => {
    const proyecto = proyectos.find((p) => p.id === asignacion.proyectoId)
    if (!proyecto || proyecto.fechaInicio > HOY) return
    semanasEntre(proyecto.fechaInicio, HOY).forEach((semana, indiceSemana) => {
      const patron = (indiceSemana + indiceAsignacion) % 4
      const variacion = patron === 0 ? -2 : patron === 1 ? 1 : 0
      const horas = semana === semanaActual ? (asignacion.horasDiarias ?? 0) * diasTranscurridos : Math.max(0, asignacion.horasSemana + variacion)
      registros.push({
        id: `H${registros.length + 1}`,
        proyectoId: asignacion.proyectoId,
        desarrolladorId: asignacion.desarrolladorId,
        semana,
        horas,
        registradoPor: 'Datos de demostración',
        fecha: semana,
      })
    })
  })
  return registros
}

export const horasIniciales: RegistroHoras[] = generarHorasIniciales()

export const evidenciasIniciales: Evidencia[] = [
  {
    id: 'EV1', proyectoId: 'P4', desarrolladorId: 'DEV2', tipo: 'commit', titulo: 'API de agenda: endpoints de citas',
    descripcion: 'CRUD de citas con validación de horarios ocupados y pruebas de integración.', fecha: '2026-10-20',
    enlace: 'https://github.com/demo/sistema-citas/commit/8f3a2c1', commit: '8f3a2c1', rama: 'feature/agenda', cuotaId: 'Q10', horas: 6,
    registradoPor: 'Sofía Backend', creadoEn: '2026-10-20T18:10:00.000Z', estado: 'validada',
    revision: { por: 'Ana Dirección', fecha: '2026-10-21T09:00:00.000Z', comentario: 'Correcto, con pruebas.' },
  },
  {
    id: 'EV2', proyectoId: 'P4', desarrolladorId: 'DEV1', tipo: 'commit', titulo: 'Pantalla de reserva de citas',
    descripcion: 'Formulario de reserva con selector de horario disponible y confirmación.', fecha: '2026-10-24',
    enlace: 'https://github.com/demo/sistema-citas/commit/b41d9e7', commit: 'b41d9e7', rama: 'feature/reserva', cuotaId: 'Q10', horas: 4,
    registradoPor: 'Diego Developer', creadoEn: '2026-10-24T20:30:00.000Z', estado: 'validada',
    revision: { por: 'Sofía Backend', fecha: '2026-10-25T10:00:00.000Z', comentario: '' },
  },
  {
    id: 'EV3', proyectoId: 'P4', desarrolladorId: 'DEV1', tipo: 'actividad', titulo: 'Recordatorios por correo',
    descripcion: 'Plantillas de correo y envío programado 24 h antes de cada cita.', fecha: '2026-10-28', horas: 3,
    registradoPor: 'Diego Developer', creadoEn: '2026-10-28T19:00:00.000Z', estado: 'pendiente',
  },
  {
    id: 'EV4', proyectoId: 'P1', desarrolladorId: 'DEV1', tipo: 'commit', titulo: 'Carrito y resumen del pedido',
    descripcion: 'Carrito persistente y cálculo de totales con impuestos.', fecha: '2026-10-27',
    enlace: 'https://github.com/demo/app-pedidos/commit/c0ffee1', commit: 'c0ffee1', rama: 'develop', cuotaId: 'Q2', horas: 5,
    registradoPor: 'Diego Developer', creadoEn: '2026-10-27T21:00:00.000Z', estado: 'observada',
    revision: { por: 'Ana Dirección', fecha: '2026-10-28T08:30:00.000Z', comentario: 'Falta adjuntar la captura del flujo en el móvil.' },
  },
]

export const adicionalesIniciales: Adicional[] = [
  {
    id: 'AD1', proyectoId: 'P4', titulo: 'Recordatorios por WhatsApp',
    descripcion: 'Enviar los recordatorios de cita también por WhatsApp, además del correo.',
    solicitadoPor: 'Dra. Elena Ruiz', fechaSolicitud: '2026-10-20', montoEstimado: 900, diasEstimados: 10, estado: 'cotizado',
    registradoPor: 'Carlos Comercial', creadoEn: '2026-10-20T15:00:00.000Z',
  },
  {
    id: 'AD2', proyectoId: 'P1', titulo: 'Programa de puntos para clientes',
    descripcion: 'Acumular puntos por cada pedido y canjearlos por descuentos.',
    solicitadoPor: 'María Torres', fechaSolicitud: '2026-10-27', montoEstimado: 0, diasEstimados: 0, estado: 'solicitado',
    registradoPor: 'Carlos Comercial', creadoEn: '2026-10-27T17:30:00.000Z',
  },
]

export const almacenInicial: Almacen = {
  clientes,
  proyectos,
  contratos,
  cuotas: cuotasIniciales,
  cobros: cobrosIniciales,
  documentos: documentosIniciales,
  desarrolladores,
  asignaciones: asignacionesIniciales,
  horas: horasIniciales,
  horasExtra: [],
  evidencias: evidenciasIniciales,
  adicionales: adicionalesIniciales,
}
