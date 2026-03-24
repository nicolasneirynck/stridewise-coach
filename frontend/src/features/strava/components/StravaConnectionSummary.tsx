interface StravaConnectionSummaryProps {
  athleteId: string
  totalActivities: number
  totalDistanceMeters: number
  latestActivityDate: number | null
  onImport: () => void
  isImporting: boolean
}

function formatActivityDate(date:number):string{
  return new Intl.DateTimeFormat('en-GB',{
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(new Date(date))
}

export function StravaConnectionSummary({
  athleteId,totalActivities,totalDistanceMeters, latestActivityDate, onImport, isImporting
}: StravaConnectionSummaryProps) {

  const totalDistanceKms = `${(totalDistanceMeters/1000).toFixed(2)} km`
  const latestActivityDisplay =  
    latestActivityDate 
      ? formatActivityDate(latestActivityDate)
      : 'No activity yet'

  return (
    <section className="rounded-3xl border border-stone-200 bg-linear-to-br from-orange-50 via-white to-stone-50 p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-600">
            Strava Summary
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">
            Strava overview
          </h2>
          <p className="mt-2 text-sm text-zinc-600">
            Activity summary data is live from Strava.
          </p>
        </div>
        <div className="flex flex-col gap-3 md:items-end">
          <span className="inline-flex w-fit rounded-full bg-green-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-green-700">
            Connected
          </span>
          <button
            type="button"
            onClick={onImport}
            disabled={isImporting}
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-amber-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:ring-offset-2 focus:ring-offset-orange-50 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-500"
          >
            {isImporting ? 'Importing activities from Strava...' : 'Import activities from Strava'}
          </button>
          <p className="max-w-xs text-sm text-zinc-500 md:text-right">
            Pull your latest Strava workouts into the dashboard whenever you need a refresh.
          </p>
        </div>
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
            Latest Activity
          </p>
          <p className="mt-2 text-xl font-semibold text-zinc-950">
            {latestActivityDisplay}
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
