interface StravaConnectionSummaryProps {
  athleteId: string | null
  onImport: () => Promise<void> | void
  isImporting: boolean
}

export function StravaConnectionSummary({
  athleteId, onImport, isImporting
}: StravaConnectionSummaryProps) {
  return (
    <section className="rounded-3xl border border-stone-200 bg-linear-to-br from-orange-50 via-white to-stone-50 p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-600">
            Strava Summary
          </p>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">
              Strava connected
            </h2>
            <p className="max-w-2xl text-sm text-zinc-600">
              Your Strava account is linked and ready to sync the latest activities into StrideWise.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-3">
          <span className="inline-flex w-fit rounded-full bg-green-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-green-700">
            Connected
          </span>
          <button
            type="button"
            onClick={onImport}
            disabled={isImporting}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:ring-offset-2 focus:ring-offset-orange-50 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-500"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              fill="none"
              className={`h-4 w-4 ${isImporting ? 'animate-spin' : ''}`}
            >
              <path
                d="M16.667 10A6.667 6.667 0 1 1 14.714 5.286"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M16.667 3.333v4.167H12.5"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {isImporting ? 'Syncing...' : 'Sync now'}
          </button>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <span className="inline-flex w-fit rounded-full border border-stone-200 bg-white px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-zinc-600">
          Athlete ID {athleteId ?? 'Unavailable'}
        </span>
      </div>
    </section>
  )
}
