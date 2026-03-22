import { Navigate, Outlet } from 'react-router'
import { NavBar } from '../components/NavBar'

export default function Layout() {
  const token = window.localStorage.getItem('stridewise_auth_token')

  if (!token) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="min-h-screen bg-stone-100 text-zinc-900">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col md:flex-row">
        <NavBar />
        <main className="flex-1 p-6 md:p-10">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
