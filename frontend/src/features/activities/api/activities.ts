import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api'
const activitiesUrl = `${API_BASE_URL}/activities`
const AUTH_TOKEN_STORAGE_KEY = 'stridewise_auth_token'

export type ActivityType = 'run' | 'hike' |'bike' | 'strengthtraining'
export type ActivityTypeFilter = 'all' | ActivityType

export interface StoredActivity {
  id: number
  userId: number
  name: string
  type: ActivityType
  startDate: string
  duration: number,
  distance: number
  sourceActivityId: number | null
  source: string
}

export type RunningActivityGraphPoint = {
  startDate: string,
  averagePace: number,
  averageHeartRate: number
}

export type WeeklyLoadDataPoint = {
  weekStartDate: string,
  totalLoad: number
}

export type RunningActivityAnalysis = {
  id: number
  startDate: string
  averageHeartRate: number
  averagePace: number
  distance: number
  duration: number
}


function getAuthToken(): string {
  const authToken = window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)

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

export async function requestStoredActivities(filter:ActivityTypeFilter = 'all'): Promise<StoredActivity[]> {
  const authToken = getAuthToken()


  try {
    const response = await axios.get<StoredActivity[]>(activitiesUrl, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      params: filter === 'all' ? undefined : { type: filter },
    })

    return response.data
  } catch (error) {
    return handleExpiredAuth(error)
  }
}

  export async function requestRunningGraphData(): Promise<RunningActivityGraphPoint[]> {
    const authToken = getAuthToken()

    try {
      const response = await axios.get<RunningActivityGraphPoint[]>(`${API_BASE_URL}/activities/running-graph`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      return response.data
    } catch (error) {
      return handleExpiredAuth(error)
    }
  }

  export async function requestWeeklyLoadData(): Promise<WeeklyLoadDataPoint[]>{
    const authToken = getAuthToken()

    try{
      const response = await axios.get<WeeklyLoadDataPoint[]>(`${API_BASE_URL}/activities/weekly-load`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      return response.data
    } catch (error) {
      return handleExpiredAuth(error)
    }
}

export async function requestTargetHeartRateActivities(): Promise<RunningActivityAnalysis[]> {
  const authToken = getAuthToken()

  try {
    const response = await axios.get<RunningActivityAnalysis[]>(`${API_BASE_URL}/activities/running-activities/target-heart-rate`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    })

    return response.data
  } catch (error) {
    return handleExpiredAuth(error)
  }
}
