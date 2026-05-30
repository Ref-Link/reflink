'use client'

import { useState } from 'react'
import type { AgeGroup } from '@/types/domain'

const AGE_GROUPS: AgeGroup[] = ['U12', 'U15', 'U18', 'Senior']

export interface MatchFormData {
  title: string
  match_date: string
  start_time: string
  venue: string
  age_group: string
  referees_needed: number
  assistants_needed: number
  compensation: number | null
  notes: string
}

interface MatchFormProps {
  readonly initialData?: Readonly<Partial<MatchFormData>>
  readonly onSubmit: (data: MatchFormData) => Promise<void>
  readonly submitLabel?: string
}

export function MatchForm({ initialData, onSubmit, submitLabel = '登録する' }: MatchFormProps) {
  const [formData, setFormData] = useState<MatchFormData>({
    title: initialData?.title ?? '',
    match_date: initialData?.match_date ?? '',
    start_time: initialData?.start_time ?? '',
    venue: initialData?.venue ?? '',
    age_group: initialData?.age_group ?? '',
    referees_needed: initialData?.referees_needed ?? 1,
    assistants_needed: initialData?.assistants_needed ?? 2,
    compensation: initialData?.compensation ?? null,
    notes: initialData?.notes ?? '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!formData.title.trim()) {
      setError('試合名を入力してください')
      return
    }
    if (!formData.match_date) {
      setError('試合日を選択してください')
      return
    }
    if (!formData.start_time) {
      setError('開始時間を入力してください')
      return
    }
    if (!formData.venue.trim()) {
      setError('会場を入力してください')
      return
    }
    if (!formData.age_group) {
      setError('対象年代を選択してください')
      return
    }
    if (formData.referees_needed === 0 && formData.assistants_needed === 0) {
      setError('主審・副審のどちらかを1名以上指定してください')
      return
    }

    setLoading(true)
    try {
      await onSubmit(formData)
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          試合名 <span className="text-red-500">*</span>
        </label>
        <input
          id="title"
          type="text"
          value={formData.title}
          onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
          className={inputClass}
          placeholder="例: U15リーグ 第3節"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="match_date" className="block text-sm font-medium text-gray-700">
            試合日 <span className="text-red-500">*</span>
          </label>
          <input
            id="match_date"
            type="date"
            value={formData.match_date}
            onChange={(e) => setFormData((p) => ({ ...p, match_date: e.target.value }))}
            className={inputClass}
            required
          />
        </div>

        <div>
          <label htmlFor="start_time" className="block text-sm font-medium text-gray-700">
            開始時間 <span className="text-red-500">*</span>
          </label>
          <input
            id="start_time"
            type="time"
            value={formData.start_time}
            onChange={(e) => setFormData((p) => ({ ...p, start_time: e.target.value }))}
            className={inputClass}
            required
          />
        </div>
      </div>

      <div>
        <label htmlFor="venue" className="block text-sm font-medium text-gray-700">
          会場 <span className="text-red-500">*</span>
        </label>
        <input
          id="venue"
          type="text"
          value={formData.venue}
          onChange={(e) => setFormData((p) => ({ ...p, venue: e.target.value }))}
          className={inputClass}
          placeholder="例: 名古屋市港サッカー場"
          required
        />
      </div>

      <div>
        <label htmlFor="age_group" className="block text-sm font-medium text-gray-700">
          対象年代 <span className="text-red-500">*</span>
        </label>
        <select
          id="age_group"
          value={formData.age_group}
          onChange={(e) => setFormData((p) => ({ ...p, age_group: e.target.value }))}
          className={inputClass}
          required
        >
          <option value="">選択してください</option>
          {AGE_GROUPS.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="referees_needed" className="block text-sm font-medium text-gray-700">
            主審人数 <span className="text-red-500">*</span>
          </label>
          <input
            id="referees_needed"
            type="number"
            min={0}
            max={1}
            value={formData.referees_needed}
            onChange={(e) => setFormData((p) => ({ ...p, referees_needed: Number(e.target.value) }))}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="assistants_needed" className="block text-sm font-medium text-gray-700">
            副審人数 <span className="text-red-500">*</span>
          </label>
          <input
            id="assistants_needed"
            type="number"
            min={0}
            max={2}
            value={formData.assistants_needed}
            onChange={(e) => setFormData((p) => ({ ...p, assistants_needed: Number(e.target.value) }))}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="compensation" className="block text-sm font-medium text-gray-700">
          報酬額（円）
        </label>
        <input
          id="compensation"
          type="number"
          min={0}
          value={formData.compensation ?? ''}
          onChange={(e) =>
            setFormData((p) => ({ ...p, compensation: e.target.value ? Number(e.target.value) : null }))
          }
          className={inputClass}
          placeholder="例: 3000"
        />
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">備考</label>
        <textarea
          id="notes"
          rows={3}
          value={formData.notes}
          onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
          className={inputClass}
          placeholder="審判への連絡事項など"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
      >
        {loading ? '保存中...' : submitLabel}
      </button>
    </form>
  )
}
