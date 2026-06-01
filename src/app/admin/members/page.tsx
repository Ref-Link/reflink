'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ApprovalList, type MemberWithUser } from '@/components/members/ApprovalList'

const STATUS_LABELS: Record<string, string> = {
  pending: '承認待ち',
  approved: '承認済み',
  rejected: '却下',
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-gray-100 text-gray-500',
}

const ROLE_LABELS: Record<string, string> = {
  referee: '審判',
  organizer: '運営者',
  manager: '管理者',
}

export default function AdminMembersPage() {
  const [communityId, setCommunityId] = useState<string | null>(null)
  const [members, setMembers] = useState<MemberWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const fetchMembers = useCallback(async (cId: string) => {
    const res = await fetch(`/api/communities/${cId}/members`)
    if (res.ok) {
      setMembers(await res.json())
    } else {
      const json = await res.json()
      setErrorMessage(json.error ?? 'メンバー一覧の取得に失敗しました')
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        setLoading(false)
        setErrorMessage('ログインが必要です')
        return
      }

      supabase
        .from('community_members')
        .select('community_id')
        .eq('user_id', user.id)
        .eq('role', 'manager')
        .eq('status', 'approved')
        .limit(1)
        .single()
        .then(({ data }) => {
          if (!data) {
            setLoading(false)
            setErrorMessage('管理者権限がありません')
            return
          }
          setCommunityId(data.community_id)
          fetchMembers(data.community_id)
        })
    })
  }, [fetchMembers])

  function handleAction() {
    setActionMessage('操作が完了しました')
    setTimeout(() => setActionMessage(null), 3000)
    if (communityId) fetchMembers(communityId)
  }

  const pending = members.filter((m) => m.status === 'pending')
  const approved = members.filter((m) => m.status === 'approved')
  const rejected = members.filter((m) => m.status === 'rejected')

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6">
        <Link
          href="/admin/matches"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          ← 試合管理に戻る
        </Link>
        <h1 className="mt-2 text-xl font-bold text-gray-900">メンバー管理</h1>
      </div>

      {actionMessage && (
        <div className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-700">
          {actionMessage}
        </div>
      )}
      {errorMessage && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12 text-sm text-gray-500">
          読み込み中...
        </div>
      ) : (
        <>
          <section className="mb-8">
            <h2 className="mb-3 text-base font-semibold text-gray-900">
              承認待ち
              {pending.length > 0 && (
                <span className="ml-2 inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                  {pending.length}
                </span>
              )}
            </h2>
            {communityId ? (
              <ApprovalList
                communityId={communityId}
                members={members}
                onAction={handleAction}
              />
            ) : null}
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-gray-900">
              メンバー一覧
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({approved.length}名)
              </span>
            </h2>
            {approved.length === 0 && rejected.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-300 py-8 text-center">
                <p className="text-sm font-medium text-gray-500">承認済みメンバーはまだいません</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {[...approved, ...rejected].map((member) => (
                  <li
                    key={member.id}
                    className={`rounded-lg border border-gray-200 bg-white p-4 shadow-sm ${member.status === 'rejected' ? 'opacity-50' : ''}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-gray-900">
                            {member.users.display_name}
                          </span>
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                            {ROLE_LABELS[member.role] ?? member.role}
                          </span>
                        </div>
                        <div className="mt-0.5 text-xs text-gray-500">
                          {member.users.license_level} · {member.users.region}
                        </div>
                      </div>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[member.status]}`}
                      >
                        {STATUS_LABELS[member.status]}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </main>
  )
}
