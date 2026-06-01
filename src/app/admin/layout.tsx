import Link from 'next/link'
import type { ReactNode } from 'react'

const NAV_ITEMS = [
  { href: '/admin/matches', label: '試合管理' },
  { href: '/admin/members', label: 'メンバー管理' },
] as const

export default function AdminLayout({ children }: { readonly children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-2xl px-4">
          <div className="flex h-14 items-center justify-between">
            <span className="text-base font-bold text-gray-900">RefLink 管理</span>
          </div>
          <nav aria-label="管理ナビゲーション" className="-mb-px flex gap-6">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="border-b-2 border-transparent py-2 text-sm font-medium text-gray-500 hover:border-blue-500 hover:text-blue-600"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <div>{children}</div>
    </div>
  )
}
