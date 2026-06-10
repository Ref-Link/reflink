# Contract: GET /api/assignments

**変更種別**: レスポンスの `matches` オブジェクトにフィールドを追加

## Request

```
GET /api/assignments[?age_group=&date_from=&date_to=]
Authorization: session cookie (referee role)
```

## Response

**200 OK**

```json
[
  {
    "id": "uuid",
    "role": "referee | assistant_referee",
    "status": "confirmed",
    "confirmed_at": "ISO8601",
    "matches": {
      "id": "uuid",
      "title": "string",
      "match_date": "YYYY-MM-DD",
      "start_time": "HH:MM:SS",
      "venue": "string",
      "age_group": "U12 | U15 | U18 | Senior",
      "organizer_phone": "string | null",
      "referees_needed": 0 | 1,
      "assistants_needed": 0 | 1 | 2,
      "compensation": number | null,
      "notes": "string | null"
    }
  }
]
```

**新規フィールド** (matches オブジェクト内):
- `referees_needed`: 必要主審数
- `assistants_needed`: 必要副審数
- `compensation`: 報酬（円）。`0` は無償、`null` は未設定
- `notes`: 備考。`null` または空文字は非表示

## Display Rules

- `compensation === 0` → 「無償」と表示
- `compensation === null` → 報酬行を非表示
- `notes` が null/空 → 備考行を非表示
- `referees_needed === 0` → 主審人数行を非表示（試合詳細展開内）
