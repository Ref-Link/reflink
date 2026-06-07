import Link from 'next/link'

interface HomeScreenProps {
  displayName: string
  isAdmin: boolean
  isReferee: boolean
}

export default function HomeScreen({ displayName, isAdmin, isReferee }: HomeScreenProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="sticky top-0 z-10 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="mx-auto flex h-14 max-w-lg items-center px-4">
          <span className="text-base font-bold text-gray-900 dark:text-gray-100">RefLink</span>
        </div>
      </header>
      <main className="mx-auto max-w-lg px-4 py-8">
        <p className="text-sm text-gray-500 dark:text-gray-400">こんにちは、{displayName}さん</p>
        <h1 className="mt-1 text-xl font-bold text-gray-900 dark:text-gray-100">何をしますか？</h1>
        <div className="mt-6 flex flex-col gap-4">
          {isAdmin && (
            <Link
              href="/admin/matches"
              className="min-h-[80px] w-full p-4 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex items-center gap-4 hover:shadow-md transition-shadow"
            >
              <div aria-hidden="true" className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">試合・メンバーを管理する</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">試合の登録・審判の割当・メンバー承認</p>
              </div>
              <svg className="h-5 w-5 text-gray-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          )}
          {isReferee && (
            <Link
              href="/profile"
              className="min-h-[80px] w-full p-4 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex items-center gap-4 hover:shadow-md transition-shadow"
            >
              <div aria-hidden="true" className="flex-shrink-0 h-10 w-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <svg className="h-5 w-5 text-green-600 dark:text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">審判として参加する</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">プロフィール・空き日程・担当履歴</p>
              </div>
              <svg className="h-5 w-5 text-gray-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          )}
          {!isAdmin && !isReferee && (
            <Link
              href="/join"
              className="min-h-[80px] w-full p-4 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex items-center gap-4 hover:shadow-md transition-shadow"
            >
              <div aria-hidden="true" className="flex-shrink-0 h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                <svg className="h-5 w-5 text-purple-600 dark:text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">コミュニティに参加する</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">審判として活動するにはコミュニティへの参加が必要です</p>
              </div>
              <svg className="h-5 w-5 text-gray-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          )}
        </div>
      </main>
    </div>
  )
}
