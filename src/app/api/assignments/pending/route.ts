import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const adminClient = createAdminClient()

  const { data, error } = await adminClient
    .from('assignments')
    .select(`
      id,
      role,
      status,
      matches (
        id,
        title,
        match_date,
        start_time,
        venue,
        age_group,
        compensation,
        notes
      )
    `)
    .eq('user_id', user.id)
    .eq('status', 'notified')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const result = (data ?? [])
    .filter((item) => item.matches !== null)
    .map((item) => {
      const match = item.matches as unknown as {
        id: string
        title: string
        match_date: string
        start_time: string
        venue: string
        age_group: string
        compensation: number | null
        notes: string | null
      }
      return {
        id: item.id,
        role: item.role,
        status: item.status,
        match,
      }
    })

  result.sort((a, b) => a.match.match_date.localeCompare(b.match.match_date))

  return NextResponse.json(result)
}
