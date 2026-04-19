import type { ReactNode } from "react"
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

export type WeeklyTrainingLoadPoint = {
  weekStartDate: string,
  weekStartTimestamp: number,
  totalLoad: number
}

type WeeklyTrainingLoadChartProps = {
  points: WeeklyTrainingLoadPoint[]
  rangeStartDate: Date
  rangeEndDate: Date
}

function formatWeekStartDateLabel(weekStartDate: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(new Date(`${weekStartDate}T00:00:00.000Z`))
}

function formatTooltipWeekStartDateLabel(label: ReactNode): ReactNode {
  if (typeof label === 'string') {
    return formatWeekStartDateLabel(label)
  }

  if (typeof label === 'number') {
    return formatWeekStartDateLabel(new Date(label).toISOString().slice(0, 10))
  }

  return label
}

function formatMonthTick(timestamp: number): string {
  return new Intl.DateTimeFormat('nl-BE', {
    month: 'short',
  }).format(new Date(timestamp))
}

function formatDistanceInKilometers(distanceInMeters: number): string {
  return `${new Intl.NumberFormat('nl-BE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(distanceInMeters / 1000)} km`
}

function formatDistanceTickInKilometers(distanceInMeters: number): string {
  return `${Math.round(distanceInMeters / 1000)}`
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

export default function WeeklyTrainingLoadChart({
  points,
  rangeStartDate,
  rangeEndDate,
}: WeeklyTrainingLoadChartProps){
  const monthTicks = getMonthTicks(rangeStartDate, rangeEndDate)

  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={points} margin={{ top: 20, right: 20, bottom: 36, left: 28 }}>
        <CartesianGrid />
        <XAxis
          type="number"
          dataKey="weekStartTimestamp"
          scale="time"
          domain={[rangeStartDate.getTime(), rangeEndDate.getTime()]}
          padding={{ left: 16, right: 16 }}
          ticks={monthTicks}
          tickFormatter={formatMonthTick}
          label={{ value: 'Month', position: 'bottom', offset: 8 }}/>
        <YAxis
          type="number"
          dataKey="totalLoad"
          tickFormatter={formatDistanceTickInKilometers}
          label={{
            value: 'Weekly Distance (km)',
            angle: -90,
            position: 'insideLeft',
            style: { textAnchor: 'middle' },
            offset: 20 
          }}/>
        <Tooltip
          labelFormatter={formatTooltipWeekStartDateLabel}
          formatter={(value) =>
            typeof value === 'number'
              ? [formatDistanceInKilometers(value), 'Weekly distance']
              : value
          }
        />
        <Line 
          type="monotone"
          dataKey="totalLoad"
          stroke="#f97316"
          dot={{ fill: '#ffffff', stroke: '#f97316' }}
          activeDot={{ r: 8, stroke: '#ffffff', fill: '#f97316' }}
          strokeWidth={2}/>
      </LineChart>
    </ResponsiveContainer>
  )

}
