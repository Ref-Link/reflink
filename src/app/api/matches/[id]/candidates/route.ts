import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { Candidate } from '@/types/domain'

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

async function buildAssignmentStatsMap(
  supabase: ReturnType<typeof createClient>,
  userIds: string[]
): Promise<Map<string, { total: number; last: string | null }>> {
  const statsMap = new Map<string, { total: number; last: string | null }>()

  const { data: confirmedAssignments } = await supabase
    .from('assignments')
    .select('user_id, match_id')
    .in('user_id', userIds)
    .eq('status', 'confirmed')

  if (!confirmedAssignments || confirmedAssignments.length === 0) return statsMap

  const assignedMatchIds = Array.from(new Set(confirmedAssignments.map((a) => a.match_id)))
  const { data: assignedMatches } = await supabase
    .from('matches')
    .select('id, match_date')
    .in('id', assignedMatchIds)

  const matchDateMap = new Map((assignedMatches ?? []).map((m) => [m.id, m.match_date]))

  for (const row of confirmedAssignments) {
    const matchDate = matchDateMap.get(row.match_id) ?? null
    const existing = statsMap.get(row.user_id) ?? { total: 0, last: null }
    const newLast =
      matchDate && (existing.last === null || matchDate > existing.last) ? matchDate : existing.last
    statsMap.set(row.user_id, { total: existing.total + 1, last: newLast })
  }

  return statsMap
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

  // Get match details (must belong to organizer's community)
  const { data: match, error: matchError } = await supabase
    .from('matches')
    .select('id, community_id, match_date, age_group')
    .eq('id', params.id)
    .eq('community_id', membership.community_id)
    .single()

  if (matchError || !match) {
    return NextResponse.json({ error: 'Match not found' }, { status: 404 })
  }

  // Get approved referee member user IDs for the community
  const { data: members, error: membersError } = await supabase
    .from('community_members')
    .select('user_id')
    .eq('community_id', match.community_id)
    .eq('role', 'referee')
    .eq('status', 'approved')

  if (membersError) {
    return NextResponse.json({ error: membersError.message }, { status: 500 })
  }

  if (!members || members.length === 0) {
    return NextResponse.json([])
  }

  const allRefereeIds = members.map((m) => m.user_id)

  // Find referees with availability on the match date covering the match's age_group
  const { data: availabilities, error: availError } = await supabase
    .from('availabilities')
    .select('user_id')
    .in('user_id', allRefereeIds)
    .eq('date', match.match_date)
    .contains('age_groups', [match.age_group])

  if (availError) {
    return NextResponse.json({ error: availError.message }, { status: 500 })
  }

  if (!availabilities || availabilities.length === 0) {
    return NextResponse.json([])
  }

  const availableUserIds = Array.from(new Set(availabilities.map((a) => a.user_id)))

  // Fetch user profiles for available referees
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, display_name, license_level, role_type, age_groups, region, travel_range_km, referred_by')
    .in('id', availableUserIds)

  if (usersError) {
    return NextResponse.json({ error: usersError.message }, { status: 500 })
  }

  if (!users || users.length === 0) {
    return NextResponse.json([])
  }

  const statsMap = await buildAssignmentStatsMap(supabase, availableUserIds)

  const candidates: Candidate[] = users.map((u) => ({
    id: u.id,
    display_name: u.display_name,
    license_level: u.license_level,
    role_type: u.role_type,
    age_groups: u.age_groups,
    region: u.region,
    travel_range_km: u.travel_range_km,
    referred_by: u.referred_by,
    total_assignments: statsMap.get(u.id)?.total ?? 0,
    last_active_date: statsMap.get(u.id)?.last ?? null,
  }))

  // Sort by total_assignments descending (most experienced first)
  candidates.sort((a, b) => b.total_assignments - a.total_assignments)

  return NextResponse.json(candidates)
}
