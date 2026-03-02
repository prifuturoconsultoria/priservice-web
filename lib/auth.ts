'use server'

/**
 * Server-Side Authentication Functions
 *
 * Validates JWT tokens and manages user sessions
 * Uses React cache() to deduplicate JWT verification within a single request
 */

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import { cache } from 'react'

export type UserRole = 'admin' | 'technician' | 'observer'

export interface User {
  id: number
  email: string
  fullName: string
  role: UserRole
}

/**
 * Verify JWT signature and extract user info
 */
async function verifyJWT(token: string): Promise<User | null> {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null

    const secret = process.env.JWT_SECRET

    if (!secret) {
      console.warn('[verifyJWT] JWT_SECRET not configured - using insecure decode fallback')
      return decodeJWTUnsafe(token)
    }

    const secretKey = new TextEncoder().encode(secret)

    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ['HS256', 'HS384', 'HS512'],
    })

    return {
      id: 0,
      email: (payload.sub as string) || '',
      fullName: (payload.fullName as string) || (payload.name as string) || (payload.sub as string)?.split('@')[0] || 'User',
      role: ((payload.role as string)?.toLowerCase() || 'observer') as UserRole,
    }
  } catch (error) {
    console.error('[verifyJWT] Token verification failed:', error)
    return null
  }
}

/**
 * Decode JWT without signature verification (INSECURE - fallback only)
 */
function decodeJWTUnsafe(token: string): User | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null

    const payload = JSON.parse(
      Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString()
    )

    if (payload.exp && payload.exp * 1000 < Date.now()) return null

    return {
      id: 0,
      email: payload.sub || '',
      fullName: payload.fullName || payload.name || payload.sub?.split('@')[0] || 'User',
      role: (payload.role?.toLowerCase() || 'observer') as UserRole,
    }
  } catch (error) {
    console.error('[decodeJWTUnsafe] Error decoding token:', error)
    return null
  }
}

/**
 * Get current user from JWT token in cookie
 * Cached per request — JWT verification only happens once per page load
 */
export const getUser = cache(async (): Promise<User | null> => {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('access_token')?.value

    if (!accessToken) return null

    const user = await verifyJWT(accessToken)
    return user
  } catch (error) {
    console.error('[getUser] Error getting user:', error)
    return null
  }
})

/**
 * Get the raw access token from cookies (cached per request)
 */
export const getAccessToken = cache(async (): Promise<string | null> => {
  const cookieStore = await cookies()
  return cookieStore.get('access_token')?.value || null
})

/**
 * Require authentication, redirect to login if not authenticated
 */
export async function requireAuth(): Promise<User> {
  const user = await getUser()
  if (!user) redirect('/login')
  return user
}

/**
 * Get user profile — uses JWT data directly (fast, no API call needed)
 * The JWT already contains role, email, and fullName
 */
export async function getUserProfile() {
  const user = await getUser()
  if (!user) return null
  return { id: user.id, email: user.email, fullName: user.fullName, role: user.role }
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
