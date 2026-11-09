import { HOY } from '../datos/datosEjemplo'
import type {
  Asignacion, Cliente, Cobro, Contrato, Cuota, Desarrollador, Documento, Proyecto, RegistroAuditoria, RegistroHoras, Usuario,
} from '../tipos'
import { equipoDeProyecto, esJefe, horasDiariasDe, redondearHoras } from './equipo'
import { cobradoCuota, estadoCuota, formatoFecha, formatoMoneda, montoCuota, resumenPlan, saldoCuota, sumarDias } from './finanzas'
import {
  cumplimiento, horasDe, idsConHoras, planificadoALaFecha, semanasDelProyecto, totalDeDesarrollador, totalDeProyecto, totalDeSemana, VENTANA_SEMANAS,
} from './horas'
import { resumenFinanciero } from './indicadores'
import { etiquetaCortaSemana } from './semanas'

export interface DatosInforme {
  proyecto: Proyecto
  cliente?: Cliente
  responsable?: Usuario
  contratos: Contrato[]
  cuotas: Cuota[]
  cobros: Cobro[]
  documentos: Documento[]
  asignaciones: Asignacion[]
  desarrolladores: Desarrollador[]
  horas: RegistroHoras[]
  registros: RegistroAuditoria[]
  generadoPor: string
}

const limpio = (texto: string | number | undefined | null): string =>
  String(texto ?? '').replace(/[\u2013\u2014]/g, '-').replace(/\u00b7/g, '|').replace(/[^\u0000-\u00ff]/g, '')

const ETIQUETAS_MODALIDAD = { fecha: 'Por fecha', hito: 'Por hito', mixta: 'Mixta' }
const ETIQUETAS_CATEGORIA = { contrato: 'Contrato', cotizacion: 'Cotizacion', acta: 'Acta', anexo: 'Anexo', minuta: 'Minuta' }

export const nombreArchivoInforme = (proyecto: Proyecto): string => {
  const nombre = proyecto.nombre.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '')
  return `Informe-${proyecto.codigo}-${nombre}.pdf`
}

export async function generarInformeProyecto(datos: DatosInforme): Promise<string> {
  const { jsPDF } = await import('jspdf')
  const autoTable = (await import('jspdf-autotable')).default
  const { proyecto, cliente, responsable, contratos, cuotas, cobros, documentos, desarrolladores, horas, registros } = datos

  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const ancho = doc.internal.pageSize.getWidth()
  const alto = doc.internal.pageSize.getHeight()
  const margen = 40
  let y = 0

  const finalDeTabla = (): number => (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY
  const nombreDe = (id: string): string => limpio(desarrolladores.find((d) => d.id === id)?.nombre ?? id)

  const tabla = (opciones: Parameters<typeof autoTable>[1], derecha: number[] = []) => {
    autoTable(doc, {
      startY: y,
      didParseCell: (gancho) => {
        if (derecha.includes(gancho.column.index)) gancho.cell.styles.halign = 'right'
      },
      margin: { left: margen, right: margen },
      styles: { fontSize: 8, cellPadding: 4, textColor: [30, 41, 59], lineColor: [226, 232, 240], lineWidth: 0.5 },
      headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      ...opciones,
    })
    y = finalDeTabla() + 20
  }

  const seccion = (texto: string) => {
    if (y > alto - 150) {
      doc.addPage()
      y = margen
    }
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(30, 41, 59)
    doc.text(texto, margen, y)
    doc.setDrawColor(99, 102, 241)
    doc.setLineWidth(1.5)
    doc.line(margen, y + 5, margen + 36, y + 5)
    y += 18
  }

  const nota = (texto: string) => {
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(9)
    doc.setTextColor(100, 116, 139)
    doc.text(limpio(texto), margen, y)
    y += 20
  }

  doc.setFillColor(15, 23, 42)
  doc.rect(0, 0, ancho, 96, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(165, 180, 252)
  doc.text('INFORME INTEGRAL DEL PROYECTO', margen, 30)
  doc.setFontSize(20)
  doc.setTextColor(255, 255, 255)
  const titulo = limpio(proyecto.nombre)
  doc.text(titulo.length > 46 ? `${titulo.slice(0, 45)}...` : titulo, margen, 56)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(203, 213, 225)
  doc.text(limpio(`${proyecto.codigo} | ${proyecto.estado} | Emitido el ${formatoFecha(HOY)}`), margen, 78)
  y = 124

  seccion('1. Datos generales')
  tabla({
    theme: 'grid',
    body: [
      ['Codigo', limpio(proyecto.codigo)],
      ['Nombre', limpio(proyecto.nombre)],
      ['Descripcion', limpio(proyecto.descripcion) || '-'],
      ['Estado del proyecto', limpio(proyecto.estado)],
      ['Estado del prototipo', limpio(proyecto.prototipo)],
      ['Cliente', limpio(cliente?.nombre) || '-'],
      ['Contacto del cliente', limpio(`${cliente?.contacto ?? '-'} | ${cliente?.correo ?? '-'} | ${cliente?.telefono ?? '-'}`)],
      ['Responsable', limpio(responsable ? `${responsable.nombre} (${responsable.rol})` : 'Sin asignar')],
      ['Fecha de inicio', formatoFecha(proyecto.fechaInicio)],
      ['Entrega ofrecida', `${formatoFecha(proyecto.fechaEntrega)} (${proyecto.mesesOfrecidos} meses)`],
      ['Contingencia', `${proyecto.diasContingencia} dias, limite ${formatoFecha(sumarDias(proyecto.fechaEntrega, proyecto.diasContingencia))}`],
      ['Prototipo', limpio(proyecto.urlPrototipo) || '-'],
      ['Repositorio', limpio(proyecto.repositorio) || '-'],
    ],
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 130, textColor: [100, 116, 139], fillColor: [248, 250, 252] } },
  })

  const financiero = resumenFinanciero(contratos, cuotas, cobros)
  seccion('2. Resumen financiero (USD)')
  tabla({
    head: [['Contratado', 'Cobrado', 'Por cobrar', 'Vencido', 'Avance de cobranza']],
    body: [[
      formatoMoneda(financiero.contratado), formatoMoneda(financiero.cobrado), formatoMoneda(financiero.porCobrar),
      formatoMoneda(financiero.vencido), `${financiero.progresoCobro} %`,
    ]],
    styles: { fontSize: 10, cellPadding: 6, halign: 'center', textColor: [30, 41, 59], lineColor: [226, 232, 240], lineWidth: 0.5 },
  })

  const equipo = equipoDeProyecto(datos.asignaciones, proyecto.id)
  const horasSemana = redondearHoras(equipo.reduce((suma, a) => suma + a.horasSemana, 0))
  seccion('3. Equipo del proyecto')
  tabla({
    head: [['Persona', 'Rol en el proyecto', 'Especialidad', 'Horas diarias', 'Horas por semana']],
    body: equipo.map((a) => [
      nombreDe(a.desarrolladorId),
      esJefe(a, equipo) ? 'Jefe de proyecto' : 'Colaborador',
      limpio(desarrolladores.find((d) => d.id === a.desarrolladorId)?.especialidad),
      horasDiariasDe(a),
      a.horasSemana,
    ]),
    foot: [['Total del equipo', `${equipo.length} personas`, '', '', horasSemana]],
    footStyles: { fillColor: [241, 245, 249], textColor: [30, 41, 59], fontStyle: 'bold' },
  }, [3, 4])

  seccion('4. Contratos y plan de pagos')
  contratos.forEach((contrato) => {
    const plan = resumenPlan(contrato, cuotas)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(51, 65, 85)
    doc.text(limpio(`Contrato ${contrato.numero} (${contrato.tipo}) | ${formatoMoneda(contrato.monto)} USD | Plan ${plan.estado}: cubre ${plan.porcentaje} %`), margen, y)
    y += 8
    tabla({
      head: [['#', 'Concepto', 'Modalidad', 'Monto', 'Fecha esperada', 'Entrega', 'Factura', 'Cobrado', 'Saldo', 'Estado']],
      body: cuotas
        .filter((q) => q.contratoId === contrato.id)
        .sort((a, b) => a.orden - b.orden)
        .map((q) => [
          q.orden, limpio(q.concepto), ETIQUETAS_MODALIDAD[q.modalidad], formatoMoneda(montoCuota(q, contrato)), formatoFecha(q.fechaProyectada),
          limpio(q.estadoEntrega), limpio(q.numeroFactura ?? (q.facturaRequerida ? 'Por emitir' : 'No requerida')),
          formatoMoneda(cobradoCuota(q.id, cobros)), formatoMoneda(saldoCuota(q, contrato, cobros)), estadoCuota(q, contrato, cobros),
        ]),
      styles: { fontSize: 7, cellPadding: 3, textColor: [30, 41, 59], lineColor: [226, 232, 240], lineWidth: 0.5 },
    }, [3, 7, 8])
  })
  if (contratos.length === 0) nota('El proyecto no tiene contratos registrados.')

  seccion('5. Cobros registrados')
  const cobrosProyecto = cobros.filter((b) => cuotas.some((q) => q.id === b.cuotaId))
  if (cobrosProyecto.length === 0) nota('Aun no se registran cobros.')
  else {
    tabla({
      head: [['Fecha', 'Concepto', 'Valor', 'Medio', 'Referencia', 'Recibo', 'Registrado por']],
      body: cobrosProyecto
        .sort((a, b) => a.fechaReal.localeCompare(b.fechaReal))
        .map((b) => [
          formatoFecha(b.fechaReal), limpio(cuotas.find((q) => q.id === b.cuotaId)?.concepto), formatoMoneda(b.valor), limpio(b.medio),
          limpio(b.referencia) || '-', limpio(b.numeroRecibo), limpio(b.registradoPor),
        ]),
    }, [2])
  }

  seccion('6. Documentos y minutas')
  if (documentos.length === 0) nota('El expediente aun no tiene documentos.')
  else {
    tabla({
      head: [['Documento', 'Categoria', 'Version', 'Estado', 'Fecha', 'Autor']],
      body: documentos.map((d) => [limpio(d.titulo), ETIQUETAS_CATEGORIA[d.categoria], limpio(d.version), limpio(d.estado), formatoFecha(d.fecha), limpio(d.autor)]),
    })
    const minutas = documentos.filter((d) => d.minuta)
    if (minutas.length > 0) {
      tabla({
        head: [['Reunion', 'Acuerdos', 'Compromisos pendientes']],
        body: minutas.map((d) => [
          limpio(`${d.titulo} (${formatoFecha(d.minuta?.fecha)})`),
          limpio(d.minuta?.acuerdos.map((a) => `- ${a}`).join('\n')) || '-',
          limpio(d.minuta?.pendientes.map((p) => `- ${p.tarea} | ${p.responsable} | ${formatoFecha(p.fecha)}`).join('\n')) || '-',
        ]),
        styles: { fontSize: 7, cellPadding: 3, textColor: [30, 41, 59], lineColor: [226, 232, 240], lineWidth: 0.5 },
      })
    }
  }

  seccion('7. Contabilidad de horas')
  const todasLasSemanas = semanasDelProyecto(proyecto)
  if (todasLasSemanas.length === 0) nota('El proyecto aun no inicia: no hay semanas para contabilizar.')
  else {
    const personas = idsConHoras(horas, proyecto.id, equipo)
    const totalInvertido = totalDeProyecto(horas, proyecto.id)
    const filas = personas.map((id) => {
      const asignacion = equipo.find((a) => a.desarrolladorId === id)
      const invertido = totalDeDesarrollador(horas, proyecto.id, id)
      const planificado = asignacion ? planificadoALaFecha(asignacion, proyecto) : 0
      const avance = cumplimiento(invertido, planificado)
      return { id, asignacion, invertido, planificado, avance }
    })
    const totalPlanificado = redondearHoras(filas.reduce((suma, f) => suma + f.planificado, 0))
    const avanceEquipo = cumplimiento(totalInvertido, totalPlanificado)
    tabla({
      head: [['Persona', 'Plan h/semana', 'Total invertido', 'Planificado a la fecha', 'Cumplimiento']],
      body: filas.map((f) => [
        nombreDe(f.id) + (f.asignacion ? '' : ' (ya no esta en el equipo)'), f.asignacion?.horasSemana ?? '-', `${f.invertido} h`, `${f.planificado} h`,
        f.avance === null ? '-' : `${f.avance} %`,
      ]),
      foot: [['Total del equipo en conjunto', horasSemana, `${totalInvertido} h`, `${totalPlanificado} h`, avanceEquipo === null ? '-' : `${avanceEquipo} %`]],
      footStyles: { fillColor: [241, 245, 249], textColor: [30, 41, 59], fontStyle: 'bold' },
    }, [1, 2, 3, 4])
    const semanas = todasLasSemanas.slice(-VENTANA_SEMANAS)
    tabla({
      head: [['Persona', ...semanas.map(etiquetaCortaSemana), 'Total']],
      body: filas.map((f) => [nombreDe(f.id), ...semanas.map((s) => horasDe(horas, proyecto.id, f.id, s) || '-'), `${f.invertido} h`]),
      foot: [['Equipo', ...semanas.map((s) => totalDeSemana(horas, proyecto.id, s) || '-'), `${totalInvertido} h`]],
      footStyles: { fillColor: [241, 245, 249], textColor: [30, 41, 59], fontStyle: 'bold' },
      styles: { fontSize: 7, cellPadding: 3, textColor: [30, 41, 59], lineColor: [226, 232, 240], lineWidth: 0.5 },
      columnStyles: { 0: { cellWidth: 70 } },
    }, semanas.map((_, indice) => indice + 1).concat(semanas.length + 1))
  }

  seccion('8. Registro de auditoria del proyecto')
  const eventos = registros.filter((r) => r.proyectoId === proyecto.id)
  if (eventos.length === 0) nota('No hay eventos de auditoria registrados para este proyecto en este navegador.')
  else {
    tabla({
      head: [['Fecha', 'Usuario', 'Accion', 'Detalle']],
      body: eventos.map((r) => [limpio(new Date(r.fecha).toLocaleString('es-EC')), limpio(r.usuario), limpio(r.accion), limpio(r.detalle)]),
      styles: { fontSize: 7, cellPadding: 3, textColor: [30, 41, 59], lineColor: [226, 232, 240], lineWidth: 0.5 },
      columnStyles: { 0: { cellWidth: 80 }, 3: { cellWidth: 230 } },
    })
  }

  const paginas = doc.getNumberOfPages()
  for (let pagina = 1; pagina <= paginas; pagina += 1) {
    doc.setPage(pagina)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(148, 163, 184)
    doc.text(limpio(`${proyecto.codigo} | Generado por ${datos.generadoPor} el ${formatoFecha(HOY)}`), margen, alto - 22)
    doc.text(`Pagina ${pagina} de ${paginas}`, ancho - margen, alto - 22, { align: 'right' })
  }

  const archivo = nombreArchivoInforme(proyecto)
  doc.save(archivo)
  return archivo
}