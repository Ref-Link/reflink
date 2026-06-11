---

description: "Task list for 審判資格なしメンバー登録"
---

# Tasks: 審判資格なしメンバー登録

**Input**: Design documents from `specs/014-optional-referee-qualification/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api-changes.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)

---

## Phase 1: Setup (Blocking Prerequisites)

**Purpose**: DBマイグレーションと型定義の更新。すべてのユーザーストーリーの実装前に完了必須。

**⚠️ CRITICAL**: このフェーズが完了するまでユーザーストーリーの実装を開始しない

- [ ] T001 Supabase SQL Editorで `ALTER TABLE users ALTER COLUMN license_level DROP NOT NULL;` を実行し `users.license_level` の NOT NULL 制約を削除する
- [ ] T002 [P] `src/types/database.ts` の `users.Row.license_level` を `string | null` に変更し、`users.Insert` の `license_level` を `license_level?: string | null`、`role_type` を `role_type?: string[]`、`age_groups` を `age_groups?: string[]` に変更する

**Checkpoint**: DBとTypeScriptの型が一致した状態になり、コンパイルエラーが解消されること

---

## Phase 2: User Story 1 - 審判資格なしでプロフィール登録 (Priority: P1) 🎯 MVP

**Goal**: ライセンスなしユーザーが表示名・地域のみでプロフィールを保存し、コミュニティ参加申請まで完了できる

**Independent Test**: 新規ユーザーとしてログインし、審判ライセンスを空欄のままプロフィール保存 → コミュニティ参加申請が「審査中」になること。既存ライセンスありユーザーのフローも変わらないこと。

### Implementation for User Story 1

- [ ] T003 [US1] `src/app/api/profile/route.ts` の初期作成バリデーション（line 63）を `!display_name || !region` のみに変更し、`license_level` が指定された場合のみ `role_type?.length` と `age_groups?.length` も検証するよう修正する
- [ ] T004 [US1] `src/components/profile/ProfileForm.tsx` の `handleSubmit` からライセンスの必須バリデーション（line 63–65 の `!formData.license_level` ブロック）を削除し、役割・年代の必須バリデーション（line 67–73）を「`formData.license_level` が設定されている場合のみ」に変更する。また select 要素の `required` 属性（line 152）を削除する

**Checkpoint**: ライセンス空欄でプロフィール保存・コミュニティ申請が完了し、ライセンスありユーザーは従来通り動作すること

---

## Phase 3: User Story 2 - 管理者がライセンス状況を確認しながらメンバーを承認 (Priority: P2)

**Goal**: 管理者がメンバー管理画面でライセンスなしメンバーを「なし」と識別でき、承認後もアサイン候補に含まれないことが保証される

**Independent Test**: ライセンスなしユーザーを承認後、管理者のメンバー詳細でライセンス欄が「なし」と表示される。試合アサイン候補一覧にそのメンバーが現れない。

### Implementation for User Story 2

- [ ] T005 [US2] `src/app/admin/members/AdminMembersClient.tsx` のメンバー概要表示（line 127）を `{member.users.license_level ?? 'なし'} · {member.users.region}` に変更し、詳細展開時のライセンス表示（line 145）も `{member.users.license_level ?? 'なし'}` に変更する

**Checkpoint**: 管理画面でライセンスなしメンバーに「なし」と表示され、アサイン候補APIの既存フィルタ（`role_type overlaps`）により候補に表示されないこと

---

## Phase 4: User Story 3 - 運営者ユーザーに最適化されたプロフィール画面 (Priority: P3)

**Goal**: ライセンスなしユーザーのプロフィール画面で「担当役割」「対応年代」セクションを非表示にし、入力負荷を軽減する

**Independent Test**: ライセンスなしで登録したユーザーのプロフィール編集画面を開くと担当役割・対応年代セクションが表示されない。ライセンスを追加入力すると両セクションが表示される。

### Implementation for User Story 3

- [ ] T006 [US3] `src/components/profile/ProfileForm.tsx` の担当役割 `<fieldset>` ブロック（line 162–183）と対応年代 `<fieldset>` ブロック（line 185–206）を `formData.license_level` が設定されている場合のみ表示する条件付きレンダリングに変更する

**Checkpoint**: ライセンス空欄時に両セクションが非表示、ライセンス選択後に表示されること

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: リグレッション検証と仕上げ

- [ ] T007 `specs/014-optional-referee-qualification/quickstart.md` のテスト手順（新規ユーザーフロー・リグレッション確認）を手動で実施し、全シナリオが期待通り動作することを確認する

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 依存なし。即時開始可能
- **User Stories (Phase 2–4)**: Phase 1 完了後に開始可能
  - T003 と T004 は Phase 1 完了後に並行実行可能
  - T005 は T003/T004 に依存しない（別ファイル）
  - T006 は T004 の変更を拡張するため T004 完了後に実施
- **Polish (Phase 5)**: 全ストーリー完了後

### User Story Dependencies

- **US1 (P1)**: Phase 1 完了後に開始（他ストーリーへの依存なし）
- **US2 (P2)**: Phase 1 完了後に開始（US1 に依存しない）
- **US3 (P3)**: T004 完了後に開始（同一ファイルへの拡張変更）

### Parallel Opportunities

- **T001 と T002**: T001 は SQL 実行、T002 は型定義変更。独立しているため並行可能
- **T003 と T005**: 異なるファイルのため並行可能（Phase 1 完了後）
- **T004 と T005**: 異なるファイルのため並行可能

---

## Parallel Example: Phase 1

```
並行実行可能:
  T001: Supabase SQL Editor でマイグレーション実行
  T002: src/types/database.ts の型定義更新
```

## Parallel Example: Phase 2 + Phase 3 (Phase 1 完了後)

```
並行実行可能:
  T003: src/app/api/profile/route.ts のバリデーション変更
  T005: src/app/admin/members/AdminMembersClient.tsx の表示修正
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1: DBマイグレーション + 型定義（T001, T002）
2. Phase 2: US1 実装（T003, T004）
3. **STOP and VALIDATE**: ライセンスなしユーザーがプロフィール登録・申請できること

### Incremental Delivery

1. T001 + T002 → 基盤準備
2. T003 + T004 → US1 完了（ライセンスなし登録可能）
3. T005 → US2 完了（管理者がライセンス状況識別可能）
4. T006 → US3 完了（プロフィール画面最適化）
5. T007 → 全シナリオ検証

---

## Notes

- [P] tasks = 異なるファイル、依存関係なし
- [Story] label はトレーサビリティのためユーザーストーリーにマッピング
- T003 と T004 は ProfileForm の同一ファイルへの変更があるため順序通り実施（T003 は API のみ）
- `apply/route.ts` は変更不要（ロールは引き続き `referee` 固定）
- アサイン候補除外の動作確認は T007 で実施（既存フィルタで自動保証）
