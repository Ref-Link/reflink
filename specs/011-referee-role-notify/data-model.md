# Data Model: 審判依頼通知のロール選択UX改善

## DBスキーマ変更

**変更なし。** 本機能はすべて既存スキーマで実装できる。

| テーブル | フィールド | 用途 | 状態 |
|---------|-----------|------|------|
| `assignments` | `role: 'referee' \| 'assistant_referee'` | 依頼ロールの記録 | 既存（変更なし） |
| `matches` | `referees_needed: number` | 主審の募集有無の判定 | 既存（読み取りのみ） |
| `matches` | `assistants_needed: number` | 副審の募集有無の判定 | 既存（読み取りのみ） |
| `users` | `role_type: string[]` | 候補者の対応可能ロール一覧 | 既存（読み取りのみ） |

---

## フロントエンド型定義の変更

### `CandidateList` コンポーネントの props 拡張

```ts
// src/components/matches/CandidateList.tsx

interface CandidateListProps {
  readonly candidates: Candidate[]
  readonly isLoading?: boolean
  readonly selectedIds?: Set<string>
  readonly selectedRoles?: Map<string, 'referee' | 'assistant_referee'>   // NEW
  readonly matchRecruitedRoles?: RefereeRole[]                            // NEW
  readonly onToggleSelect?: (id: string) => void
  readonly onRoleChange?: (id: string, role: 'referee' | 'assistant_referee') => void  // NEW
}
```

### `match/[id]/page.tsx` ステート追加

```ts
// 追加するステート
const [selectedRoles, setSelectedRoles] =
  useState<Map<string, 'referee' | 'assistant_referee'>>(new Map())

// 既存 handleToggleSelect の変更
function handleToggleSelect(id: string) {
  setSelectedIds((prev) => {
    const next = new Set(prev)
    if (next.has(id)) {
      next.delete(id)
      // ロール選択も削除
      setSelectedRoles((r) => { const m = new Map(r); m.delete(id); return m })
    } else {
      next.add(id)
      // 選択可能ロールが1種類なら自動設定
      const candidate = candidates.find((c) => c.id === id)
      if (candidate) {
        const available = availableRolesFor(candidate, matchRecruitedRoles)
        if (available.length === 1) {
          setSelectedRoles((r) => new Map(r).set(id, available[0]))
        }
      }
    }
    return next
  })
}

// 送信可否の計算
const notifyReady =
  selectedIds.size > 0 &&
  Array.from(selectedIds).every((id) => selectedRoles.has(id))
```

### ヘルパー関数

```ts
// match/[id]/page.tsx 内ユーティリティ
function availableRolesFor(
  candidate: Candidate,
  recruitedRoles: RefereeRole[]
): RefereeRole[] {
  return candidate.role_type.filter((r): r is RefereeRole =>
    recruitedRoles.includes(r as RefereeRole)
  )
}
```

---

## `MatchNotificationParams` の変更

```ts
// src/lib/line/messages.ts
export interface MatchNotificationParams {
  assignmentId: string
  title: string
  match_date: string
  start_time: string
  venue: string
  age_group: string
  compensation: number | null
  role: 'referee' | 'assistant_referee'   // NEW
}
```

---

## エンティティ関係図

```
Match ──< assignments >── User
  │                         │
referees_needed          role_type[]
assistants_needed
  │
  ▼
matchRecruitedRoles[]   (derived on frontend)
  │
  ∩ candidate.role_type
  │
  ▼
availableRoles[]  →  1件: 自動設定
                 →  2件: UI表示 → selectedRoles Map
                                      │
                                      ▼
                              assignments.role (DB保存)
                              LINE通知ヘッダー (FR-004)
                              LINE altText (FR-005)
```

---

## 状態遷移

候補選択フロー:

```
候補チェック
  → availableRoles.length === 1 → 自動でロール設定 → selectedRoles に追加
  → availableRoles.length === 2 → ロール選択UI表示 → 選択後 selectedRoles に追加
                                                    → 未選択 → 送信ボタン disabled

候補チェック解除
  → selectedIds から削除
  → selectedRoles から削除（自動）
```
