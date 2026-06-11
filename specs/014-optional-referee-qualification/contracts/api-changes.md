# API Contract Changes: 審判資格なしメンバー登録

## PATCH /api/profile

### 変更概要

初期プロフィール作成時の必須フィールドを変更。

### リクエストボディ（変更後）

```json
{
  "display_name": "田中太郎",        // 必須
  "region": "愛知西部",              // 必須
  "license_level": "3級",            // 任意（設定時は role_type / age_groups も必須）
  "role_type": ["referee"],          // ライセンスあり時は必須、なし時は任意
  "age_groups": ["U15", "U18"],      // ライセンスあり時は必須、なし時は任意
  "real_name": "田中太郎",           // 任意
  "phone_number": "090-1234-5678",   // 任意
  "travel_range_km": 30              // 任意
}
```

### バリデーションルール（変更後）

| 条件 | 必須フィールド |
|------|--------------|
| 常に | `display_name`, `region` |
| `license_level` を指定した場合 | `role_type`（1件以上）, `age_groups`（1件以上） |

### エラーレスポンス（変更後）

```json
// display_name or region が未指定
{ "error": "display_name and region are required for initial profile creation" }

// license_level あり & role_type 未指定
{ "error": "role_type and age_groups are required when license_level is provided" }
```

---

## POST /api/communities/:id/apply

### 変更なし

ロール自動判定は行わない。申請時のロールは引き続き `referee` のまま。

ライセンスなしユーザーのアサイン候補除外は `candidates` API の `role_type overlaps` フィルタで実現済みであり、この API の変更は不要。

### レスポンス（変更なし）

```json
// 201 Created
{
  "id": "uuid",
  "community_id": "uuid",
  "user_id": "uuid",
  "role": "referee",
  "status": "pending",
  "created_at": "..."
}
```
