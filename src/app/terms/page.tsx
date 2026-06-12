import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '利用規約 | RefLink',
}

type LegalSection = {
  title: string
  content: string[]
}

const TERMS_SECTIONS: LegalSection[] = [
  {
    title: 'サービスの目的',
    content: [
      'RefLink（以下「本サービス」）は、地域サッカー協会・クラブと審判員をつなぐマッチングプラットフォームです。',
      '本サービスは、審判員の空き日程管理・試合アサイン・担当履歴の記録を通じて、地域サッカーの運営をサポートすることを目的としています。',
    ],
  },
  {
    title: '利用資格',
    content: [
      '本サービスは、招待リンクを受け取った審判員および認定コミュニティ運営者のみが利用できます（Pilotフェーズ）。',
      '本サービスを利用するには、LINE または Google アカウントによる認証が必要です。',
      'サービスの性質上、未成年の方が利用する場合は保護者の同意を得た上でご利用ください。',
    ],
  },
  {
    title: '禁止事項',
    content: [
      '以下の行為を禁止します。',
      '・虚偽の情報を登録・送信する行為',
      '・他のユーザーへの嫌がらせ・誹謗中傷',
      '・本サービスのシステムに過度な負荷をかける行為',
      '・本サービスを通じて取得した個人情報の目的外利用または第三者への提供',
      '・その他、法令または公序良俗に反する行為',
    ],
  },
  {
    title: '免責事項',
    content: [
      '本サービスは現在Pilotフェーズで提供されており、機能・内容は予告なく変更される場合があります。',
      '本サービスの利用に起因するいかなる損害についても、運営者は責任を負いません。ただし、法令により免責が認められない場合はこの限りではありません。',
      '試合アサインの確定・変更はコミュニティ運営者の判断によるものであり、本サービスはその結果について責任を負いません。',
    ],
  },
  {
    title: '規約変更について',
    content: [
      '本規約は、サービスの改善・法令の変更等に伴い、予告なく変更される場合があります。',
      '変更後の規約はサービス上に掲示した時点で有効となります。変更後も本サービスを継続して利用した場合、変更後の規約に同意したものとみなします。',
    ],
  },
  {
    title: '問い合わせ先',
    content: [
      '本規約に関するお問い合わせは、下記メールアドレスまたはコミュニティ運営者までご連絡ください。',
      'メール: reflink.support@gmail.com',
    ],
  },
]

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          利用規約
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
          施行日: 2026年6月
        </p>
        {TERMS_SECTIONS.map((section) => (
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
