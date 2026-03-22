interface StravaConnectCardProps {
  loading: boolean
  onConnect: () => void
}

export function StravaConnectCard({
  loading,
  onConnect,
}: StravaConnectCardProps) {
  return (
    <>
      <div className="mt-8 rounded-2xl border border-stone-200 bg-stone-50 p-5">
        <h2 className="text-lg font-semibold text-zinc-900">What happens next</h2>
        <p className="mt-2 text-sm text-zinc-600">
          You will be sent to Strava to approve access, then returned to the app.
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={onConnect}
          disabled={loading}
          className="rounded-xl bg-orange-500 px-5 py-3 text-sm font-medium text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-stone-300"
        >
          {loading ? 'Redirecting to Strava...' : 'Connect with Strava'}
        </button>

        <p className="text-sm text-zinc-500">
          You will review permissions on Strava before anything is connected.
        </p>
      </div>
    </>
  )
}
