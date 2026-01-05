'use server'

/**
 * Server-Side Authentication Functions
 *
 * Validates JWT tokens and manages user sessions
 */

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'

export type UserRole = 'admin' | 'technician' | 'observer'

export interface User {
  id: number
  email: string
  fullName: string
  role: UserRole
}

/**
 * Decode JWT token and extract user info
 * @param token JWT access token
 * @returns Decoded user data or null if invalid
 */
function decodeJWT(token: string): User | null {
  try {
    // JWT format: header.payload.signature
    const parts = token.split('.')
    if (parts.length !== 3) {
      console.error('[decodeJWT] Invalid JWT format')
      return null
    }

    // Decode payload (base64url)
    const payload = JSON.parse(
      Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString()
    )

    console.log('[decodeJWT] Token payload:', payload)

    // Check expiration
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      console.error('[decodeJWT] Token expired')
      return null
    }

    // Extract user info from JWT claims
    // Backend JWT structure: { role, userId, sub (email), iat, exp }
    const user: User = {
      id: 0, // Backend uses UUID in userId field, frontend expects number (not used)
      email: payload.sub || '', // sub contains the email
      fullName: payload.fullName || payload.name || payload.sub?.split('@')[0] || 'User',
      role: (payload.role?.toLowerCase() || 'observer') as UserRole, // Convert TECHNICIAN -> technician
    }

    return user
  } catch (error) {
    console.error('[decodeJWT] Error decoding token:', error)
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

    // Decode JWT to get user info (no backend call needed)
    const user = decodeJWT(accessToken)

    if (!user) {
      console.error('[getUser] Failed to decode JWT or token expired')
      return null
    }

    console.log('[getUser] User decoded from JWT:', user.email)
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
