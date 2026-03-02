/**
 * Token Sync API Route
 *
 * Syncs JWT tokens from client-side to HTTP-only cookies for server-side access
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

/**
 * POST /api/sync-tokens — Store tokens in HTTP-only cookies
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { accessToken, refreshToken } = body

    if (!accessToken || !refreshToken) {
      return NextResponse.json(
        { error: 'Access token and refresh token are required' },
        { status: 400 }
      )
    }

    const response = NextResponse.json({ success: true })

    response.cookies.set('access_token', accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 60 * 60,
      path: '/',
    })

    response.cookies.set('refresh_token', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    return response
  } catch {
    return NextResponse.json(
      { error: 'Failed to sync tokens' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/sync-tokens — Clear token cookies (logout)
 */
export async function DELETE() {
  try {
    const cookieStore = await cookies()

    cookieStore.delete('access_token')
    cookieStore.delete('refresh_token')

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: 'Failed to clear tokens' },
      { status: 500 }
    )
  }
}
