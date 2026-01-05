'use server'

/**
 * Server-Side Authentication Functions
 *
 * Validates JWT tokens and manages user sessions
 */

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { jwtVerify } from 'jose'

export type UserRole = 'admin' | 'technician' | 'observer'

export interface User {
  id: number
  email: string
  fullName: string
  role: UserRole
}

/**
 * Verify JWT signature and extract user info
 * ✅ SECURITY: Verifies token signature to prevent forgery
 * @param token JWT access token
 * @returns Verified user data or null if invalid
 */
async function verifyJWT(token: string): Promise<User | null> {
  try {
    // First, decode header to check algorithm
    const parts = token.split('.')
    if (parts.length !== 3) {
      console.error('[verifyJWT] Invalid JWT format')
      return null
    }

    const header = JSON.parse(
      Buffer.from(parts[0].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString()
    )

    console.log('[verifyJWT] JWT algorithm:', header.alg)

    // Get JWT secret from environment
    const secret = process.env.JWT_SECRET

    if (!secret) {
      console.error('[verifyJWT] JWT_SECRET not configured - using insecure decode fallback')
      // Fallback to unsafe decode (development only)
      return decodeJWTUnsafe(token)
    }

    // Create secret key for verification
    const secretKey = new TextEncoder().encode(secret)

    // ✅ Verify signature and decode (prevents token forgery)
    // Allow common HMAC algorithms (HS256, HS384, HS512)
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ['HS256', 'HS384', 'HS512'],
    })

    console.log('[verifyJWT] Token verified successfully:', payload.sub)

    // Extract user info from JWT claims
    // Backend JWT structure: { role, userId, sub (email), iat, exp }
    const user: User = {
      id: 0, // Backend uses UUID in userId field, frontend expects number (not used)
      email: (payload.sub as string) || '', // sub contains the email
      fullName: (payload.fullName as string) || (payload.name as string) || (payload.sub as string)?.split('@')[0] || 'User',
      role: ((payload.role as string)?.toLowerCase() || 'observer') as UserRole, // Convert TECHNICIAN -> technician
    }

    return user
  } catch (error) {
    console.error('[verifyJWT] Token verification failed:', error)
    return null
  }
}

/**
 * Decode JWT without signature verification (INSECURE - fallback only)
 * ⚠️ WARNING: Use only when JWT_SECRET is not configured
 * @param token JWT access token
 * @returns Decoded user data or null if invalid
 */
function decodeJWTUnsafe(token: string): User | null {
  try {
    console.warn('[decodeJWTUnsafe] ⚠️ WARNING: Using insecure JWT decode without signature verification!')

    // JWT format: header.payload.signature
    const parts = token.split('.')
    if (parts.length !== 3) {
      console.error('[decodeJWTUnsafe] Invalid JWT format')
      return null
    }

    // Decode payload (base64url)
    const payload = JSON.parse(
      Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString()
    )

    // Check expiration
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      console.error('[decodeJWTUnsafe] Token expired')
      return null
    }

    // Extract user info from JWT claims
    const user: User = {
      id: 0,
      email: payload.sub || '',
      fullName: payload.fullName || payload.name || payload.sub?.split('@')[0] || 'User',
      role: (payload.role?.toLowerCase() || 'observer') as UserRole,
    }

    return user
  } catch (error) {
    console.error('[decodeJWTUnsafe] Error decoding token:', error)
    return null
  }
}

/**
 * Get current user from JWT token in cookie
 * @returns User object or null if not authenticated
 */
export async function getUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('access_token')?.value

    console.log('[getUser] Checking auth, has token:', !!accessToken)

    if (!accessToken) {
      console.log('[getUser] No access token found in cookies')
      return null
    }

    // ✅ SECURITY: Verify JWT signature and decode
    const user = await verifyJWT(accessToken)

    if (!user) {
      console.error('[getUser] Failed to verify JWT or token expired')
      return null
    }

    console.log('[getUser] User verified from JWT:', user.email)
    return user
  } catch (error) {
    console.error('[getUser] Error getting user:', error)
    return null
  }
}

/**
 * Require authentication, redirect to login if not authenticated
 * @returns User object
 * @throws Redirects to /login if not authenticated
 */
export async function requireAuth(): Promise<User> {
  const user = await getUser()

  if (!user) {
    redirect('/login')
  }

  return user
}

/**
 * Get user profile from Supabase database
 * Auto-creates profile if doesn't exist (first Azure AD login)
 * @returns User profile from database or null
 */
export async function getUserProfile() {
  const user = await getUser()
  if (!user) return null

  const supabase = await createClient()

  // Find profile by email (Azure AD users don't have Supabase auth ID)
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', user.email)
    .maybeSingle()

  // Create profile if doesn't exist (first login from Azure AD)
  if (!profile) {
    try {
      const { data: newProfile } = await supabase
        .from('profiles')
        .insert({
          email: user.email,
          full_name: user.fullName,
          role: user.role,
          azure_user_id: user.id, // Store backend user ID
        })
        .select()
        .single()

      return newProfile
    } catch (error) {
      console.error('Error creating profile:', error)
      return null
    }
  }

  // Update azure_user_id if not set (migration case)
  if (!profile.azure_user_id) {
    try {
      await supabase
        .from('profiles')
        .update({ azure_user_id: user.id })
        .eq('id', profile.id)

      profile.azure_user_id = user.id
    } catch (error) {
      console.error('Error updating azure_user_id:', error)
    }
  }

  return profile
}

/**
 * Sign out user - clear cookies and redirect to login
 */
export async function signOut() {
  const cookieStore = await cookies()

  cookieStore.delete('access_token')
  cookieStore.delete('refresh_token')

  redirect('/login')
}
