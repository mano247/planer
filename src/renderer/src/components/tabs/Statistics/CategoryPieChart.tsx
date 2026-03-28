import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'

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

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { name: string; value: number; payload: CategoryStat }[] }) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-[#1a1d27] border border-[#2d3142] rounded-lg px-3 py-2 text-sm shadow-xl">
      <div className="flex items-center gap-2 text-slate-100">
        <span>{d.icon}</span>
        <span>{d.name}</span>
      </div>
      <div className="text-slate-400 mt-1">{d.hours.toFixed(1)}h ({d.minutes}min)</div>
    </div>
  )
}

export default function CategoryPieChart({ data }: Props): JSX.Element {
  if (data.length === 0) return <div className="flex items-center justify-center h-48 text-slate-600 text-sm">No data</div>

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={85}
          paddingAngle={2}
          dataKey="minutes"
          nameKey="name"
        >
          {data.map((entry, index) => (
            <Cell key={index} fill={entry.color} opacity={0.85} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          formatter={(value, entry) => {
            const item = data.find(d => d.name === value)
            return <span className="text-xs text-slate-400">{item?.icon} {value}</span>
          }}
          iconType="circle"
          iconSize={8}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
