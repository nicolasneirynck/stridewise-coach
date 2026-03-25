import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api'
const connectUrl = `${API_BASE_URL}/strava/connect-url`;
const connectionStatusUrl = `${API_BASE_URL}/strava/connection-status`
const activitiesUrl = `${API_BASE_URL}/activities`
const importUrl = `${API_BASE_URL}/activities/import-from-strava`
const AUTH_TOKEN_STORAGE_KEY = 'stridewise_auth_token'

export type StravaActivity = {
  id:string,
  name:string,
  sportType:string,
  startDate:string,
  distanceMeters:number
}

export type StravaImport = {
  fetchedCount: number,
  importedCount: number,
  skippedCount: number,
}

export type StravaConnectionStatus ={
  athleteId: number | null,
  isConnected: boolean
}

function getAuthToken():string{
  const authToken: string | null = window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)

 if (!authToken) {
    throw new Error('Missing authentication token')
  }

  return authToken
}

function handleExpiredAuth(error: unknown): never {
  if (
    axios.isAxiosError(error) &&
    error.response?.status === 401 &&
    error.response.data?.message === 'Token has expired'
  ) {
    window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY)
    window.location.assign('/')
  }

  throw error
}

export async function requestStravaConnectUrl(): Promise<string>{
  const authToken = getAuthToken()

  try {
    const response = await axios.get<{ url: string }>(connectUrl, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    })

    return response.data.url
  } catch (error) {
    return handleExpiredAuth(error)
  }
};

export async function requestStravaConnectionStatus():Promise<StravaConnectionStatus>{
  const authToken = getAuthToken()

  try {
    const response = await axios.get<StravaConnectionStatus>(connectionStatusUrl, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    })

    return response.data
  } catch (error) {
    return handleExpiredAuth(error)
  }
}

export async function requestStravaActivities():Promise<StravaActivity[]>{
  const authToken = getAuthToken()

  try {
    const response = await axios.get<Array<{
      id: number,
      name: string,
      startDate: string,
      distance: number,
      source: string,
    }>>(activitiesUrl,{
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    })

    return response.data.map((activity) => ({
      id: String(activity.id),
      name: activity.name,
      sportType: activity.source === 'strava' ? 'Strava' : activity.source,
      startDate: activity.startDate,
      distanceMeters: activity.distance,
    }))
  } catch (error) {
    return handleExpiredAuth(error)
  }
}

export async function importStravaActivities():Promise<StravaImport>{
  const authToken = getAuthToken()

  try {
    const response = await axios.post<StravaImport>(importUrl,{},{
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    })

    return response.data
  } catch (error) {
    return handleExpiredAuth(error)
  }
}
