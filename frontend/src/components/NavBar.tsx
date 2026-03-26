import { NavLink, useNavigate } from 'react-router'

export function NavBar() {
  const navigate = useNavigate()

  function handleLogout() {
    window.localStorage.removeItem('stridewise_auth_token')
    navigate('/', { replace: true })
  }

  const getNavLinkClassName = ({ isActive }: { isActive: boolean }) =>
    [
      'rounded-xl px-4 py-3 text-sm font-medium transition',
      isActive
        ? 'bg-amber-500 text-white shadow-sm'
        : 'text-zinc-700 hover:bg-white hover:text-zinc-950',
    ].join(' ')

  return (
    <aside className="w-full border-b border-stone-200 bg-stone-50 p-6 md:min-h-screen md:w-72 md:border-b-0 md:border-r">
      <div className="flex h-full flex-col">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
            StrideWise Coach
          </p>
        </div>

        <nav className="mt-8 flex flex-col gap-2">
          <NavLink to="/home" className={getNavLinkClassName}>
            Dashboard
          </NavLink>
          <NavLink to="/activities" className={getNavLinkClassName}>
            Activities
          </NavLink>
          <NavLink to="/strava" className={getNavLinkClassName}>
            Strava Connect
          </NavLink>
        </nav>

        <button
          type="button"
          onClick={handleLogout}
          className="mt-8 rounded-xl border border-stone-300 px-4 py-3 text-left text-sm font-medium text-zinc-700 transition hover:bg-white hover:text-zinc-950 md:mt-auto"
        >
          Logout
        </button>
      </div>
    </aside>
  )
}
