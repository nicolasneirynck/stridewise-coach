interface StravaConnectCardProps {
  loading: boolean
  isConnected: boolean
  onAction: () => void
}

export function StravaConnectCard({
  loading,
  isConnected,
  onAction,
}: StravaConnectCardProps) {
  return (
    <>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={onAction}
          disabled={loading}
          className={
            isConnected
              ? "rounded-xl bg-stone-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-300"
              : "rounded-xl bg-orange-500 px-5 py-3 text-sm font-medium text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-stone-300"
          }
        >
          {loading
            ? isConnected
              ? 'Disconnecting...'
              : 'Redirecting to Strava...'
            : isConnected
              ? 'Disconnect from Strava'
              : 'Connect with Strava'}
        </button>

        <p className="text-sm text-zinc-500">
          {isConnected
            ? 'Disconnecting will remove the current Strava link from your account.'
            : 'You will review permissions on Strava before anything is connected.'}
        </p>
      </div>
    </>
  )
}
