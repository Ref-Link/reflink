import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PATCH(
  _request: Request,
  { params }: { params: { id: string; userId: string } }
) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: communityId, userId } = params

  const { data: membership } = await supabase
    .from('community_members')
    .select('role')
    .eq('community_id', communityId)
    .eq('user_id', user.id)
    .eq('status', 'approved')
    .single()

  if (!membership || membership.role !== 'manager') {
    return NextResponse.json({ error: 'Forbidden: manager role required' }, { status: 403 })
  }

  const { data, error } = await supabase
    .from('community_members')
    .update({ status: 'rejected' })
    .eq('community_id', communityId)
    .eq('user_id', userId)
    .eq('status', 'pending')
    .select()
    .single()

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? 'Member not found or not in pending status' },
      { status: error ? 500 : 404 }
    )
  }

  return NextResponse.json(data)
}
