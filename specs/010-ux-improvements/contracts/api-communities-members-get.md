# Contract: GET /api/communities/[id]/members

**変更種別**: `users` ネストオブジェクトにフィールドを追加

## Request

```
GET /api/communities/:id/members
Authorization: session cookie (manager role required)
```

## Response

**200 OK**

```json
[
  {
    "id": "uuid",
    "community_id": "uuid",
    "user_id": "uuid",
    "role": "referee | organizer | manager",
    "status": "pending | approved | rejected",
    "approved_by": "uuid | null",
    "approved_at": "ISO8601 | null",
    "created_at": "ISO8601",
    "users": {
      "display_name": "string",
      "license_level": "1級 | 2級 | 3級 | 4級",
      "region": "string",
      "age_groups": ["U12", "U15"],
      "role_type": ["referee", "assistant_referee"],
      "travel_range_km": 30 | null
    }
  }
]
```

**新規フィールド** (users オブジェクト内):
- `age_groups`: 対応年代
- `role_type`: 担当可能役割
- `travel_range_km`: 移動範囲（km）。`null` は非表示

## Display Rules (expanded section)

- `travel_range_km === null` → 移動範囲行を非表示
- `real_name`, `phone_number` は **含まない**（FR-010）

## Supabase Select Change

```ts
// 変更前
.select('*, users!user_id(display_name, license_level, region)')

// 変更後
.select('*, users!user_id(display_name, license_level, region, age_groups, role_type, travel_range_km)')
```
