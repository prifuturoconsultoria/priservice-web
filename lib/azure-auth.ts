/**
 * Azure AD OAuth Authentication Utilities
 *
 * Provides helper functions for Microsoft OAuth Authorization Code Flow
 */

const STATE_KEY = 'azure_oauth_state'
const STATE_EXPIRY_KEY = 'azure_oauth_state_expiry'
const STATE_EXPIRY_MINUTES = 30 // Increased to 30 minutes for safety

/**
 * Generates a cryptographically secure random state for CSRF protection
 * @returns Random state string
 */
export function generateState(): string {
  const randomPart = crypto.randomUUID()
  const timestamp = Date.now().toString(36)
  return `${randomPart}-${timestamp}`
}

/**
 * Stores the OAuth state in sessionStorage with expiration
 * @param state The state string to store
 */
export function storeState(state: string): void {
  if (typeof window === 'undefined') return

  const expiryTime = Date.now() + (STATE_EXPIRY_MINUTES * 60 * 1000)
  sessionStorage.setItem(STATE_KEY, state)
  sessionStorage.setItem(STATE_EXPIRY_KEY, expiryTime.toString())
  console.log('[Azure Auth] State stored:', state.substring(0, 10) + '...')
}

/**
 * Retrieves the stored OAuth state from sessionStorage
 * @returns The stored state or null if not found/expired
 */
export function getStoredState(): string | null {
  if (typeof window === 'undefined') return null

  const state = sessionStorage.getItem(STATE_KEY)
  const expiryStr = sessionStorage.getItem(STATE_EXPIRY_KEY)

  if (!state || !expiryStr) return null

  const expiry = parseInt(expiryStr, 10)
  if (Date.now() > expiry) {
    // State expired, clear it
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
 * @param receivedState The state parameter received from Microsoft
 * @returns true if valid, false otherwise
 */
export function validateState(receivedState: string): boolean {
  console.log('[Azure Auth] Validating state. Received:', receivedState?.substring(0, 10) + '...')

  const storedState = getStoredState()
  console.log('[Azure Auth] Stored state:', storedState?.substring(0, 10) + '...')

  if (!storedState) {
    console.error('[Azure Auth] No stored state found or state has expired')
    return false
  }

  if (receivedState !== storedState) {
    console.error('[Azure Auth] State mismatch - possible CSRF attack')
    console.error('Received:', receivedState)
    console.error('Stored:', storedState)
    return false
  }

  console.log('[Azure Auth] State validation successful')
  return true
}

/**
 * Builds the Microsoft OAuth authorization URL
 * @returns The complete authorization URL
 */
export function getAzureLoginUrl(): string {
  const tenantId = process.env.NEXT_PUBLIC_AZURE_TENANT_ID
  const clientId = process.env.NEXT_PUBLIC_AZURE_CLIENT_ID
  const redirectUri = process.env.NEXT_PUBLIC_REDIRECT_URI

  if (!tenantId || !clientId || !redirectUri) {
    throw new Error('Azure AD configuration missing. Check environment variables.')
  }

  // Generate and store state for CSRF protection
  const state = generateState()
  storeState(state)

  // Build authorization URL
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
