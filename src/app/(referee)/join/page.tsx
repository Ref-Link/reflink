'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { CommunityRow, CommunityMemberRow } from '@/types/database'

interface CommunityWithStatus extends CommunityRow {
  memberStatus: CommunityMemberRow['status'] | null
}

export default function JoinPage() {
  const [communities, setCommunities] = useState<CommunityWithStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [applyingId, setApplyingId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        setLoading(false)
        return
      }

      const [{ data: comms }, { data: memberships }] = await Promise.all([
        supabase.from('regional_communities').select('*').order('name'),
        supabase
          .from('community_members')
          .select('community_id, status')
          .eq('user_id', user.id),
      ])

      const membershipMap = new Map(
        (memberships ?? []).map((m) => [m.community_id, m.status as CommunityMemberRow['status']])
      )

      setCommunities(
        (comms ?? []).map((c) => ({
          ...c,
          memberStatus: membershipMap.get(c.id) ?? null,
        }))
      )
      setLoading(false)
    })
  }, [])

  async function handleApply(communityId: string) {
    setApplyingId(communityId)
    setErrorMessage(null)

    const res = await fetch(`/api/communities/${communityId}/apply`, {
      method: 'POST',
    })

    setApplyingId(null)

    if (res.ok) {
      setSuccessMessage('参加申請を送信しました。管理者の承認をお待ちください。')
      setTimeout(() => setSuccessMessage(null), 5000)
      setCommunities((prev) =>
        prev.map((c) =>
          c.id === communityId ? { ...c, memberStatus: 'pending' } : c
        )
      )
    } else {
      const json = await res.json()
      setErrorMessage(json.error ?? '申請に失敗しました')
    }
  }

  const statusLabel: Record<CommunityMemberRow['status'], string> = {
    pending: '承認待ち',
    approved: '参加中',
    rejected: '却下',
  }

  const statusColor: Record<CommunityMemberRow['status'], string> = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    rejected: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">コミュニティに参加する</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          参加したいコミュニティを選んで申請してください。管理者が承認すると試合の候補として表示されるようになります。
        </p>
      </div>

      {successMessage && (
        <div className="mb-4 rounded-md bg-green-50 dark:bg-green-950 p-3 text-sm text-green-700 dark:text-green-300">
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="mb-4 rounded-md bg-red-50 dark:bg-red-950 p-3 text-sm text-red-700 dark:text-red-300">
          {errorMessage}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12 text-sm text-gray-500 dark:text-gray-400">
          読み込み中...
        </div>
      ) : communities.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-600 py-12 text-center">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">参加できるコミュニティがありません</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {communities.map((community) => (
            <li
              key={community.id}
              className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{community.name}</div>
                  <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{community.region}</div>
                  {community.description && (
                    <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">{community.description}</div>
                  )}
                </div>
                <div className="flex-shrink-0">
                  {community.memberStatus ? (
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor[community.memberStatus]}`}
                    >
                      {statusLabel[community.memberStatus]}
                    </span>
                  ) : (
                    <button
                      onClick={() => handleApply(community.id)}
                      disabled={applyingId === community.id}
                      className="min-h-[44px] rounded-md bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      {applyingId === community.id ? '申請中...' : '参加申請'}
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
