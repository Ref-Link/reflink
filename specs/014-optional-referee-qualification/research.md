# Research: 審判資格なしメンバー登録

## 変更が必要なファイル一覧

| ファイル | 変更種別 | 概要 |
|--------|---------|------|
| `src/types/database.ts` | 型変更 | `users.license_level` を `string \| null` に変更 |
| `src/app/api/profile/route.ts` | バリデーション緩和 | 初期作成時の必須フィールドを `display_name`, `region` のみに変更 |
| `src/components/profile/ProfileForm.tsx` | UI変更 | ライセンス・役割・年代の `required` 制約を削除、条件付き表示 |
| `src/app/admin/members/AdminMembersClient.tsx` | 表示修正 | ライセンスが `null` の場合「なし」と表示 |
| Supabase migration | DB変更 | `users.license_level` の NOT NULL 制約を削除 |

---

## 決定事項と根拠

### D-01: ロール自動判定をしない理由

**Decision**: コミュニティ参加申請時のロールはライセンス有無にかかわらず常に `referee` とする。ロール自動判定は行わない。

**Rationale**: 
- `organizer` / `manager` ロールは `getOrganizerMembership()` で管理者API認可に使われる。ライセンスなし = 自動的に `organizer` とすると、意図しない管理権限を付与するリスクがある
- 「ライセンスを持たない」ことと「コミュニティの運営者である」ことは独立した概念。混同すべきでない
- アサイン候補の除外は `users.role_type` が空配列であることで既に実現されており、`community_members.role` に依存しない

**Alternatives considered**:
- ライセンスなし → `organizer` 自動付与: 管理権限の誤付与リスクあり（却下）
- 新ロール `member` を追加: DBスキーマ変更が大きく、今回のスコープを超える（却下）

---

### D-02: `license_level` の nullable 化

**Decision**: DBカラム `users.license_level` の NOT NULL 制約を削除し `NULL` を許容する。空文字列 `''` は使わない。

**Rationale**:
- 「未登録」と「空文字」を区別できる
- `NULL` チェックによる条件分岐がシンプル
- 既存の候補者フィルタ (`overlaps('role_type', ...)`) は `role_type` ベースのため影響なし

**Migration SQL**:
```sql
ALTER TABLE users ALTER COLUMN license_level DROP NOT NULL;
```

---

### D-03: `role_type` / `age_groups` の扱い

**Decision**: `role_type` と `age_groups` は引き続き `string[]` (NOT NULL, default `'{}'`) とする。ライセンスなしの場合はフォームで非表示にし、DB には空配列 `[]` を保存する。

**Rationale**:
- `candidates` API のフィルタ (`overlaps('role_type', ['referee', 'assistant_referee'])`) が空配列に対しては false を返すため、運営者は自動的に候補から除外される
- NOT NULL + 空配列 はスキーマ変更最小で対応できる

---

### D-04: ProfileForm のUI変更方針

**Decision**: 
- `license_level` の `required` バリデーションを削除（フロント・バックエンド両方）
- `license_level` が空の場合、`role_type` と `age_groups` セクションを非表示にする
- `license_level` を入力したら `role_type` と `age_groups` が表示され、それらは必須となる

**Rationale**: 運営者ユーザーに不要な選択肢を見せない（Constitution III）

---

### D-05: 管理者画面の対応

**Decision**: `AdminMembersClient.tsx` のメンバー詳細にライセンス表示がある（line 127, 145）が、`null` の場合は「なし」と表示する。ロール表示は変更なし（全員 `referee` で登録されるため）。

**Rationale**: 管理者はライセンス欄の「なし」表示でライセンス未保有者を識別できる。ロールバッジによる識別ではなくプロフィールデータで判断する設計。

---

## 影響を受けないファイル

| ファイル | 理由 |
|--------|------|
| `src/app/api/matches/[id]/candidates/route.ts` | `role_type overlaps` フィルタでライセンスなしユーザーは自動除外（変更不要） |
| `src/app/api/communities/[id]/apply/route.ts` | ロールは引き続き `referee` のまま（変更不要） |
| `src/types/domain.ts` | 既存の型定義で対応可能 |
| LINE通知関連 | ライセンスなしユーザーはアサイン対象外のため影響なし |
