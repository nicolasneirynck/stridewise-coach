import { Navigate, useSearchParams } from 'react-router'

export function StravaCallbackHandler() {
  const [searchParams] = useSearchParams()
  const status = searchParams.get('status')
  const athleteId = searchParams.get('athleteId')
  const reason = searchParams.get('reason')
  const redirectParams = new URLSearchParams()

  if (status) {
    redirectParams.set('status', status)
  }

  if (athleteId) {
    redirectParams.set('athleteId', athleteId)
  }

  if (reason) {
    redirectParams.set('reason', reason)
  }

  const search = redirectParams.toString()

  return <Navigate to={search ? `/strava?${search}` : '/strava'} replace />
}
