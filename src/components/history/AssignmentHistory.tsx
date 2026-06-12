'use client'

import { useState } from 'react'
import { ContactInfo } from '@/components/ui/ContactInfo'
import type { AgeGroup } from '@/types/domain'
import { AGE_GROUP_LABELS } from '@/types/domain'

const DAY_NAMES = ['日', '月', '火', '水', '木', '金', '土']

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  const month = d.getMonth() + 1
  const day = d.getDate()
  const dayName = DAY_NAMES[d.getDay()]
  return `${month}月${day}日(${dayName})`
}

export interface AssignmentHistoryItem {
  id: string
  role: 'referee' | 'assistant_referee'
  status: string
  confirmed_at: string | null
  matches: {
    id: string
    title: string
    match_date: string
    start_time: string
    venue: string
    age_group: string
    organizer_phone: string | null
    organizer_name: string | null
    referees_needed: number
    assistants_needed: number
    compensation: number | null
    notes: string | null
  } | null
}

interface AssignmentHistoryProps {
  readonly items: AssignmentHistoryItem[]
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

export function AssignmentHistory({ items }: AssignmentHistoryProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-600 p-8 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">確定済みの担当履歴はありません</p>
      </div>
    )
  }

  return (
    <ul className="space-y-3">
      {items.map((item) => {
        const match = item.matches
        if (!match) return null
        const ageGroupColor = AGE_GROUP_COLORS[match.age_group as AgeGroup] ?? 'bg-gray-100 text-gray-700'
        const isExpanded = expandedId === item.id

        return (
          <li
            key={item.id}
            className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm"
          >
            <button
              type="button"
              onClick={() => setExpandedId(isExpanded ? null : item.id)}
              className="w-full px-4 py-3 text-left"
            >
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
                  <span className="text-xs text-gray-400 dark:text-gray-500">{isExpanded ? '▲' : '▼'}</span>
                </div>
              </div>
            </button>

            {isExpanded && (
              <div className="border-t border-gray-100 dark:border-gray-700 px-4 pb-3 pt-2 space-y-2">
                <dl className="space-y-1 text-sm">
                  {match.referees_needed > 0 && (
                    <div className="flex gap-2">
                      <dt className="text-xs text-gray-400 dark:text-gray-500 w-20 shrink-0">主審</dt>
                      <dd className="text-xs text-gray-700 dark:text-gray-300">{match.referees_needed}名</dd>
                    </div>
                  )}
                  {match.assistants_needed > 0 && (
                    <div className="flex gap-2">
                      <dt className="text-xs text-gray-400 dark:text-gray-500 w-20 shrink-0">副審</dt>
                      <dd className="text-xs text-gray-700 dark:text-gray-300">{match.assistants_needed}名</dd>
                    </div>
                  )}
                  {match.compensation != null && (
                    <div className="flex gap-2">
                      <dt className="text-xs text-gray-400 dark:text-gray-500 w-20 shrink-0">報酬</dt>
                      <dd className="text-xs text-gray-700 dark:text-gray-300">
                        {match.compensation === 0 ? '無償' : `${match.compensation.toLocaleString()}円`}
                      </dd>
                    </div>
                  )}
                  {match.notes && (
                    <div className="flex gap-2">
                      <dt className="text-xs text-gray-400 dark:text-gray-500 w-20 shrink-0">備考</dt>
                      <dd className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{match.notes}</dd>
                    </div>
                  )}
                </dl>
                {item.status === 'confirmed' && (
                  <div className="border-t border-gray-100 dark:border-gray-700 pt-2">
                    <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">運営者連絡先</p>
                    <ContactInfo phone={match.organizer_phone ?? null} name={match.organizer_name ?? null} />
                  </div>
                )}
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )
}
