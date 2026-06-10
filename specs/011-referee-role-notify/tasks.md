# Tasks: 審判依頼通知のロール選択UX改善

**Input**: Design documents from `/specs/011-referee-role-notify/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/assignments-api.md ✅

**Organization**: Tasks grouped by user story. No DB migration required. 4 existing files changed only.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no shared dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2)

---

## Phase 1: Setup

**Purpose**: Project structure check — existing project, no initialization needed.

_既存プロジェクトへの局所変更のみ。新規ファイル・依存追加・DBマイグレーション不要。_

- [x] T001 Confirm 4 target files exist and review current state: `src/components/matches/CandidateList.tsx`, `src/app/admin/matches/[id]/page.tsx`, `src/lib/line/messages.ts`, `src/app/api/matches/[id]/assignments/route.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: No shared foundational changes required.

_`RefereeRole` 型は `src/types/domain.ts` に既存。`assignments.role` カラムは既存。追加の基盤作業なし。_

**Checkpoint**: Phase 1 完了後、Phase 3 と Phase 4 を並行開始可能。

---

## Phase 3: User Story 1 - 候補者ごとにロールを指定して通知送信 (Priority: P1) 🎯 MVP

**Goal**: 主催者が各候補者を主審・副審のどちらとして依頼するかを明示的に指定でき、指定したロールでアサインレコードが作成される

**Independent Test**: 主審・副審両方に対応する審判候補を選択し、「副審」を選択後に通知送信した際に、アサイン一覧で「副審」と表示されることを確認する（spec.md US1 の Independent Test）

### Implementation for User Story 1

- [x] T002 [P] [US1] `CandidateListProps` インターフェースに `selectedRoles?: Map<string, 'referee' | 'assistant_referee'>`, `matchRecruitedRoles?: RefereeRole[]`, `onRoleChange?: (id: string, role: 'referee' | 'assistant_referee') => void` を追加する `src/components/matches/CandidateList.tsx`
- [x] T003 [P] [US1] `src/app/admin/matches/[id]/page.tsx` に `selectedRoles: Map<string, 'referee' | 'assistant_referee'>` ステートと `matchRecruitedRoles` 計算（`match.referees_needed > 0 ? ['referee'] : []` + `match.assistants_needed > 0 ? ['assistant_referee'] : []`）を追加する
- [x] T004 [US1] `src/components/matches/CandidateList.tsx` に、選択済み候補でかつ `availableRoles.length === 2` の場合にインライン表示するロールピッカー（主審/副審 2ボタントグル、min-h-[44px]）を追加する（T002 に依存）
- [x] T005 [US1] `src/app/admin/matches/[id]/page.tsx` の `handleToggleSelect` を修正する: チェックON時に `availableRolesFor(candidate, matchRecruitedRoles).length === 1` なら自動で `selectedRoles` に設定、チェックOFF時に `selectedRoles` から削除（T003 に依存）
- [x] T006 [US1] `src/app/admin/matches/[id]/page.tsx` に `notifyReady` 計算（`selectedIds.size > 0 && Array.from(selectedIds).every(id => selectedRoles.has(id))`）を追加し、送信ボタンの `disabled` 条件を `!notifyReady || notifying` に変更し、ボタンラベルを選択内容（例: `主審1名・副審1名に通知を送る`）を反映するよう更新する（T005 に依存）
- [x] T007 [US1] `src/app/admin/matches/[id]/page.tsx` の `handleNotify` 内のロール決定ロジックを `selectedRoles.get(userId)` に置き換える（現行の `role_type.includes('referee') ? 'referee' : 'assistant_referee'` を削除）（T006 に依存）
- [x] T008 [US1] `src/app/admin/matches/[id]/page.tsx` の `<CandidateList>` JSXに `selectedRoles`, `matchRecruitedRoles`, `onRoleChange` props を渡すよう更新する（T004, T007 に依存）

**Checkpoint**: User Story 1 完了後 — 候補選択→ロール指定→通知送信→アサイン一覧でロール確認が独立してテスト可能

---

## Phase 4: User Story 2 - ロールに応じた通知文言の表示 (Priority: P2)

**Goal**: LINEで受け取る通知のヘッダーが主審依頼の場合は「【主審募集】」、副審依頼の場合は「【副審募集】」と表示される

**Independent Test**: 主審として通知送信した審判員のLINEに「【主審募集】」、副審として通知送信した審判員のLINEに「【副審募集】」が表示されることを確認する（spec.md US2 の Independent Test）

### Implementation for User Story 2

- [x] T009 [P] [US2] `src/lib/line/messages.ts` の `MatchNotificationParams` に `role: 'referee' | 'assistant_referee'` を追加し、ヘッダーテキストを `role === 'referee' ? '【主審募集】' : '【副審募集】'` に、`altText` を `${role === 'referee' ? '【主審募集】' : '【副審募集】'}${title} ${dateFormatted}` に変更する
- [x] T010 [US2] `src/app/api/matches/[id]/assignments/route.ts` の `buildMatchNotificationMessage` 呼び出しに `role` を追加する: `buildMatchNotificationMessage({ ..., role: role as 'referee' | 'assistant_referee' })`（T009 に依存）

**Checkpoint**: User Story 1 AND 2 の組み合わせで、選択したロールがLINE通知ヘッダーに反映されることを確認できる

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: 受け入れシナリオ全件の手動確認と軽微な調整

- [ ] T011 spec.md US1 の受け入れシナリオ1〜6を手動確認する（主審のみ対応候補、副審のみ対応候補、両対応候補、試合が主審のみ募集、副審のみ募集の各ケース）
- [ ] T012 spec.md US2 の受け入れシナリオ1〜3を手動確認する（LINE通知のヘッダーとトーク一覧プレビューの文言）
- [ ] T013 [P] エッジケース確認: `role_type` が空の候補が候補リストに表示されないこと、同一審判員への重複送信がブロックされること

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: 即開始可
- **Phase 2 (Foundational)**: スキップ — 追加の基盤作業なし
- **Phase 3 (US1)**: Phase 1 完了後に開始可
- **Phase 4 (US2)**: Phase 1 完了後に開始可（Phase 3 と並行可能）
- **Phase 5 (Polish)**: Phase 3 AND Phase 4 完了後

### User Story Dependencies

- **US1 (P1)**: Phase 1 完了後に即開始
- **US2 (P2)**: Phase 1 完了後に即開始（US1 と並行可）
  - T009 (`messages.ts`) は T002〜T008 と独立
  - T010 (`route.ts`) は T009 の完了後のみ必要

### Within US1 (sequential constraints in page.tsx)

```
T002 (CandidateList props) ─┐
T003 (page.tsx state)       ├─→ T004 (role picker UI) ──→ T008 (wire props)
                            └─→ T005 (handleToggleSelect)
                                 └─→ T006 (notifyReady + button)
                                      └─→ T007 (handleNotify fix)
                                           └─→ T008 (wire props)
```

### Parallel Opportunities

- T002 と T003 は異なるファイルのため並行実行可
- T009 は US1 の全タスクと並行実行可

---

## Parallel Example: User Story 1 + 2 同時進行

```
# 開発者1: US1 (UI)
Task T002: CandidateList props interface update
Task T003: page.tsx selectedRoles state + matchRecruitedRoles

# 開発者2: US2 (LINE通知)（並行）
Task T009: messages.ts role param + header/altText update
```

---

## Implementation Strategy

### MVP First (User Story 1 のみ)

1. Phase 1: T001 実行
2. Phase 3: T002〜T008 を順次実行
3. **STOP and VALIDATE**: US1 の Independent Test を実行
4. アサイン一覧でロールが正しく記録されることを確認

### Incremental Delivery

1. US1 完了 → デプロイ → アサイン記録の正確性が担保される（主な価値）
2. US2 完了（T009〜T010）→ デプロイ → LINE通知の文言改善が追加される

---

## Notes

- [P] タスク = 異なるファイル・相互依存なし
- `page.tsx` の変更（T003, T005, T006, T007, T008）は同一ファイル内のため順次実行
- `CandidateList.tsx` の変更（T002, T004）は T002 を先に完了させてから T004 を実行
- 現行の `handleNotify` バグ（両対応候補を常に主審として送信）は T007 で修正される
- テストタスクは本 spec で明示的に要求されていないため省略
