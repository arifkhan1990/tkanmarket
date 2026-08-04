import { auth } from '@/lib/auth/config'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isAdminRoute = pathname.startsWith('/admin') && pathname !== '/admin/login'

  // Redirect unauthenticated users from admin routes to login
  if (isAdminRoute && !req.auth) {
    const loginUrl = new URL('/admin/login', req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect already-authenticated users away from login page
  if (pathname === '/admin/login' && req.auth) {
    return NextResponse.redirect(new URL('/admin/dashboard', req.url))
  }

  const response = NextResponse.next()

  // Security headers on all routes
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('X-DNS-Prefetch-Control', 'on')

  return response
})

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/v1/admin/:path*',
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
}
