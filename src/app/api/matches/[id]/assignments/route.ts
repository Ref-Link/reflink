import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { pushMessage } from '@/lib/line/client'
import { buildMatchNotificationMessage } from '@/lib/line/messages'
import type { Database } from '@/types/database'

type AssignmentInsert = Database['public']['Tables']['assignments']['Insert']

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

export async function POST(
  request: Request,
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

  const { data: match, error: matchError } = await supabase
    .from('matches')
    .select('*')
    .eq('id', params.id)
    .eq('community_id', membership.community_id)
    .single()

  if (matchError || !match) {
    return NextResponse.json({ error: 'Match not found' }, { status: 404 })
  }

  const body = await request.json()
  const { candidates } = body as { candidates: Array<{ userId: string; role: string }> }

  if (!Array.isArray(candidates) || candidates.length === 0) {
    return NextResponse.json({ error: 'candidates array is required' }, { status: 400 })
  }

  const results = []
  const errors = []

  for (const candidate of candidates) {
    const { userId, role } = candidate

    if (!userId || !['referee', 'assistant_referee'].includes(role)) {
      errors.push({ userId, error: 'invalid userId or role' })
      continue
    }

    const { data: referee } = await supabase
      .from('users')
      .select('line_user_id, display_name')
      .eq('id', userId)
      .single()

    if (!referee) {
      errors.push({ userId, error: 'User not found' })
      continue
    }

    const payload: AssignmentInsert = {
      match_id: params.id,
      user_id: userId,
      role: role as 'referee' | 'assistant_referee',
      status: 'notified',
      notified_at: new Date().toISOString(),
    }

    const { data: assignment, error: assignError } = await supabase
      .from('assignments')
      .insert(payload)
      .select()
      .single()

    if (assignError || !assignment) {
      errors.push({ userId, error: assignError?.message ?? 'Failed to create assignment' })
      continue
    }

    if (referee.line_user_id) {
      try {
        const flexMessage = buildMatchNotificationMessage({
          assignmentId: assignment.id,
          title: match.title,
          match_date: match.match_date,
          start_time: match.start_time,
          venue: match.venue,
          age_group: match.age_group,
          compensation: match.compensation,
        })
        await pushMessage(referee.line_user_id, [flexMessage])
      } catch (lineError) {
        console.error(`LINE push failed for ${userId}:`, lineError)
      }
    }

    results.push(assignment)
  }

  return NextResponse.json({ assignments: results, errors }, { status: 201 })
}
