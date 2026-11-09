import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, FileCheck2, FileClock, FileText, FolderOpen, Paperclip, Video } from 'lucide-react'
import EtiquetaEstado from '../componentes/EtiquetaEstado'
import { ETIQUETAS_CATEGORIA } from '../componentes/expediente/PestanaDocumentos'
import DonutGrafico from '../componentes/graficos/DonutGrafico'
import { BarraAvance, Encabezado, Leyenda, Panel } from '../componentes/Panel'
import TarjetaMetrica from '../componentes/TarjetaMetrica'
import { useAuth } from '../contextos/AuthContext'
import { useDatos } from '../contextos/DatosContext'
import ModalVerDocumento from '../componentes/modales/ModalVerDocumento'
import { entradaCompacta } from '../utils/estilos'
import { formatoFecha } from '../utils/finanzas'
import { CATEGORIAS_CONTROLADAS, puedeVerCategoria, puedeVerDocumento } from '../utils/permisosDocumentos'
import PermisosDocumentos from '../componentes/PermisosDocumentos'
import type { CategoriaDocumento, EstadoDocumento } from '../tipos'

const COLORES_CATEGORIA: Record<CategoriaDocumento, string> = {
  contrato: '#6366f1',
  cotizacion: '#0ea5e9',
  acta: '#10b981',
  anexo: '#f59e0b',
  minuta: '#8b5cf6',
}

const COLORES_ESTADO_DOC: Record<EstadoDocumento, string> = {
  borrador: '#94a3b8',
  'en revisión': '#f59e0b',
  firmado: '#10b981',
  aprobado: '#6366f1',
}

const ETIQUETAS_ESTADO_DOC: Record<EstadoDocumento, string> = {
  borrador: 'Borrador',
  'en revisión': 'En revisión',
  firmado: 'Firmado',
  aprobado: 'Aprobado',
}

export default function Documentos() {
  const { documentos: todos, proyectos, desarrolladores, asignaciones, permisosDocumentos } = useDatos()
  const { usuario } = useAuth()
  const documentos = todos.filter((d) => puedeVerDocumento(usuario, d, permisosDocumentos, desarrolladores, asignaciones))
  const ocultas = CATEGORIAS_CONTROLADAS.filter((c) => !puedeVerCategoria(usuario?.rol, c.id, permisosDocumentos))
  const puedeEditar = usuario?.rol === 'administrador' || usuario?.rol === 'comercial'
  const [viendo, setViendo] = useState<string | null>(null)
  const [categoria, setCategoria] = useState('todas')
  const [busqueda, setBusqueda] = useState('')

  const nombreProyecto = (id: string) => proyectos.find((p) => p.id === id)?.nombre ?? ''
  const lista = documentos
    .filter((d) => categoria === 'todas' || d.categoria === categoria)
    .filter((d) => `${d.titulo} ${nombreProyecto(d.proyectoId)} ${d.autor}`.toLowerCase().includes(busqueda.toLowerCase()))
    .sort((a, b) => b.fecha.localeCompare(a.fecha))

  const cerrados = documentos.filter((d) => d.estado === 'firmado' || d.estado === 'aprobado').length
  const enRevision = documentos.filter((d) => d.estado === 'en revisión').length
  const borradores = documentos.filter((d) => d.estado === 'borrador').length
  const porcentajeCerrados = documentos.length ? Math.round((cerrados / documentos.length) * 100) : 0

  const segmentosCategoria = (Object.keys(ETIQUETAS_CATEGORIA) as CategoriaDocumento[]).filter((c) => puedeVerCategoria(usuario?.rol, c, permisosDocumentos)).map((c) => ({
    id: c,
    nombre: ETIQUETAS_CATEGORIA[c],
    valor: documentos.filter((d) => d.categoria === c).length,
    color: COLORES_CATEGORIA[c],
  }))

  const segmentosEstado = (Object.keys(COLORES_ESTADO_DOC) as EstadoDocumento[]).map((e) => ({
    nombre: ETIQUETAS_ESTADO_DOC[e],
    valor: documentos.filter((d) => d.estado === e).length,
    color: COLORES_ESTADO_DOC[e],
  }))

  const porProyecto = proyectos
    .map((p) => {
      const docs = documentos.filter((d) => d.proyectoId === p.id)
      const listos = docs.filter((d) => d.estado === 'firmado' || d.estado === 'aprobado').length
      return { proyecto: p, total: docs.length, listos }
    })
    .filter((x) => x.total > 0)

  return (
    <>
      <Encabezado titulo="Documentación" subtitulo={ocultas.length ? "Documentos de los proyectos a los que tu área tiene acceso" : "Contratos, cotizaciones, actas, anexos y minutas de todos los proyectos"} />

      {usuario?.rol === 'administrador' && <PermisosDocumentos />}
      {ocultas.length > 0 && (
        <p className="mb-5 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
          Por la política de documentos de la empresa, tu área no tiene acceso a: <strong>{ocultas.map((c) => c.etiqueta.toLowerCase()).join(', ')}</strong>.
        </p>
      )}

      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <TarjetaMetrica titulo="Documentos" valor={String(documentos.length)} detalle={`En ${porProyecto.length} proyectos`} icono={FolderOpen} />
        <TarjetaMetrica titulo="Firmados / aprobados" valor={String(cerrados)} tono="ok" detalle={`${porcentajeCerrados} % del total`} icono={FileCheck2} />
        <TarjetaMetrica titulo="En revisión" valor={String(enRevision)} tono={enRevision > 0 ? 'alerta' : 'neutro'} detalle="Esperando aprobación" icono={FileClock} />
        <TarjetaMetrica titulo="Borradores" valor={String(borradores)} detalle="Aún no enviados" icono={FileText} />
      </div>

      <div className="mb-5 grid gap-5 lg:grid-cols-3">
        <Panel titulo="Por categoría" subtitulo="Clic para filtrar el listado">
          <DonutGrafico datos={segmentosCategoria} centroValor={String(documentos.length)} centroEtiqueta="Documentos" />
          <div className="mt-4 space-y-1 border-t border-slate-100 pt-3">
            {segmentosCategoria.map((s) => (
              <button key={s.id} onClick={() => setCategoria(categoria === s.id ? 'todas' : s.id)} className={`block w-full rounded-lg px-2 py-1 transition-colors ${categoria === s.id ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}>
                <Leyenda color={s.color} nombre={s.nombre} valor={String(s.valor)} />
              </button>
            ))}
          </div>
        </Panel>

        <Panel titulo="Estado de aprobación" subtitulo="Ciclo de vida de los documentos">
          <DonutGrafico datos={segmentosEstado} centroValor={`${porcentajeCerrados} %`} centroEtiqueta="Cerrados" />
          <div className="mt-4 space-y-2.5 border-t border-slate-100 pt-4">
            {segmentosEstado.map((s) => <Leyenda key={s.nombre} color={s.color} nombre={s.nombre} valor={String(s.valor)} />)}
          </div>
        </Panel>

        <Panel titulo="Expediente por proyecto" subtitulo="Documentos firmados o aprobados">
          {porProyecto.length === 0 && <p className="text-sm text-slate-400">Aún no hay documentos</p>}
          <div className="space-y-3.5">
            {porProyecto.map(({ proyecto, total, listos }) => (
              <Link key={proyecto.id} to={`/proyectos/${proyecto.id}`} className="block hover:opacity-80">
                <BarraAvance etiqueta={proyecto.nombre} porcentaje={Math.round((listos / total) * 100)} color="#10b981" texto={`${listos}/${total}`} />
              </Link>
            ))}
          </div>
        </Panel>
      </div>

      <Panel
        titulo={`Listado de documentos (${lista.length})`}
        subtitulo="Más recientes primero"
        accion={
          <div className="flex flex-wrap gap-2">
            <input className={`${entradaCompacta} w-56`} placeholder="Buscar documento o proyecto" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
            <select className={`${entradaCompacta} w-auto`} value={categoria} onChange={(e) => setCategoria(e.target.value)}>
              <option value="todas">Todas las categorías</option>
              {segmentosCategoria.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
            </select>
          </div>
        }
      >
        <div className="-mx-5 -mb-5 overflow-x-auto border-t border-slate-100">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/60 text-left text-[11px] uppercase tracking-wider text-slate-500">
              <tr>
                {['Documento', 'Proyecto', 'Categoría', 'Versión', 'Autor', 'Fecha', 'Estado', 'Archivo'].map((t) => <th key={t} className="p-3 font-medium">{t}</th>)}
              </tr>
            </thead>
            <tbody>
              {lista.length === 0 && <tr><td colSpan={8} className="p-4 text-center text-slate-400">No hay documentos con ese filtro</td></tr>}
              {lista.map((d) => {
                const proyecto = proyectos.find((p) => p.id === d.proyectoId)
                return (
                  <tr key={d.id} className="border-t border-slate-100 transition-colors hover:bg-slate-50/60">
                    <td className="p-3 font-medium text-slate-900">{d.titulo}</td>
                    <td className="p-3">{proyecto && <Link to={`/proyectos/${proyecto.id}`} className="text-indigo-600 hover:underline">{proyecto.nombre}</Link>}</td>
                    <td className="p-3">
                      <span className="inline-flex items-center gap-1.5 text-slate-600">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORES_CATEGORIA[d.categoria] }} />
                        {ETIQUETAS_CATEGORIA[d.categoria]}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-xs text-slate-500">{d.version}</td>
                    <td className="whitespace-nowrap p-3 text-slate-600">{d.autor}</td>
                    <td className="whitespace-nowrap p-3">{formatoFecha(d.fecha)}</td>
                    <td className="p-3"><EtiquetaEstado estado={d.estado} /></td>
                    <td className="whitespace-nowrap p-3">
                      {d.minuta ? (
                        d.minuta.enlace ? (
                          <a href={d.minuta.enlace} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100">
                            <Video className="h-3.5 w-3.5" />Unirse
                          </a>
                        ) : <span className="text-xs text-slate-400">Sin enlace</span>
                      ) : d.archivo ? (
                        <button onClick={() => setViendo(d.id)} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100">
                          <Eye className="h-3.5 w-3.5" />{d.archivo.tipo === 'application/pdf' ? 'Ver PDF' : 'Ver archivo'}
                        </button>
                      ) : puedeEditar ? (
                        <button onClick={() => setViendo(d.id)} className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-600 hover:border-indigo-300 hover:text-indigo-700">
                          <Paperclip className="h-3.5 w-3.5" />Adjuntar
                        </button>
                      ) : <span className="text-xs text-slate-400">—</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Panel>
      {viendo && <ModalVerDocumento documentoId={viendo} puedeEditar={puedeEditar} onCerrar={() => setViendo(null)} />}
    </>
  )
}
