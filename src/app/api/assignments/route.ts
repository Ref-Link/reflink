import { createClient } from '@/lib/supabase/server'
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

  let query = supabase
    .from('assignments')
    .select(`
      id,
      role,
      status,
      confirmed_at,
      matches (
        id,
        title,
        match_date,
        start_time,
        venue,
        age_group
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

  return NextResponse.json(filtered)
}
