# Quickstart: 審判資格なしメンバー登録

## 実装順序（依存関係順）

### Step 1: DBマイグレーション

Supabase SQL Editorで実行：

```sql
ALTER TABLE users ALTER COLUMN license_level DROP NOT NULL;
ALTER TABLE users ALTER COLUMN role_type SET DEFAULT '{}';
ALTER TABLE users ALTER COLUMN age_groups SET DEFAULT '{}';
```

### Step 2: 型定義更新

`src/types/database.ts`:
- `users.Row.license_level`: `string` → `string | null`
- `users.Insert.license_level`: `string` → `string | null`（optional化）
- `users.Insert.role_type`: optional化（`role_type?: string[]`）
- `users.Insert.age_groups`: optional化（`age_groups?: string[]`）

### Step 3: Profile API のバリデーション変更

`src/app/api/profile/route.ts` の初期作成バリデーション：
- 変更前: `!display_name || !license_level || !role_type?.length || !age_groups?.length || !region`
- 変更後: `!display_name || !region`（ライセンスあり時のみ role_type/age_groups チェックを追加）

### Step 4: ProfileForm の UI 変更

`src/components/profile/ProfileForm.tsx`:
- `license_level` の `required` バリデーション削除
- `role_type`・`age_groups` の `required` バリデーションを「ライセンスあり時のみ」に変更
- ライセンスなし時は `role_type` と `age_groups` セクションを非表示に

### Step 5: AdminMembersClient のライセンス表示修正

`src/app/admin/members/AdminMembersClient.tsx`:
- ライセンス表示箇所（line 127, 145）を `null` 対応（`member.users.license_level ?? 'なし'`）

> **apply/route.ts は変更不要**: ロールは引き続き `referee` 固定。`organizer` / `manager` は管理者が手動付与する管理権限ロールであり、ライセンス有無と混同しない。アサイン候補除外は `candidates` API の `role_type overlaps` フィルタで既に実現されている。

---

## テスト手順

### 新規ユーザー（審判ライセンスなし）のフロー

1. 新規ユーザーとしてログイン
2. プロフィール登録画面で **表示名・地域のみ** 入力（ライセンス空欄）
3. 保存 → 成功すること
4. コミュニティ一覧 → 参加申請 → 申請受理されること（ロールは `referee`）
5. 管理者画面でライセンス欄が「なし」と表示されること
6. 承認後、試合アサイン候補一覧に表示されないこと

### 既存ユーザー（審判ライセンスあり）のリグレッション確認

1. ライセンスありのユーザーでプロフィール登録 → 従来通り保存できること
2. コミュニティ参加申請 → ロールが `referee` であること（変更なし）
3. 承認後、アサイン候補に表示されること
