'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { AssignmentTabs, type AssignmentTab } from '@/components/assignments/AssignmentTabs'
import { PendingList, type PendingAssignmentItem } from '@/components/assignments/PendingList'
import { AssignmentHistory, type AssignmentHistoryItem } from '@/components/history/AssignmentHistory'

interface AssignmentsViewProps {
  readonly tabParam: string | null
}

export function AssignmentsView({ tabParam }: AssignmentsViewProps) {
  const router = useRouter()
  const pathname = usePathname()

  const [pending, setPending] = useState<PendingAssignmentItem[]>([])
  const [history, setHistory] = useState<AssignmentHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<AssignmentTab>(
    (tabParam as AssignmentTab) ?? 'recruiting'
  )

  useEffect(() => {
    async function load() {
      const [pRes, hRes] = await Promise.all([
        fetch('/api/assignments/pending'),
        fetch('/api/assignments'),
      ])
      const [pData, hData]: [PendingAssignmentItem[], AssignmentHistoryItem[]] = await Promise.all([
        pRes.ok ? pRes.json() : [],
        hRes.ok ? hRes.json() : [],
      ])
      setPending(pData)
      setHistory(hData)
      if (!tabParam) {
        setActiveTab(pData.length > 0 ? 'recruiting' : 'history')
      }
      setLoading(false)
    }
    load()
  }, [tabParam])

  useEffect(() => {
    if (tabParam) setActiveTab(tabParam as AssignmentTab)
  }, [tabParam])

  function handleTabChange(tab: AssignmentTab) {
    setActiveTab(tab)
    router.push(`${pathname}?tab=${tab}`)
  }

  function handleResponded(id: string) {
    setPending((prev) => prev.filter((item) => item.id !== id))
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">担当</h1>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">読み込み中...</p>
      ) : (
        <>
          <AssignmentTabs activeTab={activeTab} onTabChange={handleTabChange} />
          <div className="mt-4">
            {activeTab === 'recruiting' && (
              <PendingList items={pending} onResponded={handleResponded} />
            )}
            {activeTab === 'history' && (
              <AssignmentHistory items={history} />
            )}
          </div>
        </>
      )}
    </main>
  )
}
