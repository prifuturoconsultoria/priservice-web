/**
 * API Client for Spring Boot Backend Communication
 *
 * Handles authentication token exchange, token refresh, and authenticated API requests
 */

export type UserRole = 'admin' | 'technician' | 'observer'

export interface User {
  id: number
  email: string
  fullName: string
  role: UserRole
}

export interface TokenResponse {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: number
  user: User
}

const TOKEN_KEY = 'auth_tokens'
const USER_KEY = 'auth_user'

let isRefreshing = false
let refreshSubscribers: ((token: string) => void)[] = []

function subscribeTokenRefresh(callback: (token: string) => void) {
  refreshSubscribers.push(callback)
}

function onTokenRefreshed(newToken: string) {
  refreshSubscribers.forEach((callback) => callback(newToken))
  refreshSubscribers = []
}

export function getStoredTokens(): { accessToken: string; refreshToken: string } | null {
  if (typeof window === 'undefined') return null

  const tokensStr = sessionStorage.getItem(TOKEN_KEY)
  if (!tokensStr) return null

  try {
    return JSON.parse(tokensStr)
  } catch {
    return null
  }
}

export function storeTokens(tokens: { accessToken: string; refreshToken: string; user?: User }): void {
  if (typeof window === 'undefined') return

  sessionStorage.setItem(
    TOKEN_KEY,
    JSON.stringify({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    })
  )

  if (tokens.user) {
    sessionStorage.setItem(USER_KEY, JSON.stringify(tokens.user))
  }
}

export function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null

  const userStr = sessionStorage.getItem(USER_KEY)
  if (!userStr) return null

  try {
    return JSON.parse(userStr)
  } catch {
    return null
  }
}

export function clearTokens(): void {
  if (typeof window === 'undefined') return

  sessionStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(USER_KEY)
}

export async function exchangeCodeForTokens(authorizationCode: string): Promise<TokenResponse> {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL

  if (!backendUrl) {
    throw new Error('Backend URL not configured')
  }

  const response = await fetch(`${backendUrl}/api/auth/azure-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ authorizationCode }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Falha na autenticação' }))
    throw new Error(error.message || 'Erro ao trocar código de autorização')
  }

  return await response.json()
}

export async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL

  if (!backendUrl) {
    throw new Error('Backend URL not configured')
  }

  const response = await fetch(`${backendUrl}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })

  if (!response.ok) {
    throw new Error('Falha ao renovar token')
  }

  return await response.json()
}

export async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL

  if (!backendUrl) {
    throw new Error('Backend URL not configured')
  }

  const tokens = getStoredTokens()

  if (!tokens) {
    throw new Error('No authentication tokens found')
  }

  const response = await fetch(`${backendUrl}${endpoint}`, {
    ...options,
    headers: {
      ...options?.headers,
      'Authorization': `Bearer ${tokens.accessToken}`,
      'Content-Type': 'application/json',
    },
  })

  if (response.status === 401 && !isRefreshing) {
    isRefreshing = true

    try {
      const newTokens = await refreshAccessToken(tokens.refreshToken)
      storeTokens(newTokens)

      await syncTokensToCookies(newTokens.accessToken, newTokens.refreshToken)

      isRefreshing = false
      onTokenRefreshed(newTokens.accessToken)

      return apiRequest<T>(endpoint, options)
    } catch {
      isRefreshing = false
      clearTokens()

      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }

      throw new Error('Sessão expirada. Por favor, faça login novamente.')
    }
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro desconhecido' }))
    throw new Error(error.message || `HTTP ${response.status}`)
  }

  return response.json()
}

async function syncTokensToCookies(accessToken: string, refreshToken: string): Promise<void> {
  try {
    await fetch('/api/sync-tokens', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken, refreshToken }),
    })
  } catch {
    // Non-critical — cookie sync failure doesn't block the user
  }
}
