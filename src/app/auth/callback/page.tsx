'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AuthCallbackPage() {
  useEffect(() => {
    const supabase = createClient()

    async function handleImplicitFlow() {
      const hashParams = new URLSearchParams(window.location.hash.slice(1))
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')
      const searchParams = new URLSearchParams(window.location.search)
      const next = searchParams.get('next') ?? '/'

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })
        if (error) {
          window.location.href = `/login?error=${encodeURIComponent(error.message)}`
          return
        }
      }

      window.location.href = `/api/auth/callback?next=${encodeURIComponent(next)}`
    }

    handleImplicitFlow()
  }, [])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <p className="text-sm text-gray-500">認証中...</p>
    </div>
  )
}
