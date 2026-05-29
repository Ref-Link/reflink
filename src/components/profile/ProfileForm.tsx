'use client'

import { useState } from 'react'
import type { LicenseLevel, AgeGroup } from '@/types/domain'

const LICENSE_LEVELS: LicenseLevel[] = ['S級', '1級', '2級', '3級', '4級']
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
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      {/* S6853: htmlFor + id で label とコントロールを紐付け */}
      <div>
        <label htmlFor="display_name" className="block text-sm font-medium text-gray-700">
          表示名 <span className="text-red-500">*</span>
        </label>
        <input
          id="display_name"
          type="text"
          value={formData.display_name}
          onChange={(e) => setFormData((p) => ({ ...p, display_name: e.target.value }))}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="例: 田中太郎"
          required
        />
      </div>

      <div>
        <label htmlFor="real_name" className="block text-sm font-medium text-gray-700">実名（任意）</label>
        <input
          id="real_name"
          type="text"
          value={formData.real_name}
          onChange={(e) => setFormData((p) => ({ ...p, real_name: e.target.value }))}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="アサイン確定後のみ相手に開示されます"
        />
      </div>

      <div>
        <label htmlFor="license_level" className="block text-sm font-medium text-gray-700">
          審判ライセンス <span className="text-red-500">*</span>
        </label>
        <select
          id="license_level"
          value={formData.license_level}
          onChange={(e) => setFormData((p) => ({ ...p, license_level: e.target.value }))}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
        <legend className="block text-sm font-medium text-gray-700 mb-2">
          担当役割 <span className="text-red-500">*</span>
        </legend>
        <div className="flex gap-3 flex-wrap">
          {ROLE_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              aria-pressed={formData.role_type.includes(value)}
              onClick={() => setFormData((p) => ({ ...p, role_type: toggleArrayValue(p.role_type, value) }))}
              className={`rounded-full px-4 py-2 text-sm font-medium border transition-colors ${
                formData.role_type.includes(value)
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="block text-sm font-medium text-gray-700 mb-2">
          対応年代 <span className="text-red-500">*</span>
        </legend>
        <div className="flex gap-3 flex-wrap">
          {AGE_GROUPS.map((group) => (
            <button
              key={group}
              type="button"
              aria-pressed={formData.age_groups.includes(group)}
              onClick={() => setFormData((p) => ({ ...p, age_groups: toggleArrayValue(p.age_groups, group) }))}
              className={`rounded-full px-4 py-2 text-sm font-medium border transition-colors ${
                formData.age_groups.includes(group)
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
              }`}
            >
              {group}
            </button>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="region" className="block text-sm font-medium text-gray-700">
          活動地域 <span className="text-red-500">*</span>
        </label>
        <input
          id="region"
          type="text"
          value={formData.region}
          onChange={(e) => setFormData((p) => ({ ...p, region: e.target.value }))}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="例: 愛知西部"
          required
        />
      </div>

      <div>
        <label htmlFor="travel_range_km" className="block text-sm font-medium text-gray-700">移動可能範囲（km）</label>
        <input
          id="travel_range_km"
          type="number"
          min={0}
          value={formData.travel_range_km ?? ''}
          onChange={(e) =>
            setFormData((p) => ({ ...p, travel_range_km: e.target.value ? Number(e.target.value) : null }))
          }
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
