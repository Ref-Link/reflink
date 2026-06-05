import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CommunityList from './CommunityList'

export default async function JoinPage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const [{ data: comms }, { data: memberships }] = await Promise.all([
    supabase.from('regional_communities').select('*').order('name'),
    supabase
      .from('community_members')
      .select('community_id, status')
      .eq('user_id', user.id),
  ])

  const membershipMap = new Map(
    (memberships ?? []).map((m) => [m.community_id, m.status])
  )

  const communities = (comms ?? []).map((c) => ({
    ...c,
    memberStatus: membershipMap.get(c.id) ?? null,
  }))

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">コミュニティに参加する</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          参加したいコミュニティを選んで申請してください。管理者が承認すると試合の候補として表示されるようになります。
        </p>
      </div>

      <CommunityList initialCommunities={communities} />
    </main>
  )
}
