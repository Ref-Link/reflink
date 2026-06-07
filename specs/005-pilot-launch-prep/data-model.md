# Data Model: Pilot Launch Preparation

**Feature**: 005-pilot-launch-prep | **Date**: 2026-06-06

## Database Changes

**なし** — このフィーチャーはブランディング設定・静的法的文書ページ・UI リンク追加のみ。DB スキーマ変更・マイグレーション・新テーブルは不要。

---

## 設定ファイル / 静的アセット

### AppBranding 設定

アプリのブランディング情報は `layout.tsx` の `metadata` export と `public/manifest.json` に集約される。

| 項目 | 定義箇所 | 値（Pilot） |
|------|---------|-----------|
| アプリ名 | `metadata.title` / `manifest.json` の `name` | `"RefLink"` |
| ショートネーム | `manifest.json` の `short_name` | `"RefLink"` |
| 説明 | `metadata.description` / `manifest.json` の `description` | `"地域サッカー審判マッチングプラットフォーム"` |
| ファビコン | `src/app/favicon.ico` | 差し替え推奨（Pilot では既存使用可） |
| ブラウザアイコン | `public/icon-32.png`, `public/icon-192.png` | プレースホルダー |
| Apple Touch Icon | `public/icon-192.png` | プレースホルダー（192×192px） |
| PWA 起動アイコン | `public/icon-192.png`, `public/icon-512.png` | プレースホルダー |
| OGP 画像 | `public/og-image.png` | プレースホルダー（1200×630px） |
| テーマカラー | `manifest.json` の `theme_color` | `"#2563EB"` |
| 背景色 | `manifest.json` の `background_color` | `"#F9FAFB"` |

### LegalDocument 構造

法的文書は静的ページコンポーネント内にセクション配列として埋め込む。将来的な差し替えを考慮した構造:

```ts
type LegalSection = {
  title: string        // セクションタイトル（例: "禁止事項"）
  content: string[]    // 段落または箇条書き行の配列
}

type LegalDocument = {
  title: string        // ページタイトル（例: "利用規約"）
  effectiveDate: string // 施行日（例: "2026年6月"）
  sections: LegalSection[]
}
```

このデータ構造はページコンポーネント内に直接定義し、DB には保管しない。

---

## 新規ファイル一覧

| ファイル | 種別 | 内容 |
|---------|------|------|
| `public/manifest.json` | 設定 | PWA マニフェスト（名前・アイコン・表示モード） |
| `public/icon-32.png` | 画像 | ブラウザアイコン 32×32px（プレースホルダー） |
| `public/icon-192.png` | 画像 | PWA アイコン 192×192px（プレースホルダー） |
| `public/icon-512.png` | 画像 | PWA アイコン 512×512px（プレースホルダー） |
| `public/og-image.png` | 画像 | OGP 画像 1200×630px（プレースホルダー） |
| `src/app/terms/page.tsx` | ページ | 利用規約（静的コンテンツ） |
| `src/app/privacy/page.tsx` | ページ | プライバシーポリシー（静的コンテンツ） |

---

## 変更ファイル一覧

| ファイル | 変更内容 |
|---------|---------|
| `src/app/layout.tsx` | metadata 更新: title・description・OGP・icons・manifest |
| `src/middleware.ts` | publicPaths に `/terms`・`/privacy` を追加 |
| `src/app/(referee)/layout.tsx` | フッター追加: 利用規約・PP リンク |
| `src/app/admin/layout.tsx` | フッター追加: 利用規約・PP リンク |
| `src/app/(auth)/login/page.tsx` | 免責テキストをリンク付きに更新 |

---

## コンポーネントパターン

### 法的ページレイアウト

```tsx
// src/app/terms/page.tsx（privacy も同様）
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
```

### フッターコンポーネント

```tsx
// (referee)/layout.tsx および admin/layout.tsx に追加
<footer className="border-t border-gray-200 dark:border-gray-700 py-4 pb-24 text-center">
  <div className="flex items-center justify-center gap-4">
    <Link href="/terms"
      className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
      利用規約
    </Link>
    <Link href="/privacy"
      className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
      プライバシーポリシー
    </Link>
  </div>
</footer>
```

注: referee layout では固定ボトムナビ（高さ約 80px）を考慮して `pb-24`。admin layout では `pb-4`。

### ログインページリンク更新

```tsx
// 変更前
<p className="mt-6 text-center text-xs text-gray-400">
  ログインすることで利用規約に同意したとみなされます
</p>

// 変更後
<p className="mt-6 text-center text-xs text-gray-400 dark:text-gray-500">
  ログインすることで
  <Link href="/terms" className="underline hover:text-gray-600 dark:hover:text-gray-300">利用規約</Link>
  および
  <Link href="/privacy" className="underline hover:text-gray-600 dark:hover:text-gray-300">プライバシーポリシー</Link>
  に同意したとみなされます
</p>
```
