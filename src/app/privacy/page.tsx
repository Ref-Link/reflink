import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'プライバシーポリシー | RefLink',
}

type LegalSection = {
  title: string
  content: string[]
}

const PRIVACY_SECTIONS: LegalSection[] = [
  {
    title: '収集する個人情報の種類',
    content: [
      '本サービスでは、以下の個人情報を収集します。',
      '・氏名（表示名）・プロフィール画像（LINE または Google アカウントから取得）',
      '・メールアドレス（Google 認証の場合）',
      '・空き日程・担当履歴などのサービス利用データ',
      '・ブラウザ種別・OS 等のアクセスログ（サービス改善目的）',
    ],
  },
  {
    title: '利用目的',
    content: [
      '収集した個人情報は以下の目的にのみ使用します。',
      '・審判員と試合のマッチング処理',
      '・担当履歴・空き日程の管理・表示',
      '・コミュニティ運営者への審判員情報の提供（同コミュニティ内に限る）',
      '・サービスの品質向上・障害対応',
    ],
  },
  {
    title: '第三者提供（LINE連携含む）',
    content: [
      '収集した個人情報は、以下の場合を除き第三者に提供しません。',
      '・本人の同意がある場合',
      '・法令に基づく開示が必要な場合',
      '・LINE ログイン（LINE株式会社）・Google OAuth（Google LLC）を通じた認証処理において、各社のプライバシーポリシーに従い情報が処理されます。',
    ],
  },
  {
    title: 'データ保管・管理',
    content: [
      '個人情報は Supabase（米国）のサーバーに暗号化して保管されます。',
      '不正アクセス・漏洩を防止するため、適切なアクセス制御を実施しています。',
      'サービス終了時または本人からの削除要請に応じ、個人情報を削除します。',
    ],
  },
  {
    title: 'ユーザーの権利（削除・訂正）',
    content: [
      'ユーザーは自身の個人情報について、以下の権利を有します。',
      '・情報の開示・訂正・削除の要請',
      '・サービス上のプロフィール情報は、設定画面から自身で更新できます。',
      '・アカウント削除またはデータ削除のご要望は、コミュニティ運営者または管理者へお申し付けください。対応いたします。',
    ],
  },
  {
    title: '問い合わせ先',
    content: [
      'プライバシーポリシーに関するご質問・ご要望は、コミュニティ運営者または本サービスの管理者までご連絡ください。',
    ],
  },
]

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          プライバシーポリシー
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
          施行日: 2026年6月
        </p>
        {PRIVACY_SECTIONS.map((section) => (
          <section key={section.title} className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
              {section.title}
            </h2>
            {section.content.map((para, i) => (
              <p key={i} className="text-sm text-gray-700 dark:text-gray-300 leading-7 mb-2">
                {para}
              </p>
            ))}
          </section>
        ))}
      </div>
    </div>
  )
}
