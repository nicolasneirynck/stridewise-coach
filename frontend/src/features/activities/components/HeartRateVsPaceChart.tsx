import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { HeartRateVsPaceTooltip } from './HeartRateVsPaceTooltip'

type HeartRateVsPacePoint = {
  pace: number
  heartRate: number
  startDate: string
}

type HeartRateVsPaceChartProps = {
  points: HeartRateVsPacePoint[]
}

const PACE_PADDING_SECONDS = 10
const HEART_RATE_PADDING_BPM = 5

function formatPaceSeconds(seconds: number): string {
  const totalSeconds = Math.round(seconds)
  const minutes = Math.floor(totalSeconds / 60)
  const remainingSeconds = totalSeconds % 60

  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`
}

export default function HeartRateVsPaceChart({points}: HeartRateVsPaceChartProps){
  if (points.length === 0) {
    return <p>No running activities with usable heart rate yet.</p>
  }

  const paceValues = points.map((point) => point.pace)
  const heartRateValues = points.map((point) => point.heartRate)

  const minPace = Math.min(...paceValues)
  const maxPace = Math.max(...paceValues)
  const minHeartRate = Math.min(...heartRateValues)
  const maxHeartRate = Math.max(...heartRateValues)

  const xAxisDomain: [number, number] = [
    Math.max(0, Math.floor(minPace - PACE_PADDING_SECONDS)),
    Math.ceil(maxPace + PACE_PADDING_SECONDS),
  ]
  const yAxisDomain: [number, number] = [
    Math.max(0, Math.floor(minHeartRate - HEART_RATE_PADDING_BPM)),
    Math.ceil(maxHeartRate + HEART_RATE_PADDING_BPM),
  ]

 return(
    <ResponsiveContainer width="100%" height={320}>
        <ScatterChart margin={{ top: 20, right: 20, bottom: 36, left: 28 }}>
        <CartesianGrid />
        <XAxis
          type="number"
          dataKey="pace"
          domain={xAxisDomain}
          tickFormatter={formatPaceSeconds}
          name="Pace"
          label={{ value: 'Pace (min/km)', position: 'insideBottom', offset: -12 }}
        />
        <YAxis
          type="number"
          dataKey="heartRate"
          domain={yAxisDomain}
          name="Heart Rate"
          label={{
            value: 'Heart Rate (bpm)',
            angle: -90,
            position: 'insideLeft',
            style: { textAnchor: 'middle' },
          }}
        />
        <Tooltip content={<HeartRateVsPaceTooltip />} />
        <Scatter data={points} />
      </ScatterChart>
    </ResponsiveContainer>
 )
}
