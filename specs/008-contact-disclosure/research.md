# Research: アサイン確定後の連絡先情報開示

**Phase**: 0 | **Date**: 2026-06-08

---

## 1. 日本国内電話番号の正規化・検証・表示

**Decision**: 保存時に非数字を除去 (`/\D/g`)、10〜11桁かつ `0` 始まりを必須とする。表示時は桁数でハイフン補完パターンを分岐する。

**Rationale**: 仕様が明示する2パターン（「11桁: 0XX-XXXX-XXXX」「10桁: 0X-XXXX-XXXX」）を正確に実装するための最小ロジック。国際番号（+81形式）はスコープ外と明記されているため不要。

**Alternatives considered**:
- `libphonenumber-js` など外部ライブラリ: 依存追加コストが正当化されない (国内番号のみ、ロジックが3関数で収まる)
- DB側チェック制約のみで正規化: アプリ層で正規化しないと制約違反エラーをユーザーに晒すことになるため却下

**Implementation** (`src/lib/phone.ts`):
```typescript
export function normalizePhoneNumber(input: string): string {
  return input.replace(/\D/g, '')
}

export function isValidPhoneNumber(normalized: string): boolean {
  return /^0\d{9,10}$/.test(normalized)
}

export function formatPhoneNumber(normalized: string): string {
  if (normalized.length === 11) {
    return `${normalized.slice(0, 3)}-${normalized.slice(3, 7)}-${normalized.slice(7)}`
  }
  if (normalized.length === 10) {
    return `${normalized.slice(0, 2)}-${normalized.slice(2, 6)}-${normalized.slice(6)}`
  }
  return normalized
}
```

---

## 2. Supabase マイグレーション方針

**Decision**: `supabase/migrations/20260608000001_add_phone_number.sql` に `ALTER TABLE users ADD COLUMN phone_number text;` と CHECK 制約を追加。`supabase db push` または Supabase Dashboard の SQL エディタで適用。

**Rationale**: プロジェクトは既に `supabase/migrations/` を使用したマイグレーション管理を採用している。既存パターンに則る。

**Alternatives considered**:
- 別テーブル (`user_contacts`) への分離: 過剰設計。MVPスコープ外の監査ログ等が必要になったときに検討。

**Migration SQL**:
```sql
ALTER TABLE public.users
  ADD COLUMN phone_number text
  CONSTRAINT users_phone_number_check CHECK (phone_number ~ '^0[0-9]{9,10}$');
```

---

## 3. 電話番号開示のセキュリティ制御方針

**Decision**: 電話番号はサーバーサイドAPIルート内でのみ取得・フィルタリングし、クライアントサイドの直接Supabaseクエリには含めない。

**Rationale**:
- 既存の `"users: community members can view public profile"` RLS ポリシーは同一コミュニティメンバーのすべての行を開示する。クライアントクエリで `phone_number` を含めると、コミュニティメンバー全員に電話番号が漏れる。
- SC-004「confirmed以外のAPIレスポンスに電話番号が含まれないことが100%保証」を達成するには、Supabase RLS だけでは不十分 — アプリ層フィルタリングが必要。
- サーバーAPIルートでは `confirmed` ステータスを確認してから `phone_number` を返すため、意図しない開示が発生しない。

**Scope**:
- `GET /api/assignments` (担当履歴): `status = 'confirmed'` でフィルタ済みのため、レスポンスに運営者の `phone_number` を含められる
- `PATCH /api/matches/[id]/assignments/[assignmentId]/confirm`: `service_role` クライアントで電話番号チェックを実施
- admin assignments page: **直接Supabaseクエリを継続** (リアルタイム購読のため)、ただし `users(display_name)` のみ取得。電話番号は `confirmed` への遷移後に別途 `fetch('/api/matches/[id]/assignments/contact-info')` で取得する

**Alternatives considered**:
- PostgreSQL 列レベル権限 (`REVOKE SELECT (phone_number) ON users FROM authenticated`): 既存のGRANT文を大幅に再設計する必要があり、RLS再帰問題再発リスクがある
- DB VIEW でカラムを隠す: 既存クエリパターンが JOIN を多用しておりview導入が波及する

---

## 4. 管理画面の確定フロー改修方針

**Decision**: 「確定」ボタンタップ → APIが `phone_number` 未登録を検知 → フロントエンドがエラーコードに応じてインライン処理:
- `ORGANIZER_PHONE_MISSING`: インライン電話番号入力フォームを表示 → 保存後に自動再試行
- `REFEREE_PHONE_MISSING`: エラーメッセージのみ表示（審判に登録を依頼）

**Rationale**: 運営者自身の電話番号登録はその場で解決できる。審判の未登録はその場では解決できないため、アクションなしのエラーメッセージが適切。2ステップ（PATCH profile → PATCH confirm）はシンプルで既存APIを再利用できる。

---

## 5. LINE フォローアップメッセージ設計

**Decision**: LINE webhook (`/api/webhook/line`) の `accept` アクション処理後、`users.phone_number` が null の場合に `pushTextMessage` でフォローアップを送信する。

**Rationale**: 既存の `pushTextMessage` 関数を再利用できる。LIFF不使用のため、ディープリンクは `NEXT_PUBLIC_APP_URL/profile` の直接URLとする。

**Message template**:
```
【電話番号登録のお願い】
アサイン確定時に運営者との緊急連絡手段として電話番号が必要です。
以下のリンクからプロフィールに電話番号をご登録ください。

{NEXT_PUBLIC_APP_URL}/profile
```

**Alternatives considered**:
- Flex Message (リッチカード形式): ボタン付きで見栄えが良いが、URLボタンだけの簡易メッセージで十分。テキストメッセージで実装コストを最小化。

---

## 6. 新規サーバーAPIルート: `/api/matches/[id]/assignments/contact-info`

**Decision**: admin assignments page がリアルタイム購読で status を取得した後、確定済みアサインの電話番号を取得するための専用エンドポイントを追加する。

**Method**: `GET`  
**Auth**: 運営者/管理者ロール必須  
**Response**: `{ [assignmentId]: string | null }` — 確定済みアサインIDをキーとした電話番号マップ

**Rationale**: クライアントサイドのリアルタイム購読（`realtime`）と電話番号取得を分離することで、電話番号が直接Supabaseクライアントに流れることを防ぐ。
