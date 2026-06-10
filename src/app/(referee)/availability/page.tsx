'use client'

import { useEffect, useState, useCallback } from 'react'
import { AvailabilityCalendar, AvailabilityList, type NewAvailabilityData } from '@/components/availability/AvailabilityCalendar'
import type { AvailabilityRow } from '@/types/database'

export default function AvailabilityPage() {
  const [items, setItems] = useState<AvailabilityRow[]>([])
  const [loading, setLoading] = useState(true)
  const [defaultAgeGroups, setDefaultAgeGroups] = useState<string[]>([])

  const fetchAvailabilities = useCallback(async () => {
    const res = await fetch('/api/availability')
    if (res.ok) {
      setItems(await res.json())
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchAvailabilities()
    fetch('/api/profile').then(async (res) => {
      if (res.ok) {
        const profile = await res.json()
        if (Array.isArray(profile.age_groups)) {
          setDefaultAgeGroups(profile.age_groups)
        }
      }
    })
  }, [fetchAvailabilities])

  async function handleAdd(data: NewAvailabilityData) {
    const res = await fetch('/api/availability', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      const json = await res.json()
      throw new Error(json.error ?? '登録に失敗しました')
    }

    const created: AvailabilityRow = await res.json()
    setItems((prev) => [...prev, created].sort((a, b) => a.date.localeCompare(b.date)))
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/availability/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      throw new Error(json.error ?? '削除に失敗しました')
    }
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  const existingDates = items.map((item) => item.date)

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">空き日程管理</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          対応可能な日程を登録してください。運営者が試合の審判候補を探す際に使用されます。
        </p>
      </div>

      <div className="space-y-6">
        <AvailabilityCalendar existingDates={existingDates} defaultAgeGroups={defaultAgeGroups} onAdd={handleAdd} />

        <div>
          <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
            登録済み空き日程
            {items.length > 0 && (
              <span className="ml-2 rounded-full bg-blue-100 dark:bg-blue-900 px-2 py-0.5 text-xs text-blue-700 dark:text-blue-200">
                {items.length}件
              </span>
            )}
          </h2>
          {loading ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">読み込み中...</p>
          ) : (
            <AvailabilityList items={items} onDelete={handleDelete} />
          )}
        </div>
      </div>
    </main>
  )
}
