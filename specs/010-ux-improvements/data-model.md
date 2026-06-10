# Data Model: UX改善（審判・運営者）

## スキーマ変更

**なし。** すべての変更は既存テーブルの SELECT フィールド拡張、または API レスポンスへの computed フィールド追加にとどまる。

---

## 拡張されるエンティティとフィールド

### MatchWithCounts（API レスポンス拡張型）

`GET /api/matches` および `GET /api/matches/[id]` のレスポンスに追加されるフィールド:

| フィールド | 型 | 算出方法 | 説明 |
|-----------|-----|---------|------|
| `confirmed_referees` | `number` | assignments WHERE match_id=X AND role='referee' AND status='confirmed' の COUNT | 確定済み主審数 |
| `confirmed_assistants` | `number` | assignments WHERE match_id=X AND role='assistant_referee' AND status='confirmed' の COUNT | 確定済み副審数 |

既存の `MatchRow` フィールド（`referees_needed`, `assistants_needed`）と組み合わせて「確定数 / 必要数」を表示。

### AssignmentHistoryItem.matches（型拡張）

`GET /api/assignments` レスポンスの `matches` オブジェクトに追加されるフィールド:

| フィールド | 型 | 既存/追加 |
|-----------|-----|---------|
| `id` | `string` | 既存 |
| `title` | `string` | 既存 |
| `match_date` | `string` | 既存 |
| `start_time` | `string` | 既存 |
| `venue` | `string` | 既存 |
| `age_group` | `string` | 既存 |
| `organizer_phone` | `string \| null` | 既存 |
| `referees_needed` | `number` | **追加** |
| `assistants_needed` | `number` | **追加** |
| `compensation` | `number \| null` | **追加** |
| `notes` | `string \| null` | **追加** |

### MemberWithUser.users（型拡張）

`GET /api/communities/[id]/members` の `users` ネストオブジェクトに追加されるフィールド:

| フィールド | 型 | 既存/追加 |
|-----------|-----|---------|
| `display_name` | `string` | 既存 |
| `license_level` | `string` | 既存 |
| `region` | `string` | 既存 |
| `age_groups` | `string[]` | **追加** |
| `role_type` | `string[]` | **追加** |
| `travel_range_km` | `number \| null` | **追加** |

> **注意**: `real_name`・`phone_number` は FR-010 により意図的に除外。

---

## コンポーネント状態モデル

### AvailabilityCalendar（FR-001/002）

| 状態 | 変更 |
|------|------|
| `defaultAgeGroups: string[]` prop | **新規追加**。外部からの初期値。 |
| `selectedAgeGroups` の初期値 | `[]` → `defaultAgeGroups` |
| フォームリセット後の `selectedAgeGroups` | `[]` → `defaultAgeGroups` |
| `notes` state / textarea | **削除** (FR-002) |

### アコーディオン状態（FR-003/007/008/009）

すべての accordion コンポーネントで共通パターン:

```ts
const [expandedId, setExpandedId] = useState<string | null>(null)
```

- `null` = 全て折り畳み
- `string` = その id のアイテムのみ展開
- 別アイテムタップ → `expandedId` が新 id に更新 → 旧アイテム自動折り畳み (FR-009)

---

## バリデーション規則

- 「確定数 / 必要数」表示: `referees_needed = 0` の役割は表示しない (spec edge case)
- `compensation === 0` は「無償」として表示; `compensation === null` は非表示 (spec edge case)
- `travel_range_km === null` のメンバーは移動範囲行を非表示 (spec edge case)
- `notes` が空文字の既存空き日程では備考行を非表示 (spec edge case; AvailabilityList 既対応済み)
