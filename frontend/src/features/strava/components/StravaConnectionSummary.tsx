interface StravaConnectionSummaryProps {
  athleteId: string
  totalActivities: number
  totalDistanceMeters: number
}

const mockSummary = {
  athleteName: 'Mock runner',
  lastSynced: 'Today at 09:14',
}

export function StravaConnectionSummary({
  athleteId,totalActivities,totalDistanceMeters
}: StravaConnectionSummaryProps) {

  const totalDistanceKms = `${(totalDistanceMeters/1000).toFixed(2)} km`

  return (
    <section className="rounded-3xl border border-stone-200 bg-linear-to-br from-orange-50 via-white to-stone-50 p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-600">
            Connection Summary
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">
            {mockSummary.athleteName}
          </h2>
          <p className="mt-2 text-sm text-zinc-600">
            Athlete ID is live from Strava. The rest of this summary uses mock
            values for now.
          </p>
        </div>

        <span className="inline-flex w-fit rounded-full bg-green-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-green-700">
          Connected
        </span>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-stone-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
            Athlete ID
          </p>
          <p className="mt-2 text-xl font-semibold text-zinc-950">{athleteId}</p>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
            Last Synced
          </p>
          <p className="mt-2 text-xl font-semibold text-zinc-950">
            {mockSummary.lastSynced}
          </p>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
            Total Activities
          </p>
          <p className="mt-2 text-xl font-semibold text-zinc-950">
            {totalActivities}
          </p>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
            Total Distance
          </p>
          <p className="mt-2 text-xl font-semibold text-zinc-950">
            {totalDistanceKms}
          </p>
        </div>
      </div>
    </section>
  )
}
