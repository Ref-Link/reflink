import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { pushTextMessage } from '@/lib/line/client'

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

export async function PATCH(
  _request: Request,
  { params }: { params: { id: string; assignmentId: string } }
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

  const { data: match } = await supabase
    .from('matches')
    .select('id, community_id, title, match_date, start_time, venue, age_group')
    .eq('id', params.id)
    .eq('community_id', membership.community_id)
    .single()

  if (!match) {
    return NextResponse.json({ error: 'Match not found' }, { status: 404 })
  }

  const { data: assignment, error: assignError } = await supabase
    .from('assignments')
    .select('id, user_id, match_id, status')
    .eq('id', params.assignmentId)
    .eq('match_id', params.id)
    .single()

  if (assignError || !assignment) {
    return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
  }

  if (assignment.status === 'confirmed') {
    return NextResponse.json({ error: 'Assignment already confirmed' }, { status: 409 })
  }

  const { data: updated, error: updateError } = await supabase
    .from('assignments')
    .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
    .eq('id', params.assignmentId)
    .select()
    .single()

  if (updateError || !updated) {
    return NextResponse.json({ error: updateError?.message ?? 'Failed to confirm' }, { status: 500 })
  }

  const { data: referee } = await supabase
    .from('users')
    .select('line_user_id')
    .eq('id', assignment.user_id)
    .single()

  if (referee?.line_user_id) {
    try {
      const d = new Date(match.match_date)
      const weekdays = ['日', '月', '火', '水', '木', '金', '土']
      const dateStr = `${d.getMonth() + 1}月${d.getDate()}日(${weekdays[d.getDay()]})`
      const timeStr = match.start_time.slice(0, 5)
      const confirmText =
        `【アサイン確定】\n` +
        `${match.title}\n` +
        `📅 ${dateStr} ${timeStr}\n` +
        `📍 ${match.venue}\n` +
        `対象年代: ${match.age_group}`
      await pushTextMessage(referee.line_user_id, confirmText)
    } catch (lineError) {
      console.error('LINE push failed:', lineError)
    }
  }

  return NextResponse.json(updated)
}
