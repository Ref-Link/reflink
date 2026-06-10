'use client'

export type AssignmentTab = 'recruiting' | 'history'

const TABS: { id: AssignmentTab; label: string }[] = [
  { id: 'recruiting', label: '募集' },
  { id: 'history', label: '履歴' },
]

interface AssignmentTabsProps {
  readonly activeTab: AssignmentTab
  readonly onTabChange: (tab: AssignmentTab) => void
}

export function AssignmentTabs({ activeTab, onTabChange }: AssignmentTabsProps) {
  return (
    <div className="flex border-b border-gray-200 dark:border-gray-700">
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 border-b-2 py-2 text-sm font-medium transition-colors ${
              isActive
                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
