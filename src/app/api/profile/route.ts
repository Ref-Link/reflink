import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { Database } from '@/types/database'

type UserInsert = Database['public']['Tables']['users']['Insert']
type UserUpdate = Database['public']['Tables']['users']['Update']

export async function GET() {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json(null, { status: 404 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function PATCH(request: Request) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { display_name, real_name, license_level, role_type, age_groups, region, travel_range_km, line_user_id } = body

  // Check if profile exists to decide insert vs update
  const { data: existing } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!existing) {
    // First-time profile creation — require mandatory fields
    if (!display_name || !license_level || !role_type?.length || !age_groups?.length || !region) {
      return NextResponse.json(
        { error: 'display_name, license_level, role_type, age_groups, region are required for initial profile creation' },
        { status: 400 }
      )
    }

    const insertPayload: UserInsert = {
      id: user.id,
      display_name: String(display_name),
      license_level: String(license_level),
      role_type: role_type as string[],
      age_groups: age_groups as string[],
      region: String(region),
      real_name: real_name != null ? String(real_name) : null,
      line_user_id: line_user_id != null ? String(line_user_id) : null,
      travel_range_km: travel_range_km != null ? Number(travel_range_km) : null,
    }

    const { data, error } = await supabase
      .from('users')
      .insert(insertPayload)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  }

  // Update existing profile — only include fields present in body
  const updatePayload: UserUpdate = { updated_at: new Date().toISOString() }
  if (display_name !== undefined) updatePayload.display_name = String(display_name)
  if (real_name !== undefined) updatePayload.real_name = real_name != null ? String(real_name) : null
  if (license_level !== undefined) updatePayload.license_level = String(license_level)
  if (role_type !== undefined) updatePayload.role_type = role_type as string[]
  if (age_groups !== undefined) updatePayload.age_groups = age_groups as string[]
  if (region !== undefined) updatePayload.region = String(region)
  if (travel_range_km !== undefined) updatePayload.travel_range_km = travel_range_km != null ? Number(travel_range_km) : null
  if (line_user_id !== undefined) updatePayload.line_user_id = line_user_id != null ? String(line_user_id) : null

  const { data, error } = await supabase
    .from('users')
    .update(updatePayload)
    .eq('id', user.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
