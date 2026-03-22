import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api'

interface LoginRequest {
  email: string
  password: string
}

interface LoginResponse {
  token: string
}

export async function login(
  credentials: LoginRequest,
): Promise<LoginResponse> {
  const response = await axios.post<LoginResponse>(
    `${API_BASE_URL}/sessions`,
    credentials,
  )

  return response.data
}
