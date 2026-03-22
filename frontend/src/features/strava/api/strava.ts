import axios from 'axios';

const connectUrl = 'http://localhost:3000/api/strava/connect-url';
const activitiesUrl = 'http://localhost:3000/api/strava/activities'
const AUTH_TOKEN_STORAGE_KEY = 'stridewise_auth_token'

export type StravaActivity = {
  id:string,
  name:string,
  sportType:string,
  startDate:string,
  distanceMeters:number
}

function getAuthToken():string{
  const authToken: string | null = window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)

 if (!authToken) {
    throw new Error('Missing authentication token')
  }

  return authToken
}

export async function requestStravaConnectUrl(): Promise<string>{
  const authToken = getAuthToken()

  const response = await axios.get<{ url: string }>(connectUrl, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  })

  return response.data.url
};

export async function requestStravaActivities():Promise<StravaActivity[]>{
  const authToken = getAuthToken()

  const response = await axios.get<StravaActivity[]>(activitiesUrl,{
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  })

  return response.data
}