# Research: RefLink MVP

**Branch**: `001-mvp-implementation` | **Date**: 2026-05-29  
**Status**: Complete — all NEEDS CLARIFICATION resolved

---

## 1. LINE Messaging API — 通知 & ワンタップ回答

**Decision**: LINE Messaging API (Push Message) + Postback Events

**Rationale**:
- Push Message で任意のタイミングに通知を送信できる（試合通知・確定通知・リマインダー）
- Flex Message の Button コンポーネントで「参加」「辞退」ボタンを構成
- ボタンタップ時は Postback Event として Webhook へ届くため、サーバー側で状態を更新できる
- LINE Bot SDK for Node.js (`@line/bot-sdk`) を使用することで実装を標準化できる

**Alternatives considered**:
- LINE Notify (Push のみ、インタラクションなし) → 回答機能が作れないため却下
- LINE LIFF (ミニアプリ内でボタン) → MVP には過剰、審判のタップ体験をシンプルに保つ必要があるため却下

**Implementation details**:
- Channel Access Token は Supabase Vault (シークレット管理) または環境変数で保持
- Webhook URL: `/api/webhook/line` (POST, LINE 署名検証必須)
- Postback data 形式: `action=accept&assignmentId=<uuid>` または `action=decline&assignmentId=<uuid>`
- LINE User ID と Supabase User ID のマッピングは `users` テーブルの `line_user_id` カラムで管理

---

## 2. 認証設計 — Google / LINE ログイン + コミュニティ承認

**Decision**: Supabase Auth (Google OAuth 組み込み) + LINE Login (カスタム OAuth プロバイダー)

**Rationale**:
- Supabase Auth は Google OAuth をネイティブサポート。設定のみで利用可能
- LINE Login は OAuth 2.0 準拠。Supabase の Custom OAuth Provider 機能で統合可能
- `@supabase/ssr` パッケージで Next.js App Router とのサーバーサイド統合が公式サポートされている
- LINE Login 後に取得できる LINE User ID を `users.line_user_id` に保存し、Messaging API 通知先と紐づける

**Alternatives considered**:
- NextAuth.js での統合 → Supabase との二重管理になるため却下。Supabase Auth 単体で完結させる

**LINE Login と LINE Messaging API の統合**:
- LINE Login で取得した `userId`（LINE User ID）を Profile 保存時に記録
- Messaging API の Push Message はこの `userId` を宛先として使用
- 審判が Messaging API Webhook から回答する際も `userId` でユーザーを特定

---

## 3. リアルタイム状態更新 — 運営者ダッシュボード

**Decision**: Supabase Realtime (PostgreSQL Changes)

**Rationale**:
- `assignments` テーブルへの INSERT/UPDATE を Supabase Realtime でサブスクライブ
- 運営者の管理画面（Next.js クライアント）がリアルタイムで回答状況を受信
- Supabase JavaScript SDK に組み込まれており、追加インフラ不要

**Alternatives considered**:
- ポーリング → サーバー負荷・UX ともに劣るため却下
- WebSocket サーバー自前実装 → インフラ複雑化、Supabase Realtime で十分

---

## 4. アクセス制御 — 半クローズドコミュニティ

**Decision**: Supabase Row Level Security (RLS) による地域コミュニティ単位のアクセス制御

**Rationale**:
- `community_members.status = 'approved'` のユーザーのみが審判候補として表示される
- RLS ポリシーでテーブルレベルのアクセス制御を実装。アプリ層での漏れを防ぐ
- 未承認ユーザーは自分のプロフィールと申請状況のみ閲覧可能
- 実名・連絡先（`users.real_name`, `users.phone`）はアサイン確定後に限定的に開示

**Key RLS policies**:
- `availabilities`: 同一コミュニティの承認済みメンバーのみ閲覧可能
- `matches`: 同一コミュニティのメンバー（管理者/運営者）のみ作成・閲覧可能
- `assignments`: 関係する審判・運営者・管理者のみ閲覧可能
- `users` (personal info): 本人のみ、またはアサイン確定後に相手方に一部開示

---

## 5. 自動リマインダー — 前日通知

**Decision**: Supabase Edge Functions + pg_cron

**Rationale**:
- pg_cron（Supabase 組み込み）で毎夜スケジュールを実行
- 翌日に試合があり `assignments.status = 'confirmed'` のレコードを抽出
- Edge Function 経由で LINE Push Message を送信
- サーバーレス、追加インフラ不要

**Alternatives considered**:
- Vercel Cron Jobs → Supabase と切り離された管理が必要になり複雑化。pg_cron で統合する方が整合性が高い

---

## 6. MVP スコープ明確化

以下はリサーチを通じて MVP 外として確定:

| 機能 | 判断 | 理由 |
|------|------|------|
| 決済統合 | MVP 外 | Constitution により禁止 |
| 評点・レーティング | MVP 外 | Constitution Principle V により禁止 |
| 複数地域 | MVP 外 | Constitution により Phase 2 以降（ただし設計は拡張可能、下記参照） |
| AI 推薦 | MVP 外 | Phase 2 以降 |
| 審判間 DM | MVP 外 | Constitution Principle IV により禁止 |
| 公開プロフィール検索 | MVP 外 | Constitution Principle IV により禁止 |
| LINE LIFF | MVP 外 | Principle III — 過剰な複雑性 |

---

## 7. 複数地域対応の将来拡張性

MVP は単一地域のみを対象とするが、データモデルは以下の理由により**破壊的変更なしに**マルチリージョン展開が可能。

### 拡張可能な部分

| 設計 | 理由 |
|------|------|
| `regional_communities` が独立エンティティ | 地域の追加はレコード追加のみ |
| `community_members` が多対多 | 1人の審判が複数コミュニティに所属できる |
| `matches.community_id` | 試合データは地域スコープに閉じており混在しない |
| `assignments` は `match_id` 経由でスコープされる | 地域をまたいだアサインの混在が起きない |

### Phase 2 で対応が必要な点

**1. `availabilities` の重複アサイン問題**

`availabilities` は `user_id` のみで管理され、地域をまたいで共通の個人カレンダーとして機能する。これは意図的に正しい設計だが、複数地域から同一時間帯に通知が届いた場合に二重承諾が発生しうる。

対応策: 審判候補の検索クエリに「同日時に `accepted` または `confirmed` の `assignment` が存在しないか」のチェックを追加する。スキーマ変更は不要。

**2. `users.region` の単一テキスト問題**

現状 `users.region` は単一の `text` カラムで、複数地域で活動する審判を表現できない。Phase 2 では以下のいずれかで対応する：

- `users.region` を補助情報（主な拠点）として残し、実質的な所属は `community_members` で管理（推奨）
- `users.region` を `text[]` に変更（マイグレーションで対応可能）

**推奨アプローチ**: `community_members` を「どの地域に所属するか」の正となるデータとして扱い、`users.region` は UI 表示の補助フィールドとして位置づける。これにより Phase 2 でスキーマ変更なしに地域横断検索が実現できる。
