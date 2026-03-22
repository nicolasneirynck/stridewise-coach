import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import './index.css'
import LoginRoute from './pages/LoginRoute.tsx'
import Layout from './pages/Layout.tsx'
import { HomePage } from './pages/HomePage.tsx'
import NotFound from './pages/NotFound.tsx'
import { StravaConnectPage } from './features/strava/routes/StravaConnectPage.tsx'
import { StravaCallbackHandler } from './features/strava/routes/StravaCallbackHandler.tsx'

const router = createBrowserRouter([
  {
    path: '/',
    Component: LoginRoute,
  },
  {
    Component: Layout,
    children: [
      { path: '/home', Component: HomePage },
      { path: '/strava', Component: StravaConnectPage },
      { path: '/strava/callback', Component: StravaCallbackHandler },
    ],
  },
  { path: '*', Component: NotFound },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
