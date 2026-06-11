'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ContactInfo } from '@/components/ui/ContactInfo'
import type { AssignmentRow, MatchRow } from '@/types/database'
import type { AssignmentStatus } from '@/types/domain'

const STATUS_LABELS: Record<AssignmentStatus, string> = {
  notified: '通知済',
  accepted: '承諾',
  declined: '辞退',
  confirmed: '確定',
}

const STATUS_COLORS: Record<AssignmentStatus, string> = {
  notified: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  accepted: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  declined: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
}

const ROLE_LABELS: Record<string, string> = {
  referee: '主審',
  assistant_referee: '副審',
}

interface AssignmentWithUser extends AssignmentRow {
  users: { display_name: string }
}

export default function AssignmentsPage() {
  const params = useParams<{ id: string }>()
  const [match, setMatch] = useState<MatchRow | null>(null)
  const [assignments, setAssignments] = useState<AssignmentWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [confirmedMessage, setConfirmedMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Inline phone registration state
  const [showPhoneForm, setShowPhoneForm] = useState(false)
  const [pendingAssignmentId, setPendingAssignmentId] = useState<string | null>(null)
  const [phoneInput, setPhoneInput] = useState('')
  const [phoneSaving, setPhoneSaving] = useState(false)
  const [phoneError, setPhoneError] = useState<string | null>(null)

  // Contact info map: assignmentId → referee phone_number
  const [contactMap, setContactMap] = useState<Record<string, string | null>>({})

  const fetchMatch = useCallback(async () => {
    const res = await fetch(`/api/matches/${params.id}`)
    if (res.ok) setMatch(await res.json())
  }, [params.id])

  const fetchAssignments = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('assignments')
      .select('*, users(display_name)')
      .eq('match_id', params.id)
      .order('created_at', { ascending: true })
    setAssignments((data as unknown as AssignmentWithUser[]) ?? [])
    setLoading(false)
  }, [params.id])

  const fetchContactInfo = useCallback(async () => {
    const res = await fetch(`/api/matches/${params.id}/assignments/contact-info`)
    if (res.ok) {
      setContactMap(await res.json())
    }
  }, [params.id])

  useEffect(() => {
    fetchMatch()
    fetchAssignments()
    fetchContactInfo()

    const supabase = createClient()
    const channel = supabase
      .channel(`assignments:match:${params.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'assignments',
          filter: `match_id=eq.${params.id}`,
        },
        () => {
          fetchAssignments()
          fetchContactInfo()
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchMatch, fetchAssignments, fetchContactInfo, params.id])

  async function handleConfirm(assignmentId: string) {
    setConfirmingId(assignmentId)
    setErrorMessage(null)
    setShowPhoneForm(false)
    const res = await fetch(`/api/matches/${params.id}/assignments/${assignmentId}/confirm`, {
      method: 'PATCH',
    })
    setConfirmingId(null)
    if (res.ok) {
      setConfirmedMessage('アサインを確定しました')
      setTimeout(() => setConfirmedMessage(null), 3000)
      fetchAssignments()
      fetchContactInfo()
    } else {
      const json = await res.json()
      if (json.error === 'ORGANIZER_PHONE_MISSING') {
        setPendingAssignmentId(assignmentId)
        setShowPhoneForm(true)
        setPhoneInput('')
        setPhoneError(null)
      } else if (json.error === 'REFEREE_PHONE_MISSING') {
        setErrorMessage('審判の連絡先が未登録のため確定できません。審判に登録を依頼してください。')
      } else if (json.error === 'SLOT_FULL') {
        setErrorMessage(json.message ?? '確定人数が募集人数に達しています')
      } else {
        setErrorMessage(json.error ?? '確定に失敗しました')
      }
    }
  }

  async function handlePhoneSave() {
    setPhoneSaving(true)
    setPhoneError(null)
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone_number: phoneInput }),
    })
    if (!res.ok) {
      const json = await res.json()
      setPhoneError(json.error ?? '保存に失敗しました')
      setPhoneSaving(false)
      return
    }
    setPhoneSaving(false)
    setShowPhoneForm(false)
    if (pendingAssignmentId) {
      await handleConfirm(pendingAssignmentId)
      setPendingAssignmentId(null)
    }
  }

  const counts: Record<AssignmentStatus, number> = {
    notified: assignments.filter((a) => a.status === 'notified').length,
    accepted: assignments.filter((a) => a.status === 'accepted').length,
    declined: assignments.filter((a) => a.status === 'declined').length,
    confirmed: assignments.filter((a) => a.status === 'confirmed').length,
  }

  const confirmedByRole = {
    referee: assignments.filter((a) => a.role === 'referee' && a.status === 'confirmed').length,
    assistant_referee: assignments.filter((a) => a.role === 'assistant_referee' && a.status === 'confirmed').length,
  }

  function isSlotFull(role: string): boolean {
    if (!match) return false
    if (role === 'referee') return confirmedByRole.referee >= match.referees_needed
    if (role === 'assistant_referee') return confirmedByRole.assistant_referee >= match.assistants_needed
    return false
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6">
        <Link
          href={`/admin/matches/${params.id}`}
          className="inline-flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
        >
          ← 試合詳細に戻る
        </Link>
        <h1 className="mt-3 text-xl font-bold text-gray-900 dark:text-gray-100">
          {match?.title ?? '読み込み中...'}
        </h1>
        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">アサイン状況</p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(['notified', 'accepted', 'declined', 'confirmed'] as AssignmentStatus[]).map((status) => (
          <div
            key={status}
            className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 text-center shadow-sm"
          >
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{counts[status]}</div>
            <span
              className={`mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[status]}`}
            >
              {STATUS_LABELS[status]}
            </span>
          </div>
        ))}
      </div>

      {confirmedMessage && (
        <div className="mb-4 rounded-md bg-green-50 dark:bg-green-950 p-3 text-sm text-green-700 dark:text-green-300">
          {confirmedMessage}
        </div>
      )}
      {errorMessage && (
        <div className="mb-4 rounded-md bg-red-50 dark:bg-red-950 p-3 text-sm text-red-700 dark:text-red-300">
          {errorMessage}
        </div>
      )}

      {showPhoneForm && (
        <div className="mb-4 rounded-md border border-yellow-200 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-950 p-4">
          <p className="mb-2 text-sm font-medium text-yellow-800 dark:text-yellow-300">
            確定するには電話番号の登録が必要です
          </p>
          {phoneError && (
            <p className="mb-2 text-xs text-red-600 dark:text-red-400">{phoneError}</p>
          )}
          <div className="flex gap-2">
            <input
              type="tel"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              placeholder="例: 090-1234-5678"
              className="flex-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              onClick={handlePhoneSave}
              disabled={phoneSaving || !phoneInput.trim()}
              className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
            >
              {phoneSaving ? '保存中...' : '保存して確定'}
            </button>
            <button
              onClick={() => { setShowPhoneForm(false); setPendingAssignmentId(null) }}
              className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12 text-sm text-gray-500 dark:text-gray-400">
          読み込み中...
        </div>
      ) : assignments.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-600 py-12 text-center">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">まだ通知が送信されていません</p>
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
            試合詳細ページから審判候補を選んで通知してください
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {assignments.map((assignment) => (
            <li
              key={assignment.id}
              className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 shadow-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {assignment.users.display_name}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[assignment.status as AssignmentStatus]}`}
                    >
                      {STATUS_LABELS[assignment.status as AssignmentStatus]}
                    </span>
                  </div>
                  <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    {ROLE_LABELS[assignment.role] ?? assignment.role}
                  </div>
                  {assignment.responded_at && (
                    <div className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                      回答: {new Date(assignment.responded_at).toLocaleString('ja-JP')}
                    </div>
                  )}
                  {assignment.status === 'confirmed' && (
                    <div className="mt-1">
                      <ContactInfo phone={contactMap[assignment.id] ?? null} />
                    </div>
                  )}
                </div>
                {assignment.status === 'accepted' && (
                  <button
                    onClick={() => handleConfirm(assignment.id)}
                    disabled={confirmingId === assignment.id || isSlotFull(assignment.role)}
                    className="min-h-[44px] rounded-md bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    {confirmingId === assignment.id ? '処理中...' : '確定'}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
