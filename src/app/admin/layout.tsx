import Link from 'next/link'
import type { ReactNode } from 'react'

const NAV_ITEMS = [
  { href: '/admin/matches', label: '試合管理' },
  { href: '/admin/members', label: 'メンバー管理' },
] as const

export default function AdminLayout({ children }: { readonly children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="sticky top-0 z-10 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="mx-auto max-w-2xl px-4">
          <div className="flex h-14 items-center justify-between">
            <span className="text-base font-bold text-gray-900 dark:text-gray-100">RefLink 管理</span>
          </div>
          <nav aria-label="管理ナビゲーション" className="-mb-px flex gap-6">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="border-b-2 border-transparent py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <div className="px-4">{children}</div>
      <footer className="border-t border-gray-200 dark:border-gray-700 py-4 pb-4 text-center">
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/terms"
            className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
          >
            利用規約
          </Link>
          <Link
            href="/privacy"
            className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
          >
            プライバシーポリシー
          </Link>
        </div>
      </footer>
    </div>
  )
}
