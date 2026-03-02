/**
 * Azure AD OAuth Authentication Utilities
 *
 * Provides helper functions for Microsoft OAuth Authorization Code Flow
 */

const STATE_KEY = 'azure_oauth_state'
const STATE_EXPIRY_KEY = 'azure_oauth_state_expiry'
const STATE_EXPIRY_MINUTES = 30

/**
 * Generates a cryptographically secure random state for CSRF protection
 */
export function generateState(): string {
  const randomPart = crypto.randomUUID()
  const timestamp = Date.now().toString(36)
  return `${randomPart}-${timestamp}`
}

/**
 * Stores the OAuth state in sessionStorage with expiration
 */
export function storeState(state: string): void {
  if (typeof window === 'undefined') return

  const expiryTime = Date.now() + (STATE_EXPIRY_MINUTES * 60 * 1000)
  sessionStorage.setItem(STATE_KEY, state)
  sessionStorage.setItem(STATE_EXPIRY_KEY, expiryTime.toString())
}

/**
 * Retrieves the stored OAuth state from sessionStorage
 */
export function getStoredState(): string | null {
  if (typeof window === 'undefined') return null

  const state = sessionStorage.getItem(STATE_KEY)
  const expiryStr = sessionStorage.getItem(STATE_EXPIRY_KEY)

  if (!state || !expiryStr) return null

  const expiry = parseInt(expiryStr, 10)
  if (Date.now() > expiry) {
    clearStoredState()
    return null
  }

  return state
}

/**
 * Clears the stored OAuth state from sessionStorage
 */
export function clearStoredState(): void {
  if (typeof window === 'undefined') return

  sessionStorage.removeItem(STATE_KEY)
  sessionStorage.removeItem(STATE_EXPIRY_KEY)
}

/**
 * Validates that the received state matches the stored state
 */
export function validateState(receivedState: string): boolean {
  const storedState = getStoredState()

  if (!storedState) return false
  if (receivedState !== storedState) return false

  return true
}

/**
 * Builds the Microsoft OAuth authorization URL
 */
export function getAzureLoginUrl(): string {
  const tenantId = process.env.NEXT_PUBLIC_AZURE_TENANT_ID
  const clientId = process.env.NEXT_PUBLIC_AZURE_CLIENT_ID
  const redirectUri = process.env.NEXT_PUBLIC_REDIRECT_URI

  if (!tenantId || !clientId || !redirectUri) {
    throw new Error('Azure AD configuration missing. Check environment variables.')
  }

  const state = generateState()
  storeState(state)

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    scope: 'openid profile email User.Read',
    state: state,
    response_mode: 'query',
  })

  return `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?${params.toString()}`
}
