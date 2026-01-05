/**
 * Authentication Middleware
 *
 * Protects routes using JWT tokens stored in HTTP-only cookies
 */

import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Define public routes that don't require authentication
  const publicRoutes = ['/login', '/auth/callback', '/api/sync-tokens']
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route))

  // Allow access to approval routes (they use token-based security)
  const isApprovalRoute = pathname.startsWith('/approval/')
  if (isApprovalRoute) {
    return NextResponse.next()
  }

  // Get access token from cookie
  const accessToken = request.cookies.get('access_token')?.value

  console.log('[Middleware]', {
    pathname,
    isPublicRoute,
    hasAccessToken: !!accessToken,
    timestamp: new Date().toISOString(),
  })

  // If no token and accessing protected route, redirect to login
  if (!accessToken && !isPublicRoute) {
    console.log('[Middleware] No access token, redirecting to login')
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  // If has token and accessing login page specifically, redirect to dashboard
  // Don't redirect /auth/callback or /api/sync-tokens
  if (accessToken && pathname === '/login') {
    console.log('[Middleware] Has token on login page, redirecting to dashboard')
    const dashboardUrl = new URL('/', request.url)
    return NextResponse.redirect(dashboardUrl)
  }

  // Allow request to proceed
  console.log('[Middleware] Allowing request to proceed')
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
