'use client'

import { useState, useCallback } from 'react'
import { ApprovalList, type MemberWithUser } from '@/components/members/ApprovalList'
import type { AgeGroup } from '@/types/domain'
import { AGE_GROUP_LABELS } from '@/types/domain'

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

const ROLE_TYPE_LABELS: Record<string, string> = {
  referee: '主審',
  assistant_referee: '副審',
}

interface Props {
  readonly communityId: string
  readonly initialMembers: MemberWithUser[]
}

export default function AdminMembersClient({ communityId, initialMembers }: Props) {
  const [members, setMembers] = useState(initialMembers)
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const fetchMembers = useCallback(async () => {
    const res = await fetch(`/api/communities/${communityId}/members`)
    if (res.ok) {
      setMembers(await res.json())
    } else {
      const json = await res.json()
      setErrorMessage(json.error ?? 'メンバー一覧の取得に失敗しました')
    }
  }, [communityId])

  function handleAction() {
    setActionMessage('操作が完了しました')
    setTimeout(() => setActionMessage(null), 3000)
    fetchMembers()
  }

  const pending = members.filter((m) => m.status === 'pending')
  const approved = members.filter((m) => m.status === 'approved')
  const rejected = members.filter((m) => m.status === 'rejected')

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">メンバー管理</h1>
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

      <section className="mb-8">
        <h2 className="mb-3 text-base font-semibold text-gray-900">
          承認待ち
          {pending.length > 0 && (
            <span className="ml-2 inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
              {pending.length}
            </span>
          )}
        </h2>
        <ApprovalList
          communityId={communityId}
          members={members}
          onAction={handleAction}
        />
      </section>

      <section>
        <h2 className="mb-3 text-base font-semibold text-gray-900">
          {'メンバー一覧'}<span className="ml-2 text-sm font-normal text-gray-500">({approved.length}名)</span>
        </h2>
        {approved.length === 0 && rejected.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 py-8 text-center">
            <p className="text-sm font-medium text-gray-500">承認済みメンバーはまだいません</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {[...approved, ...rejected].map((member) => {
              const isExpanded = expandedId === member.id
              return (
                <li
                  key={member.id}
                  className={`rounded-lg border border-gray-200 bg-white shadow-sm ${member.status === 'rejected' ? 'opacity-50' : ''}`}
                >
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : member.id)}
                    className="flex w-full items-center justify-between gap-3 p-4 text-left min-h-[44px]"
                  >
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
                    <div className="flex shrink-0 items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[member.status]}`}
                      >
                        {STATUS_LABELS[member.status]}
                      </span>
                      <span className="text-xs text-gray-400">{isExpanded ? '▲' : '▼'}</span>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-gray-100 px-4 pb-3 pt-2">
                      <dl className="space-y-1">
                        <div className="flex gap-2">
                          <dt className="text-xs text-gray-400 w-20 shrink-0">ライセンス</dt>
                          <dd className="text-xs text-gray-700">{member.users.license_level}</dd>
                        </div>
                        {member.users.age_groups.length > 0 && (
                          <div className="flex gap-2">
                            <dt className="text-xs text-gray-400 w-20 shrink-0">対応年代</dt>
                            <dd className="text-xs text-gray-700">
                              {member.users.age_groups.map((g) => AGE_GROUP_LABELS[g as AgeGroup] ?? g).join('・')}
                            </dd>
                          </div>
                        )}
                        {member.users.role_type.length > 0 && (
                          <div className="flex gap-2">
                            <dt className="text-xs text-gray-400 w-20 shrink-0">担当役割</dt>
                            <dd className="text-xs text-gray-700">
                              {member.users.role_type.map((r) => ROLE_TYPE_LABELS[r] ?? r).join('・')}
                            </dd>
                          </div>
                        )}
                        {member.users.travel_range_km != null && (
                          <div className="flex gap-2">
                            <dt className="text-xs text-gray-400 w-20 shrink-0">移動範囲</dt>
                            <dd className="text-xs text-gray-700">{member.users.travel_range_km}km</dd>
                          </div>
                        )}
                      </dl>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </main>
  )
}
