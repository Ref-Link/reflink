import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { Database } from '@/types/database'

type MatchInsert = Database['public']['Tables']['matches']['Insert']

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

export async function GET() {
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
    .eq('community_id', membership.community_id)
    .order('match_date', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const matchIds = (data ?? []).map((m) => m.id)
  const { data: confirmedAssignments } = matchIds.length > 0
    ? await supabase
        .from('assignments')
        .select('match_id, role')
        .in('match_id', matchIds)
        .eq('status', 'confirmed')
    : { data: [] }

  const countsByMatch: Record<string, { confirmed_referees: number; confirmed_assistants: number }> = {}
  for (const a of confirmedAssignments ?? []) {
    if (!countsByMatch[a.match_id]) countsByMatch[a.match_id] = { confirmed_referees: 0, confirmed_assistants: 0 }
    if (a.role === 'referee') countsByMatch[a.match_id].confirmed_referees++
    else if (a.role === 'assistant_referee') countsByMatch[a.match_id].confirmed_assistants++
  }

  const enriched = (data ?? []).map((m) => ({
    ...m,
    confirmed_referees: countsByMatch[m.id]?.confirmed_referees ?? 0,
    confirmed_assistants: countsByMatch[m.id]?.confirmed_assistants ?? 0,
  }))

  return NextResponse.json(enriched)
}

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const membership = await getOrganizerMembership(supabase, user.id)
  if (!membership) {
    return NextResponse.json({ error: 'Forbidden: organizer or manager role required' }, { status: 403 })
  }

  const body = await request.json()
  const { title, match_date, start_time, venue, age_group, referees_needed, assistants_needed, compensation, notes } = body

  if (!title || !match_date || !start_time || !venue || !age_group) {
    return NextResponse.json(
      { error: 'title, match_date, start_time, venue, age_group are required' },
      { status: 400 }
    )
  }

  const refereesVal = Number(referees_needed ?? 1)
  const assistantsVal = Number(assistants_needed ?? 2)

  if (refereesVal < 0 || refereesVal > 1) {
    return NextResponse.json({ error: 'referees_needed must be 0 or 1' }, { status: 400 })
  }
  if (assistantsVal < 0 || assistantsVal > 2) {
    return NextResponse.json({ error: 'assistants_needed must be 0, 1, or 2' }, { status: 400 })
  }
  if (refereesVal === 0 && assistantsVal === 0) {
    return NextResponse.json({ error: 'referees_needed and assistants_needed cannot both be 0' }, { status: 400 })
  }

  const payload: MatchInsert = {
    community_id: membership.community_id,
    created_by: user.id,
    title: String(title),
    match_date: String(match_date),
    start_time: String(start_time),
    venue: String(venue),
    age_group: String(age_group),
    referees_needed: refereesVal,
    assistants_needed: assistantsVal,
    compensation: compensation == null ? null : Number(compensation),
    notes: notes == null ? null : String(notes),
    status: 'open',
  }

  const { data, error } = await supabase
    .from('matches')
    .insert(payload)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
