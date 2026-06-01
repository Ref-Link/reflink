import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const communityId = params.id

  const { data: membership } = await supabase
    .from('community_members')
    .select('role')
    .eq('community_id', communityId)
    .eq('user_id', user.id)
    .eq('status', 'approved')
    .single()

  if (membership?.role !== 'manager') {
    return NextResponse.json({ error: 'Forbidden: manager role required' }, { status: 403 })
  }

  // Use admin client so RLS doesn't hide pending members' user profiles
  const adminClient = createAdminClient()
  const { data, error } = await adminClient
    .from('community_members')
    .select('*, users!user_id(display_name, license_level, region)')
    .eq('community_id', communityId)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
