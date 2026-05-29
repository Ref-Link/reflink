import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { SupabaseClient, User } from '@supabase/supabase-js'

type AnyClient = SupabaseClient & { from: (table: string) => ReturnType<SupabaseClient['from']> }

async function handleUserProfile(supabase: SupabaseClient, user: User, origin: string, next: string) {
  const { data: profile } = await supabase.from('users').select('id').eq('id', user.id).single()

  const lineUserId = (user.user_metadata?.line_user_id as string | undefined) ?? null

  if (!profile) {
    await (supabase as AnyClient).from('users').insert({
      id: user.id,
      display_name: user.user_metadata?.full_name ?? user.email ?? '未設定',
      license_level: '4級',
      role_type: ['referee'],
      age_groups: ['U12'],
      region: '',
      line_user_id: lineUserId,
    })
    return NextResponse.redirect(`${origin}/profile?setup=true`)
  }

  if (lineUserId) {
    await (supabase as AnyClient).from('users').update({ line_user_id: lineUserId }).eq('id', user.id)
  }

  const redirectTo = next.startsWith('/') ? `${origin}${next}` : origin
  return NextResponse.redirect(redirectTo)
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error)}`)
  }

  const supabase = createClient()

  if (code) {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    if (exchangeError) {
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(exchangeError.message)}`)
    }
  }

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(`${origin}/login`)
  }

  return handleUserProfile(supabase, user, origin, next)
}
