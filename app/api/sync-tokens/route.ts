/**
 * Token Sync API Route
 *
 * Syncs JWT tokens from client-side sessionStorage to HTTP-only cookies
 * for server-side access in server actions
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

/**
 * POST /api/sync-tokens
 * Store tokens in HTTP-only cookies
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[sync-tokens] POST request received')
    const body = await request.json()
    const { accessToken, refreshToken } = body

    if (!accessToken || !refreshToken) {
      console.error('[sync-tokens] Missing tokens in request')
      return NextResponse.json(
        { error: 'Access token and refresh token are required' },
        { status: 400 }
      )
    }

    console.log('[sync-tokens] Setting cookies...')
    console.log('[sync-tokens] Access token preview:', accessToken.substring(0, 20) + '...')
    console.log('[sync-tokens] Environment:', process.env.NODE_ENV)
    console.log('[sync-tokens] Secure flag:', process.env.NODE_ENV === 'production')

    // Create response with cookies set in headers (more reliable)
    const response = NextResponse.json({ success: true })

    // Set access token cookie (1 hour expiration)
    // ✅ SECURITY: httpOnly + secure + strict sameSite
    response.cookies.set('access_token', accessToken, {
      httpOnly: true,      // Prevents JavaScript access (XSS protection)
      secure: true,        // HTTPS only (always enabled for security)
      sameSite: 'strict',  // Strict CSRF protection
      maxAge: 60 * 60,     // 1 hour
      path: '/',
    })

    // Set refresh token cookie (7 days expiration)
    // ✅ SECURITY: httpOnly + secure + strict sameSite
    response.cookies.set('refresh_token', refreshToken, {
      httpOnly: true,      // Prevents JavaScript access (XSS protection)
      secure: true,        // HTTPS only (always enabled for security)
      sameSite: 'strict',  // Strict CSRF protection
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    console.log('[sync-tokens] Cookies set in response headers')

    return response
  } catch (error) {
    console.error('[sync-tokens] Error syncing tokens:', error)
    return NextResponse.json(
      { error: 'Failed to sync tokens' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/sync-tokens
 * Clear token cookies (logout)
 */
export async function DELETE() {
  try {
    const cookieStore = await cookies()

    cookieStore.delete('access_token')
    cookieStore.delete('refresh_token')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error clearing tokens:', error)
    return NextResponse.json(
      { error: 'Failed to clear tokens' },
      { status: 500 }
    )
  }
}
