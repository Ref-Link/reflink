# Contracts: Public Pages & App Branding

**Feature**: 005-pilot-launch-prep | **Date**: 2026-06-06

このプロジェクトが公開するインターフェース契約。認証不要でアクセスできる URL と、PWA・OGP のメタデータ仕様を定義する。

---

## 1. 法的ページ URL 契約

### GET `/terms` — 利用規約

| 項目 | 値 |
|------|---|
| 認証 | 不要（公開） |
| HTTP メソッド | GET |
| レスポンス形式 | HTML（Next.js SSG） |
| キャッシュ | 静的生成（ビルド時） |
| ステータス | 200 OK |

**必須コンテンツ（FR-006）**:
- サービスの目的
- 利用資格（審判・運営者）
- 禁止事項
- 免責事項
- 規約変更について
- 問い合わせ先

**アクセスパス**:
- ログインページのリンクテキスト「利用規約」
- アプリフッター「利用規約」リンク
- 直接 URL アクセス

---

### GET `/privacy` — プライバシーポリシー

| 項目 | 値 |
|------|---|
| 認証 | 不要（公開） |
| HTTP メソッド | GET |
| レスポンス形式 | HTML（Next.js SSG） |
| キャッシュ | 静的生成（ビルド時） |
| ステータス | 200 OK |

**必須コンテンツ（FR-007）**:
- 収集する個人情報の種類（氏名・資格情報・LINE アカウント・空き日程）
- 利用目的
- 第三者提供（LINE 連携含む）
- データ保管・管理
- ユーザーの権利（削除・訂正）
- 問い合わせ先

**アクセスパス**:
- ログインページのリンクテキスト「プライバシーポリシー」
- アプリフッター「プライバシーポリシー」リンク
- 直接 URL アクセス

---

## 2. PWA マニフェスト契約

### GET `/manifest.json`

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
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

**参照されるアイコン**:

| ファイル | サイズ | 用途 |
|---------|------|------|
| `/icon-192.png` | 192×192px | ホーム画面アイコン・標準 |
| `/icon-512.png` | 512×512px | スプラッシュスクリーン・高解像度 |

---

## 3. OGP メタデータ契約

`layout.tsx` の `metadata.openGraph` が出力するメタタグ仕様:

| メタタグ | 値 |
|---------|---|
| `og:title` | `RefLink` |
| `og:description` | `地域サッカー審判マッチングプラットフォーム` |
| `og:type` | `website` |
| `og:locale` | `ja_JP` |
| `og:site_name` | `RefLink` |
| `og:image` | `/og-image.png` |
| `og:image:width` | `1200` |
| `og:image:height` | `630` |
| `og:image:alt` | `RefLink` |

**OGP 画像仕様**:

| 項目 | 値 |
|------|---|
| ファイル | `public/og-image.png` |
| サイズ | 1200×630px（標準 OGP 比率） |
| 形式 | PNG |
| Pilot 状態 | プレースホルダー（背景 `#2563EB`、テキスト白） |

---

## 4. アイコン / ファビコン契約

| URL | サイズ | 用途 | `<link rel>` |
|-----|------|------|-------------|
| `/favicon.ico` | 16×16, 32×32 | ブラウザタブアイコン | `icon` (Next.js 自動) |
| `/icon-32.png` | 32×32 | ブラウザアイコン | `icon` |
| `/icon-192.png` | 192×192 | Apple Touch Icon / PWA | `apple-touch-icon` |

---

## 5. ミドルウェア認証パス契約

`/terms` および `/privacy` は認証なしでアクセス可能。

| パス | 認証 | 理由 |
|-----|------|------|
| `/terms` | 不要 | 登録前確認のために公開必須 |
| `/privacy` | 不要 | 個人情報保護法対応 |
| `/login` | 不要 | 既存 |
| `/api/auth/*` | 不要 | 既存 |
| その他すべて | 必要 | 既存のまま |
