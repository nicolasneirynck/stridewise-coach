import type { ReactNode } from "react"
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

type PaceEvolutionPoint = {
  date: string
  pace: number
  id: number
}

type PaceEvolutionPointProp = {
  points: PaceEvolutionPoint[]
}

function formatActivityDate(date: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}

function formatPaceSeconds(seconds: number): string {
  const totalSeconds = Math.round(seconds)
  const minutes = Math.floor(totalSeconds / 60)
  const remainingSeconds = totalSeconds % 60

  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`
}

function formatTooltipDateLabel(label: ReactNode): ReactNode {
  if (typeof label === 'string') {
    return formatActivityDate(label)
  }

  return label
}

export default function PaceEvolutionChart({points}:PaceEvolutionPointProp){
  return (
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={points} margin={{ top: 20, right: 20, bottom: 36, left: 28 }}>
          <CartesianGrid />
          <XAxis
            dataKey="date"
            tickFormatter={formatActivityDate}
            label={{ value: 'Date', position: 'bottom', offset: 8 }}/>
          <YAxis
            type="number"
            dataKey="pace"
            tickFormatter={formatPaceSeconds}
            reversed
            domain={[300, (dataMax: number) => dataMax + 20]}
            label={{
              value: 'Pace (min/km)',
              angle: -90,
              position: 'insideLeft',
              style: { textAnchor: 'middle' },
              offset: 0 
            }}/>
          <Tooltip
            labelFormatter={formatTooltipDateLabel}
            formatter={(value) =>
              typeof value === 'number'
                ? [`${formatPaceSeconds(value)} /km`, 'Pace']
                : value
            }
          />
          <Line 
            type="monotone"
            dataKey="pace"
            stroke="#f97316"
            dot={{ fill: '#ffffff', stroke: '#f97316' }}
            activeDot={{ r: 8, stroke: '#ffffff', fill: '#f97316' }}
            strokeWidth={2}/>
        </LineChart>
      </ResponsiveContainer>
    )
}
