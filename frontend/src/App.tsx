import { useState } from 'react'
import './App.css'

const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api'

function App() {
  const [isRedirecting, setIsRedirecting] = useState(false)
  const pathname = window.location.pathname
  const searchParams = new URLSearchParams(window.location.search)
  const isCallbackPage = pathname === '/strava/callback'

  const status = searchParams.get('status')
  const athleteId = searchParams.get('athleteId')
  const reason = searchParams.get('reason')

  const handleConnectClick = () => {
    setIsRedirecting(true)
    window.location.href = `${apiBaseUrl}/strava/connect`
  }

  const handleRetryClick = () => {
    window.location.href = '/'
  }

  const getErrorMessage = () => {
    switch (reason) {
      case 'access_denied':
        return 'Strava access was denied. Please approve the request to continue.'
      case 'missing_code':
        return 'No authorization code was returned by Strava. Please try again.'
      case 'token_exchange_failed':
        return 'StrideWise could not complete the Strava token exchange. Please try again.'
      default:
        return 'The Strava connection could not be completed. Please try again.'
    }
  }

  if (isCallbackPage) {
    const isSuccess = status === 'success'

    return (
      <main className="status-page">
        <section className="status-card">
          <p className="eyebrow">StrideWise x Strava</p>
          <h1>{isSuccess ? 'Strava connected' : 'Connection failed'}</h1>
          <p className="status-copy">
            {isSuccess
              ? `Your Strava authorization worked${athleteId ? ` for athlete ${athleteId}` : ''}. You can now continue with activity import in the next sprint.`
              : getErrorMessage()}
          </p>
          <div className="status-actions">
            <button className="secondary-button" onClick={handleRetryClick}>
              {isSuccess ? 'Back to connect page' : 'Try again'}
            </button>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="connect-page">
      <section className="connect-card">
        <p className="eyebrow">StrideWise MVP</p>
        <h1>Connect your Strava account</h1>
        <p className="lead">
          Authorize StrideWise to access your running and cycling activities so
          they can be imported into the application.
        </p>
        <p className="connection-label">Status: Not connected</p>

        <div className="connect-actions">
          <button
            className="primary-button"
            onClick={handleConnectClick}
            disabled={isRedirecting}
          >
            {isRedirecting ? 'Redirecting to Strava...' : 'Connect Strava account'}
          </button>
          <p className="hint">
            You will be redirected to Strava to approve access for StrideWise.
          </p>
        </div>
      </section>
    </main>
  )
}

export default App
