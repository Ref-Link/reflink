# Contract: プロフィール API

## `PATCH /api/profile`

**変更内容**: `phone_number` フィールドの受け付け・正規化・保存を追加する。

### Request Body (変更点のみ)

```json
{
  "phone_number": "090-1234-5678"
}
```

- ハイフンあり/なしどちらも受け付ける
- 他フィールドと組み合わせて送信可能 (既存動作と同じ partial update)

### Validation (server-side)

```
phone_number が present の場合:
  1. 非数字を除去 (normalize)
  2. 正規化後が 10〜11桁 かつ '0' 始まり でなければ 400 を返す
```

**Validation Error**:
```json
{
  "error": "電話番号は0始まりの10〜11桁の数字で入力してください"
}
```
HTTP status: `400`

### Response (変更点)

- `phone_number` フィールドが UserRow に含まれる (正規化済み数字列)
- 例: `"09012345678"` (ハイフンなし)

### Server-side logic (変更点)

```
phone_number が body に含まれる場合:
  1. normalizePhoneNumber(phone_number) → normalized
  2. isValidPhoneNumber(normalized) が false → 400 エラー
  3. updatePayload.phone_number = normalized
```

---

## `GET /api/assignments` (変更点)

**変更内容**: 担当履歴レスポンスに運営者の `phone_number` を追加する。

### Response (変更点)

```json
[
  {
    "id": "...",
    "role": "referee",
    "status": "confirmed",
    "confirmed_at": "2026-06-08T10:00:00Z",
    "matches": {
      "id": "...",
      "title": "○○リーグ",
      "match_date": "2026-06-15",
      "start_time": "10:00:00",
      "venue": "△△グラウンド",
      "age_group": "U15",
      "organizer_phone": "09012345678"
    }
  }
]
```

- `matches.organizer_phone`: 運営者の `phone_number` (正規化済み) または `null`
- status が `confirmed` のレスポンスのみ返すため (既存フィルタ)、常に開示条件を満たしている

### Supabase query 変更点

```typescript
supabase
  .from('assignments')
  .select(`
    id, role, status, confirmed_at,
    matches (
      id, title, match_date, start_time, venue, age_group,
      organizer:users!created_by(phone_number)
    )
  `)
  .eq('user_id', user.id)
  .eq('status', 'confirmed')
```

**Note**: サーバーサイドAPIルートのため、`service_role` クライアントを使用して電話番号を取得する（または既存の `createClient()` に RLS による追加ポリシーが適用される）。レスポンス整形時に `matches.organizer.phone_number` を `matches.organizer_phone` にフラット化して返す。
