import { useEffect, useState } from 'react'

export function useAutoStravaImport(
  shouldAutoImport: boolean,
  handleImport: () => Promise<void> | void
) {
  const [hasTriedAutoImport, setHasTriedAutoImport] = useState(false)

  useEffect(() => {
    if (hasTriedAutoImport || !shouldAutoImport) {
      return
    }

    setHasTriedAutoImport(true)
    void handleImport() // the effect should fire it and not care about the returned promise
  }, [hasTriedAutoImport, shouldAutoImport, handleImport])
}