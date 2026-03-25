import { Navigate, useSearchParams } from 'react-router'

export function StravaCallbackHandler() {
  const [searchParams] = useSearchParams()
  const errorReason = searchParams.get('reason')
  const errorParams = new URLSearchParams()

  if (errorReason) {
    errorParams.set('reason', errorReason)
  }

  const search = errorParams.toString()

  return <Navigate to={search ? `/strava?${search}` : '/strava'} replace />
}
