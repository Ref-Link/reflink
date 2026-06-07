'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type CommunityMembership = {
  community_id: string
  community_name: string
  status: 'pending' | 'approved'
}

const STATUS_LABELS: Record<CommunityMembership['status'], string> = {
  pending: '申請中',
  approved: '承認済み',
}

const STATUS_COLORS: Record<CommunityMembership['status'], string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
}

export function CommunityMemberships() {
  const [memberships, setMemberships] = useState<CommunityMembership[] | null>(null)

  useEffect(() => {
    fetch('/api/communities/my-memberships')
      .then((res) => res.json())
      .then((data) => setMemberships(Array.isArray(data) ? data : []))
      .catch(() => setMemberships([]))
  }, [])

  return (
    <section className="mt-8">
      <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">所属コミュニティ</h2>

      {memberships === null ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">読み込み中...</p>
      ) : memberships.length === 0 ? (
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">まだコミュニティに参加していません</p>
          <Link
            href="/join"
            className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 active:bg-blue-800"
          >
            コミュニティを追加
          </Link>
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
          {memberships.map((m) => (
            <div key={m.community_id} className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-gray-900 dark:text-gray-100">{m.community_name}</span>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[m.status]}`}>
                {STATUS_LABELS[m.status]}
              </span>
            </div>
          ))}
          <div className="px-4 py-3">
            <Link
              href="/join"
              className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 active:bg-blue-800"
            >
              コミュニティを追加
            </Link>
          </div>
        </div>
      )}
    </section>
  )
}
