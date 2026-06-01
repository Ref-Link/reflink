import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const communityId = params.id

  const { data: community } = await supabase
    .from('regional_communities')
    .select('id')
    .eq('id', communityId)
    .single()

  if (!community) {
    return NextResponse.json({ error: 'Community not found' }, { status: 404 })
  }

  const { data: existing } = await supabase
    .from('community_members')
    .select('id, status')
    .eq('community_id', communityId)
    .eq('user_id', user.id)
    .single()

  if (existing) {
    return NextResponse.json(
      { error: 'Already applied or a member', status: existing.status },
      { status: 409 }
    )
  }

  const { data, error } = await supabase
    .from('community_members')
    .insert({
      community_id: communityId,
      user_id: user.id,
      role: 'referee',
      status: 'pending',
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
