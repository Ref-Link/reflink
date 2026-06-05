'use client'

import { useState } from 'react'
import type { AgeGroup } from '@/types/domain'
import type { AvailabilityRow } from '@/types/database'

const AGE_GROUPS: AgeGroup[] = ['U12', 'U15', 'U18', 'Senior']

export interface NewAvailabilityData {
  date: string
  start_time: string | null
  end_time: string | null
  age_groups: string[]
  notes: string | null
}

interface AvailabilityCalendarProps {
  readonly existingDates?: string[]
  readonly onAdd: (data: NewAvailabilityData) => Promise<void>
}

function getToday(): string {
  return new Date().toISOString().split('T')[0]
}

export function AvailabilityCalendar({ existingDates = [], onAdd }: AvailabilityCalendarProps) {
  const [selectedDate, setSelectedDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [selectedAgeGroups, setSelectedAgeGroups] = useState<string[]>([])
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggleAgeGroup(group: string) {
    setSelectedAgeGroups((prev) =>
      prev.includes(group) ? prev.filter((g) => g !== group) : [...prev, group]
    )
  }

  async function handleAdd() {
    setError(null)

    if (!selectedDate) {
      setError('日付を選択してください')
      return
    }
    if (selectedAgeGroups.length === 0) {
      setError('対応年代を選択してください')
      return
    }
    if (startTime && endTime && endTime <= startTime) {
      setError('終了時刻は開始時刻より後にしてください')
      return
    }

    setLoading(true)
    try {
      await onAdd({
        date: selectedDate,
        start_time: startTime || null,
        end_time: endTime || null,
        age_groups: selectedAgeGroups,
        notes: notes.trim() || null,
      })
      // Reset form on success
      setSelectedDate('')
      setStartTime('')
      setEndTime('')
      setSelectedAgeGroups([])
      setNotes('')
    } catch (err) {
      setError(err instanceof Error ? err.message : '登録に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const today = getToday()

  return (
    <div className="space-y-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">空き日程を追加</h3>

      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-950 p-3 text-sm text-red-700 dark:text-red-300">{error}</div>
      )}

      <div>
        <label htmlFor="avail_date" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
          日付 <span className="text-red-500">*</span>
        </label>
        <div className={`overflow-hidden rounded-md border focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 ${
          existingDates.includes(selectedDate)
            ? 'border-yellow-400'
            : 'border-gray-300 dark:border-gray-600'
        }`}>
          <input
            id="avail_date"
            type="date"
            min={today}
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className={`block w-full rounded-md px-3 py-3 text-sm text-gray-900 dark:text-gray-100 shadow-sm focus:outline-none ${
              existingDates.includes(selectedDate)
                ? 'bg-yellow-50 dark:bg-yellow-950'
                : 'bg-white dark:bg-gray-800'
            }`}
          />
        </div>
        {existingDates.includes(selectedDate) && (
          <p className="mt-1 text-xs text-yellow-600 dark:text-yellow-400">この日付はすでに登録済みです</p>
        )}
      </div>

      <div className="flex gap-3">
        <div className="flex-1 min-w-0">
          <label htmlFor="avail_start_time" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">開始時刻</label>
          <div className="overflow-hidden rounded-md border border-gray-300 dark:border-gray-600 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
            <input
              id="avail_start_time"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="block w-full rounded-md bg-white dark:bg-gray-800 px-3 py-3 text-sm text-gray-900 dark:text-gray-100 shadow-sm focus:outline-none"
            />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <label htmlFor="avail_end_time" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">終了時刻</label>
          <div className="overflow-hidden rounded-md border border-gray-300 dark:border-gray-600 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
            <input
              id="avail_end_time"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="block w-full rounded-md bg-white dark:bg-gray-800 px-3 py-3 text-sm text-gray-900 dark:text-gray-100 shadow-sm focus:outline-none"
            />
          </div>
        </div>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">未入力の場合は終日対応可として登録されます</p>

      <fieldset>
        <legend className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
          対応年代 <span className="text-red-500">*</span>
        </legend>
        <div className="flex gap-2 flex-wrap">
          {AGE_GROUPS.map((group) => (
            <button
              key={group}
              type="button"
              onClick={() => toggleAgeGroup(group)}
              className={`min-h-[44px] rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                selectedAgeGroups.includes(group)
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-blue-400'
              }`}
            >
              {group}
            </button>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="avail_notes" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">備考</label>
        <textarea
          id="avail_notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-3 text-sm text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="任意メモ"
        />
      </div>

      <button
        type="button"
        onClick={handleAdd}
        disabled={loading}
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
      >
        {loading ? '登録中...' : '追加する'}
      </button>
    </div>
  )
}

// List display for existing availabilities
interface AvailabilityListProps {
  readonly items: AvailabilityRow[]
  readonly onDelete: (id: string) => Promise<void>
}

const DAY_NAMES = ['日', '月', '火', '水', '木', '金', '土']

function formatTimeRange(start: string | null, end: string | null): string {
  if (start && end) return `${start.slice(0, 5)} – ${end.slice(0, 5)}`
  if (start) return `${start.slice(0, 5)}〜`
  return '終日'
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  const month = d.getMonth() + 1
  const day = d.getDate()
  const dayName = DAY_NAMES[d.getDay()]
  return `${month}月${day}日(${dayName})`
}

export function AvailabilityList({ items, onDelete }: AvailabilityListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      await onDelete(id)
    } finally {
      setDeletingId(null)
    }
  }

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-600 p-8 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">登録済みの空き日程はありません</p>
      </div>
    )
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.id} className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 shadow-sm">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{formatDate(item.date)}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatTimeRange(item.start_time, item.end_time)}
            </p>
            <div className="flex gap-1 flex-wrap">
              {item.age_groups.map((g) => (
                <span key={g} className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">{g}</span>
              ))}
            </div>
            {item.notes && <p className="text-xs text-gray-400 dark:text-gray-500">{item.notes}</p>}
          </div>
          <button
            type="button"
            onClick={() => handleDelete(item.id)}
            disabled={deletingId === item.id}
            className="ml-4 min-h-[44px] min-w-[44px] rounded-md px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            {deletingId === item.id ? '削除中' : '削除'}
          </button>
        </li>
      ))}
    </ul>
  )
}
