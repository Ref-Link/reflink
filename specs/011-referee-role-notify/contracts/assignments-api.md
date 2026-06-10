# Contract: POST /api/matches/[id]/assignments

本機能における変更: なし（インターフェースは既存のまま）。

---

## リクエスト

```
POST /api/matches/{matchId}/assignments
Authorization: Supabase session cookie
Content-Type: application/json
```

### Body

```json
{
  "candidates": [
    { "userId": "uuid", "role": "referee" },
    { "userId": "uuid", "role": "assistant_referee" }
  ]
}
```

| フィールド | 型 | 必須 | 制約 |
|-----------|-----|------|------|
| `candidates` | array | ✅ | 1件以上 |
| `candidates[].userId` | string (UUID) | ✅ | 存在するユーザーID |
| `candidates[].role` | `"referee"` \| `"assistant_referee"` | ✅ | 列挙値のみ |

### バリデーション変更点

本機能前: フロントエンドが `role_type[0]` を自動選択していたため、両対応候補に対して意図しないロールが送信される可能性があった。

本機能後: フロントエンドが明示的に選択したロールのみを送信する。API 側のバリデーションルール (`['referee', 'assistant_referee'].includes(role)`) に変更なし。

---

## レスポンス

### 成功 (201 Created)

```json
{
  "assignments": [
    {
      "id": "uuid",
      "match_id": "uuid",
      "user_id": "uuid",
      "role": "assistant_referee",
      "status": "notified",
      "notified_at": "2026-06-10T12:00:00Z",
      "created_at": "2026-06-10T12:00:00Z"
    }
  ],
  "errors": []
}
```

### エラー (部分的失敗)

`errors` 配列に失敗した候補のみ格納。成功した候補は `assignments` に含まれる。

```json
{
  "assignments": [...],
  "errors": [
    { "userId": "uuid", "error": "User not found" }
  ]
}
```

### エラー (認証・認可)

| Status | error | 説明 |
|--------|-------|------|
| 401 | `"Unauthorized"` | セッションなし |
| 403 | `"Forbidden: organizer or manager role required"` | ロール不足 |
| 404 | `"Match not found"` | 試合が存在しないか別コミュニティ |
| 400 | `"candidates array is required"` | リクエストボディ不正 |

---

## 副作用

各候補に対して以下を実行（変更点 ★ 印）:

1. `assignments` テーブルに INSERT（`role` = 送信されたロール値）
2. 対象審判員の `line_user_id` に Flex Message を push 送信
   - ★ ヘッダーテキスト: `role === 'referee'` → `【主審募集】` / `role === 'assistant_referee'` → `【副審募集】`
   - ★ `altText`: `【主審募集】{title} {date}` or `【副審募集】{title} {date}`

---

## LINE Flex Message 変更箇所

```diff
- text: '【審判募集】',
+ text: role === 'referee' ? '【主審募集】' : '【副審募集】',

- altText: `【試合審判募集】${title} ${dateFormatted}`,
+ altText: `${role === 'referee' ? '【主審募集】' : '【副審募集】'}${title} ${dateFormatted}`,
```
