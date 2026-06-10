'use client'

import { useState } from 'react'
import type { Candidate, AgeGroup, RefereeRole } from '@/types/domain'
import { AGE_GROUP_LABELS } from '@/types/domain'

const LICENSE_ORDER: Record<string, number> = {
  '1級': 0,
  '2級': 1,
  '3級': 2,
  '4級': 3,
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

function licenseColor(order: number): string {
  if (order === 0) return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
  if (order === 1) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
  if (order === 2) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
  return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
}

function LicenseBadge({ level }: { readonly level: string }) {
  const order = LICENSE_ORDER[level] ?? 99
  const colorClass = licenseColor(order)
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
  readonly selectedRoles?: Map<string, RefereeRole>
  readonly matchRecruitedRoles?: RefereeRole[]
  readonly onRoleChange?: (id: string, role: RefereeRole) => void
}

export function CandidateList({
  candidates,
  isLoading = false,
  selectedIds,
  onToggleSelect,
  selectedRoles,
  matchRecruitedRoles,
  onRoleChange,
}: CandidateListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

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
        {candidates.map((candidate) => {
          const isExpanded = expandedId === candidate.id
          const availableRoles = (matchRecruitedRoles ?? []).filter(
            (r) => candidate.role_type.includes(r)
          )
          const candidateHasBothRoles =
            candidate.role_type.includes('referee') &&
            candidate.role_type.includes('assistant_referee')
          const showRolePicker = !!(selectedIds?.has(candidate.id) && candidateHasBothRoles)
          return (
            <li key={candidate.id} className="px-4 py-3">
              <div className="flex items-center gap-3">
                {onToggleSelect && (
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                    checked={selectedIds?.has(candidate.id) ?? false}
                    onChange={() => onToggleSelect(candidate.id)}
                  />
                )}
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : candidate.id)}
                  className="flex flex-1 items-center justify-between gap-2 text-left min-h-[44px]"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{candidate.display_name}</span>
                    <LicenseBadge level={candidate.license_level} />
                    {candidate.referred_by && (
                      <span className="inline-flex items-center rounded-full bg-yellow-50 dark:bg-yellow-950 px-2 py-0.5 text-xs text-yellow-700 dark:text-yellow-300">
                        紹介あり
                      </span>
                    )}
                  </div>
                  <span className="shrink-0 text-xs text-gray-400 dark:text-gray-500">{isExpanded ? '▲' : '▼'}</span>
                </button>
              </div>

              {showRolePicker && (
                <div className="mt-2 pl-7 flex gap-2 min-h-[44px] items-center">
                  {availableRoles.map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => onRoleChange?.(candidate.id, role)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium border ${
                        selectedRoles?.get(candidate.id) === role
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      {ROLE_LABELS[role]}
                    </button>
                  ))}
                </div>
              )}

              {isExpanded && (
                <div className="mt-2 pl-7 space-y-1">
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                    <span>役割: {candidate.role_type.map((r) => ROLE_LABELS[r] ?? r).join('・')}</span>
                    <span>年代: {candidate.age_groups.map((g) => AGE_GROUP_LABELS[g as AgeGroup] ?? g).join('・')}</span>
                    <span>地域: {candidate.region}</span>
                    {candidate.travel_range_km != null && (
                      <span>移動範囲: {candidate.travel_range_km}km</span>
                    )}
                  </div>
                  <div className="flex gap-x-4 text-xs text-gray-400 dark:text-gray-500">
                    <span>担当実績: {candidate.total_assignments}回</span>
                    {candidate.last_active_date && (
                      <span>最終: {formatDate(candidate.last_active_date)}</span>
                    )}
                  </div>
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
