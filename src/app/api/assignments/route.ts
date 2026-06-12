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
      confirmed_by,
      user_id,
      matches (
        id,
        title,
        match_date,
        start_time,
        venue,
        age_group,
        created_by,
        referees_needed,
        assistants_needed,
        compensation,
        notes
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

  // Collect all user IDs needing contact lookup (organizers + proxy confirmers)
  const organizerIds = filtered
    .map((item) => (item.matches as unknown as { created_by: string } | null)?.created_by)
    .filter((id): id is string => !!id)

  const proxyConfirmerIds = filtered
    .map((item) => {
      const confirmedBy = item.confirmed_by as string | null
      const createdBy = (item.matches as unknown as { created_by: string } | null)?.created_by
      return confirmedBy && confirmedBy !== createdBy ? confirmedBy : null
    })
    .filter((id): id is string => !!id)

  const uniqueUserIds = Array.from(new Set([...organizerIds, ...proxyConfirmerIds]))
  const { data: contactUsers } = uniqueUserIds.length > 0
    ? await adminClient.from('users').select('id, phone_number, real_name').in('id', uniqueUserIds)
    : { data: [] }

  const phoneById = Object.fromEntries(
    (contactUsers ?? []).map((u) => [u.id, u.phone_number])
  )
  const nameById = Object.fromEntries(
    (contactUsers ?? []).map((u) => [u.id, u.real_name || null])
  )

  // Flatten organizer and proxy confirmer contact info into matches
  const result = filtered.map((item) => {
    const matchData = item.matches as unknown as {
      id: string; title: string; match_date: string; start_time: string;
      venue: string; age_group: string; created_by: string;
      referees_needed: number; assistants_needed: number;
      compensation: number | null; notes: string | null
    } | null
    const confirmedBy = item.confirmed_by as string | null
    const isProxy = confirmedBy != null && matchData != null && confirmedBy !== matchData.created_by
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
        organizer_phone: phoneById[matchData.created_by] ?? null,
        organizer_name: nameById[matchData.created_by] ?? null,
        proxy_confirmer_phone: isProxy ? (phoneById[confirmedBy] ?? null) : null,
        proxy_confirmer_name: isProxy ? (nameById[confirmedBy] ?? null) : null,
        referees_needed: matchData.referees_needed,
        assistants_needed: matchData.assistants_needed,
        compensation: matchData.compensation,
        notes: matchData.notes,
      } : null,
    }
  })

  return NextResponse.json(result)
}
