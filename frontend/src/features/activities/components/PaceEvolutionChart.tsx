import type { ReactNode } from "react"
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

type PaceEvolutionPoint = {
  date: string
  dateTimestamp: number
  pace: number
  averageHeartRate: number
  id: number
  name: string
  distance: number
}

type PaceEvolutionPointProp = {
  points: PaceEvolutionPoint[]
  rangeStartDate: Date
  rangeEndDate: Date
}

type PaceEvolutionTooltipProps = {
  active?: boolean
  payload?: ReadonlyArray<{ payload?: PaceEvolutionPoint }>
  label?: ReactNode
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

  if (typeof label === 'number') {
    return formatActivityDate(new Date(label).toISOString())
  }

  return label
}

function formatMonthTick(timestamp: number): string {
  return new Intl.DateTimeFormat('nl-BE', {
    month: 'short',
  }).format(new Date(timestamp))
}

function formatDistanceKilometers(distanceInMeters: number): string {
  return `${(distanceInMeters / 1000).toFixed(2)} km`
}

function getMonthTicks(startDate: Date, endDate: Date): number[] {
  const ticks: number[] = []
  const current = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), 1))

  if (current < startDate) {
    current.setUTCMonth(current.getUTCMonth() + 1)
  }

  while (current <= endDate) {
    ticks.push(current.getTime())
    current.setUTCMonth(current.getUTCMonth() + 1)
  }

  return ticks
}

function CustomTooltip({ active, payload, label }: PaceEvolutionTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null
  }

  const point = payload[0]?.payload as PaceEvolutionPoint | undefined

  if (!point) {
    return null
  }

  return (
    <div className="rounded-md border border-stone-200 bg-white px-3 py-2 shadow-sm">
      <p className="font-medium text-zinc-950">{point.name}</p>
      <p className="text-sm text-zinc-600">{formatTooltipDateLabel(label)}</p>
      <p className="text-sm text-zinc-600">Distance: {formatDistanceKilometers(point.distance)}</p>
      <p className="text-sm text-zinc-600">Average heart rate: {point.averageHeartRate} bpm</p>
      <p className="text-sm text-zinc-600">Pace: {formatPaceSeconds(point.pace)} /km</p>
    </div>
  )
}

export default function PaceEvolutionChart({
  points,
  rangeStartDate,
  rangeEndDate,
}: PaceEvolutionPointProp){
  const monthTicks = getMonthTicks(rangeStartDate, rangeEndDate)

  return (
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={points} margin={{ top: 20, right: 20, bottom: 36, left: 28 }}>
          <CartesianGrid />
          <XAxis
            type="number"
            dataKey="dateTimestamp"
            scale="time"
            domain={[rangeStartDate.getTime(), rangeEndDate.getTime()]}
            padding={{ left: 16, right: 16 }}
            ticks={monthTicks}
            tickFormatter={formatMonthTick}
            label={{ value: 'Month', position: 'bottom', offset: 8 }}/>
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
          <Tooltip content={<CustomTooltip />} />
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
