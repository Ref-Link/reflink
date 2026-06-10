import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { action?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { action } = body
  if (!action || !['accept', 'decline'].includes(action as string)) {
    return NextResponse.json({ error: 'action must be "accept" or "decline"' }, { status: 400 })
  }

  const adminClient = createAdminClient()

  const { data: assignment } = await adminClient
    .from('assignments')
    .select('id, user_id, status')
    .eq('id', params.id)
    .single()

  if (!assignment) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (assignment.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (assignment.status !== 'notified') {
    return NextResponse.json({ error: 'Already responded' }, { status: 409 })
  }

  const newStatus = action === 'accept' ? 'accepted' : 'declined'

  const { data: updated, error: updateError } = await adminClient
    .from('assignments')
    .update({ status: newStatus, responded_at: new Date().toISOString() })
    .eq('id', params.id)
    .select('id, status, responded_at')
    .single()

  if (updateError || !updated) {
    return NextResponse.json({ error: updateError?.message ?? 'Failed to update' }, { status: 500 })
  }

  return NextResponse.json(updated)
}
