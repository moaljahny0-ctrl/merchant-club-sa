import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Handles the PKCE code exchange after Supabase magic link / OTP verification.
// Supabase redirects here with ?code=<pkce_code>[&next=<destination>].
// We exchange the code for a session then forward the user to their destination.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard/brand'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(new URL(next, origin))
    }
    console.error('[auth/callback] Code exchange failed:', error.message)
  }

  // Exchange failed or no code present — send to login
  const loginUrl = new URL('/auth/login', origin)
  loginUrl.searchParams.set('error', 'link_expired')
  return NextResponse.redirect(loginUrl)
}
