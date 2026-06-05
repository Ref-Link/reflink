'use client'

import type { Candidate } from '@/types/domain'

const LICENSE_ORDER: Record<string, number> = {
  'S級': 0,
  '1級': 1,
  '2級': 2,
  '3級': 3,
  '4級': 4,
}

const ROLE_LABELS: Record<string, string> = {
  referee: '主審',
  assistant_referee: '副審',
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
}

function LicenseBadge({ level }: { level: string }) {
  const order = LICENSE_ORDER[level] ?? 99
  const colorClass =
    order === 0
      ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      : order === 1
      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      : order === 2
      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colorClass}`}>
      {level}
    </span>
  )
}

interface CandidateListProps {
  readonly candidates: Candidate[]
  readonly isLoading?: boolean
  readonly selectedIds?: Set<string>
  readonly onToggleSelect?: (id: string) => void
}

export function CandidateList({
  candidates,
  isLoading = false,
  selectedIds,
  onToggleSelect,
}: CandidateListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-gray-500">
        候補を検索中...
      </div>
    )
  }

  if (candidates.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-600 py-12 text-center">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">条件に合う審判候補が見つかりませんでした</p>
        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
          試合日・対象年代で空き日程を登録している審判がいません
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500 dark:text-gray-400">{candidates.length}名の候補が見つかりました</p>
      <ul className="divide-y divide-gray-200 dark:divide-gray-700 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        {candidates.map((candidate) => (
          <li key={candidate.id} className="px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              {onToggleSelect && (
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                  checked={selectedIds?.has(candidate.id) ?? false}
                  onChange={() => onToggleSelect(candidate.id)}
                />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{candidate.display_name}</span>
                  <LicenseBadge level={candidate.license_level} />
                  {candidate.referred_by && (
                    <span className="inline-flex items-center rounded-full bg-yellow-50 dark:bg-yellow-950 px-2 py-0.5 text-xs text-yellow-700 dark:text-yellow-300">
                      紹介あり
                    </span>
                  )}
                </div>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                  <span>
                    役割: {candidate.role_type.map((r) => ROLE_LABELS[r] ?? r).join('・')}
                  </span>
                  <span>年代: {candidate.age_groups.join('・')}</span>
                  <span>地域: {candidate.region}</span>
                  {candidate.travel_range_km != null && (
                    <span>移動範囲: {candidate.travel_range_km}km</span>
                  )}
                </div>
              </div>
              <div className="flex-shrink-0 text-right">
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{candidate.total_assignments}回</div>
                <div className="text-xs text-gray-400 dark:text-gray-500">担当実績</div>
                {candidate.last_active_date && (
                  <div className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                    最終: {formatDate(candidate.last_active_date)}
                  </div>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
