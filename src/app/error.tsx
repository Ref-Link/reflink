'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui'

interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorPage({ error, reset }: Readonly<ErrorPageProps>) {
  useEffect(() => {
    console.error('Page error:', error)
  }, [error])

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-gray-900">エラーが発生しました</h1>
        <p className="text-sm text-gray-500">
          予期しないエラーが発生しました。再試行するか、しばらく経ってからアクセスしてください。
        </p>
        {error.digest && (
          <p className="text-xs text-gray-400">エラーID: {error.digest}</p>
        )}
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <Button variant="primary" onClick={reset}>
          再試行
        </Button>
        <Button variant="secondary" onClick={() => (globalThis.location.href = '/')}>
          トップへ戻る
        </Button>
      </div>
    </main>
  )
}
