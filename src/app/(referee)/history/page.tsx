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
        <h1 className="text-xl font-bold text-gray-900">担当履歴</h1>
        <p className="mt-1 text-sm text-gray-500">
          確定済みの試合担当履歴を確認できます。
        </p>
      </div>

      <div className="mb-4 space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
        <h2 className="text-xs font-semibold text-gray-600">絞り込み</h2>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">年代</label>
          <select
            value={ageGroup}
            onChange={(e) => setAgeGroup(e.target.value)}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">すべて</option>
            {AGE_GROUPS.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">開始日</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">終了日</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {(ageGroup || dateFrom || dateTo) && (
          <button
            type="button"
            onClick={handleReset}
            className="text-xs font-medium text-blue-600 hover:text-blue-500"
          >
            絞り込みをリセット
          </button>
        )}
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">
            担当一覧
            {!loading && items.length > 0 && (
              <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                {items.length}件
              </span>
            )}
          </h2>
        </div>

        {loading ? (
          <p className="text-sm text-gray-500">読み込み中...</p>
        ) : (
          <AssignmentHistory items={items} />
        )}
      </div>
    </main>
  )
}
