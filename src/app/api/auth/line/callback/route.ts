import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

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
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent('LINE token exchange failed: ' + err)}`
    )
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

  // Extract email from OIDC ID token if available
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

  const supabaseEmail = email ?? `line_${lineProfile.userId}@line.reflink.local`
  const supabaseAdmin = createAdminClient()

  // Create user if not exists
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

  // Generate magic link and get the hashed token
  const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
    type: 'magiclink',
    email: supabaseEmail,
  })

  if (linkError || !linkData?.properties?.hashed_token) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(linkError?.message ?? 'Failed to generate link')}`
    )
  }

  // Verify the token server-side to establish a session directly in cookies
  // This avoids the magic link redirect and cross-domain cookie issues
  const supabase = createClient()
  const { error: verifyError } = await supabase.auth.verifyOtp({
    token_hash: linkData.properties.hashed_token,
    type: 'magiclink',
  })

  if (verifyError) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(verifyError.message)}`
    )
  }

  // Session is now stored in cookies. Check if profile exists.
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('Session setup failed')}`)
  }

  // lineProfile.userId is the authoritative LINE user ID — use it directly
  // rather than going through user_metadata which may be missing on repeat logins.
  const lineUserId = lineProfile.userId

  // Create stub profile if first login
  const { data: profile } = await supabase.from('users').select('id').eq('id', user.id).single()

  if (profile) {
    // Always sync line_user_id on every login
    await supabase.from('users').update({ line_user_id: lineUserId }).eq('id', user.id)
  } else {
    await supabase.from('users').insert({
      id: user.id,
      display_name: lineProfile.displayName,
      license_level: '4級',
      role_type: ['referee'],
      age_groups: ['U12'],
      region: '',
      line_user_id: lineUserId,
    })
  }

  // Clear state cookies and redirect
  // Use appUrl (= NEXT_PUBLIC_APP_URL ?? origin) so the redirect goes to the correct host/protocol
  const redirectPath = (profile && next.startsWith('/')) ? next : '/profile'
  const response = NextResponse.redirect(`${appUrl}${redirectPath}`)
  response.cookies.delete('line_oauth_state')
  response.cookies.delete('line_oauth_next')
  return response
}
