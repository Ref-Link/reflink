# Quickstart: RefLink MVP 開発環境

**Branch**: `001-mvp-implementation` | **Date**: 2026-05-29

---

## 前提条件

- Node.js 20+
- pnpm 9+
- Supabase CLI (`npm i -g supabase`)
- LINE Developers アカウント（Messaging API チャネル作成済み）

---

## 初期セットアップ

### 1. リポジトリと依存関係

```bash
git clone <repo> && cd reflink
pnpm install
```

### 2. Supabase ローカル環境起動

```bash
supabase start
# → API URL, anon key, service_role key が表示される
```

### 3. 環境変数

`.env.local` を作成:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<local anon key>
SUPABASE_SERVICE_ROLE_KEY=<local service role key>

# LINE Messaging API
LINE_CHANNEL_SECRET=<your channel secret>
LINE_CHANNEL_ACCESS_TOKEN=<your channel access token>

# LINE Login (OAuth)
LINE_LOGIN_CHANNEL_ID=<your line login channel id>
LINE_LOGIN_CHANNEL_SECRET=<your line login channel secret>
```

### 4. マイグレーション適用

```bash
supabase db push
```

### 5. 開発サーバー起動

```bash
pnpm dev
# → http://localhost:3000
```

---

## LINE Webhook ローカルテスト

LINE Platform からローカル開発環境への Webhook 受信には ngrok を使用:

```bash
ngrok http 3000
# → https://xxxx.ngrok.io が表示される
```

LINE Developers コンソールの Webhook URL を:
```
https://xxxx.ngrok.io/api/webhook/line
```
に設定する。

---

## プロジェクト構造

```text
reflink/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # ログイン・コールバックページ
│   │   ├── (referee)/          # 審判向けページ
│   │   │   ├── profile/        # プロフィール登録・編集
│   │   │   ├── availability/   # 空き日程管理
│   │   │   └── history/        # 担当履歴
│   │   ├── (admin)/            # 運営者・管理者向けページ
│   │   │   ├── matches/        # 試合管理
│   │   │   ├── candidates/     # 審判候補表示
│   │   │   └── members/        # メンバー管理（管理者のみ）
│   │   └── api/
│   │       ├── auth/
│   │       ├── availability/
│   │       ├── matches/
│   │       ├── assignments/
│   │       ├── communities/
│   │       └── webhook/
│   │           └── line/
│   ├── components/             # 共通UIコンポーネント
│   ├── lib/
│   │   ├── supabase/           # Supabase client (server/client)
│   │   └── line/               # LINE SDK ラッパー
│   └── types/                  # TypeScript 型定義
├── supabase/
│   ├── migrations/             # DB マイグレーションファイル
│   └── seed.sql                # 開発用シードデータ
└── tests/
    ├── unit/
    └── integration/
```

---

## 主要コマンド

```bash
pnpm dev          # 開発サーバー起動
pnpm build        # プロダクションビルド
pnpm test         # テスト実行
pnpm lint         # Lint チェック
supabase db diff  # マイグレーション差分確認
supabase db push  # マイグレーション適用
```

---

## パイロット環境へのデプロイ

1. Supabase: プロジェクト作成 → マイグレーション適用
2. LINE Developers: Messaging API + LINE Login チャネル設定
3. Vercel: GitHub 連携 → 環境変数設定 → デプロイ
4. LINE Webhook URL を Vercel の URL に更新
