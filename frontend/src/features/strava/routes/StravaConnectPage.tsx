import { useSearchParams } from 'react-router'
import useSWR from 'swr'
import useSWRMutation from 'swr/mutation'
import { requestStravaConnectUrl, requestStravaActivities, importStravaActivities, type StravaImport, requestStravaConnectionStatus} from '../api/strava'
import { StravaConnectCard } from '../components/StravaConnectCard'
import { StravaConnectionSummary } from '../components/StravaConnectionSummary'
import { StravaActivitiesList } from '../components/StravaActivitiesList'
import AsyncData from '../../../components/ui/AsyncData'
import { useEffect, useState } from 'react'

export function StravaConnectPage() {
  const [searchParams] = useSearchParams() // still necesarry?

  const {
    data: connectionStatus,
    isLoading: connectionStatusLoading,
    error: connectionStatusError
  } = useSWR('strava/connection-status', requestStravaConnectionStatus)

  const status = searchParams.get('status')
  const reason = searchParams.get('reason')
  const isConnected = connectionStatus ? connectionStatus.isConnected : false

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
    trigger: triggerStravaImport,
    isMutating: isImportingFromStrava,
    error: importError,
  } = useSWRMutation('activities/import-from-strava', importStravaActivities)

  const [importFeedback,setImportFeedback] = useState<StravaImport|null>(null);
  const [autoImportAttempted,setAutoImportAttempted] = useState<boolean>(false)

  const shouldLoadActivities = !connectionStatusLoading && isConnected

  const {
    data: activities,
    isLoading: activitiesLoading,
    error: activitiesError,
    mutate: refreshActivities
  } = useSWR(shouldLoadActivities ? 'strava/activities' : null, requestStravaActivities)

  const totalActivities = activities?.length ?? 0
  const totalDistanceMeters = activities?.reduce((total, activity) => total + activity.distanceMeters, 0) ?? 0
  const latestActivity = 
    activities && activities.length > 0 
      ? Math.max(...activities.map((activity) => Date.parse(activity.startDate)))
      : null

  const connectionError = connectionStatusError ?? connectError ?? callbackError
  const connectedAthleteId = isConnected && connectionStatus?.athleteId ? String(connectionStatus.athleteId) : null

  const shouldAutomaticallyImport = isConnected && !connectionStatusLoading && !connectionStatusError

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

  const handleImportClick = async () => {
    setImportFeedback(null)

    try{
      const importedActivities = await triggerStravaImport()

      setImportFeedback(importedActivities)
      await refreshActivities()

    } catch {
      // AsyncData will show the mutation error below
    }
    
  }

  useEffect(() => {
    if(autoImportAttempted || !shouldAutomaticallyImport)
      return

    setAutoImportAttempted(true)
    handleImportClick()
  }, [autoImportAttempted,shouldAutomaticallyImport,handleImportClick]);

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
          {isConnected ? (
            <div className='flex flex-col gap-6'>
              <StravaConnectionSummary
                athleteId={connectedAthleteId}
                totalActivities={totalActivities}
                totalDistanceMeters={totalDistanceMeters}
                latestActivityDate={latestActivity}
                onImport={handleImportClick}
                isImporting={isImportingFromStrava}
              />  
              {importError?
                <div className="rounded-3xl border border-stone-200 bg-white p-8 shadow-sm">
                  <p className="mt-2 text-sm text-zinc-600">
                    We couldn't import your Strava activities right now.
                  </p>
                </div>
                  : importFeedback? 
                <div className="rounded-3xl border border-stone-200 bg-white p-8 shadow-sm">
                  <p className="mt-2 text-sm text-zinc-600">
                    {importFeedback.importedCount > 0
                      ? `Imported ${importFeedback.importedCount} activities from Strava`
                      : `No new activities imported`}
                  </p>
                  <div className='flex flex-col'>
                    <small className="text-sm text-zinc-600">
                      Fetched {importFeedback.fetchedCount} activities
                    </small>
                    <small className="text-sm text-zinc-600">
                      Skipped {importFeedback.skippedCount} activities
                    </small>
                  </div>
                </div> : null}
              {activitiesSection}
            </div>
          ) : connectionStatusLoading
              ? renderActivitiesStatus("Checking your Strava connection.")
              : renderActivitiesStatus("You are not connected to Strava yet.")}
        </AsyncData>  
      </div>

    </section>
  )
}
