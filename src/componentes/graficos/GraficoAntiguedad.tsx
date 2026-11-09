import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatoMoneda } from '../../utils/finanzas'

export interface TramoAntiguedad {
  rango: string
  Vencido: number
  cuotas: number
}

// De menos a más grave: cuanto más antigua la deuda, más intenso el rojo.
export const COLORES_TRAMO = ['#f59e0b', '#f97316', '#ef4444', '#9f1239']

const abreviar = (n: number): string => (n >= 1000 ? `${Math.round(n / 100) / 10}k` : String(n))

export default function GraficoAntiguedad({ datos }: { datos: TramoAntiguedad[] }) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={datos} margin={{ top: 24, right: 8, left: -8, bottom: 0 }} barCategoryGap="28%">
          <defs>
            {COLORES_TRAMO.map((color, i) => (
              <linearGradient key={color} id={`degradadoTramo${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.95} />
                <stop offset="100%" stopColor={color} stopOpacity={0.45} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="rango" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
          <YAxis tickFormatter={abreviar} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
          <Tooltip
            cursor={{ fill: '#f1f5f9', radius: 10 }}
            formatter={(valor, _nombre, item) => {
              const cuotas = (item.payload as TramoAntiguedad).cuotas
              return [`${formatoMoneda(Number(valor))} · ${cuotas} ${cuotas === 1 ? 'cuota' : 'cuotas'}`, 'Vencido']
            }}
            contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 8px 24px rgb(15 23 42 / 0.12)', fontSize: 12 }}
          />
          <Bar dataKey="Vencido" radius={[10, 10, 4, 4]} maxBarSize={72} minPointSize={3}>
            {datos.map((d, i) => (
              <Cell key={d.rango} fill={d.Vencido > 0 ? `url(#degradadoTramo${i % COLORES_TRAMO.length})` : '#e2e8f0'} />
            ))}
            <LabelList
              dataKey="Vencido"
              position="top"
              formatter={(valor: unknown) => (Number(valor) > 0 ? formatoMoneda(Number(valor)) : '')}
              style={{ fontSize: 11, fontWeight: 600, fill: '#334155' }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
