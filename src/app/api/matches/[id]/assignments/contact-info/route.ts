import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
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

  const adminClient = createAdminClient()

  const { data: confirmedAssignments, error } = await adminClient
    .from('assignments')
    .select('id, user_id')
    .eq('match_id', params.id)
    .eq('status', 'confirmed')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!confirmedAssignments || confirmedAssignments.length === 0) {
    return NextResponse.json({})
  }

  const userIds = confirmedAssignments.map((a) => a.user_id)
  const { data: users } = await adminClient
    .from('users')
    .select('id, phone_number')
    .in('id', userIds)

  const phoneByUserId = Object.fromEntries(
    (users ?? []).map((u) => [u.id, u.phone_number])
  )

  const contactMap: Record<string, string | null> = {}
  for (const assignment of confirmedAssignments) {
    contactMap[assignment.id] = phoneByUserId[assignment.user_id] ?? null
  }

  return NextResponse.json(contactMap)
}
