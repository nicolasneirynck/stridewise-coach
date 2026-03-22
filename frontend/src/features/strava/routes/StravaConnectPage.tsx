import { useSearchParams } from 'react-router'
import useSWR from 'swr'
import useSWRMutation from 'swr/mutation'
import { requestStravaConnectUrl, requestStravaActivities } from '../api/strava'
import { StravaConnectCard } from '../components/StravaConnectCard'
import { StravaConnectionSummary } from '../components/StravaConnectionSummary'
import { StravaActivitiesList } from '../components/StravaActivitiesList'
import AsyncData from '../../../components/ui/AsyncData'

export function StravaConnectPage() {
  const [searchParams] = useSearchParams()

  const status = searchParams.get('status')
  const athleteId = searchParams.get('athleteId')
  const reason = searchParams.get('reason')
  const isConnected = status === 'success'

  // Callback errors happen after Strava redirects back.
  // Mutation errors happen while starting the connection from this page.
  const callbackError = 
    status === 'error'
      ? new Error(
          reason === 'access_denied'
            ? 'You cancelled the Strava connection.'
            : reason === 'missing_code'
              ? 'Strava did not return an authorization code.'
              : reason === 'token_exchange_failed'
                ? 'We could not finish the Strava connection. Please try again.'
                : 'Something went wrong while connecting Strava.',
        )
      : null

  const {
    trigger: triggerStravaConnect,
    isMutating: isConnectingStrava,
    error: connectError,
  } = useSWRMutation('strava/connect-url', requestStravaConnectUrl)

  const {
    data: activities,
    isLoading: activitiesLoading,
    error: activitiesError,
  } = useSWR(isConnected ? 'strava/activities' : null, requestStravaActivities)

  const totalActivities = activities?.length ?? 0
  const totalDistanceMeters = activities?.reduce((total, activity) => total + activity.distanceMeters, 0) ?? 0
  const latestActivity = 
    activities && activities.length > 0 
      ? Math.max(...activities.map((activity) => Date.parse(activity.startDate)))
      : null

  const connectionError = connectError ?? callbackError
  const connectedAthleteId = isConnected && athleteId ? athleteId : null

  const handleConnectClick = async () => {
    try {
      const connectUrl = await triggerStravaConnect()

      if (typeof connectUrl !== 'string' || connectUrl.trim().length === 0) {
        throw new Error('Missing Strava connect URL')
      }

      const parsedUrl = new URL(connectUrl)

      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        throw new Error('Invalid Strava connect URL')
      }
      
      window.location.href = parsedUrl.toString()
    } catch {
      // AsyncData will show the mutation error below
    }
  }

  function renderActivitiesStatus(message:string){
    return (
    <section aria-labelledby="strava-activities-heading" className='rounded-3xl border border-stone-200 bg-white p-8 shadow-sm'>
      <header className="mb-4">
        <h2 id="strava-activities-heading" className="text-2xl font-semibold tracking-tight text-zinc-950">
           Recent activities
        </h2>
        <p className="mt-2 text-sm text-zinc-600">
          {message}
        </p>
      </header>
    </section>)
  }

  const activitiesSection = activitiesLoading
    ? renderActivitiesStatus('Loading your recent Strava activities.')
    : activitiesError
      ? renderActivitiesStatus(
          'We couldn’t load your recent Strava activities right now. Please try refreshing the page in a moment.',
        )
      : <StravaActivitiesList activities={activities ?? []} />

  return (
    <section className="rounded-3xl border border-stone-200 bg-white p-8 shadow-sm">
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-500">
        Activity Import
      </p>

      <h1 className="mt-3 text-4xl font-bold tracking-tight text-zinc-950">
        Connect your Strava account
      </h1>

      <p className="mt-4 max-w-2xl text-base text-zinc-600">
        Link Strava so your activities can be imported into StrideWise.
      </p>

      <StravaConnectCard loading={isConnectingStrava} onConnect={handleConnectClick} />

      <div className="mt-4">
        <AsyncData loading={false} error={connectionError}>
          {connectedAthleteId ? (
            <div className='flex flex-col gap-6'>
              <StravaConnectionSummary
                athleteId={connectedAthleteId}
                totalActivities={totalActivities}
                totalDistanceMeters={totalDistanceMeters}
                latestActivityDate={latestActivity}
              />  
              {activitiesSection}
            </div>
          ) : null}
        </AsyncData>  
      </div>

    </section>
  )
}
