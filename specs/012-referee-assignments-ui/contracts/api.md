# API Contracts: 審判UIへの担当タブ追加

## 新規エンドポイント

---

### GET /api/assignments/pending

ログイン中の審判に届いている未回答の募集一覧を返す。

**認証**: 必須（セッションCookie）

**リクエスト**: パラメータなし

**レスポンス 200**:

```json
[
  {
    "id": "uuid",
    "role": "referee" | "assistant_referee",
    "status": "notified",
    "match": {
      "id": "uuid",
      "title": "string",
      "match_date": "YYYY-MM-DD",
      "start_time": "HH:MM:SS",
      "venue": "string",
      "age_group": "U12" | "U15" | "U18" | "Senior",
      "compensation": number | null,
      "notes": "string" | null
    }
  }
]
```

**フィルタ条件**: `assignments.user_id = currentUser.id AND assignments.status = 'notified'`

**ソート**: `match_date ASC`（直近の試合を先頭に）

**エラー**:
- `401 Unauthorized` — 未ログイン

---

### PATCH /api/assignments/[id]/respond

審判が募集に参加または辞退する。

**認証**: 必須（セッションCookie）

**リクエストボディ**:

```json
{
  "action": "accept" | "decline"
}
```

**処理ルール**（LINE Webhookと同一）:
1. `assignments.id = [id]` かつ `assignments.user_id = currentUser.id` でレコードを取得（他人の募集への操作を防止）
2. `status !== 'notified'` の場合 → `409 Conflict`（すでに回答済み）
3. `action = 'accept'` → `status = 'accepted'`, `responded_at = now()`
4. `action = 'decline'` → `status = 'declined'`, `responded_at = now()`

**レスポンス 200**:

```json
{
  "id": "uuid",
  "status": "accepted" | "declined",
  "responded_at": "ISO8601"
}
```

**エラー**:
- `400 Bad Request` — `action`が不正な値
- `401 Unauthorized` — 未ログイン
- `403 Forbidden` — 対象の募集が自分のものでない
- `404 Not Found` — 指定IDの募集が存在しない
- `409 Conflict` — すでに回答済み（`status !== 'notified'`）

---

## 既存エンドポイント（変更なし）

| エンドポイント | 用途 | 変更 |
|---|---|---|
| `GET /api/assignments` | 確定済み履歴一覧（履歴タブ） | なし |
| `PATCH /api/matches/[id]/assignments/[assignmentId]/confirm` | 管理者による確定 | なし |
| `POST /api/webhook/line` | LINEからの参加・辞退 | なし |
