import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatoMoneda } from '../../utils/finanzas'

interface PuntoFlujo {
  mes: string
  Proyectado: number
  Ejecutado: number
}

const MESES_CORTOS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

const etiquetaMes = (mes: string): string => `${MESES_CORTOS[Number(mes.slice(5, 7)) - 1]} ${mes.slice(2, 4)}`

const abreviar = (n: number): string => (n >= 1000 ? `${n / 1000}k` : String(n))

export default function GraficoFlujoMensual({ datos }: { datos: PuntoFlujo[] }) {
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={datos} margin={{ top: 10, right: 8, left: -8, bottom: 0 }}>
          <defs>
            <linearGradient id="degradadoProyectado" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.28} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="degradadoEjecutado" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="mes" tickFormatter={etiquetaMes} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
          <YAxis tickFormatter={abreviar} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
          <Tooltip
            labelFormatter={(mes) => etiquetaMes(String(mes))}
            formatter={(valor, nombre) => [formatoMoneda(Number(valor)), nombre]}
            contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 8px 24px rgb(15 23 42 / 0.12)', fontSize: 12 }}
          />
          <Area type="monotone" dataKey="Proyectado" stroke="#6366f1" strokeWidth={2} fill="url(#degradadoProyectado)" />
          <Area type="monotone" dataKey="Ejecutado" stroke="#10b981" strokeWidth={2.5} fill="url(#degradadoEjecutado)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}