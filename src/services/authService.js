import { request, setStoredToken } from './apiClient.js'

export async function login({ email, senha }) {
  const data = await request('/auth/login', {
    method: 'POST',
    body: { email, senha },
    auth: false,
  })
  if (data?.accessToken) {
    setStoredToken(data.accessToken)
  }
  return data
}

export function getMe(signal) {
  return request('/auth/me', { signal })
}

export async function logout() {
  try {
    await request('/auth/logout', { method: 'POST' })
  } finally {
    setStoredToken(null)
  }
}
