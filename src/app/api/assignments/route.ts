import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const age_group = searchParams.get('age_group')
  const date_from = searchParams.get('date_from')
  const date_to = searchParams.get('date_to')

  const adminClient = createAdminClient()

  let query = adminClient
    .from('assignments')
    .select(`
      id,
      role,
      status,
      confirmed_at,
      user_id,
      matches (
        id,
        title,
        match_date,
        start_time,
        venue,
        age_group,
        created_by
      )
    `)
    .eq('user_id', user.id)
    .eq('status', 'confirmed')
    .order('confirmed_at', { ascending: false })

  if (age_group) {
    query = query.eq('matches.age_group', age_group)
  }

  if (date_from) {
    query = query.gte('matches.match_date', date_from)
  }

  if (date_to) {
    query = query.lte('matches.match_date', date_to)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Filter out records where matches is null (happens when join filters exclude the match)
  const filtered = (data ?? []).filter((item) => item.matches !== null)

  // Sort by match_date desc after filtering
  filtered.sort((a, b) => {
    const matchA = (a.matches as unknown) as { match_date: string } | null
    const matchB = (b.matches as unknown) as { match_date: string } | null
    if (!matchA || !matchB) return 0
    return matchB.match_date.localeCompare(matchA.match_date)
  })

  // Fetch organizer phone numbers for all confirmed assignments
  const organizerIds = filtered
    .map((item) => (item.matches as unknown as { created_by: string } | null)?.created_by)
    .filter((id): id is string => !!id)

  const uniqueOrganizerIds = Array.from(new Set(organizerIds))
  const { data: organizerUsers } = uniqueOrganizerIds.length > 0
    ? await adminClient.from('users').select('id, phone_number').in('id', uniqueOrganizerIds)
    : { data: [] }

  const phoneByOrganizerId = Object.fromEntries(
    (organizerUsers ?? []).map((u) => [u.id, u.phone_number])
  )

  // Flatten organizer.phone_number into matches.organizer_phone
  const result = filtered.map((item) => {
    const matchData = item.matches as unknown as {
      id: string; title: string; match_date: string; start_time: string;
      venue: string; age_group: string; created_by: string
    } | null
    return {
      id: item.id,
      role: item.role,
      status: item.status,
      confirmed_at: item.confirmed_at,
      matches: matchData ? {
        id: matchData.id,
        title: matchData.title,
        match_date: matchData.match_date,
        start_time: matchData.start_time,
        venue: matchData.venue,
        age_group: matchData.age_group,
        organizer_phone: phoneByOrganizerId[matchData.created_by] ?? null,
      } : null,
    }
  })

  return NextResponse.json(result)
}
