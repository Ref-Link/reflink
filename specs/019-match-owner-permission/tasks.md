# Tasks: 試合操作権限の限定（作成者＋マネージャー方針）

**Input**: Design documents from `specs/019-match-owner-permission/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/match-permission.md ✅

**Organization**: US1（organizer は自分の試合のみ操作）と US2（manager は全試合操作）は同一コード変更で実現されるため Phase 3 にまとめる。US3（代理確定者連絡先表示）は Phase 4。

---

## Phase 2: Foundational（全 User Story の前提条件）

**Purpose**: DBスキーマ変更と型定義の更新。すべての API 変更がこれに依存する。

**⚠️ CRITICAL**: Phase 2 完了前に Phase 3 以降を開始しない

- [ ] T001 `assignments` テーブルに `confirmed_by uuid REFERENCES public.users(id)` を追加するマイグレーションを `supabase/migrations/20260612000001_assignments_confirmed_by.sql` に作成する
- [ ] T002 `src/types/database.ts` の `assignments` テーブルの Row / Insert / Update 型に `confirmed_by: string | null` を追加する

**Checkpoint**: `supabase db push`（またはローカル `supabase start`）でマイグレーション適用後、assignments テーブルに confirmed_by カラムが存在することを確認する

---

## Phase 3: User Story 1 + 2 — API 権限チェック（Priority: P1）🎯 MVP

**Goal**: organizer は自分が作成した試合のみ閲覧・操作でき、manager はコミュニティ内全試合を操作できる

**Independent Test**: quickstart.md シナリオ 1（organizer 制限）・シナリオ 2（manager 全操作）・シナリオ 5（API 不正アクセス拒否）を手動で実行して確認する

### Implementation

- [ ] T003 [P] [US1] `src/app/api/matches/route.ts` の `GET` ハンドラで、`membership.role === 'organizer'` の場合に `.eq('created_by', user.id)` フィルタを追加し、manager は全件返すよう分岐を実装する
- [ ] T004 [P] [US1] `src/app/api/matches/[id]/route.ts` の `GET` ハンドラで、match 取得後に `isOwnerOrManager`（`membership.role === 'manager' || match.created_by === user.id`）チェックを追加し、非該当の場合は 404 を返す
- [ ] T005 [P] [US1] `src/app/api/matches/[id]/candidates/route.ts` の `GET` ハンドラで、match 取得後に同じ `isOwnerOrManager` チェックを追加し、非該当の場合は 404 を返す
- [ ] T006 [P] [US1] `src/app/api/matches/[id]/assignments/route.ts` の `POST` ハンドラで、match 取得後に同じ `isOwnerOrManager` チェックを追加し、非該当の場合は 404 を返す
- [ ] T007 [US1] `src/app/api/matches/[id]/assignments/[assignmentId]/confirm/route.ts` の `PATCH` ハンドラで、(1) match 取得後に `isOwnerOrManager` チェックを追加して非該当は 404、(2) 確定成功時の `assignments.update` に `confirmed_by: user.id` を追加する（T004 の ownership チェックパターンを踏襲）

**Checkpoint**: quickstart.md シナリオ 1・2・5 を実行し、organizer が他者の試合を操作できないこと、manager が全試合を操作できることを確認する

---

## Phase 4: User Story 3 — 代理確定者連絡先の取得と表示（Priority: P2）

**Goal**: manager が代理確定した場合、審判の担当履歴に試合作成者の連絡先に加えて代理確定者の連絡先も表示される

**Independent Test**: quickstart.md シナリオ 3（代理確定者連絡先の表示）・シナリオ 4（同一人確定時は非表示）を手動で実行して確認する

### Implementation

- [ ] T008 [US3] `src/app/api/assignments/route.ts` の `GET` ハンドラで、(1) assignments の select クエリに `confirmed_by` を追加、(2) `confirmed_by != null && confirmed_by !== match.created_by` のケースを検出して該当ユーザーの `phone_number` と `real_name` を取得し、(3) レスポンスの matches フィールドに `proxy_confirmer_phone: string | null` と `proxy_confirmer_name: string | null` を追加する
- [ ] T009 [US3] `src/components/history/AssignmentHistory.tsx` で、`AssignmentHistoryItem['matches']` 型に `proxy_confirmer_phone` と `proxy_confirmer_name` を追加し、`proxy_confirmer_phone` が非 null の場合に「代理確定者連絡先」ラベルと `<ContactInfo>` コンポーネントを既存の「運営者連絡先」ブロックの直下に追加表示する

**Checkpoint**: quickstart.md シナリオ 3・4 を実行し、代理確定時のみ連絡先が2件表示されることを確認する

---

## Phase 5: Polish

- [ ] T010 quickstart.md の全シナリオ（1〜5）を通して実行し、リグレッションがないことを確認する

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 2)**: 即座に開始可能 — Phase 3・4 をブロックする
- **Phase 3 (US1+US2)**: Phase 2 完了後に開始。T003〜T006 は並列実行可。T007 は T003〜T006 と独立したファイルのため並列実行可
- **Phase 4 (US3)**: Phase 3 完了後に開始（T007 で `confirmed_by` が保存されるため）。T008 → T009 の順
- **Phase 5 (Polish)**: Phase 4 完了後

### Parallel Opportunities

```bash
# Phase 3 は T003〜T007 を並列実行可能（すべて別ファイル）:
T003: src/app/api/matches/route.ts
T004: src/app/api/matches/[id]/route.ts
T005: src/app/api/matches/[id]/candidates/route.ts
T006: src/app/api/matches/[id]/assignments/route.ts
T007: src/app/api/matches/[id]/assignments/[assignmentId]/confirm/route.ts
```

---

## Implementation Strategy

### MVP First（Phase 2 + Phase 3 のみ）

1. Phase 2 完了（T001, T002）
2. Phase 3 完了（T003〜T007）
3. シナリオ 1・2・5 で動作確認
4. この時点で P1 の仕様がすべて満たされ、リリース可能

### Incremental Delivery

1. Phase 2 → Phase 3 → MVP リリース
2. Phase 4（代理確定者連絡先） → シナリオ 3・4 で確認 → 追加リリース

---

## Notes

- `isOwnerOrManager` チェックは各 route 内のインラインで実装する（共通ヘルパー化は不要）
- 権限なしは **403 ではなく 404** を返す（試合の存在を漏らさないため）
- `GET /api/matches` のみ挙動が異なる（リスト絞り込みのためエラーを返さない）
- 既存の admin 画面ページ（page.tsx）は変更不要（API で絞るため自動的に反映）
