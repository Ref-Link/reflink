import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'

interface LineTokenResponse {
  access_token: string
  id_token?: string
}

interface LineProfile {
  userId: string
  displayName: string
  pictureUrl?: string
}

interface LineIdTokenPayload {
  email?: string
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  // NEXT_PUBLIC_APP_URL must be used for redirect_uri to match what was sent to LINE.
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? origin
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error)}`)
  }

  const cookieStore = cookies()
  const storedState = cookieStore.get('line_oauth_state')?.value
  const next = cookieStore.get('line_oauth_next')?.value ?? '/profile'

  if (!state || state !== storedState) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent('Invalid state parameter')}`
    )
  }

  if (!code) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent('No authorization code')}`
    )
  }

  // Exchange LINE code for tokens
  const tokenRes = await fetch('https://api.line.me/oauth2/v2.1/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: `${appUrl}/api/auth/line/callback`,
      client_id: process.env.LINE_LOGIN_CHANNEL_ID ?? '',
      client_secret: process.env.LINE_LOGIN_CHANNEL_SECRET ?? '',
    }),
  })

  if (!tokenRes.ok) {
    const err = await tokenRes.text()
    const msg = encodeURIComponent('LINE token exchange failed: ' + err)
    return NextResponse.redirect(`${origin}/login?error=${msg}`)
  }

  const tokens: LineTokenResponse = await tokenRes.json()

  // Get LINE user profile
  const profileRes = await fetch('https://api.line.me/v2/profile', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  })

  if (!profileRes.ok) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent('Failed to get LINE profile')}`
    )
  }

  const lineProfile: LineProfile = await profileRes.json()

  // Try to extract email from OIDC ID token (LINE may not always provide one)
  let email: string | null = null
  if (tokens.id_token) {
    try {
      const payload: LineIdTokenPayload = JSON.parse(
        Buffer.from(tokens.id_token.split('.')[1], 'base64url').toString()
      )
      email = payload.email ?? null
    } catch {
      // ignore malformed token
    }
  }

  // Use LINE user ID as synthetic email when no real email is available
  const supabaseEmail = email ?? `line_${lineProfile.userId}@line.reflink.local`
  const supabaseAdmin = createAdminClient()

  // Create user if they don't exist yet (safe to ignore "already registered" error)
  await supabaseAdmin.auth.admin.createUser({
    email: supabaseEmail,
    user_metadata: {
      full_name: lineProfile.displayName,
      line_user_id: lineProfile.userId,
      avatar_url: lineProfile.pictureUrl ?? null,
      provider: 'line',
    },
    email_confirm: true,
  })

  // Generate a one-time magic link to sign the user in
  const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
    type: 'magiclink',
    email: supabaseEmail,
    options: {
      redirectTo: `${appUrl}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  })

  if (linkError || !linkData?.properties?.action_link) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(linkError?.message ?? 'Failed to create session')}`
    )
  }

  const response = NextResponse.redirect(linkData.properties.action_link)
  response.cookies.delete('line_oauth_state')
  response.cookies.delete('line_oauth_next')
  return response
}
