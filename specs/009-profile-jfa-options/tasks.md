# Tasks: プロフィール選択項目のJFA準拠化

**Input**: Design documents from `specs/009-profile-jfa-options/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)

---

## Phase 1: Foundational (Blocking Prerequisites)

**Purpose**: TypeScript 型定義の更新。全コンポーネントが参照するため最初に完了させる。

**⚠️ CRITICAL**: この型変更が完了するまで US1〜US3 の作業は開始しない。

- [x] T001 Update `LicenseLevel` type to `'1級' | '2級' | '3級' | '4級'` and `AgeGroup` type to `'第4種(U-12)' | '第3種(U-15)' | '第2種(U-18)' | '第1種(大学・社会人)'` in `src/types/domain.ts`

**Checkpoint**: `domain.ts` の型更新完了。TypeScript のコンパイルエラーが各コンポーネントで発生することを確認（既存定数が型と不一致になる）。

---

## Phase 2: User Story 1 - 審判員が正確なライセンスと対応年代を登録できる (Priority: P1) 🎯 MVP

**Goal**: 審判員がプロフィール登録・空き登録フォームで正しいJFA選択肢から入力できる

**Independent Test**: プロフィール編集画面を開き、ライセンスに「1〜4級」のみ、年代に「第4種(U-12)〜第1種(大学・社会人)」のみが表示されることを確認

### Implementation for User Story 1

- [x] T002 [US1] Update `LICENSE_LEVELS` to `['1級', '2級', '3級', '4級']` and `AGE_GROUPS` to `['第4種(U-12)', '第3種(U-15)', '第2種(U-18)', '第1種(大学・社会人)']` in `src/components/profile/ProfileForm.tsx`
- [x] T003 [P] [US1] Update `AGE_GROUPS` constant to `['第4種(U-12)', '第3種(U-15)', '第2種(U-18)', '第1種(大学・社会人)']` in `src/components/availability/AvailabilityCalendar.tsx`
- [x] T004 [P] [US1] Update `AGE_GROUPS` constant to `['第4種(U-12)', '第3種(U-15)', '第2種(U-18)', '第1種(大学・社会人)']` in `src/app/(referee)/history/page.tsx`

**Checkpoint**: ProfileForm・AvailabilityCalendar・history フィルターで新しい選択肢が表示される。TypeScript コンパイルエラーなし。

---

## Phase 3: User Story 2 - 運営者が正確な種別情報で審判を検索・確認できる (Priority: P2)

**Goal**: 試合登録・候補者一覧・担当履歴など運営者画面でJFA種別が正しく表示される

**Independent Test**: 試合登録フォームで対象年代に「第N種」選択肢が出ることと、候補者一覧でライセンス順序が正しいことを確認

### Implementation for User Story 2

- [x] T005 [P] [US2] Update `AGE_GROUPS` constant to `['第4種(U-12)', '第3種(U-15)', '第2種(U-18)', '第1種(大学・社会人)']` in `src/components/matches/MatchForm.tsx`
- [x] T006 [P] [US2] Remove `'S級': 0` entry from `LICENSE_ORDER` and renumber remaining entries (`'1級': 0, '2級': 1, '3級': 2, '4級': 3`) in `src/components/matches/CandidateList.tsx`
- [x] T007 [P] [US2] Update `AGE_GROUP_COLORS` keys from `{U12, U15, U18, Senior}` to `{'第4種(U-12)', '第3種(U-15)', '第2種(U-18)', '第1種(大学・社会人)'}` in `src/components/history/AssignmentHistory.tsx`

**Checkpoint**: 試合登録フォーム・候補者一覧・履歴画面が正しく動作する。TypeScript コンパイルエラーなし。

---

## Phase 4: User Story 3 - 既存ユーザーのプロフィールが新選択体系と整合する (Priority: P3)

**Goal**: 既存の DB データが新しい種別表記に変換され、新規ユーザー登録でも正しいデフォルト値が使われる

**Independent Test**: ローカル Supabase でマイグレーションを適用し、`SELECT license_level, age_groups FROM users` の結果に `U12`・`S級` 等の旧値が含まれないことを確認

### Implementation for User Story 3

- [x] T008 [US3] Create migration file `supabase/migrations/20260609000001_update_jfa_profile_options.sql` with: (1) drop and recreate `users_license_level_check` constraint without 'S級', (2) UPDATE `users.license_level = '4級' WHERE license_level = 'S級'`, (3) four `array_replace` UPDATE statements for `users.age_groups` (U12→第4種(U-12), U15→第3種(U-15), U18→第2種(U-18), Senior→第1種(大学・社会人)), (4) same four updates for `availabilities.age_groups`, (5) four `REPLACE` UPDATE statements for `matches.age_group`
- [x] T009 [P] [US3] Update default `age_groups` from `['U12']` to `['第4種(U-12)']` in new-user insert at `src/app/api/auth/line/callback/route.ts` line 159
- [x] T010 [P] [US3] Update all `age_groups` array values in INSERT statements in `supabase/seed.sql` (U12→第4種(U-12), U15→第3種(U-15), U18→第2種(U-18), Senior→第1種(大学・社会人)) and update any `license_level = 'S級'` references

**Checkpoint**: `supabase db reset` が成功し、seed データが新しい値で投入される。マイグレーション適用後に旧値が残っていないことを確認。

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: 全画面の目視確認と最終品質チェック

- [x] T011 [P] Verify profile form screen: open `/profile` and confirm license shows only 1〜4級 (no S級), age groups show 第4種(U-12)〜第1種(大学・社会人) only
- [x] T012 [P] Verify availability calendar and history filter: open availability calendar and history page, confirm age group selections are updated
- [ ] T013 Run `supabase db reset` to apply migration + seed, then verify no legacy values (`U12`, `U15`, `U18`, `Senior`, `S級`) remain in any table

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 1)**: No dependencies - start immediately
- **User Stories (Phase 2–4)**: All depend on Phase 1 completion (T001)
  - US1, US2, US3 can proceed in parallel after Phase 1
- **Polish (Phase 5)**: Depends on all Phase 2–4 tasks complete

### User Story Dependencies

- **US1 (P1)**: Depends on T001 only
- **US2 (P2)**: Depends on T001 only — independent of US1
- **US3 (P3)**: Depends on T001 — independent of US1/US2 (DB migration is separate from UI)

### Within Each User Story

- US1: T002 first, then T003 and T004 in parallel
- US2: T005, T006, T007 all in parallel
- US3: T008 first (migration SQL), then T009 and T010 in parallel

### Parallel Opportunities

- After T001: T002–T010 can all be worked on in parallel (different files)
- Within US2: T005, T006, T007 are fully parallel
- Within US3: T009, T010 are parallel after T008

---

## Parallel Example: User Story 2

```
After T001 (types):
  Parallel Group A:
    T005 — MatchForm.tsx
    T006 — CandidateList.tsx
    T007 — AssignmentHistory.tsx
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: T001 (types) — 5 min
2. Complete Phase 2: T002, T003, T004 — 10 min
3. **STOP and VALIDATE**: Open profile form and confirm new options
4. Continue to Phase 3 and 4

### Incremental Delivery

1. T001 → US1 (プロフィール・空き登録フォームを修正) → 目視確認
2. US2 (試合登録・候補者一覧を修正) → 目視確認
3. US3 (DBマイグレーション・デフォルト値を修正) → `supabase db reset` で確認

---

## Notes

- [P] tasks = different files, no dependencies on each other
- TypeScript コンパイルエラーが T001 完了後に発生するのは正常（その後の T002〜T007 で解消する）
- マイグレーション (T008) はローカル `supabase db reset` で動作確認してからコミットすること
- S級ライセンスを持つ既存ユーザーは 4級 へ自動変換される（FR-009）
