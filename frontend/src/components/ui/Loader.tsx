export default function Loader() {
  return (
    <div className="rounded-2xl border border-stone-200 bg-stone-50 p-5">
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-stone-200 border-t-orange-500">
          <span className="sr-only">Loading...</span>
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Loading
          </p>
          <p className="mt-1 text-sm text-zinc-600">
            Preparing your Strava connection details.
          </p>
        </div>
      </div>
    </div>
  )
}
