import useSWRMutation from "swr/mutation"
import { importStravaActivities, type StravaImport } from "../api/strava"
import { useState } from "react";
import { mutate } from "swr";
import { BASE_COACH_RESULT_KEY } from "../../activities/api/activities"

export function useStravaImport(onImported?: () => Promise<unknown> | void) {
  
  const [importFeedback,setImportFeedback] = useState<StravaImport|null>(null);

  const {
    trigger: triggerStravaImport,
    isMutating: isImportingFromStrava,
    error: importError,
  } = useSWRMutation('activities/import-from-strava', importStravaActivities)

  function clearImportFeedback() {
    setImportFeedback(null)
  }

  function storeImportFeedback(result: StravaImport) {
    setImportFeedback(result)
  }

  async function handleImport(){
    clearImportFeedback()

    try{
      const stravaImport = await triggerStravaImport()
      storeImportFeedback(stravaImport)
      await mutate('activities/running-graph')
      await mutate(BASE_COACH_RESULT_KEY)
      await mutate((key) => Array.isArray(key) && key[0] === 'activities')
      /*
       ['activities', activityTypeFilter]
       ->
          ['activities', 'all']
          ['activities', 'run']
          ['activities', 'bike']
          ...
      */


      if (onImported) {
        await onImported()
      }
    } catch {
      // SWR exposes the mutation error through importError
    }
  }

  return {handleImport, isImportingFromStrava, importError,importFeedback}
}