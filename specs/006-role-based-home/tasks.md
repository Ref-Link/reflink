# Tasks: ロールベースホーム画面

**Input**: Design documents from `/specs/006-role-based-home/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ui-contracts.md ✅

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create new component scaffold

- [ ] T001 Create `src/components/home/HomeScreen.tsx` with `HomeScreenProps` interface (`displayName: string`, `isAdmin: boolean`, `isReferee: boolean`), outer layout structure (`min-h-screen bg-gray-50`), sticky header containing "RefLink" brand text, and `<main className="mx-auto max-w-lg px-4 py-8">` with entry card container `<div className="mt-6 flex flex-col gap-4">` as a Server Component (no `'use client'`)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Replace `src/app/page.tsx` redirect with role-based Server Component — required by all user stories

**⚠️ CRITICAL**: Phase 3+ cannot begin until this phase is complete

- [ ] T002 Replace `src/app/page.tsx`: import `createClient` from `@/utils/supabase/server`; call `supabase.auth.getUser()` and redirect to `/login` if no user; fetch `users.display_name` and all `community_members` rows for `user_id` in parallel via `Promise.all`; derive `isAdmin` (`role∈{organizer,manager} && status==='approved'`) and `isReferee` (`role==='referee'`) flags; render `<HomeScreen displayName={userData?.display_name ?? ''} isAdmin={isAdmin} isReferee={isReferee} />`

**Checkpoint**: `page.tsx` renders `HomeScreen` — user story implementation can begin

---

## Phase 3: User Story 1 — Organizerのみのユーザーが管理画面へ到達できる (Priority: P1) 🎯 MVP

**Goal**: Organizer-role user logs in and sees the admin entry card

**Independent Test**: Organizerロールのアカウントでログインし、ホーム画面に「試合・メンバーを管理する」エントリーポイントが表示され、タップで `/admin/matches` に遷移することを確認。管理エントリーのみ表示されること（審判エントリーは非表示）を確認。

### Implementation for User Story 1

- [ ] T003 [US1] Add admin entry card to `src/components/home/HomeScreen.tsx`: when `isAdmin === true`, render `<Link href="/admin/matches">` card with label "試合・メンバーを管理する", sub-description "試合の登録・審判の割当・メンバー承認", Tailwind styles `min-h-[80px] w-full p-4 bg-white rounded-xl shadow-sm border flex items-center gap-4` for tap-target compliance (SC-004)
- [ ] T004 [P] [US1] Update `src/app/admin/layout.tsx`: replace `<span>RefLink 管理</span>` with `<Link href="/">RefLink 管理</Link>` (import `Link` from `next/link`) to add home navigation per FR-009

**Checkpoint**: Organizer-only account sees admin entry card; admin layout header links back to `/`

---

## Phase 4: User Story 2 — 兼任ユーザーが管理機能と審判機能の両方にアクセスできる (Priority: P1)

**Goal**: User with both organizer and referee roles sees both admin and referee entry cards

**Independent Test**: organizer + referee両ロールを持つアカウントでログインし、管理エントリーポイントと審判エントリーポイントの両方が表示されることを確認。どちらのカードからも対応画面に遷移できることを確認。

### Implementation for User Story 2

- [ ] T005 [US2] Add referee entry card to `src/components/home/HomeScreen.tsx`: when `isReferee === true`, render `<Link href="/profile">` card with label "審判として参加する", sub-description "プロフィール・空き日程・担当履歴", same card Tailwind styles as admin card (`min-h-[80px] w-full p-4 bg-white rounded-xl shadow-sm border flex items-center gap-4`)

**Checkpoint**: Dual-role account sees both admin and referee entry cards; single-role accounts still see only their respective card

---

## Phase 5: User Story 3 — 審判のみのユーザーのログイン後体験が維持される (Priority: P2)

**Goal**: Referee-only user sees referee entry; community-less user sees join entry; referee layout has home navigation

**Independent Test**: refereeロールのみのアカウントでログインし審判エントリーのみ表示されることを確認。コミュニティ未参加アカウントでログインしコミュニティ参加エントリーのみ表示されることを確認。

### Implementation for User Story 3

- [ ] T006 [P] [US3] Add join entry card to `src/components/home/HomeScreen.tsx`: when `!isAdmin && !isReferee`, render `<Link href="/join">` card with label "コミュニティに参加する", sub-description "審判として活動するにはコミュニティへの参加が必要です", same card Tailwind styles
- [ ] T007 [P] [US3] Update `src/app/(referee)/layout.tsx`: replace `<span>RefLink</span>` with `<Link href="/">RefLink</Link>` (import `Link` from `next/link`) to add home navigation per FR-009

**Checkpoint**: Referee-only account sees referee entry; new account with no membership sees join entry; referee layout header links back to `/`

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Accessibility compliance and final validation

- [ ] T008 [P] Verify all SVG icons in `src/components/home/HomeScreen.tsx` have `aria-hidden="true"` and all entry cards are wrapped in `<Link>` elements (not `<div onClick>`) per ui-contracts.md accessibility requirements
- [ ] T009 Manual verification of all 4 role scenarios in order: (A) organizer-only → admin card only; (B) referee-only → referee card only; (C) dual-role → both cards; (D) no membership → join card only; plus confirm both layout headers link home

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on T001 — BLOCKS all user story phases
- **User Story 1 (Phase 3)**: Depends on Phase 2 completion
- **User Story 2 (Phase 4)**: Depends on Phase 3 — extends same `HomeScreen.tsx`
- **User Story 3 (Phase 5)**: Depends on Phase 4 — adds final cards and referee layout
- **Polish (Phase 6)**: Depends on Phases 3–5

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Phase 2 — no dependency on other stories
- **User Story 2 (P1)**: Extends `HomeScreen.tsx` from US1 — implement after US1 complete
- **User Story 3 (P2)**: Extends `HomeScreen.tsx` and modifies `(referee)/layout.tsx` — implement after US2

### Within Each User Story

- Models/types (HomeScreenProps) → component scaffold → entry card implementation
- Core component before layout link changes (different files, can be [P])

### Parallel Opportunities

- **T003 ‖ T004**: admin entry card (HomeScreen.tsx) ‖ admin layout home link (admin/layout.tsx)
- **T006 ‖ T007**: join entry card (HomeScreen.tsx) ‖ referee layout home link ((referee)/layout.tsx)
- **T008 ‖ T009**: accessibility check ‖ manual role scenario testing

---

## Parallel Example: User Story 1

```bash
# Both can run simultaneously (different files):
Task T003: "Add admin entry card to src/components/home/HomeScreen.tsx"
Task T004: "Update src/app/admin/layout.tsx — wrap brand text in Link href='/'"
```

## Parallel Example: User Story 3

```bash
# Both can run simultaneously (different files):
Task T006: "Add join entry card to src/components/home/HomeScreen.tsx"
Task T007: "Update src/app/(referee)/layout.tsx — wrap brand text in Link href='/'"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001 — create `HomeScreen.tsx` scaffold)
2. Complete Phase 2: Foundational (T002 — replace `page.tsx` with role-based Server Component)
3. Complete Phase 3: User Story 1 (T003, T004 — admin entry card + admin layout home link)
4. **STOP and VALIDATE**: Test with organizer-only account — admin entry visible, taps to `/admin/matches`, header links home
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → `HomeScreen` renders (empty card list)
2. US1 complete → Organizer can reach admin screen (MVP, unblocks stakeholder validation)
3. US2 complete → Dual-role user sees both entries (no existing user UX broken)
4. US3 complete → Referee-only UX preserved + join entry for new community-less users
5. Each story delivers value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Pair completes Phase 1 + Phase 2 together (T001, T002)
2. Once Foundational done:
   - Developer A: US1 (T003 + T004)
   - Developer B: starts reading existing layout files to prep US3 layout changes
3. After US1: Developer A continues with US2 (T005); Developer B does T006 + T007

---

## Notes

- **No DB migrations** — queries use existing `community_members` and `users` tables only
- **No new npm dependencies** — uses Next.js `Link`, existing Supabase SSR client, Tailwind CSS
- **No tests required** — spec.md specifies manual testing per user story account scenarios
- [P] tasks = different files, no dependencies on incomplete tasks in the same phase
- [Story] label maps each task to its user story for traceability
- All 4 role scenarios must pass Phase 6 manual validation before shipping
