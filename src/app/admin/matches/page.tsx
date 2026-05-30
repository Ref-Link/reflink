'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { MatchForm, type MatchFormData } from '@/components/matches/MatchForm'
import type { MatchRow } from '@/types/database'
import type { MatchStatus } from '@/types/domain'

const STATUS_LABELS: Record<MatchStatus, string> = {
  open: '募集中',
  filled: '確定済',
  cancelled: 'キャンセル',
}

const STATUS_COLORS: Record<MatchStatus, string> = {
  open: 'bg-green-100 text-green-800',
  filled: 'bg-blue-100 text-blue-800',
  cancelled: 'bg-gray-100 text-gray-500',
}

function formatMatchDate(dateStr: string): string {
  const d = new Date(dateStr)
  const days = ['日', '月', '火', '水', '木', '金', '土']
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${days[d.getDay()]}）`
}

export default function AdminMatchesPage() {
  const [matches, setMatches] = useState<MatchRow[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [created, setCreated] = useState(false)

  useEffect(() => {
    fetchMatches()
  }, [])

  async function fetchMatches() {
    setLoading(true)
    const res = await fetch('/api/matches')
    if (res.ok) {
      setMatches(await res.json())
    }
    setLoading(false)
  }

  async function handleCreate(data: MatchFormData) {
    const res = await fetch('/api/matches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      const json = await res.json()
      throw new Error(json.error ?? '試合の作成に失敗しました')
    }

    await fetchMatches()
    setShowForm(false)
    setCreated(true)
    setTimeout(() => setCreated(false), 3000)
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">試合管理</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {showForm ? 'キャンセル' : '+ 試合を作成'}
        </button>
      </div>

      {created && (
        <div className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-700">
          試合を作成しました
        </div>
      )}

      {showForm && (
        <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-gray-900">新規試合作成</h2>
          <MatchForm onSubmit={handleCreate} submitLabel="試合を作成" />
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12 text-sm text-gray-500">
          読み込み中...
        </div>
      ) : matches.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 py-12 text-center">
          <p className="text-sm font-medium text-gray-500">試合がまだ登録されていません</p>
          <p className="mt-1 text-xs text-gray-400">「+ 試合を作成」から最初の試合を登録してください</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {matches.map((match) => (
            <li key={match.id}>
              <Link
                href={`/admin/matches/${match.id}`}
                className="block rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-gray-900">{match.title}</span>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[match.status as MatchStatus]}`}
                      >
                        {STATUS_LABELS[match.status as MatchStatus]}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      {formatMatchDate(match.match_date)} {match.start_time.slice(0, 5)}〜
                    </div>
                    <div className="mt-0.5 text-xs text-gray-500">
                      {match.venue} ／ {match.age_group}
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right text-xs text-gray-400">
                    <div>主審 {match.referees_needed}名</div>
                    <div>副審 {match.assistants_needed}名</div>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
