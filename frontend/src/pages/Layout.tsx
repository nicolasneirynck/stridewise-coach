import { Navigate, Outlet } from 'react-router'
import useSWR from 'swr'
import { NavBar } from '../components/NavBar'
import { requestStravaConnectionStatus } from '../features/strava/api/strava'
import { useStravaImport } from '../features/strava/hooks/useStravaImport'
import { useStravaAutoImportOnAppLoad } from '../features/strava/hooks/useStravaAutoImportOnAppLoad'

export default function Layout() {
  const token = window.localStorage.getItem('stridewise_auth_token')

  if (!token) {
    return <Navigate to="/" replace />
  }

  const {
    data: connectionStatus,
    isLoading: connectionStatusLoading,
    error: connectionStatusError,
  } = useSWR('strava/connection-status', requestStravaConnectionStatus)

  const { handleImport } = useStravaImport()

  const shouldAutoImportOnAppLoad =
    connectionStatus?.isConnected === true &&
    !connectionStatusLoading &&
    !connectionStatusError

  useStravaAutoImportOnAppLoad(shouldAutoImportOnAppLoad, handleImport)

  return (
    <div className="min-h-screen bg-stone-100 text-zinc-900">
      <div className="flex min-h-screen flex-col md:flex-row">
        <NavBar />
        <main className="flex-1 p-6 md:p-10">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
