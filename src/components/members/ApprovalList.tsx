'use client'

import { useState } from 'react'
import type { AgeGroup } from '@/types/domain'
import { AGE_GROUP_LABELS } from '@/types/domain'

const ROLE_TYPE_LABELS: Record<string, string> = {
  referee: '主審',
  assistant_referee: '副審',
}

export interface MemberWithUser {
  id: string
  user_id: string
  community_id: string
  role: string
  status: 'pending' | 'approved' | 'rejected'
  approved_by: string | null
  approved_at: string | null
  created_at: string
  users: {
    display_name: string
    license_level: string
    region: string
    age_groups: string[]
    role_type: string[]
    travel_range_km: number | null
  }
}

interface ApprovalListProps {
  readonly communityId: string
  readonly members: MemberWithUser[]
  readonly onAction: () => void
}

export function ApprovalList({ communityId, members, onAction }: ApprovalListProps) {
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const pending = members.filter((m) => m.status === 'pending')

  async function handleApprove(userId: string) {
    setProcessingId(userId)
    setErrorMessage(null)
    const res = await fetch(`/api/communities/${communityId}/members/${userId}/approve`, {
      method: 'PATCH',
    })
    setProcessingId(null)
    if (res.ok) {
      onAction()
    } else {
      const json = await res.json()
      setErrorMessage(json.error ?? '承認に失敗しました')
    }
  }

  async function handleReject(userId: string) {
    setProcessingId(userId)
    setErrorMessage(null)
    const res = await fetch(`/api/communities/${communityId}/members/${userId}/reject`, {
      method: 'PATCH',
    })
    setProcessingId(null)
    if (res.ok) {
      onAction()
    } else {
      const json = await res.json()
      setErrorMessage(json.error ?? '却下に失敗しました')
    }
  }

  if (pending.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-600 py-8 text-center">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">承認待ちのメンバーはいません</p>
      </div>
    )
  }

  return (
    <div>
      {errorMessage && (
        <div className="mb-3 rounded-md bg-red-50 dark:bg-red-950 p-3 text-sm text-red-700 dark:text-red-300">
          {errorMessage}
        </div>
      )}
      <ul className="space-y-3">
        {pending.map((member) => {
          const isExpanded = expandedId === member.id
          return (
            <li
              key={member.id}
              className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm"
            >
              <div className="flex items-center justify-between gap-3 p-4">
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : member.id)}
                  className="flex flex-1 items-start gap-2 text-left min-h-[44px]"
                >
                  <div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {member.users.display_name}
                    </div>
                    <div className="mt-0.5 flex gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>{member.users.license_level}</span>
                      <span>·</span>
                      <span>{member.users.region}</span>
                    </div>
                    <div className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                      申請日: {new Date(member.created_at).toLocaleDateString('ja-JP')}
                    </div>
                  </div>
                  <span className="ml-1 shrink-0 text-xs text-gray-400 dark:text-gray-500">{isExpanded ? '▲' : '▼'}</span>
                </button>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleApprove(member.user_id)}
                    disabled={processingId === member.user_id}
                    className="min-h-[44px] rounded-md bg-green-600 px-3 py-2.5 text-xs font-semibold text-white hover:bg-green-500 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                  >
                    {processingId === member.user_id ? '処理中...' : '承認'}
                  </button>
                  <button
                    onClick={() => handleReject(member.user_id)}
                    disabled={processingId === member.user_id}
                    className="min-h-[44px] rounded-md bg-white dark:bg-gray-800 px-3 py-2.5 text-xs font-semibold text-gray-700 dark:text-gray-300 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  >
                    {processingId === member.user_id ? '処理中...' : '却下'}
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-gray-100 dark:border-gray-700 px-4 pb-3 pt-2">
                  <dl className="space-y-1">
                    <div className="flex gap-2">
                      <dt className="text-xs text-gray-400 dark:text-gray-500 w-20 shrink-0">ライセンス</dt>
                      <dd className="text-xs text-gray-700 dark:text-gray-300">{member.users.license_level}</dd>
                    </div>
                    {member.users.age_groups.length > 0 && (
                      <div className="flex gap-2">
                        <dt className="text-xs text-gray-400 dark:text-gray-500 w-20 shrink-0">対応年代</dt>
                        <dd className="text-xs text-gray-700 dark:text-gray-300">
                          {member.users.age_groups.map((g) => AGE_GROUP_LABELS[g as AgeGroup] ?? g).join('・')}
                        </dd>
                      </div>
                    )}
                    {member.users.role_type.length > 0 && (
                      <div className="flex gap-2">
                        <dt className="text-xs text-gray-400 dark:text-gray-500 w-20 shrink-0">担当役割</dt>
                        <dd className="text-xs text-gray-700 dark:text-gray-300">
                          {member.users.role_type.map((r) => ROLE_TYPE_LABELS[r] ?? r).join('・')}
                        </dd>
                      </div>
                    )}
                    {member.users.travel_range_km != null && (
                      <div className="flex gap-2">
                        <dt className="text-xs text-gray-400 dark:text-gray-500 w-20 shrink-0">移動範囲</dt>
                        <dd className="text-xs text-gray-700 dark:text-gray-300">{member.users.travel_range_km}km</dd>
                      </div>
                    )}
                  </dl>
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
