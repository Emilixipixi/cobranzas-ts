import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Eye, FileCheck2, FileWarning, Receipt, Search, Wallet } from 'lucide-react'
import { useDatos } from '../contextos/DatosContext'
import { entradaCompacta } from '../utils/estilos'
import { formatoFecha, formatoMoneda } from '../utils/finanzas'
import { filasCartera } from '../utils/indicadores'
import type { Cobro } from '../tipos'
import ModalComprobantes from './modales/ModalComprobantes'
import ModalVerArchivo from './modales/ModalVerArchivo'
import ModalVerFactura from './modales/ModalVerFactura'
import { Panel } from './Panel'

interface Props {
  puedeOperar: boolean
  /** Versión resumida para el dashboard: pocas filas, pendientes primero y enlace al control completo. */
  compacto?: boolean
}

type Pestana = 'facturas' | 'comprobantes'
type FiltroArchivo = 'todos' | 'con' | 'sin'

function Cobertura({ icono: Icono, titulo, con, total }: { icono: typeof Receipt; titulo: string; con: number; total: number }) {
  const porcentaje = total ? Math.round((con / total) * 100) : 100
  const completo = con === total
  return (
    <div className="rounded-xl border border-slate-200 p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
          <Icono className="h-3.5 w-3.5 text-indigo-500" />
          {titulo}
        </span>
        <span className={`text-xs font-semibold ${completo ? 'text-emerald-600' : 'text-amber-600'}`}>{con}/{total} con archivo</span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-slate-100">
        <div className={`h-2 rounded-full ${completo ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${porcentaje}%` }} />
      </div>
      <p className="mt-1 text-[11px] text-slate-500">{completo ? 'Todo respaldado' : `${total - con} pendiente(s) de subir`}</p>
    </div>
  )
}

function Estado({ tiene }: { tiene: boolean }) {
  return tiene ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700"><FileCheck2 className="h-3 w-3" />Archivo</span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700"><FileWarning className="h-3 w-3" />Sin archivo</span>
  )
}

/** Facturas emitidas y comprobantes de cobro (evidencias) en un solo lugar. */
export default function RespaldoCobranza({ puedeOperar, compacto = false }: Props) {
  const { proyectos, clientes, contratos, cuotas, cobros } = useDatos()
  const [pestana, setPestana] = useState<Pestana>('facturas')
  const [filtro, setFiltro] = useState<FiltroArchivo>(compacto ? 'sin' : 'todos')
  const [busqueda, setBusqueda] = useState('')
  const [verFactura, setVerFactura] = useState<string | null>(null)
  const [verComprobante, setVerComprobante] = useState<Cobro | null>(null)
  const [gestionarCuota, setGestionarCuota] = useState<string | null>(null)

  const filas = filasCartera(proyectos, clientes, contratos, cuotas, cobros)
  const facturas = filas.filter((f) => f.cuota.numeroFactura).sort((a, b) => (b.cuota.fechaFactura ?? '').localeCompare(a.cuota.fechaFactura ?? ''))
  const comprobantes = cobros
    .map((b) => ({ cobro: b, fila: filas.find((f) => f.cuota.id === b.cuotaId) }))
    .filter((x): x is { cobro: Cobro; fila: (typeof filas)[number] } => Boolean(x.fila))
    .sort((a, b) => b.cobro.fechaReal.localeCompare(a.cobro.fechaReal))

  const facturasConArchivo = facturas.filter((f) => f.cuota.archivoFactura).length
  const comprobantesConArchivo = comprobantes.filter((x) => x.cobro.archivoComprobante).length

  const texto = busqueda.trim().toLowerCase()
  const pasaArchivo = (tiene: boolean) => filtro === 'todos' || (filtro === 'con' ? tiene : !tiene)
  const facturasVisibles = facturas.filter(
    (f) => pasaArchivo(Boolean(f.cuota.archivoFactura)) && (!texto || `${f.cuota.numeroFactura} ${f.proyecto.nombre} ${f.cuota.concepto}`.toLowerCase().includes(texto))
  )
  const comprobantesVisibles = comprobantes.filter(
    (x) => pasaArchivo(Boolean(x.cobro.archivoComprobante)) && (!texto || `${x.cobro.numeroRecibo} ${x.cobro.referencia} ${x.fila.proyecto.nombre} ${x.fila.cuota.concepto}`.toLowerCase().includes(texto))
  )
  const limite = compacto ? 5 : Infinity

  return (
    <Panel
      titulo="Facturas y comprobantes de cobro"
      subtitulo={puedeOperar ? 'Respaldo documental que sube Finanzas: facturas emitidas y evidencias de cada pago' : 'Respaldo documental de facturación y cobros'}
      accion={
        compacto ? (
          <Link to="/cobranza" className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:underline">
            Ver todo en Control de cobranza <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        ) : undefined
      }
    >
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <Cobertura icono={Receipt} titulo="Facturas emitidas" con={facturasConArchivo} total={facturas.length} />
        <Cobertura icono={Wallet} titulo="Comprobantes de cobro" con={comprobantesConArchivo} total={comprobantes.length} />
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs font-semibold">
          {([
            { id: 'facturas', etiqueta: `Facturas (${facturas.length})` },
            { id: 'comprobantes', etiqueta: `Comprobantes de cobro (${comprobantes.length})` },
          ] as const).map((t) => (
            <button
              key={t.id}
              onClick={() => setPestana(t.id)}
              className={`rounded-md px-3 py-1.5 transition-colors ${pestana === t.id ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {t.etiqueta}
            </button>
          ))}
        </div>
        <select className={`${entradaCompacta} w-auto py-1.5 text-xs`} value={filtro} onChange={(e) => setFiltro(e.target.value as FiltroArchivo)}>
          <option value="todos">Con y sin archivo</option>
          <option value="sin">Solo pendientes de subir</option>
          <option value="con">Solo con archivo</option>
        </select>
        {!compacto && (
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input className={`${entradaCompacta} w-56 py-1.5 pl-8 text-xs`} placeholder="Número, recibo, proyecto…" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
          </div>
        )}
      </div>

      <div className="-mx-5 -mb-5 overflow-x-auto border-t border-slate-100">
        {pestana === 'facturas' ? (
          <table className="w-full text-sm">
            <thead className="bg-slate-50/60 text-left text-[11px] uppercase tracking-wider text-slate-500">
              <tr>
                {['Factura', 'Proyecto', 'Concepto', 'Emitida', 'Vence', 'Monto', 'Archivo', ''].map((t) => <th key={t} className="p-3 font-medium">{t}</th>)}
              </tr>
            </thead>
            <tbody>
              {facturasVisibles.length === 0 && <tr><td colSpan={8} className="p-4 text-center text-slate-400">{filtro === 'sin' ? 'Todas las facturas tienen su archivo' : 'No hay facturas con este filtro'}</td></tr>}
              {facturasVisibles.slice(0, limite).map((f) => (
                <tr key={f.cuota.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                  <td className="whitespace-nowrap p-3 font-mono text-xs font-semibold text-slate-900">{f.cuota.numeroFactura}</td>
                  <td className="whitespace-nowrap p-3"><Link to={`/proyectos/${f.proyecto.id}`} className="text-indigo-600 hover:underline">{f.proyecto.nombre}</Link></td>
                  <td className="whitespace-nowrap p-3 text-slate-600">{f.cuota.concepto}</td>
                  <td className="whitespace-nowrap p-3">{formatoFecha(f.cuota.fechaFactura)}</td>
                  <td className="whitespace-nowrap p-3">{formatoFecha(f.cuota.vencimientoFactura)}</td>
                  <td className="whitespace-nowrap p-3 tabular-nums">{formatoMoneda(f.monto, f.contrato.moneda)}</td>
                  <td className="p-3"><Estado tiene={Boolean(f.cuota.archivoFactura)} /></td>
                  <td className="whitespace-nowrap p-3 text-right">
                    <button onClick={() => setVerFactura(f.cuota.id)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:border-indigo-300 hover:text-indigo-700">
                      <Eye className="h-3.5 w-3.5" />{f.cuota.archivoFactura ? 'Ver factura' : puedeOperar ? 'Subir archivo' : 'Ver'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50/60 text-left text-[11px] uppercase tracking-wider text-slate-500">
              <tr>
                {['Recibo', 'Proyecto', 'Concepto', 'Fecha', 'Medio / referencia', 'Valor', 'Archivo', ''].map((t) => <th key={t} className="p-3 font-medium">{t}</th>)}
              </tr>
            </thead>
            <tbody>
              {comprobantesVisibles.length === 0 && <tr><td colSpan={8} className="p-4 text-center text-slate-400">{filtro === 'sin' ? 'Todos los cobros tienen su comprobante' : 'No hay cobros con este filtro'}</td></tr>}
              {comprobantesVisibles.slice(0, limite).map(({ cobro: b, fila: f }) => (
                <tr key={b.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                  <td className="whitespace-nowrap p-3 font-mono text-xs font-semibold text-slate-900">{b.numeroRecibo}</td>
                  <td className="whitespace-nowrap p-3"><Link to={`/proyectos/${f.proyecto.id}`} className="text-indigo-600 hover:underline">{f.proyecto.nombre}</Link></td>
                  <td className="whitespace-nowrap p-3 text-slate-600">{f.cuota.concepto}</td>
                  <td className="whitespace-nowrap p-3">{formatoFecha(b.fechaReal)}</td>
                  <td className="whitespace-nowrap p-3 text-xs text-slate-600">{b.medio}{b.referencia ? ` · ${b.referencia}` : ''}</td>
                  <td className="whitespace-nowrap p-3 font-medium tabular-nums text-emerald-700">{formatoMoneda(b.valor, f.contrato.moneda)}</td>
                  <td className="p-3"><Estado tiene={Boolean(b.archivoComprobante)} /></td>
                  <td className="whitespace-nowrap p-3 text-right">
                    {b.archivoComprobante ? (
                      <button onClick={() => setVerComprobante(b)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:border-indigo-300 hover:text-indigo-700">
                        <Eye className="h-3.5 w-3.5" />Ver comprobante
                      </button>
                    ) : puedeOperar ? (
                      <button onClick={() => setGestionarCuota(f.cuota.id)} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-indigo-700">
                        Subir comprobante
                      </button>
                    ) : <span className="text-xs text-slate-400">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {compacto && (pestana === 'facturas' ? facturasVisibles : comprobantesVisibles).length > limite && (
          <p className="border-t border-slate-100 p-3 text-center text-xs text-slate-500">
            y {(pestana === 'facturas' ? facturasVisibles : comprobantesVisibles).length - limite} más ·{' '}
            <Link to="/cobranza" className="font-semibold text-indigo-600 hover:underline">ver en Control de cobranza</Link>
          </p>
        )}
      </div>

      {verFactura && <ModalVerFactura cuotaId={verFactura} puedeOperar={puedeOperar} onCerrar={() => setVerFactura(null)} />}
      {verComprobante?.archivoComprobante && <ModalVerArchivo archivo={verComprobante.archivoComprobante} titulo={`Comprobante ${verComprobante.numeroRecibo}`} onCerrar={() => setVerComprobante(null)} />}
      {gestionarCuota && <ModalComprobantes cuotaId={gestionarCuota} puedeOperar={puedeOperar} onCerrar={() => setGestionarCuota(null)} />}
    </Panel>
  )
}
