# RefLink

地域サッカーの審判と運営者をつなぐ、信頼ベースのマッチングプラットフォーム。

## 技術スタック

- **Framework**: Next.js 14 (App Router)
- **Database / Auth / Realtime**: Supabase (PostgreSQL + RLS)
- **Notification**: LINE Messaging API
- **Styling**: Tailwind CSS
- **Runtime**: Node.js 20, TypeScript 5.x

## ローカル開発

### 前提条件

- Node.js 20+
- pnpm 9+
- Supabase CLI (`npm i -g supabase`)

### セットアップ

```bash
# 依存関係インストール
pnpm install

# Supabase ローカル起動
supabase start

# 環境変数を設定
cp .env.local.example .env.local
# .env.local を編集して各値を設定する

# マイグレーション適用（初回）
supabase db push

# 開発サーバー起動
pnpm dev
# → http://localhost:3000
```

### 主要コマンド

```bash
pnpm dev          # 開発サーバー
pnpm build        # プロダクションビルド
pnpm lint         # Lint チェック
supabase db diff  # マイグレーション差分確認
supabase db push  # マイグレーション適用
```

## Vercel デプロイ

### 手順

1. **Supabase** でプロジェクトを作成し、マイグレーションを適用
2. **LINE Developers** で Messaging API + LINE Login チャネルを設定
3. **Vercel** で GitHub リポジトリを連携してデプロイ
4. Vercel の環境変数に以下を設定
5. LINE Webhook URL を `https://<your-domain>/api/webhook/line` に更新

### 必須環境変数

| 変数名 | 説明 | 取得元 |
|--------|------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase プロジェクト URL | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 公開 anon キー | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase サービスロールキー（サーバーサイドのみ） | Supabase Dashboard → Settings → API |
| `LINE_CHANNEL_SECRET` | LINE Messaging API チャネルシークレット | LINE Developers → Messaging API チャネル |
| `LINE_CHANNEL_ACCESS_TOKEN` | LINE Messaging API アクセストークン | LINE Developers → Messaging API チャネル |
| `LINE_LOGIN_CHANNEL_ID` | LINE Login チャネル ID | LINE Developers → LINE Login チャネル |
| `LINE_LOGIN_CHANNEL_SECRET` | LINE Login チャネルシークレット | LINE Developers → LINE Login チャネル |

> **注意**: `SUPABASE_SERVICE_ROLE_KEY` は Vercel の "Environment Variables" で `Preview` と `Production` のみに設定し、クライアントには絶対に公開しないこと。

### Vercel リージョン設定

`vercel.json` で `hnd1`（東京）リージョンを指定済み。LINE API のレイテンシ最小化のため変更不要。

### LINE Webhook の設定

LINE Developers コンソール → Messaging API チャネル → Webhook URL:

```
https://<your-vercel-domain>/api/webhook/line
```

Webhook の「検証」ボタンで疎通確認後、「Webhookの利用」を ON にする。

### LINE Login コールバック URL

LINE Developers コンソール → LINE Login チャネル → コールバック URL:

```
https://<your-vercel-domain>/api/auth/callback
```
