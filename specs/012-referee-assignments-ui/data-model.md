# Data Model: 審判UIへの担当タブ追加

## スキーマ変更

**なし。** 既存の`assignments`テーブルおよび`matches`テーブルのスキーマ変更は不要。

---

## 既存エンティティの利用

### assignments テーブル（既存）

この機能で使用するフィールドと状態遷移：

| フィールド | 型 | この機能での用途 |
|---|---|---|
| `id` | uuid | API `[id]` パラメータ、カードのkey |
| `match_id` | uuid | matchesとのJOIN |
| `user_id` | uuid | ログインユーザーでフィルタリング |
| `role` | `'referee' \| 'assistant_referee'` | 「主審」「副審」表示 |
| `status` | `'notified' \| 'accepted' \| 'declined' \| 'confirmed'` | 募集タブ：`notified`のみ表示、回答後に`accepted`/`declined`に更新 |
| `responded_at` | timestamp | 回答時に現在時刻をセット（respond APIで更新） |

### 状態遷移（審判UI操作分）

```
notified  ──「参加」──▶  accepted
         └─「辞退」──▶  declined
```

`confirmed`への遷移は管理者UIのみ（この機能のスコープ外）。

---

### matches テーブル（既存 — JOINで参照）

募集カードの表示に使用するフィールド：

| フィールド | 表示用途 |
|---|---|
| `title` | カードタイトル |
| `match_date` | 日付表示（例: 6月15日(日)） |
| `start_time` | 開始時刻（例: 10:00） |
| `venue` | 会場名 |
| `age_group` | 年代バッジ（U12/U15/U18/Senior） |
| `compensation` | 報酬（展開後の詳細欄） |
| `notes` | 備考（展開後の詳細欄） |

---

## フロントエンドの型定義（新規）

`src/components/assignments/PendingList.tsx`で使用する型：

```typescript
interface PendingAssignmentItem {
  id: string
  role: 'referee' | 'assistant_referee'
  status: 'notified' | 'accepted' | 'declined'
  match: {
    id: string
    title: string
    match_date: string
    start_time: string
    venue: string
    age_group: string
    compensation: number | null
    notes: string | null
  }
}
```

`AssignmentHistoryItem`（既存、`src/components/history/AssignmentHistory.tsx`）は変更なし。
