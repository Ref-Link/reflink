'use client'

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
  } | null
}

interface AssignmentHistoryProps {
  items: AssignmentHistoryItem[]
}

const ROLE_LABELS: Record<string, string> = {
  referee: '主審',
  assistant_referee: '副審',
}

const AGE_GROUP_COLORS: Record<string, string> = {
  U12: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  U15: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  U18: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  Senior: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
}

export function AssignmentHistory({ items }: AssignmentHistoryProps) {
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
        const ageGroupColor = AGE_GROUP_COLORS[match.age_group] ?? 'bg-gray-100 text-gray-700'

        return (
          <li
            key={item.id}
            className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 shadow-sm"
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
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${ageGroupColor}`}
                >
                  {match.age_group}
                </span>
                <span className="rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-400">
                  {ROLE_LABELS[item.role] ?? item.role}
                </span>
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
