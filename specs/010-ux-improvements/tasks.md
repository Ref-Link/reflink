# Tasks: UX改善（審判・運営者）

**Input**: Design documents from `/specs/010-ux-improvements/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Organization**: Tasks are grouped by user story (priority order: P1 → P2) to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1–US6)
- No automated tests in this project — test tasks omitted

---

## Phase 1: Setup

**Purpose**: No new infrastructure required. All 6 stories are pure UI + API changes with no schema migrations or new directories.

*(No setup tasks — proceed directly to user story phases)*

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: No blocking prerequisites. All user stories are independent and can be worked in any order after the foundation check.

**Checkpoint**: Proceed directly to Phase 3 (all stories can start independently)

---

## Phase 3: User Story 1 — 空き日程登録時の対応年代を自動プリセット (Priority: P1) 🎯 MVP

**Goal**: プロフィールに登録された対応年代が空き日程追加フォームの初期値として反映される。

**Independent Test**: プロフィールに U15・U18 を設定した審判が空き日程追加フォームを開くと、U15・U18 ボタンが選択済みで表示される。フォームリセット後も同様。

- [X] T001 [US1] `AvailabilityCalendar` に `defaultAgeGroups: string[]` prop を追加し、`selectedAgeGroups` の初期値をそれで初期化、フォームリセット後も `defaultAgeGroups` に戻すよう変更 — `src/components/availability/AvailabilityCalendar.tsx`
- [X] T002 [US1] `AvailabilityPage` の mount 時に `GET /api/profile` を呼び出し `profile.age_groups` を取得して `<AvailabilityCalendar defaultAgeGroups={...} />` に渡す（profile 未取得中は空配列） — `src/app/(referee)/availability/page.tsx`

**Checkpoint**: User Story 1 完了。審判が空き日程フォームを開くと対応年代がプリセットされる。

---

## Phase 4: User Story 4 — 試合一覧・詳細で確定済み審判人数を即時確認 (Priority: P1)

**Goal**: 運営者の試合一覧・詳細画面に「確定数 / 必要数」が表示される。

**Independent Test**: 試合一覧で各試合カードの右下に「主審 1/1名」「副審 0/2名」のような表示があることを確認。詳細画面の必要人数セクションでも同様。

- [X] T003 [P] [US4] `GET /api/matches` で matches 取得後、match id 一覧で assignments を一括クエリし `confirmed_referees` / `confirmed_assistants` を各試合オブジェクトにマージして返す — `src/app/api/matches/route.ts`
- [X] T004 [P] [US4] `GET /api/matches/[id]` でも同様に confirmed counts を単一試合レスポンスに追加する — `src/app/api/matches/[id]/route.ts`
- [X] T005 [US4] 試合一覧カードの右側人数表示を「主審 {confirmed_referees}/{referees_needed}名」「副審 {confirmed_assistants}/{assistants_needed}名」形式に変更（needed=0 の役割は非表示） — `src/app/admin/matches/page.tsx`
- [X] T006 [US4] 試合詳細の `必要人数` `<dd>` を「主審 {confirmed}/{needed}名 ／ 副審 {confirmed}/{needed}名」形式に変更（needed=0 の役割は非表示） — `src/app/admin/matches/[id]/page.tsx`

**Note**: T005 は T003 完了後に実施。T006 は T004 完了後に実施。T003・T004 は並行実施可。

**Checkpoint**: User Story 4 完了。試合一覧・詳細で確定済み人数が確認できる。

---

## Phase 5: User Story 5 — 必要人数が揃ったら試合ステータスを自動で「確定済」へ (Priority: P1)

**Goal**: 最後のアサイン確定直後、試合ステータスが自動的に `filled` に更新される。

**Independent Test**: 必要人数（主審 1 名・副審 2 名）の最後の 1 名を確定した直後に試合一覧でステータスが「確定済」になっていることを確認。

- [X] T007 [US5] `PATCH confirm` ルートで match の select に `referees_needed, assistants_needed` を追加し、アサイン確定後に当試合の confirmed 数を再集計して閾値を満たした場合 `matches.status = 'filled'` に更新する — `src/app/api/matches/[id]/assignments/[assignmentId]/confirm/route.ts`

**Checkpoint**: User Story 5 完了。最後のアサイン確定でステータスが自動更新される。

---

## Phase 6: User Story 2 — 空き日程フォームから備考欄を削除 (Priority: P2)

**Goal**: フォームから備考テキストエリアを取り除き、フォームをシンプルにする（既存データの notes 表示は維持）。

**Independent Test**: 空き日程追加フォームを開いて備考テキストエリアが表示されないことを確認。登録済み一覧に既存備考付きアイテムがある場合は備考テキストが引き続き表示されることを確認。

- [X] T008 [US2] `AvailabilityCalendar` から `notes` state・textarea・label・`NewAvailabilityData.notes` フィールドを削除（`AvailabilityList` の既存 notes 表示は変更しない） — `src/components/availability/AvailabilityCalendar.tsx`

**Note**: T001 と同じファイルだが独立した変更（notes 削除は age_groups プリセットと干渉しない）。T001 完了後に実施。

**Checkpoint**: User Story 2 完了。備考欄が空き日程フォームから削除された。

---

## Phase 7: User Story 3 — 担当履歴から試合詳細をタップ展開で確認 (Priority: P2)

**Goal**: 担当履歴リストの各アイテムをタップして必要人数・報酬・備考が展開表示される。

**Independent Test**: 担当履歴リストの試合をタップして詳細セクション（必要審判人数・報酬・備考）が展開される。再タップで折り畳まれる。報酬・備考未設定の試合では該当行が非表示。

- [X] T009 [US3] `GET /api/assignments` の Supabase select の matches join に `referees_needed, assistants_needed, compensation, notes` を追加し、フラット化処理でこれらを `matches` オブジェクトに含める — `src/app/api/assignments/route.ts`
- [X] T010 [US3] `AssignmentHistoryItem.matches` 型に `referees_needed`, `assistants_needed`, `compensation: number | null`, `notes: string | null` を追加し、`AssignmentHistory` コンポーネントにアコーディオン展開を実装（`expandedId` state; タップで展開/折り畳み; 必要人数・報酬・備考を展開セクションに表示; compensation=0 は「無償」表示; null フィールドは非表示） — `src/components/history/AssignmentHistory.tsx`

**Note**: T010 は T009 完了後に実施。

**Checkpoint**: User Story 3 完了。担当履歴から試合詳細をタップ確認できる。

---

## Phase 8: User Story 6 — 審判候補一覧・メンバー一覧からプロフィール詳細をタップ展開で確認 (Priority: P2)

**Goal**: 審判候補一覧と運営者メンバー一覧で各アイテムをタップしてプロフィール詳細（ライセンス・年代・役割・地域・移動範囲）が展開される。real_name・電話番号は一切表示しない。

**Independent Test**: 審判候補一覧で候補をタップして年代・役割・移動範囲が展開される。別候補をタップすると前が折り畳まれ新しい候補が展開される。メンバー管理でも同様。

- [X] T011 [P] [US6] `CandidateList` をアコーディオン化: collapsed では display_name + license badge + チェックボックスのみ表示; タップで license, age_groups, role_type, region, travel_range_km（null なら非表示）を展開; `expandedId` state で単一展開を強制 (FR-009) — `src/components/matches/CandidateList.tsx`
- [X] T012 [P] [US6] `GET /api/communities/[id]/members` の `users!user_id(...)` select に `age_groups, role_type, travel_range_km` を追加（real_name・phone_number は含めない） — `src/app/api/communities/[id]/members/route.ts`
- [X] T013 [US6] `MemberWithUser.users` 型に `age_groups: string[]`, `role_type: string[]`, `travel_range_km: number | null` を追加; `ApprovalList` の pending メンバー表示にアコーディオンを追加（collapsed: display_name + license + 承認/却下ボタン; expanded: license, age_groups, role_type, travel_range_km を詳細表示） — `src/components/members/ApprovalList.tsx`
- [X] T014 [US6] `AdminMembersClient` の承認済み/却下メンバー一覧にアコーディオンを追加（collapsed: display_name + role + status badge; expanded: license, age_groups, role_type, travel_range_km; 両セクションで `expandedId` を共有し単一展開） — `src/app/admin/members/AdminMembersClient.tsx`

**Note**: T011 と T012 は並行実施可。T013 は T012 完了後に実施。T014 は T013 と並行実施可（AdminMembersClient は ApprovalList とは別ファイル）。

**Checkpoint**: User Story 6 完了。候補一覧・メンバー管理でプロフィール詳細をタップ確認できる。

---

## Final Phase: Polish & Cross-Cutting Concerns

- [X] T015 [P] 全アコーディオン展開箇所で `real_name`・`phone_number` が表示されないことを確認（FR-010 コンプライアンス） — `CandidateList.tsx`, `ApprovalList.tsx`, `AdminMembersClient.tsx`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: タスクなし
- **Foundational (Phase 2)**: ブロッキングなし
- **User Stories (Phase 3–8)**: すべて独立。完了順序は自由
- **Polish (Final Phase)**: Phase 3–8 すべて完了後

### User Story Dependencies

- **US1 (T001–T002)**: 独立。即開始可能
- **US4 (T003–T006)**: 独立。即開始可能
- **US5 (T007)**: 独立。即開始可能
- **US2 (T008)**: T001 完了後推奨（同一ファイル）
- **US3 (T009–T010)**: 独立。即開始可能
- **US6 (T011–T014)**: T011・T012 は独立開始可能；T013 は T012 後

### Parallel Opportunities

- T003 ‖ T004 (異なるファイル)
- T005 ‖ T006 (T003・T004 完了後、異なるファイル)
- T011 ‖ T012 (異なるファイル)
- T013 ‖ T014 (T012 完了後、異なるファイル)

---

## Parallel Example: User Story 4

```bash
# Launch in parallel (different files):
Task T003: "Enrich GET /api/matches with confirmed counts — src/app/api/matches/route.ts"
Task T004: "Enrich GET /api/matches/[id] with confirmed counts — src/app/api/matches/[id]/route.ts"

# After T003 and T004 complete, launch in parallel:
Task T005: "Display confirmed counts on match cards — src/app/admin/matches/page.tsx"
Task T006: "Display confirmed counts in match detail — src/app/admin/matches/[id]/page.tsx"
```

## Parallel Example: User Story 6

```bash
# Launch in parallel (different files):
Task T011: "Accordion for CandidateList — src/components/matches/CandidateList.tsx"
Task T012: "Extend members API select — src/app/api/communities/[id]/members/route.ts"

# After T012 completes, launch in parallel:
Task T013: "Update MemberWithUser type + ApprovalList accordion — src/components/members/ApprovalList.tsx"
Task T014: "Accordion for AdminMembersClient member list — src/app/admin/members/AdminMembersClient.tsx"
```

---

## Implementation Strategy

### MVP First (User Stories 1, 4, 5 — P1 のみ)

1. Phase 3 完了: US1 (T001–T002) → 空き日程フォームで年代プリセット
2. Phase 4 完了: US4 (T003–T006) → 試合一覧・詳細に確定人数表示
3. Phase 5 完了: US5 (T007) → アサイン確定で試合ステータス自動更新
4. **STOP and VALIDATE**: P1 3ストーリーを独立テスト → デプロイ可能

### Incremental Delivery

1. US1 → 審判フォーム UX 改善 → デプロイ
2. US4 + US5 → 運営者 UX 改善 (確定人数表示 + 自動ステータス) → デプロイ
3. US2 → 空き日程フォームさらにシンプル化 → デプロイ
4. US3 → 担当履歴にタップ展開 → デプロイ
5. US6 → 候補・メンバー一覧にタップ展開 → デプロイ

---

## Notes

- **[P]** タスク = 異なるファイル、依存なし → 並行実施可
- **[Story]** ラベル = 対応するユーザーストーリー（トレーサビリティ）
- `real_name`・`phone_number` は FR-010 により全展開 UI から除外 — 実装時に必ず確認
- `compensation === 0` は「無償」表示、`null` は非表示
- `referees_needed === 0` や `assistants_needed === 0` の役割は人数表示から除外
- `travel_range_km === null` のメンバーは移動範囲行を非表示
- アコーディオンはすべて `useState<string | null>(null)` パターンで実装（ライブラリ不要）
