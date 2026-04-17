import { createServerClient } from '@supabase/ssr'
import createIntlMiddleware from 'next-intl/middleware'
import { NextResponse, type NextRequest } from 'next/server'
import { routing } from './i18n/routing'

const intlMiddleware = createIntlMiddleware(routing)

// Routes that require authentication
const PROTECTED_PREFIXES = ['/dashboard']

// Routes only accessible to unauthenticated users
const AUTH_ONLY_PATHS = ['/auth/login', '/auth/reset-password']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── Supabase session refresh ──────────────────────────────────────────────
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session — must be called before any redirects
  const { data: { user } } = await supabase.auth.getUser()

  // ── Dashboard protection ──────────────────────────────────────────────────
  const isProtected = PROTECTED_PREFIXES.some(p => pathname.startsWith(p))
  if (isProtected && !user) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // ── Redirect logged-in users away from auth pages ─────────────────────────
  const isAuthOnly = AUTH_ONLY_PATHS.some(p => pathname.startsWith(p))
  if (isAuthOnly && user) {
    return NextResponse.redirect(new URL('/dashboard/brand', request.url))
  }

  // ── i18n for public routes ────────────────────────────────────────────────
  // Dashboard and auth routes are not locale-prefixed
  if (!isProtected && !pathname.startsWith('/auth')) {
    const intlResponse = intlMiddleware(request)
    // Copy any Supabase auth cookies to the intl response
    response.cookies.getAll().forEach(cookie => {
      intlResponse.cookies.set(cookie)
    })
    return intlResponse
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|_next/data|favicon.ico|.*\\..*).*)'],
}
