import { NextResponse } from 'next/server'
import { verifyState } from '@/lib/line-oauth-state'
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

async function fetchLineData(
  code: string,
  redirectUri: string
): Promise<{ profile: LineProfile; email: string | null } | { error: string }> {
  const tokenRes = await fetch('https://api.line.me/oauth2/v2.1/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: process.env.LINE_LOGIN_CHANNEL_ID ?? '',
      client_secret: process.env.LINE_LOGIN_CHANNEL_SECRET ?? '',
    }),
  })
  if (!tokenRes.ok) return { error: 'LINE token exchange failed: ' + await tokenRes.text() }

  const tokens: LineTokenResponse = await tokenRes.json()

  const profileRes = await fetch('https://api.line.me/v2/profile', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  })
  if (!profileRes.ok) return { error: 'Failed to get LINE profile' }

  const profile: LineProfile = await profileRes.json()

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

  return { profile, email }
}

type SupabaseClient = ReturnType<typeof createClient>

async function upsertLineUser(
  supabase: SupabaseClient,
  userId: string,
  lineProfile: LineProfile
): Promise<boolean> {
  const lineUserId = lineProfile.userId
  const { data: existing } = await supabase.from('users').select('id').eq('id', userId).single()
  if (existing) {
    await supabase.from('users').update({ line_user_id: lineUserId }).eq('id', userId)
    return true
  }
  await supabase.from('users').insert({
    id: userId,
    display_name: lineProfile.displayName,
    license_level: '4級',
    role_type: ['referee'],
    age_groups: ['U12'],
    region: '',
    line_user_id: lineUserId,
  })
  return false
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

  if (!state) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent('Invalid state parameter')}`
    )
  }

  const { valid, next } = verifyState(state)
  if (!valid) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent('Invalid state parameter')}`
    )
  }

  if (!code) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent('No authorization code')}`
    )
  }

  const lineData = await fetchLineData(code, `${appUrl}/api/auth/line/callback`)
  if ('error' in lineData) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(lineData.error)}`
    )
  }

  const { profile: lineProfile, email } = lineData
  const supabaseEmail = email ?? `line_${lineProfile.userId}@line.reflink.local`
  const supabaseAdmin = createAdminClient()

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

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('Session setup failed')}`)
  }

  const hadProfile = await upsertLineUser(supabase, user.id, lineProfile)
  const redirectPath = (hadProfile && next.startsWith('/')) ? next : '/profile'
  return NextResponse.redirect(`${appUrl}${redirectPath}`)
}
