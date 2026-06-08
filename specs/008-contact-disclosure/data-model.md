# Data Model: アサイン確定後の連絡先情報開示

**Phase**: 1 | **Date**: 2026-06-08

---

## Schema Changes

### `users` テーブル — `phone_number` カラム追加

```sql
ALTER TABLE public.users
  ADD COLUMN phone_number text
  CONSTRAINT users_phone_number_check CHECK (phone_number ~ '^0[0-9]{9,10}$');
```

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| `phone_number` | `text` | ✅ NULL | 数字のみ10〜11桁 (例: `"09012345678"`); 保存時に正規化済み |

- 既存の `users` 行はすべて `NULL` になる (正しい初期状態)
- CHECK制約により不正な値をDB層でも拒否する

### TypeScript型の更新 (`src/types/database.ts`)

```typescript
// Database['public']['Tables']['users']
Row: {
  // ...既存フィールド...
  phone_number: string | null   // ADD
}
Insert: {
  // ...既存フィールド...
  phone_number?: string | null  // ADD
}
Update: {
  // ...既存フィールド...
  phone_number?: string | null  // ADD
}
```

---

## ユーティリティ関数 (`src/lib/phone.ts` — 新規)

```typescript
// 入力から非数字を除去
export function normalizePhoneNumber(input: string): string {
  return input.replace(/\D/g, '')
}

// 正規化後の番号が有効か検証 (0始まり10〜11桁)
export function isValidPhoneNumber(normalized: string): boolean {
  return /^0\d{9,10}$/.test(normalized)
}

// 表示用ハイフン補完
// 11桁: 0XX-XXXX-XXXX (例: 090-1234-5678)
// 10桁: 0X-XXXX-XXXX  (例: 03-1234-5678)
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

## エンティティ関係

```
users (既存)
  └── phone_number: text | null   ← 今回追加

assignments (既存, 変更なし)
  ├── user_id → users.id (審判)
  ├── match_id → matches.id
  └── status: 'notified' | 'accepted' | 'declined' | 'confirmed'

matches (既存, 変更なし)
  └── created_by → users.id (運営者)
```

### 開示ロジック

```
assignment.status === 'confirmed'
  → 運営者 (matches.created_by) は 審判 (assignments.user_id) の phone_number を見られる
  → 審判 (assignments.user_id) は 運営者 (matches.created_by) の phone_number を見られる
  → 審判同士はお互いの phone_number を見られない
  → assignment.status が confirmed 以外に戻った場合、開示は取り消される
```

---

## 新規 UIコンポーネント (`src/components/ui/ContactInfo.tsx`)

```typescript
interface ContactInfoProps {
  phone: string | null  // 正規化済み番号 or null
}
```

**レンダリング分岐**:
- `phone === null`: `「連絡先未登録」` テキストのみ表示、ボタンなし
- `phone !== null`: フォーマット済み番号 + 「📞 発信」(`tel:` リンク) + 「💬 SMS」(`sms:` リンク)

---

## `ProfileFormData` 型の更新 (`src/components/profile/ProfileForm.tsx`)

```typescript
export interface ProfileFormData {
  // ...既存フィールド...
  phone_number: string  // ADD: ユーザー入力値 (正規化前でも可)
}
```

---

## `AssignmentHistoryItem` 型の更新 (`src/components/history/AssignmentHistory.tsx`)

```typescript
export interface AssignmentHistoryItem {
  id: string
  role: 'referee' | 'assistant_referee'
  status: string
  confirmed_at: string | null
  matches: {
    id: string
    title: string
    match_date: string
    start_time: string
    venue: string
    age_group: string
    organizer_phone: string | null  // ADD: confirmed 時のみ非null
  } | null
}
```

---

## 状態遷移と電話番号ゲート

```
assignment.status フロー:
  notified → accepted → confirmed
                          ↑
              ここで phone_number チェック (両者必須)
              - 運営者の phone_number が null → ORGANIZER_PHONE_MISSING (400)
              - 審判の phone_number が null  → REFEREE_PHONE_MISSING (400)
```

**LINEフォローアップトリガー**:
```
accepted への遷移時 (LINE webhook):
  if (user.phone_number === null) → pushTextMessage (プロフィール登録を促す)
```
