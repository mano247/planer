import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface CategoryStat {
  id: number | null
  name: string
  icon: string
  color: string
  hours: number
  minutes: number
}

interface Props {
  data: CategoryStat[]
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { value: number; payload: CategoryStat }[] }) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-[#1a1d27] border border-[#2d3142] rounded-lg px-3 py-2 text-sm shadow-xl">
      <div className="flex items-center gap-2 text-slate-100">
        <span>{d.icon}</span>
        <span>{d.name}</span>
      </div>
      <div className="text-slate-400 mt-1">{d.hours.toFixed(1)}h</div>
    </div>
  )
}

export default function CategoryBarChart({ data }: Props): JSX.Element {
  if (data.length === 0) return <div className="flex items-center justify-center h-48 text-slate-600 text-sm">No data</div>

  const chartData = data.map(d => ({
    ...d,
    label: `${d.icon} ${d.name.split('/')[0].trim()}`
  }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 40 }}>
        <XAxis
          dataKey="label"
          tick={{ fill: '#64748b', fontSize: 10 }}
          angle={-35}
          textAnchor="end"
          interval={0}
        />
        <YAxis
          tick={{ fill: '#64748b', fontSize: 10 }}
          tickFormatter={v => `${v}h`}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#ffffff10' }} />
        <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
          {chartData.map((entry, index) => (
            <Cell key={index} fill={entry.color} opacity={0.8} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
