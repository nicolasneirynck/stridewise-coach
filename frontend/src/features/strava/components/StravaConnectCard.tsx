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
