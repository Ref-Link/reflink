import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import HomeScreen from '@/components/home/HomeScreen'

export default async function RootPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [{ data: userData }, { data: memberships }] = await Promise.all([
    supabase.from('users').select('display_name').eq('id', user.id).single(),
    supabase.from('community_members').select('role, status').eq('user_id', user.id),
  ])

  if (!userData) redirect('/profile')

  const isAdmin =
    memberships?.some(
      (m) => ['organizer', 'manager'].includes(m.role) && m.status === 'approved'
    ) ?? false
  const isReferee = memberships?.some((m) => m.role === 'referee') ?? false

  return (
    <HomeScreen
      displayName={userData?.display_name ?? ''}
      isAdmin={isAdmin}
      isReferee={isReferee}
    />
  )
}
