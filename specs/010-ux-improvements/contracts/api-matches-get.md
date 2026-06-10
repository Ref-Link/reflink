# Contract: GET /api/matches

**変更種別**: レスポンス拡張（既存フィールドに `confirmed_referees` / `confirmed_assistants` を追加）

## Request

```
GET /api/matches
Authorization: session cookie (organizer/manager role required)
```

## Response

**200 OK**

```json
[
  {
    "id": "uuid",
    "community_id": "uuid",
    "created_by": "uuid",
    "title": "string",
    "match_date": "YYYY-MM-DD",
    "start_time": "HH:MM:SS",
    "venue": "string",
    "age_group": "U12 | U15 | U18 | Senior",
    "referees_needed": 0 | 1,
    "assistants_needed": 0 | 1 | 2,
    "compensation": number | null,
    "notes": "string | null",
    "status": "open | filled | cancelled",
    "created_at": "ISO8601",
    "updated_at": "ISO8601",
    "confirmed_referees": 0,
    "confirmed_assistants": 1
  }
]
```

**新規フィールド**:
- `confirmed_referees`: 当試合で `status='confirmed'` かつ `role='referee'` のアサイン数
- `confirmed_assistants`: 当試合で `status='confirmed'` かつ `role='assistant_referee'` のアサイン数

## Server-side Implementation Note

matches を取得後、以下を実行:
1. match id 一覧で `assignments` を一括クエリ（N+1 回避）
2. match_id + role でグルーピングして counts を集計
3. 各 match にマージして返す
