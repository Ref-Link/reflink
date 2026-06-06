import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { SupabaseClient, User } from '@supabase/supabase-js'

type AnyClient = SupabaseClient & { from: (table: string) => ReturnType<SupabaseClient['from']> }

async function handleUserProfile(supabase: SupabaseClient, user: User, origin: string, next: string) {
  const { data: profile } = await supabase.from('users').select('id, line_user_id').eq('id', user.id).single()

  const lineUserId = (user.user_metadata?.line_user_id as string | undefined) ?? null

  if (!profile) {
    return NextResponse.redirect(`${origin}/profile`)
  }

  if (lineUserId) {
    await (supabase as AnyClient).from('users').update({ line_user_id: lineUserId }).eq('id', user.id)
  }

  const currentLineUserId = (profile as { line_user_id: string | null }).line_user_id ?? null
  if (!currentLineUserId && user.email) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: linkedId } = await (createAdminClient() as any)
        .rpc('get_line_user_id_by_email', { lookup_email: user.email }) as { data: string | null }
      if (linkedId) {
        await (supabase as AnyClient).from('users').update({ line_user_id: linkedId }).eq('id', user.id)
      }
    } catch {
      // FR-004: linkage failure must not block login
    }
  }

  const redirectTo = next.startsWith('/') ? `${origin}${next}` : origin
  return NextResponse.redirect(redirectTo)
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const cookieStore = cookies()
  const authNextCookie = cookieStore.get('auth_next')?.value
  const next = searchParams.get('next') ?? (authNextCookie ? decodeURIComponent(authNextCookie) : '/')
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
