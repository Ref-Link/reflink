import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('community_members')
    .select('community_id, status, regional_communities(name)')
    .eq('user_id', user.id)
    .in('status', ['pending', 'approved'])
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const memberships = (data ?? []).map((row) => ({
    community_id: row.community_id,
    community_name: (row.regional_communities as unknown as { name: string } | null)?.name ?? '',
    status: row.status as 'pending' | 'approved',
  }))

  return NextResponse.json(memberships)
}
