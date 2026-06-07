# Tasks: ナビゲーション統一（Bottom Nav）

**Input**: Design documents from `/specs/007-unified-bottom-nav/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, quickstart.md ✅

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

**Tests**: No automated test suite in this project (confirmed in plan.md). No test tasks included.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization — existing Next.js 14 project with all dependencies already installed. No new packages or schema migrations required.

_No setup tasks — project is already bootstrapped. Proceed directly to user story phases._

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before any user story can begin.

_No foundational tasks — all three user stories are fully independent and can start immediately._

**Checkpoint**: All user stories can begin in parallel from Phase 3 onward.

---

## Phase 3: User Story 1 — 審判 bottom nav でホーム導線を追加 (Priority: P1) 🎯 MVP

**Goal**: Replace the inline referee nav (currently missing ホーム, includes コミュニティ) with a new `RefereeBottomNav` client component containing 4 items: ホーム · プロフィール · 空き日程 · 担当履歴.

**Independent Test**: Log in as a referee, visit `/profile`, `/availability`, `/history`. Confirm bottom nav shows 4 items with no コミュニティ item. Confirm tapping ホーム navigates to `/`. Confirm the current-page icon is highlighted.

### Implementation for User Story 1

- [X] T001 [US1] Create `src/components/nav/RefereeBottomNav.tsx` — `'use client'` component using `usePathname()` from `next/navigation`, 4 nav items in order: `{ href: '/', label: 'ホーム' }`, `{ href: '/profile', label: 'プロフィール' }`, `{ href: '/availability', label: '空き日程' }`, `{ href: '/history', label: '担当履歴' }`, active state via strict equality (`pathname === item.href`) with `text-blue-600 dark:text-blue-400`, inactive `text-gray-500 dark:text-gray-400`, fixed positioning with `style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}`
- [X] T002 [US1] Modify `src/app/(referee)/layout.tsx` — remove `NAV_ITEMS` array and inline `<nav>` block, import and render `<RefereeBottomNav />` in the layout shell, remove `pb-24` from `<footer>` (safe-area padding is now handled inside `RefereeBottomNav`) (depends on T001)

**Checkpoint**: Referee bottom nav is fully functional. Validate against quickstart.md Test 1.

---

## Phase 4: User Story 2 — 管理レイアウトを bottom nav 方式に統一 (Priority: P1)

**Goal**: Replace the admin header tabs (試合管理 / メンバー管理 tab row) with a fixed `AdminBottomNav` client component containing 3 items: ホーム · 試合管理 · メンバー管理. Add `pb-20` to the content wrapper so content is not hidden behind the fixed nav.

**Independent Test**: Log in as organizer/manager, visit `/admin/matches`. Confirm header shows only "RefLink 管理" with no tab row. Confirm bottom nav shows 3 items with 試合管理 highlighted. Confirm tapping ホーム navigates to `/`. Scroll to bottom of page content — confirm it is not hidden behind the nav.

### Implementation for User Story 2

- [X] T003 [P] [US2] Create `src/components/nav/AdminBottomNav.tsx` — `'use client'` component using `usePathname()` from `next/navigation`, 3 nav items in order: `{ href: '/', label: 'ホーム' }`, `{ href: '/admin/matches', label: '試合管理' }`, `{ href: '/admin/members', label: 'メンバー管理' }`, active state via strict equality with `text-blue-600 dark:text-blue-400`, inactive `text-gray-500 dark:text-gray-400`, same `style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}` as RefereeBottomNav
- [X] T004 [US2] Modify `src/app/admin/layout.tsx` — remove `NAV_ITEMS` constant and `<nav aria-label="管理ナビゲーション">` element from inside `<header>`, change content wrapper from `<div className="px-4">` to `<div className="px-4 pb-20">`, import and render `<AdminBottomNav />` before `<footer>` (depends on T003)

**Checkpoint**: Admin bottom nav is fully functional. Validate against quickstart.md Test 2.

---

## Phase 5: User Story 3 — プロフィールページにコミュニティ所属セクションを追加 (Priority: P2)

**Goal**: Surface the referee's community memberships (pending/approved only) directly in the profile page below the profile form. Add a dedicated API route and a `CommunityMemberships` client component.

**Independent Test**: Log in as a referee, visit `/profile`. Confirm 「所属コミュニティ」section appears below the form. Confirm empty state shows "まだコミュニティに参加していません" + "コミュニティを追加" button → navigates to `/join`. Confirm approved/pending memberships show name + correct status badge. Confirm rejected memberships are not shown.

### Implementation for User Story 3

- [X] T005 [P] [US3] Create `src/app/api/communities/my-memberships/route.ts` — `GET` handler: verify authenticated session (return 401 if not authenticated), query `community_members` joined with `regional_communities(name)` via `.select('community_id, status, regional_communities(name)').eq('user_id', userId).in('status', ['pending', 'approved']).order('created_at', { ascending: true })`, normalize response to `{ community_id: string, community_name: string, status: 'pending' | 'approved' }[]`, return `NextResponse.json(memberships)`
- [X] T006 [P] [US3] Create `src/components/profile/CommunityMemberships.tsx` — `'use client'` component: `useEffect` fetch from `/api/communities/my-memberships` on mount, loading state renders `読み込み中...`, empty state renders "まだコミュニティに参加していません" + "コミュニティを追加" button linking to `/join`, populated state renders list of `{ community_name, status }` each with a status badge (pending → `申請中` yellow, approved → `承認済み` green, matching `STATUS_COLORS` pattern from `AdminMembersClient`) plus "コミュニティを追加" button always visible at bottom
- [X] T007 [US3] Modify `src/app/(referee)/profile/page.tsx` — import `CommunityMemberships` from `@/components/profile/CommunityMemberships`, render `<CommunityMemberships />` after the `<ProfileForm />` closing tag inside `<main>`, conditional render only when `!isNew` (skip for first-time registration flow) (depends on T006)

**Checkpoint**: Community memberships section is fully functional. Validate against quickstart.md Test 3.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Edge-case verification and end-to-end validation across all user stories.

- [X] T008 [P] Verify `/join` page shows referee bottom nav with no item highlighted (no `/join` match in `RefereeBottomNav` — all items should render in inactive style)
- [X] T009 [P] Verify dual-role user (organizer + referee): navigate through referee screens → `/` → admin screens via bottom nav without errors or layout breaks
- [X] T010 Run all four quickstart.md smoke tests (Tests 1–4) end-to-end on a mobile viewport

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: N/A — project already initialized
- **Foundational (Phase 2)**: N/A — no shared blocking prerequisites
- **User Stories (Phases 3, 4, 5)**: All three can start in parallel immediately
- **Polish (Phase 6)**: Depends on completion of all three user story phases

### User Story Dependencies

- **US1 (Phase 3)**: No dependencies on US2 or US3
- **US2 (Phase 4)**: No dependencies on US1 or US3 — fully parallel with Phase 3
- **US3 (Phase 5)**: No dependencies on US1 or US2 — fully parallel with Phases 3 and 4

### Within Each User Story

- **US1**: T001 → T002 (layout update depends on component being created first)
- **US2**: T003 → T004 (layout update depends on component being created first)
- **US3**: T005 ∥ T006 (API route and component are independent files) → T007 (profile page depends on T006)

### Parallel Opportunities

- Phases 3, 4, and 5 can all be worked on simultaneously by different developers
- Within US3: T005 and T006 can run in parallel
- Phase 6 polish tasks T008 and T009 can run in parallel

---

## Parallel Example: User Story 3

```bash
# Launch T005 and T006 together (different files, no shared dependencies):
Task: "Create src/app/api/communities/my-memberships/route.ts"
Task: "Create src/components/profile/CommunityMemberships.tsx"

# Once both complete, run T007:
Task: "Modify src/app/(referee)/profile/page.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only — P1)

1. Complete Phase 3: User Story 1 (T001, T002)
2. **STOP and VALIDATE**: Test referee bottom nav per quickstart.md Test 1
3. Deploy/demo if ready

### Incremental Delivery

1. Complete US1 (Phase 3) → Referee bottom nav live ✅
2. Complete US2 (Phase 4) → Admin bottom nav live ✅
3. Complete US3 (Phase 5) → Community section in profile live ✅
4. Complete Polish (Phase 6) → Edge cases verified ✅

### Parallel Team Strategy

With multiple developers:
- Developer A: US1 (T001 → T002)
- Developer B: US2 (T003 → T004)
- Developer C: US3 (T005 ∥ T006 → T007)

---

## Notes

- [P] tasks = different files, no dependencies — safe to run simultaneously
- [Story] label maps each task to a specific user story for traceability
- No automated test suite — validate manually per quickstart.md smoke tests
- `safe-area-inset-bottom` env variable must be preserved in both nav components (iOS Safari requirement)
- `rejected` community memberships must NOT appear in `CommunityMemberships` — filter at the API layer
- `<CommunityMemberships />` renders only when `!isNew` in profile page — skip during first-time registration
- Admin header brand ("RefLink 管理") must remain untouched when removing the tab row
