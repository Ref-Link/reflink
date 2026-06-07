# Data Model: ロールベースホーム画面

**Phase**: 1  
**Date**: 2026-06-07

---

## 既存エンティティ（変更なし）

### community_members（既存テーブル）

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| community_id | uuid | FK → regional_communities |
| user_id | uuid | FK → users |
| role | 'referee' \| 'organizer' \| 'manager' | |
| status | 'pending' \| 'approved' \| 'rejected' | |
| approved_by | uuid \| null | |
| approved_at | timestamptz \| null | |
| created_at | timestamptz | |

**利用クエリ**: `SELECT role, status FROM community_members WHERE user_id = $1`  
**DB 変更**: なし

### users（既存テーブル）

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| display_name | string | not null — ホーム画面挨拶に使用 |
| … | … | その他カラムは本機能では不使用 |

**利用クエリ**: `SELECT display_name FROM users WHERE id = $1`  
**DB 変更**: なし

---

## ランタイム型（新規、DB エンティティではない）

### UserRoleContext

```typescript
interface UserRoleContext {
  displayName: string       // users.display_name
  isAdmin: boolean          // community_members に role∈{organizer,manager} AND status=approved の行が存在
  isReferee: boolean        // community_members に role=referee の行が存在（status 問わず）
}
```

**導出ルール**:
- `isAdmin = memberships.some(m => ['organizer','manager'].includes(m.role) && m.status === 'approved')`
- `isReferee = memberships.some(m => m.role === 'referee')`

**ライフサイクル**: リクエストごとにサーバーコンポーネントで計算。キャッシュなし（ロール変更が即時反映される必要があるため）。

### HomeEntry

```typescript
interface HomeEntry {
  type: 'admin' | 'referee' | 'join'
  label: string       // 例: "試合・メンバーを管理する"
  description: string // 例: "試合の登録・審判の割当・メンバー承認"
  href: string        // 遷移先パス
  icon: ReactNode     // Tailwind SVG アイコン
}
```

**表示条件**:

| entry.type | 表示条件 |
|------------|---------|
| 'admin' | `isAdmin === true` |
| 'referee' | `isReferee === true` |
| 'join' | `!isAdmin && !isReferee` |

---

## マイグレーション

**なし** — 既存テーブルへの変更・新規テーブル作成は不要。
