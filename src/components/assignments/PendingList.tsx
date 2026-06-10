'use client'

import { useState } from 'react'
import type { AgeGroup } from '@/types/domain'
import { AGE_GROUP_LABELS } from '@/types/domain'

const DAY_NAMES = ['日', '月', '火', '水', '木', '金', '土']

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  const month = d.getMonth() + 1
  const day = d.getDate()
  return `${month}月${day}日(${DAY_NAMES[d.getDay()]})`
}

export interface PendingAssignmentItem {
  id: string
  role: 'referee' | 'assistant_referee'
  status: string
  match: {
    id: string
    title: string
    match_date: string
    start_time: string
    venue: string
    age_group: string
    compensation: number | null
    notes: string | null
  }
}

interface PendingListProps {
  readonly items: PendingAssignmentItem[]
  readonly onResponded: (id: string) => void
}

const ROLE_LABELS: Record<string, string> = {
  referee: '主審',
  assistant_referee: '副審',
}

const AGE_GROUP_COLORS: Record<AgeGroup, string> = {
  U12: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  U15: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  U18: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  Senior: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
}

export function PendingList({ items, onResponded }: PendingListProps) {
  const [submittingId, setSubmittingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-600 p-8 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">現在の募集はありません</p>
      </div>
    )
  }

  async function handleRespond(id: string, action: 'accept' | 'decline') {
    setSubmittingId(id)
    setError(null)
    try {
      const res = await fetch(`/api/assignments/${id}/respond`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError((data as { error?: string }).error ?? '送信に失敗しました。再試行してください。')
        return
      }
      onResponded(id)
    } catch {
      setError('送信に失敗しました。再試行してください。')
    } finally {
      setSubmittingId(null)
    }
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="rounded-md bg-red-50 dark:bg-red-900/20 px-3 py-2 text-sm text-red-700 dark:text-red-400">
          {error}
        </p>
      )}
      <ul className="space-y-3">
        {items.map((item) => {
          const { match } = item
          const ageGroupColor = AGE_GROUP_COLORS[match.age_group as AgeGroup] ?? 'bg-gray-100 text-gray-700'
          const isSubmitting = submittingId === item.id

          return (
            <li
              key={item.id}
              className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm"
            >
              <div className="px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 space-y-1">
                    <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">{match.title}</p>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{formatDate(match.match_date)}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {match.start_time.slice(0, 5)} / {match.venue}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ageGroupColor}`}>
                      {AGE_GROUP_LABELS[match.age_group as AgeGroup] ?? match.age_group}
                    </span>
                    <span className="rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-400">
                      {ROLE_LABELS[item.role] ?? item.role}
                    </span>
                  </div>
                </div>
                {(match.compensation != null || match.notes) && (
                  <dl className="mt-2 space-y-1">
                    {match.compensation != null && (
                      <div className="flex gap-2">
                        <dt className="w-12 shrink-0 text-xs text-gray-400 dark:text-gray-500">報酬</dt>
                        <dd className="text-xs text-gray-700 dark:text-gray-300">
                          {match.compensation === 0 ? '無償' : `${match.compensation.toLocaleString()}円`}
                        </dd>
                      </div>
                    )}
                    {match.notes && (
                      <div className="flex gap-2">
                        <dt className="w-12 shrink-0 text-xs text-gray-400 dark:text-gray-500">備考</dt>
                        <dd className="whitespace-pre-wrap text-xs text-gray-700 dark:text-gray-300">{match.notes}</dd>
                      </div>
                    )}
                  </dl>
                )}
              </div>
              <div className="flex gap-2 border-t border-gray-100 dark:border-gray-700 px-4 pb-3 pt-3">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleRespond(item.id, 'accept')}
                  className="flex-1 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? '送信中...' : '参加'}
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleRespond(item.id, 'decline')}
                  className="flex-1 rounded-md bg-white dark:bg-gray-800 px-3 py-2 text-sm font-semibold text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  辞退
                </button>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
