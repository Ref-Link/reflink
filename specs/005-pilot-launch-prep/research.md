# Research: Pilot Launch Preparation

**Feature**: 005-pilot-launch-prep | **Date**: 2026-06-06

---

## 1. Next.js 14 App Router アイコン・ファビコン API

**Decision**: `public/` に PNG ファイルを配置し、`layout.tsx` の `metadata.icons` で参照する。`src/app/favicon.ico` は既存のまま維持。

**Rationale**:
- Next.js 14 App Router は `src/app/favicon.ico` を自動的に `/favicon.ico` として配信する（既存対応済み）
- `src/app/icon.png` / `src/app/apple-icon.png` を配置すると Next.js が自動で `<link rel="icon">` / `<link rel="apple-touch-icon">` を生成するが、manifest.json とアイコンパスを共有させるために `public/` に配置して `metadata.icons` で明示的に参照する方式を選択
- PWA manifest.json が参照するアイコンは `public/` から配信される URL パスを使う必要があるため、一箇所に集約した方が管理しやすい

**Implementation**:
```ts
// src/app/layout.tsx
export const metadata: Metadata = {
  icons: {
    icon: [
      { url: '/icon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/icon-192.png', sizes: '192x192', type: 'image/png' }],
  },
  manifest: '/manifest.json',
}
```

**Alternatives considered**:
- `src/app/icon.png` + `src/app/apple-icon.png`: Next.js が自動でメタを生成するが、manifest.json との共有が煩雑になる。rejected。
- Route Handler `app/manifest.ts`: Typed で Next.js 的だが pilot 段階では過剰。`public/manifest.json` で十分。rejected。

---

## 2. PWA manifest.json 構成

**Decision**: `public/manifest.json` を静的ファイルとして配置。`layout.tsx` の `metadata.manifest` で参照。

**Rationale**:
- `public/` 内のファイルはビルド後も `/manifest.json` として配信される
- Next.js Route Handler による動的生成（`app/manifest.ts`）は動的コンテンツが不要な今回は過剰
- manifest.json 内のアイコンパスは `/icon-192.png`、`/icon-512.png`（どちらも `public/` から配信）

**Manifest 構成**:
```json
{
  "name": "RefLink",
  "short_name": "RefLink",
  "description": "地域サッカー審判マッチングプラットフォーム",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#F9FAFB",
  "theme_color": "#2563EB",
  "lang": "ja",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any maskable" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ]
}
```

**Alternatives considered**:
- `app/manifest.ts` (Route Handler): TypeScript で型付けできるが、静的内容に対して過剰。rejected。

---

## 3. OGP メタデータ設定

**Decision**: `layout.tsx` の `metadata.openGraph` に OGP 設定を追加。OGP 画像は `public/og-image.png` に 1200×630px のプレースホルダーを配置。

**Rationale**:
- Next.js 14 の `metadata` API の `openGraph` プロパティで `og:title`, `og:description`, `og:image` 等が自動生成される
- ページ固有の OGP は各ページで `export const metadata` を上書きできる
- OGP 画像は pilot 段階ではデザインアセット未確定のためプレースホルダー（無地 + テキスト）を使用し、後から差し替える

**Implementation**:
```ts
openGraph: {
  title: 'RefLink',
  description: '地域サッカー審判マッチングプラットフォーム',
  type: 'website',
  locale: 'ja_JP',
  siteName: 'RefLink',
  images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'RefLink' }],
},
```

**OGP 画像プレースホルダー戦略**:
- `public/og-image.png` を 1200×630px のシンプルな画像として配置
- 背景: `#2563EB`（ブランドカラー）、テキスト: "RefLink" 白文字
- 正式デザインアセット納品後に差し替え可能

---

## 4. `/terms` と `/privacy` のアクセス制御

**Decision**: `middleware.ts` の `publicPaths` 配列に `/terms` と `/privacy` を追加。

**Rationale**:
- 現在の `publicPaths = ['/login', '/api/auth', '/api/webhook', '/auth']` に追加するだけでよい
- 認証ガードをすり抜けるための最小変更
- 利用規約・プライバシーポリシーはサービス利用前に確認するものなので認証不要が適切（個人情報保護法対応）

**Implementation**:
```ts
const publicPaths = ['/login', '/api/auth', '/api/webhook', '/auth', '/terms', '/privacy']
```

---

## 5. フッターの配置戦略（モバイル固定ナビ共存）

**Decision**: referee layout の `flex-1` div の後（固定ナビの前）にフッター要素を追加。フッターに `pb-24` を設定して固定ナビとの重複を回避。

**Rationale**:
- `(referee)/layout.tsx` のフレックスコンテナ構成:
  ```
  flex flex-col min-h-screen
  ├── header (sticky)
  ├── div.flex-1.pb-20  ← ページコンテンツ
  └── nav (fixed bottom-0)  ← 固定ナビ
  ```
- フッターを `flex-1` div の後に追加すると、ページコンテンツの後に自然に配置される
- `pb-24` でフッター自身が固定ナビに隠れないようにする
- `flex-1` の `pb-20` はフッターを考慮して `pb-0` に戻し、フッターの上端がページコンテンツ直後に来るようにする

**Result layout**:
```
flex flex-col min-h-screen
├── header (sticky)
├── div.flex-1  ← ページコンテンツ
├── footer.pb-24  ← 利用規約・PP リンク（新規）
└── nav (fixed bottom-0)
```

- `admin/layout.tsx` にも同様にフッターを追加するが、固定ナビがないため `pb-4` で十分。

---

## 6. 法的文書コンテンツ方針（Pilot 版）

**Decision**: Pilot 段階向けの簡易版ドラフトを日本語で作成し、コンポーネント内に静的コンテンツとして埋め込む。将来的に更新しやすいよう構造化する。

**Rationale**:
- 文章をデータベースに保管すると管理オーバーヘッドが増える（Constitution III: 最小限のデジタル化）
- コードベースへの埋め込みにより git 履歴で変更追跡が可能
- 運営者（ユーザー）が提供する正式文章に差し替えやすい構造（セクションごとに分離）

**利用規約の必須セクション（FR-006）**:
1. サービスの目的
2. 利用資格
3. 禁止事項
4. 免責事項
5. 規約変更について
6. 問い合わせ先

**プライバシーポリシーの必須セクション（FR-007）**:
1. 収集する個人情報の種類
2. 利用目的
3. 第三者提供（LINE 連携含む）
4. データ保管・管理
5. ユーザーの権利（削除・訂正）
6. 問い合わせ先

**問い合わせ先**: Pilot 期間中は運営者のメールアドレスを使用（メールアドレスはデプロイ時に設定）。

---

## 7. 既存アセット状況

**Decision**: 既存 `public/` ディレクトリが存在しないため新規作成。アイコン・OGP 画像はプレースホルダーとして実装。

| アセット | 現状 | 対応 |
|---------|------|------|
| `src/app/favicon.ico` | 存在（Next.js デフォルト） | 差し替え推奨（Pilot では維持可） |
| `public/` ディレクトリ | 存在しない | 新規作成 |
| `public/manifest.json` | 存在しない | 新規作成 |
| `public/icon-192.png` | 存在しない | プレースホルダー配置 |
| `public/icon-512.png` | 存在しない | プレースホルダー配置 |
| `public/og-image.png` | 存在しない | プレースホルダー配置 |
| `layout.tsx` の metadata | "Create Next App" のまま | 更新必要 |
