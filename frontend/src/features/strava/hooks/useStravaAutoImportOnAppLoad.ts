import { useEffect, useState } from 'react'

export function useStravaAutoImportOnAppLoad(
  shouldAutoImportOnAppLoad: boolean,
  handleImport: () => Promise<void> | void
) {
  const [hasTriedAutoImportOnAppLoad, setHasTriedAutoImportOnAppLoad] =
    useState(false)

  useEffect(() => {
    if (
      hasTriedAutoImportOnAppLoad ||
      !shouldAutoImportOnAppLoad
    ) {
      return
    }

    setHasTriedAutoImportOnAppLoad(true)
    void handleImport()
  }, [hasTriedAutoImportOnAppLoad, shouldAutoImportOnAppLoad, handleImport])
}
