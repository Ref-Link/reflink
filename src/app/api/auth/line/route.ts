import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'

const LINE_AUTH_URL = 'https://access.line.me/oauth2/v2.1/authorize'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const next = searchParams.get('next') ?? '/profile'
  // NEXT_PUBLIC_APP_URL takes precedence so that the redirect_uri is stable
  // even when the request comes through a reverse proxy like ngrok.
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? origin

  const state = randomBytes(16).toString('hex')

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.LINE_LOGIN_CHANNEL_ID!,
    redirect_uri: `${appUrl}/api/auth/line/callback`,
    scope: 'profile openid email',
    state,
  })

  const response = NextResponse.redirect(`${LINE_AUTH_URL}?${params}`)

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 60 * 10,
    path: '/',
  }

  response.cookies.set('line_oauth_state', state, cookieOptions)
  response.cookies.set('line_oauth_next', next, cookieOptions)

  return response
}
