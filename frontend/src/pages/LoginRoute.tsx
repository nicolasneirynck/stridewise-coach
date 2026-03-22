import { useState } from 'react'
import { Navigate } from 'react-router'
import { LoginForm } from '../features/auth/components/LoginForm'

export default function LoginRoute() {
  const [token, setToken] = useState(
    () => window.localStorage.getItem('stridewise_auth_token')
  )

  function handleLogin(token: string) {
    setToken(token)
  }

  if (token) {
    return <Navigate to="/home" replace />
  }

  return (
    <main className="min-h-screen bg-stone-100 px-6 py-16">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-8">
        <header className="text-center">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-amber-700">
            StrideWise Coach
          </p>
          <p className="mt-2 text-sm text-zinc-500">
            Status: {token ? 'Signed in' : 'Not signed in'}
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-zinc-950">
            Welcome back
          </h1>
          <p className="mt-3 max-w-2xl text-base text-zinc-600">
            Sign in to open the dashboard, try the Strava page, and keep
            building the routed app.
          </p>
        </header>

        <LoginForm onLoginSuccess={handleLogin} />
      </div>
    </main>
  )
}
