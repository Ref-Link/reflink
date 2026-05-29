import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('availabilities')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { date, start_time, end_time, age_groups, notes } = body

  if (!date || !age_groups || age_groups.length === 0) {
    return NextResponse.json({ error: 'date and age_groups are required' }, { status: 400 })
  }

  const today = new Date().toISOString().split('T')[0]
  if (date < today) {
    return NextResponse.json({ error: 'date must not be in the past' }, { status: 400 })
  }

  if (start_time && end_time && end_time <= start_time) {
    return NextResponse.json({ error: 'end_time must be after start_time' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('availabilities')
    .insert({ user_id: user.id, date, start_time: start_time ?? null, end_time: end_time ?? null, age_groups, notes: notes ?? null })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
