import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

async function getOrganizerMembership(supabase: ReturnType<typeof createClient>, userId: string) {
  const { data } = await supabase
    .from('community_members')
    .select('community_id, role')
    .eq('user_id', userId)
    .in('role', ['organizer', 'manager'])
    .eq('status', 'approved')
    .limit(1)
    .single()
  return data
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const membership = await getOrganizerMembership(supabase, user.id)
  if (!membership) {
    return NextResponse.json({ error: 'Forbidden: organizer or manager role required' }, { status: 403 })
  }

  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .eq('id', params.id)
    .eq('community_id', membership.community_id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
