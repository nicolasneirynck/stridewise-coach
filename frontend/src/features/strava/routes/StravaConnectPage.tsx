import { useSearchParams } from 'react-router'
import useSWR from 'swr'
import useSWRMutation from 'swr/mutation'
import {
  disconnectStravaConnection,
  requestStravaConnectUrl,
  requestStravaConnectionStatus,
} from '../api/strava'
import { StravaConnectCard } from '../components/StravaConnectCard'
import { StravaConnectionSummary } from '../components/StravaConnectionSummary'
import AsyncData from '../../../components/ui/AsyncData'
import { useStravaImport } from '../hooks/useStravaImport'

export function StravaConnectPage() {
  const [searchParams] = useSearchParams() // still necesarry?

  const {
    data: connectionStatus,
    error: connectionStatusError,
    mutate: mutateConnectionStatus,
  } = useSWR('strava/connection-status', requestStravaConnectionStatus)

  const reason = searchParams.get('reason')
  const isConnected = connectionStatus ? connectionStatus.isConnected : false

  // Callback errors happen after Strava redirects back.
  // Mutation errors happen while starting the connection from this page.
  const callbackError = reason
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
    trigger: triggerStravaDisconnect,
    isMutating: isDisconnectingStrava,
    error: disconnectError,
  } = useSWRMutation('strava/disconnect', disconnectStravaConnection)

  const {handleImport,isImportingFromStrava,importError,importFeedback} = useStravaImport()

  const connectionError = connectionStatusError ?? connectError ?? disconnectError ?? callbackError
  const connectedAthleteId = isConnected && connectionStatus?.athleteId ? String(connectionStatus.athleteId) : null
  const connectedAthleteName = isConnected ? connectionStatus?.athleteName ?? null : null

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

  const handleDisconnectClick = async () => {
    try {
      await triggerStravaDisconnect()
      await mutateConnectionStatus()
    } catch {
      // AsyncData will show the mutation error below
    }
  }

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

      <StravaConnectCard
        loading={isConnectingStrava || isDisconnectingStrava}
        isConnected={isConnected}
        onAction={isConnected ? handleDisconnectClick : handleConnectClick}
      />

      <div className="mt-4">
        <AsyncData loading={false} error={connectionError}>
          {isConnected ? (
            <div className='flex flex-col gap-6'>
              <StravaConnectionSummary
                athleteName={connectedAthleteName}
                athleteId={connectedAthleteId}
                onImport={handleImport}
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
            </div>
          ) : null}
        </AsyncData>  
      </div>

    </section>
  )
}
