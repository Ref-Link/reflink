# Tasks: 審判確定人数の上限チェック

**Input**: Design documents from `specs/015-referee-count-limit/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: 手動テストのみ（quickstart.md）。自動テストは本機能の対象外。

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2)

---

## Phase 1 & 2: Setup / Foundational

**スキップ**: DB マイグレーションなし、新規パッケージなし、新規ファイルなし。
既存の2ファイルを変更するのみ。ユーザーストーリー実装フェーズへ直進。

---

## Phase 3: User Story 1 - 募集人数を超えた審判確定の防止 (Priority: P1) 🎯 MVP

**Goal**: 確定APIが同ロールの確定済み件数を検証し、上限到達時に 409 SLOT_FULL を返す

**Independent Test**: 主審1名募集の試合で1名確定済みの状態で2人目の確定リクエストを送ると HTTP 409・`SLOT_FULL` が返ること（quickstart.md シナリオ4）

### Implementation for User Story 1

- [x] T001 [US1] `src/app/api/matches/[id]/assignments/[assignmentId]/confirm/route.ts` の assignment select クエリを `.select('id, user_id, match_id, status, role')` に変更する
- [x] T002 [US1] `src/app/api/matches/[id]/assignments/[assignmentId]/confirm/route.ts` の `status === 'confirmed'` チェック直後（L58付近）に、対象ロールの確定済み件数カウントクエリを追加し、`match.referees_needed`（role=referee）または `match.assistants_needed`（role=assistant_referee）以上であれば `{ error: 'SLOT_FULL', message: '<ロール名>の確定人数が募集人数に達しています' }` を HTTP 409 で返す

**Checkpoint**: この時点でAPIレベルの過剰確定が防止できること。quickstart.md シナリオ1・4で検証可能。

---

## Phase 4: User Story 2 - 管理画面での確定可否の視覚的フィードバック (Priority: P2)

**Goal**: アサイン状況画面でロール別確定済み件数が上限に達した場合、確定ボタンが非活性になる

**Independent Test**: 主審1名確定後に残りの主審候補の確定ボタンがグレーアウトし、副審ボタンは活性のまま（quickstart.md シナリオ2）

### Implementation for User Story 2

- [x] T003 [P] [US2] `src/app/admin/matches/[id]/assignments/page.tsx` の `counts` 計算ブロック付近に、ロール別確定済み件数の計算を追加する（`confirmedByRole = { referee: assignments.filter(...).length, assistant_referee: ... }`）
- [x] T004 [US2] `src/app/admin/matches/[id]/assignments/page.tsx` に `isSlotFull(role: string): boolean` ヘルパーを追加し（match が null なら false、referee なら confirmedByRole.referee >= match.referees_needed）、確定ボタンの `disabled` 属性に `|| isSlotFull(assignment.role)` を追加する（T003 に依存）
- [x] T005 [P] [US2] `src/app/admin/matches/[id]/assignments/page.tsx` の `handleConfirm` 内エラー分岐に `SLOT_FULL` ケースを追加し、「〇〇の確定人数が募集人数に達しています」を `setErrorMessage` で表示する

**Checkpoint**: この時点で UI からも過剰確定が抑止できること。quickstart.md シナリオ1〜3で総合検証可能。

---

## Phase 5: Polish & Validation

- [ ] T006 quickstart.md の全シナリオ（シナリオ1〜3）を手動実行し、動作を確認する

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 3 (US1)**: 依存なし — 即座に開始可能
- **Phase 4 (US2)**: Phase 3 完了推奨だが独立実装・独立テスト可能（異なるファイルのため）
- **Phase 5**: Phase 3・4 の完了後

### User Story Dependencies

- **US1**: 独立。Phase 3 のみで完結。
- **US2**: US1 のバックエンドチェックに論理的に依存するが、ファイルが異なるため並行実装は可能。

### Parallel Opportunities

- T003・T005 は同一ファイルだが異なる箇所のため [P] マークあり。T004 は T003 完了後に実施。
- US1（T001・T002）と US2（T003・T005）は**別ファイル**なので並行作業が可能。

---

## Parallel Example

```bash
# US1 と US2 を並行して着手する場合:
Task A: T001 + T002  →  confirm/route.ts の修正
Task B: T003 + T005  →  assignments/page.tsx の非依存部分の修正
# T004 は T003 完了後に着手
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. T001・T002 を実施（確定APIにカウントチェック追加）
2. quickstart.md シナリオ1・4で手動検証
3. **STOP and VALIDATE**: APIレベルの防止が確認できたらリリース可能

### Incremental Delivery

1. T001・T002 → API防止（US1完了）→ デプロイ可能
2. T003・T004・T005 → UI改善（US2完了）→ UX向上
3. T006 → 全シナリオ手動テストで品質確認

---

## Notes

- 変更ファイルは2つのみ（`confirm/route.ts`, `assignments/page.tsx`）
- DB変更・新規ファイル・新規パッケージは一切不要
- `assignment.role` は既存フィールドで必ず `'referee'` または `'assistant_referee'` のいずれか
- バックエンドチェック（US1）が必須の防衛ライン、フロントエンド（US2）は追加のUX改善
