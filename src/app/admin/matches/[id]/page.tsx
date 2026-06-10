'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { CandidateList } from '@/components/matches/CandidateList'
import type { MatchRow } from '@/types/database'
import type { Candidate, MatchStatus, AgeGroup } from '@/types/domain'
import { AGE_GROUP_LABELS } from '@/types/domain'

const STATUS_LABELS: Record<MatchStatus, string> = {
  open: '募集中',
  filled: '確定済',
  cancelled: 'キャンセル',
}

const STATUS_COLORS: Record<MatchStatus, string> = {
  open: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  filled: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  cancelled: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
}

function formatMatchDate(dateStr: string): string {
  const d = new Date(dateStr)
  const days = ['日', '月', '火', '水', '木', '金', '土']
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${days[d.getDay()]}）`
}

type MatchWithCounts = MatchRow & { confirmed_referees: number; confirmed_assistants: number }

export default function MatchDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [match, setMatch] = useState<MatchWithCounts | null>(null)
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [matchLoading, setMatchLoading] = useState(true)
  const [candidatesLoading, setCandidatesLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [notifying, setNotifying] = useState(false)
  const [notifyMessage, setNotifyMessage] = useState<string | null>(null)

  const fetchMatch = useCallback(async () => {
    const res = await fetch(`/api/matches/${params.id}`)
    if (res.status === 404) {
      router.push('/admin/matches')
      return
    }
    if (res.ok) {
      setMatch(await res.json())
    }
    setMatchLoading(false)
  }, [params.id, router])

  const fetchCandidates = useCallback(async () => {
    setCandidatesLoading(true)
    const res = await fetch(`/api/matches/${params.id}/candidates`)
    if (res.ok) {
      setCandidates(await res.json())
    }
    setCandidatesLoading(false)
  }, [params.id])

  useEffect(() => {
    fetchMatch()
    fetchCandidates()
  }, [fetchMatch, fetchCandidates])

  function handleToggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  async function handleNotify() {
    if (selectedIds.size === 0) return
    setNotifying(true)
    setNotifyMessage(null)

    const candidatePayload = Array.from(selectedIds).map((userId) => {
      const candidate = candidates.find((c) => c.id === userId)
      const role =
        candidate?.role_type.includes('referee') ? 'referee' : 'assistant_referee'
      return { userId, role }
    })

    const res = await fetch(`/api/matches/${params.id}/assignments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ candidates: candidatePayload }),
    })

    setNotifying(false)
    if (res.ok) {
      const json = await res.json()
      const sent = (json.assignments as unknown[]).length
      setNotifyMessage(`${sent}名に通知を送りました`)
      setSelectedIds(new Set())
    } else {
      const json = await res.json()
      setNotifyMessage(json.error ?? '通知の送信に失敗しました')
    }
  }

  if (matchLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-gray-500">読み込み中...</p>
      </div>
    )
  }

  if (!match) {
    return null
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <Link
            href="/admin/matches"
            className="inline-flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            ← 試合一覧に戻る
          </Link>
          <Link
            href={`/admin/matches/${params.id}/assignments`}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
          >
            アサイン状況 →
          </Link>
        </div>

        <div className="mt-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">{match.title}</h1>
            <span
              className={`inline-flex flex-shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[match.status as MatchStatus]}`}
            >
              {STATUS_LABELS[match.status as MatchStatus]}
            </span>
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <div>
              <dt className="text-xs font-medium text-gray-400 dark:text-gray-500">試合日</dt>
              <dd className="mt-0.5 text-gray-900 dark:text-gray-100">{formatMatchDate(match.match_date)}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-400 dark:text-gray-500">開始時間</dt>
              <dd className="mt-0.5 text-gray-900 dark:text-gray-100">{match.start_time.slice(0, 5)}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-400 dark:text-gray-500">会場</dt>
              <dd className="mt-0.5 text-gray-900 dark:text-gray-100">{match.venue}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-400 dark:text-gray-500">対象年代</dt>
              <dd className="mt-0.5 text-gray-900 dark:text-gray-100">{AGE_GROUP_LABELS[match.age_group as AgeGroup] ?? match.age_group}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-400 dark:text-gray-500">必要人数</dt>
              <dd className="mt-0.5 text-gray-900 dark:text-gray-100">
                {[
                  match.referees_needed > 0 && `主審 ${match.confirmed_referees}/${match.referees_needed}名`,
                  match.assistants_needed > 0 && `副審 ${match.confirmed_assistants}/${match.assistants_needed}名`,
                ].filter(Boolean).join(' ／ ')}
              </dd>
            </div>
            {match.compensation != null && (
              <div>
                <dt className="text-xs font-medium text-gray-400 dark:text-gray-500">報酬</dt>
                <dd className="mt-0.5 text-gray-900 dark:text-gray-100">{match.compensation.toLocaleString()}円</dd>
              </div>
            )}
          </dl>

          {match.notes && (
            <div className="mt-4 rounded-md bg-gray-50 dark:bg-gray-800 p-3">
              <dt className="text-xs font-medium text-gray-400 dark:text-gray-500">備考</dt>
              <dd className="mt-1 whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">{match.notes}</dd>
            </div>
          )}
        </div>
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">審判候補一覧</h2>
          {selectedIds.size > 0 && (
            <button
              onClick={handleNotify}
              disabled={notifying}
              className="min-h-[44px] rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {notifying ? '送信中...' : `${selectedIds.size}名に通知を送る`}
            </button>
          )}
        </div>

        {notifyMessage && (
          <div className="mb-4 rounded-md bg-green-50 dark:bg-green-950 p-3 text-sm text-green-700 dark:text-green-300">
            {notifyMessage}
          </div>
        )}

        <CandidateList
          candidates={candidates}
          isLoading={candidatesLoading}
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
        />
      </section>
    </main>
  )
}
