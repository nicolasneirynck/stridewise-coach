import useSWRMutation from "swr/mutation"
import { importStravaActivities, type StravaImport } from "../api/strava"
import { useState } from "react";

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

      if (onImported) {
        await onImported()
      }
    } catch {
      // SWR exposes the mutation error through importError
    }
  }

  return {handleImport, isImportingFromStrava, importError,importFeedback}
}