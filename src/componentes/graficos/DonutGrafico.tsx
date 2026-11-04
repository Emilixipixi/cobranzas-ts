import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

export interface SegmentoDonut {
  nombre: string
  valor: number
  color: string
}

interface Props {
  datos: SegmentoDonut[]
  centroValor: string
  centroEtiqueta: string
  formato?: (n: number) => string
  alto?: number
}

export default function DonutGrafico({ datos, centroValor, centroEtiqueta, formato = String, alto = 200 }: Props) {
  const total = datos.reduce((suma, d) => suma + d.valor, 0)
  const segmentos = total > 0 ? datos.filter((d) => d.valor > 0) : [{ nombre: 'Sin datos', valor: 1, color: '#e2e8f0' }]

  return (
    <div className="relative" style={{ height: alto }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={segmentos}
            dataKey="valor"
            nameKey="nombre"
            innerRadius="68%"
            outerRadius="94%"
            paddingAngle={segmentos.length > 1 ? 3 : 0}
            cornerRadius={6}
            stroke="none"
          >
            {segmentos.map((s) => <Cell key={s.nombre} fill={s.color} />)}
          </Pie>
          <Tooltip
            formatter={(valor, nombre) => [formato(Number(valor)), nombre]}
            contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 8px 24px rgb(15 23 42 / 0.12)', fontSize: 12 }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold tracking-tight text-slate-900">{centroValor}</span>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{centroEtiqueta}</span>
      </div>
    </div>
  )
}