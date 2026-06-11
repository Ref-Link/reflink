# Data Model: 審判資格なしメンバー登録

## 変更対象エンティティ

### users テーブル

| フィールド | 変更前 | 変更後 | 備考 |
|-----------|--------|--------|------|
| `license_level` | `TEXT NOT NULL` | `TEXT NULL` | 審判ライセンスなし時は NULL |
| `role_type` | `TEXT[] NOT NULL` | `TEXT[] NOT NULL DEFAULT '{}'` | 運営者登録時は空配列 |
| `age_groups` | `TEXT[] NOT NULL` | `TEXT[] NOT NULL DEFAULT '{}'` | 運営者登録時は空配列 |

**Migration SQL**:
```sql
ALTER TABLE users ALTER COLUMN license_level DROP NOT NULL;
ALTER TABLE users ALTER COLUMN role_type SET DEFAULT '{}';
ALTER TABLE users ALTER COLUMN age_groups SET DEFAULT '{}';
```

### community_members テーブル

変更なし。`role` フィールドは既に `'referee' | 'organizer' | 'manager'` の3値を持つ。

---

## 型定義の変更（src/types/database.ts）

```ts
// Before
users: {
  Row: {
    license_level: string       // NOT NULL
    role_type: string[]
    age_groups: string[]
  }
  Insert: {
    license_level: string       // required
    role_type: string[]         // required
    age_groups: string[]        // required
  }
}

// After
users: {
  Row: {
    license_level: string | null  // nullable
    role_type: string[]
    age_groups: string[]
  }
  Insert: {
    license_level?: string | null  // optional, nullable
    role_type?: string[]           // optional, defaults to []
    age_groups?: string[]          // optional, defaults to []
  }
}
```

---

## ロール設計方針

コミュニティ参加申請時のロールはライセンス有無にかかわらず常に `referee`。

- `organizer` / `manager` は管理者が手動付与する管理権限ロール
- アサイン候補の除外はロールではなくプロフィールの `role_type` で決定する

### アサイン候補フィルタ（変更なし）

`candidates` API はすでに以下のフィルタを使用しており、`role_type` が空配列の運営者は自動的に除外される：

```ts
.overlaps('role_type', ['referee', 'assistant_referee'])
```

---

## バリデーションルール

### プロフィール初期作成（PATCH /api/profile）

| フィールド | 変更前 | 変更後 |
|-----------|--------|--------|
| `display_name` | 必須 | 必須（変更なし） |
| `license_level` | 必須 | 任意 |
| `role_type` | 必須（1件以上） | 任意（ライセンスあり時は必須） |
| `age_groups` | 必須（1件以上） | 任意（ライセンスあり時は必須） |
| `region` | 必須 | 必須（変更なし） |

**ライセンスあり時のみ適用されるバリデーション**:
- `license_level` を入力した場合 → `role_type` と `age_groups` も必須
