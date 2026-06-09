'use client'

import { useState } from 'react'
import type { LicenseLevel, AgeGroup } from '@/types/domain'
import { AGE_GROUP_LABELS } from '@/types/domain'
import { formatPhoneNumber, normalizePhoneNumber } from '@/lib/phone'

const LICENSE_LEVELS: LicenseLevel[] = ['1級', '2級', '3級', '4級']
const AGE_GROUPS: AgeGroup[] = ['U12', 'U15', 'U18', 'Senior']
const ROLE_OPTIONS = [
  { value: 'referee', label: '主審' },
  { value: 'assistant_referee', label: '副審' },
] as const

// S7721: コンポーネント外のスコープに移動
function toggleArrayValue<T extends string>(arr: T[], value: T): T[] {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value]
}

// line_user_id はシステムが自動管理するためフォームには含めない
export interface ProfileFormData {
  display_name: string
  real_name: string
  license_level: string
  role_type: string[]
  age_groups: string[]
  region: string
  travel_range_km: number | null
  phone_number: string
}

// S6759: props を Readonly でマーク
interface ProfileFormProps {
  readonly initialData?: Readonly<Partial<ProfileFormData>>
  readonly onSubmit: (data: ProfileFormData) => Promise<void>
  readonly submitLabel?: string
}

export function ProfileForm({ initialData, onSubmit, submitLabel = '保存する' }: ProfileFormProps) {
  const [formData, setFormData] = useState<ProfileFormData>({
    display_name: initialData?.display_name ?? '',
    real_name: initialData?.real_name ?? '',
    license_level: initialData?.license_level ?? '',
    role_type: initialData?.role_type ?? [],
    age_groups: initialData?.age_groups ?? [],
    region: initialData?.region ?? '',
    travel_range_km: initialData?.travel_range_km ?? null,
    phone_number: initialData?.phone_number
      ? formatPhoneNumber(normalizePhoneNumber(initialData.phone_number))
      : '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!formData.display_name.trim()) {
      setError('表示名を入力してください')
      return
    }
    if (!formData.license_level) {
      setError('ライセンスを選択してください')
      return
    }
    if (formData.role_type.length === 0) {
      setError('担当役割を選択してください')
      return
    }
    if (formData.age_groups.length === 0) {
      setError('対応年代を選択してください')
      return
    }
    if (!formData.region.trim()) {
      setError('活動地域を入力してください')
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-950 p-4 text-sm text-red-700 dark:text-red-300">{error}</div>
      )}

      {/* S6853: htmlFor + id で label とコントロールを紐付け */}
      <div>
        <label htmlFor="display_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          表示名 <span className="text-red-500">*</span>
        </label>
        <input
          id="display_name"
          type="text"
          value={formData.display_name}
          onChange={(e) => setFormData((p) => ({ ...p, display_name: e.target.value }))}
          className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-3 text-sm text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="例: 田中太郎"
          required
        />
      </div>

      <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 p-3">
        <p className="mb-0.5 text-xs font-semibold text-amber-700 dark:text-amber-400">アサイン確定後に運営者へ開示</p>
        <p className="mb-3 text-xs text-amber-600 dark:text-amber-500">
          電話番号の登録がないとアサイン確定ができません
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="real_name" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">氏名</label>
            <input
              id="real_name"
              type="text"
              value={formData.real_name}
              onChange={(e) => setFormData((p) => ({ ...p, real_name: e.target.value }))}
              className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-3 text-sm text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="例: 田中太郎"
            />
          </div>
          <div>
            <label htmlFor="phone_number" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">電話番号（確定に必要）</label>
            <input
              id="phone_number"
              type="tel"
              value={formData.phone_number}
              onChange={(e) => setFormData((p) => ({ ...p, phone_number: e.target.value }))}
              className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-3 text-sm text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="090-1234-5678"
            />
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="license_level" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          審判ライセンス <span className="text-red-500">*</span>
        </label>
        <select
          id="license_level"
          value={formData.license_level}
          onChange={(e) => setFormData((p) => ({ ...p, license_level: e.target.value }))}
          className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-3 text-sm text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          required
        >
          <option value="">選択してください</option>
          {LICENSE_LEVELS.map((level) => (
            <option key={level} value={level}>{level}</option>
          ))}
        </select>
      </div>

      {/* ボタングループは fieldset + legend で紐付け */}
      <fieldset>
        <legend className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          担当役割 <span className="text-red-500">*</span>
        </legend>
        <div className="flex gap-3 flex-wrap">
          {ROLE_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              aria-pressed={formData.role_type.includes(value)}
              onClick={() => setFormData((p) => ({ ...p, role_type: toggleArrayValue(p.role_type, value) }))}
              className={`min-h-[44px] rounded-full px-4 py-1 text-sm font-medium border transition-colors ${
                formData.role_type.includes(value)
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-blue-400'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          対応年代 <span className="text-red-500">*</span>
        </legend>
        <div className="flex gap-3 flex-wrap">
          {AGE_GROUPS.map((group) => (
            <button
              key={group}
              type="button"
              aria-pressed={formData.age_groups.includes(group)}
              onClick={() => setFormData((p) => ({ ...p, age_groups: toggleArrayValue(p.age_groups, group) }))}
              className={`min-h-[44px] rounded-full px-4 py-1 text-sm font-medium border transition-colors ${
                formData.age_groups.includes(group)
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-blue-400'
              }`}
            >
              {AGE_GROUP_LABELS[group]}
            </button>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="region" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          活動地域 <span className="text-red-500">*</span>
        </label>
        <input
          id="region"
          type="text"
          value={formData.region}
          onChange={(e) => setFormData((p) => ({ ...p, region: e.target.value }))}
          className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-3 text-sm text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="例: 愛知西部"
          required
        />
      </div>

      <div>
        <label htmlFor="travel_range_km" className="block text-sm font-medium text-gray-700 dark:text-gray-300">移動可能範囲（km）</label>
        <input
          id="travel_range_km"
          type="number"
          min={0}
          value={formData.travel_range_km ?? ''}
          onChange={(e) =>
            setFormData((p) => ({ ...p, travel_range_km: e.target.value ? Number(e.target.value) : null }))
          }
          className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-3 text-sm text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="例: 30"
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
