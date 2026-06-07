'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ProfileForm, type ProfileFormData } from '@/components/profile/ProfileForm'
import { CommunityMemberships } from '@/components/profile/CommunityMemberships'
import { createClient } from '@/lib/supabase/client'
import type { UserRow } from '@/types/database'

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<UserRow | null>(null)
  const [defaultDisplayName, setDefaultDisplayName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)

  const fetchProfile = useCallback(async () => {
    const res = await fetch('/api/profile')
    if (res.ok) {
      setProfile(await res.json())
    } else {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setDefaultDisplayName(user?.user_metadata?.full_name ?? user?.email ?? '')
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  async function handleSubmit(data: ProfileFormData) {
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      const json = await res.json()
      throw new Error(json.error ?? '保存に失敗しました')
    }

    const updated: UserRow = await res.json()
    setProfile(updated)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)

    // First-time profile creation → go to availability registration
    if (!profile) {
      router.push('/availability')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-sm text-gray-500">読み込み中...</p>
      </div>
    )
  }

  const isNew = !profile

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          {isNew ? 'プロフィール登録' : 'プロフィール編集'}
        </h1>
        {isNew && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            まずプロフィールを登録してください。登録後に空き日程を設定できます。
          </p>
        )}
      </div>

      {saved && (
        <div className="mb-4 rounded-md bg-green-50 dark:bg-green-950 p-3 text-sm text-green-700 dark:text-green-300">
          プロフィールを保存しました
        </div>
      )}

      <ProfileForm
        initialData={
          profile
            ? {
                display_name: profile.display_name,
                real_name: profile.real_name ?? '',
                license_level: profile.license_level,
                role_type: profile.role_type,
                age_groups: profile.age_groups,
                region: profile.region,
                travel_range_km: profile.travel_range_km,
              }
            : { display_name: defaultDisplayName }
        }
        onSubmit={handleSubmit}
        submitLabel={isNew ? '登録して空き日程へ進む' : '保存する'}
      />

      {!isNew && <CommunityMemberships />}
    </main>
  )
}
