type HeartRateVsPacePoint = {
  pace: number
  heartRate: number
  startDate: string
}

type HeartRateVsPaceTooltipProps = {
  active?: boolean
  payload?: ReadonlyArray<{ payload?: HeartRateVsPacePoint }>
}

function formatPaceSeconds(seconds: number): string {
  const totalSeconds = Math.round(seconds)
  const minutes = Math.floor(totalSeconds / 60)
  const remainingSeconds = totalSeconds % 60

  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`
}

function formatActivityDate(date: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}

export function HeartRateVsPaceTooltip({
  active,
  payload,
}: HeartRateVsPaceTooltipProps) {
  const point = payload?.[0]?.payload

  if (!active || !point) {
    return null
  }

  return (
    <div className="rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-sm">
      <p className="text-sm font-semibold text-zinc-950">
        {formatActivityDate(point.startDate)}
      </p>
      <p className="mt-2 text-sm text-zinc-700">
        Heart Rate: {Math.round(point.heartRate)} bpm
      </p>
      <p className="text-sm text-zinc-700">
        Pace: {formatPaceSeconds(point.pace)} /km
      </p>
    </div>
  )
}
