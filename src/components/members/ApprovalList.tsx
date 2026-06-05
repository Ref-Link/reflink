'use client'

import { useState } from 'react'

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
  }
}

interface ApprovalListProps {
  communityId: string
  members: MemberWithUser[]
  onAction: () => void
}

export function ApprovalList({ communityId, members, onAction }: ApprovalListProps) {
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

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
        {pending.map((member) => (
          <li
            key={member.id}
            className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 shadow-sm"
          >
            <div className="flex items-center justify-between gap-3">
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
              <div className="flex gap-2">
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
          </li>
        ))}
      </ul>
    </div>
  )
}
