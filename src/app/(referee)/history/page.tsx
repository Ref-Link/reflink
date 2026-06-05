'use client'

import { useEffect, useState, useCallback } from 'react'
import { AssignmentHistory, type AssignmentHistoryItem } from '@/components/history/AssignmentHistory'
import type { AgeGroup } from '@/types/domain'

const AGE_GROUPS: AgeGroup[] = ['U12', 'U15', 'U18', 'Senior']

export default function HistoryPage() {
  const [items, setItems] = useState<AssignmentHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [ageGroup, setAgeGroup] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const fetchHistory = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (ageGroup) params.set('age_group', ageGroup)
    if (dateFrom) params.set('date_from', dateFrom)
    if (dateTo) params.set('date_to', dateTo)

    const res = await fetch(`/api/assignments?${params.toString()}`)
    if (res.ok) {
      setItems(await res.json())
    }
    setLoading(false)
  }, [ageGroup, dateFrom, dateTo])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  function handleReset() {
    setAgeGroup('')
    setDateFrom('')
    setDateTo('')
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">担当履歴</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          確定済みの試合担当履歴を確認できます。
        </p>
      </div>

      <div className="mb-4 space-y-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-4">
        <h2 className="text-xs font-semibold text-gray-600 dark:text-gray-400">絞り込み</h2>

        <div>
          <label htmlFor="filter_age_group" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">年代</label>
          <select
            id="filter_age_group"
            value={ageGroup}
            onChange={(e) => setAgeGroup(e.target.value)}
            className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-3 text-sm text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">すべて</option>
            {AGE_GROUPS.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-3">
          <div className="flex-1 min-w-0">
            <label htmlFor="filter_date_from" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">開始日</label>
            <div className="overflow-hidden rounded-md border border-gray-300 dark:border-gray-600 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
              <input
                id="filter_date_from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="block w-full rounded-md bg-white dark:bg-gray-800 px-3 py-3 text-sm text-gray-900 dark:text-gray-100 shadow-sm focus:outline-none"
              />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <label htmlFor="filter_date_to" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">終了日</label>
            <div className="overflow-hidden rounded-md border border-gray-300 dark:border-gray-600 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
              <input
                id="filter_date_to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="block w-full rounded-md bg-white dark:bg-gray-800 px-3 py-3 text-sm text-gray-900 dark:text-gray-100 shadow-sm focus:outline-none"
              />
            </div>
          </div>
        </div>

        {(ageGroup || dateFrom || dateTo) && (
          <button
            type="button"
            onClick={handleReset}
            className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
          >
            絞り込みをリセット
          </button>
        )}
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            担当一覧
            {!loading && items.length > 0 && (
              <span className="ml-2 rounded-full bg-blue-100 dark:bg-blue-900 px-2 py-0.5 text-xs text-blue-700 dark:text-blue-200">
                {items.length}件
              </span>
            )}
          </h2>
        </div>

        {loading ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">読み込み中...</p>
        ) : (
          <AssignmentHistory items={items} />
        )}
      </div>
    </main>
  )
}
