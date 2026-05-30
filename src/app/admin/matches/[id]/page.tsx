'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { CandidateList } from '@/components/matches/CandidateList'
import type { MatchRow } from '@/types/database'
import type { Candidate, MatchStatus } from '@/types/domain'

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

export default function MatchDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [match, setMatch] = useState<MatchRow | null>(null)
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [matchLoading, setMatchLoading] = useState(true)
  const [candidatesLoading, setCandidatesLoading] = useState(true)

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
        <Link
          href="/admin/matches"
          className="mb-4 inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          ← 試合一覧に戻る
        </Link>

        <div className="mt-3 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-lg font-bold text-gray-900">{match.title}</h1>
            <span
              className={`inline-flex flex-shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[match.status as MatchStatus]}`}
            >
              {STATUS_LABELS[match.status as MatchStatus]}
            </span>
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <div>
              <dt className="text-xs font-medium text-gray-400">試合日</dt>
              <dd className="mt-0.5 text-gray-900">{formatMatchDate(match.match_date)}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-400">開始時間</dt>
              <dd className="mt-0.5 text-gray-900">{match.start_time.slice(0, 5)}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-400">会場</dt>
              <dd className="mt-0.5 text-gray-900">{match.venue}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-400">対象年代</dt>
              <dd className="mt-0.5 text-gray-900">{match.age_group}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-400">必要人数</dt>
              <dd className="mt-0.5 text-gray-900">
                主審 {match.referees_needed}名 ／ 副審 {match.assistants_needed}名
              </dd>
            </div>
            {match.compensation != null && (
              <div>
                <dt className="text-xs font-medium text-gray-400">報酬</dt>
                <dd className="mt-0.5 text-gray-900">{match.compensation.toLocaleString()}円</dd>
              </div>
            )}
          </dl>

          {match.notes && (
            <div className="mt-4 rounded-md bg-gray-50 p-3">
              <dt className="text-xs font-medium text-gray-400">備考</dt>
              <dd className="mt-1 whitespace-pre-wrap text-sm text-gray-700">{match.notes}</dd>
            </div>
          )}
        </div>
      </div>

      <section>
        <h2 className="mb-4 text-base font-semibold text-gray-900">
          審判候補一覧
        </h2>
        <CandidateList candidates={candidates} isLoading={candidatesLoading} />
      </section>
    </main>
  )
}
