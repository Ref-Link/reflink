# Data Model: RefLink MVP

**Branch**: `001-mvp-implementation` | **Date**: 2026-05-29

---

## Entity Overview

```
users ──────────────────────────────────────────────────────┐
  │ 1                                                        │
  │ ∞                                                        │
community_members ── ∞──── 1 ── regional_communities         │
                                      │ 1                    │
                                      │ ∞                    │
                                    matches ──── ∞── assignments ── 1 ── users
                                      │
                              (availability check)
                                      │
                              availabilities ── ∞── 1 ── users
```

---

## Tables

### `users`

Supabase Auth の `auth.users` を参照する公開プロフィール拡張テーブル。

| カラム | 型 | 制約 | 説明 |
|--------|----|------|------|
| `id` | `uuid` | PK, FK → auth.users.id | Supabase Auth と同一 ID |
| `display_name` | `text` | NOT NULL | 表示名（ニックネーム可） |
| `real_name` | `text` | NULLABLE | 実名（アサイン確定後のみ開示） |
| `line_user_id` | `text` | UNIQUE, NULLABLE | LINE Messaging API の宛先 |
| `license_level` | `text` | NOT NULL | 審判ライセンス（例: S級, 1級, 2級, 3級, 4級） |
| `role_type` | `text[]` | NOT NULL | 役割（`referee`, `assistant_referee`, `both`） |
| `age_groups` | `text[]` | NOT NULL | 対応年代（例: `['U12','U15','U18','Senior']`） |
| `region` | `text` | NOT NULL | 活動地域（例: 愛知西部） |
| `travel_range_km` | `integer` | NULLABLE | 移動可能範囲（km） |
| `experience_years` | `integer` | NULLABLE | 経験年数 |
| `referred_by` | `uuid` | NULLABLE, FK → users.id | 紹介元ユーザー |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT now() | |
| `updated_at` | `timestamptz` | NOT NULL, DEFAULT now() | |

**Validation rules**:
- `license_level` は定義済みの値リストから選択
- `role_type` は少なくとも1つの値を持つ
- `age_groups` は少なくとも1つの値を持つ

---

### `regional_communities`

地域単位のコミュニティ。

| カラム | 型 | 制約 | 説明 |
|--------|----|------|------|
| `id` | `uuid` | PK, DEFAULT gen_random_uuid() | |
| `name` | `text` | NOT NULL, UNIQUE | 例: 愛知西部U15 |
| `region` | `text` | NOT NULL | 対象地域 |
| `description` | `text` | NULLABLE | コミュニティの説明 |
| `created_by` | `uuid` | NOT NULL, FK → users.id | 作成者（初期管理者） |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT now() | |

---

### `community_members`

コミュニティへのメンバーシップ（招待制 / 管理者承認制）。

| カラム | 型 | 制約 | 説明 |
|--------|----|------|------|
| `id` | `uuid` | PK, DEFAULT gen_random_uuid() | |
| `community_id` | `uuid` | NOT NULL, FK → regional_communities.id | |
| `user_id` | `uuid` | NOT NULL, FK → users.id | |
| `role` | `text` | NOT NULL | `referee` / `organizer` / `manager` |
| `status` | `text` | NOT NULL, DEFAULT 'pending' | `pending` / `approved` / `rejected` |
| `approved_by` | `uuid` | NULLABLE, FK → users.id | 承認した管理者 |
| `approved_at` | `timestamptz` | NULLABLE | |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT now() | |

**Unique constraint**: `(community_id, user_id)`

**Status transitions**:
```
pending → approved (by manager)
pending → rejected (by manager)
```

**RLS policies**:
- `manager` ロールのメンバーが `pending` 申請を `approved` / `rejected` に更新可能
- ユーザー本人は自身の `status` を閲覧可能
- `approved` メンバーは同一コミュニティの `approved` メンバー一覧を閲覧可能

---

### `availabilities`

審判の空き日程。

| カラム | 型 | 制約 | 説明 |
|--------|----|------|------|
| `id` | `uuid` | PK, DEFAULT gen_random_uuid() | |
| `user_id` | `uuid` | NOT NULL, FK → users.id | |
| `date` | `date` | NOT NULL | 対応可能日 |
| `start_time` | `time` | NULLABLE | 開始時間（null = 終日） |
| `end_time` | `time` | NULLABLE | 終了時間 |
| `age_groups` | `text[]` | NOT NULL | 対応可能年代 |
| `notes` | `text` | NULLABLE | 備考 |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT now() | |

**Validation rules**:
- `end_time` は `start_time` より後でなければならない（両方指定の場合）
- `date` は過去日を登録不可

---

### `matches`

試合情報。

| カラム | 型 | 制約 | 説明 |
|--------|----|------|------|
| `id` | `uuid` | PK, DEFAULT gen_random_uuid() | |
| `community_id` | `uuid` | NOT NULL, FK → regional_communities.id | |
| `created_by` | `uuid` | NOT NULL, FK → users.id | 作成した運営者 |
| `title` | `text` | NOT NULL | 試合名（例: U15リーグ 第3節） |
| `match_date` | `date` | NOT NULL | 試合日 |
| `start_time` | `time` | NOT NULL | 開始時間 |
| `venue` | `text` | NOT NULL | 会場名・場所 |
| `age_group` | `text` | NOT NULL | 対象年代 |
| `referees_needed` | `integer` | NOT NULL, DEFAULT 1 | 主審の必要人数 |
| `assistants_needed` | `integer` | NOT NULL, DEFAULT 2 | 副審の必要人数 |
| `compensation` | `integer` | NULLABLE | 報酬額（円） |
| `notes` | `text` | NULLABLE | 備考 |
| `status` | `text` | NOT NULL, DEFAULT 'open' | `open` / `filled` / `cancelled` |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT now() | |
| `updated_at` | `timestamptz` | NOT NULL, DEFAULT now() | |

---

### `assignments`

試合と審判のマッチング状態。

| カラム | 型 | 制約 | 説明 |
|--------|----|------|------|
| `id` | `uuid` | PK, DEFAULT gen_random_uuid() | |
| `match_id` | `uuid` | NOT NULL, FK → matches.id | |
| `user_id` | `uuid` | NOT NULL, FK → users.id | 審判 |
| `role` | `text` | NOT NULL | `referee` / `assistant_referee` |
| `status` | `text` | NOT NULL, DEFAULT 'notified' | `notified` / `accepted` / `declined` / `confirmed` |
| `notified_at` | `timestamptz` | NULLABLE | LINE 通知送信日時 |
| `responded_at` | `timestamptz` | NULLABLE | 審判が回答した日時 |
| `confirmed_at` | `timestamptz` | NULLABLE | 運営者が確定した日時 |
| `reminder_sent_at` | `timestamptz` | NULLABLE | リマインダー送信日時 |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT now() | |

**Unique constraint**: `(match_id, user_id)`

**Status transitions**:
```
notified → accepted  (審判がLINEで「参加」タップ)
notified → declined  (審判がLINEで「辞退」タップ)
accepted → confirmed (運営者がアサイン確定)
confirmed → notified (試合キャンセル後の再通知 — 将来拡張)
```

**RLS policies**:
- 運営者は自コミュニティ内の assignments を作成・閲覧可能
- 審判は自分に関連する assignments のみ閲覧可能
- `confirmed` 状態の assignment は関係する審判・運営者が互いの profile（実名含む）を閲覧可能

---

## インデックス設計

```sql
-- 空き日程の高速検索
CREATE INDEX idx_availabilities_user_date ON availabilities(user_id, date);
CREATE INDEX idx_availabilities_date ON availabilities(date);

-- アサイン状況の検索
CREATE INDEX idx_assignments_match_id ON assignments(match_id);
CREATE INDEX idx_assignments_user_id ON assignments(user_id);
CREATE INDEX idx_assignments_status ON assignments(status);

-- 試合の日付検索（リマインダー用）
CREATE INDEX idx_matches_match_date ON matches(match_date);
CREATE INDEX idx_matches_community_status ON matches(community_id, status);

-- コミュニティメンバー検索
CREATE INDEX idx_community_members_community_status ON community_members(community_id, status);
```

---

## 信頼可視化（Constitution Principle V 準拠）

評点なし。以下のクエリで審判の信頼情報を算出:

```sql
-- 担当履歴サマリー (assignments + matches JOIN)
SELECT
  u.id,
  u.display_name,
  COUNT(a.id) AS total_assignments,
  COUNT(DISTINCT m.age_group) AS age_groups_covered,
  MAX(m.match_date) AS last_active_date,
  u.referred_by
FROM users u
JOIN assignments a ON a.user_id = u.id AND a.status = 'confirmed'
JOIN matches m ON m.id = a.match_id
GROUP BY u.id;
```
