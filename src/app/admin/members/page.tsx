import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import AdminMembersClient from './AdminMembersClient'
import type { MemberWithUser } from '@/components/members/ApprovalList'

export default async function AdminMembersPage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: membership } = await supabase
    .from('community_members')
    .select('community_id')
    .eq('user_id', user.id)
    .eq('role', 'manager')
    .eq('status', 'approved')
    .limit(1)
    .single()

  if (!membership) {
    redirect('/profile')
  }

  const adminClient = createAdminClient()
  const { data: rawMembers } = await adminClient
    .from('community_members')
    .select('*')
    .eq('community_id', membership.community_id)
    .order('created_at', { ascending: false })

  const userIds = (rawMembers ?? []).map((m) => m.user_id)
  const { data: userData } = await adminClient
    .from('users')
    .select('id, display_name, license_level, region, age_groups, role_type, travel_range_km')
    .in('id', userIds)

  const usersById = new Map((userData ?? []).map((u) => [u.id, u]))

  const members: MemberWithUser[] = (rawMembers ?? []).map((m) => ({
    ...m,
    users: usersById.get(m.user_id) ?? { display_name: '', license_level: '', region: '', age_groups: [], role_type: [], travel_range_km: null },
  }))

  return (
    <AdminMembersClient
      communityId={membership.community_id}
      initialMembers={members}
    />
  )
}
