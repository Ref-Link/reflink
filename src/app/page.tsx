'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function RootPage() {
  useEffect(() => {
    // Supabase がサイトルートにフォールバックしてトークンをハッシュで返すケースを処理
    const hash = window.location.hash
    if (hash.includes('access_token=')) {
      window.location.replace(`/auth/callback?next=%2Fprofile${hash}`)
      return
    }

    // 認証状態を確認して適切なページへリダイレクト
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        window.location.replace('/login')
      } else {
        window.location.replace('/profile')
      }
    })
  }, [])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <p className="text-sm text-gray-500">読み込み中...</p>
    </div>
  )
}
