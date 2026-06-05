# Tasks: スマートフォン対応ユーザビリティ改善

**Input**: Design documents from `/specs/002-mobile-usability/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/design-tokens.md ✅, quickstart.md ✅

**Tests**: No test runner configured — manual browser verification per quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to ([US1], [US2], [US3])
- Include exact file paths in descriptions

---

## Phase 1: Setup & Foundational (Global Config)

**Purpose**: Enable dark mode variants globally and set mobile-safe viewport/overflow — blocks all user story work

**⚠️ CRITICAL**: No user story work can begin until all three tasks in this phase are complete

- [X] T001 [P] Add `darkMode: 'media'` to the Tailwind config in tailwind.config.ts
- [X] T002 [P] Add `body { overflow-x: hidden; }` rule to src/app/globals.css
- [X] T003 [P] Export a `viewport` config object with `viewportFit: 'cover'` (and `width: 'device-width', initialScale: 1`) in src/app/layout.tsx using Next.js 14 App Router metadata API

**Checkpoint**: Tailwind `dark:` variants now active, safe-area-inset API enabled, horizontal overflow locked — user story implementation can begin in parallel

---

## Phase 2: User Story 1 — 審判がモバイルから主要画面を快適に操作できる (Priority: P1) 🎯 MVP

**Goal**: All referee-facing screens (login, profile, availability, history) render without horizontal scroll, all interactive elements meet 44px tap targets, and all text is readable in both light and dark mode.

**Independent Test**: Open Chrome DevTools → iPhone SE 375px emulation → log in → navigate profile → availability → history. Confirm no horizontal scrollbar, all buttons/inputs are tappable, and content is readable. Then switch `prefers-color-scheme` to dark and repeat.

### Implementation for User Story 1

- [X] T004 [P] [US1] Apply `surface-card`, `text-primary`, `text-secondary`, and `text-muted` dark mode token classes to the login form container, heading, and LINE login button in src/app/(auth)/login/page.tsx
- [X] T005 [P] [US1] Add `style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}` to the bottom `<nav>` element in src/app/(referee)/layout.tsx to prevent iPhone home-indicator overlap
- [X] T006 [P] [US1] In src/components/profile/ProfileForm.tsx: change role/age-group toggle buttons from `py-1`/`py-2` to `min-h-[44px]` (toggle-chip token), change all `<input>`/`<select>` from `py-2` to `py-3` (input-base token), and apply `surface-card`, `surface-input`, `text-primary`, `text-secondary`, `text-muted`, `error-banner`, and `success-banner` dark mode tokens throughout
- [X] T007 [P] [US1] In src/components/availability/AvailabilityCalendar.tsx: change age-group toggle buttons from `px-3 py-1 text-xs` to add `min-h-[44px]` (toggle-chip token), change all `<input>`/`<textarea>` from `py-2` to `py-3` (input-base token), and apply `surface-card`, `surface-input`, `text-primary`, `text-secondary`, `text-muted` dark mode tokens throughout
- [X] T008 [P] [US1] In src/components/history/AssignmentHistory.tsx: apply `surface-card`, `text-primary`, `text-secondary`, `text-muted` dark mode tokens to all containers and text; replace status badge classes with `success`/`info`/`warning`/`danger`/`neutral` badge tokens from contracts/design-tokens.md (e.g. `bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200`)

**Checkpoint**: Referee flow (login → profile → availability → history) is fully functional on 375px mobile in both light and dark mode — User Story 1 is independently testable

---

## Phase 3: User Story 2 — 管理者がモバイルから試合・メンバー管理を確認できる (Priority: P2)

**Goal**: All admin-facing screens (matches list, match detail, assignments, member approval) display primary information without horizontal scroll at 375px, and tap targets meet 44px for key actions.

**Independent Test**: Open Chrome DevTools → iPhone SE 375px emulation → log in as admin → navigate /admin/matches → tap a match → tap assignments. Confirm match date/venue/status are readable, candidate list shows without overlap, approval buttons are tappable.

### Implementation for User Story 2

- [X] T009 [P] [US2] Apply `surface-header` dark mode tokens (`dark:bg-gray-900 dark:border-gray-700`) and `text-primary` dark mode token to the header `<header>` element and logo/title text in src/app/admin/layout.tsx; add `px-4` to the content wrapper for consistent padding
- [X] T010 [P] [US2] In src/app/admin/matches/page.tsx: add `min-h-[44px]` to the 試合を作成 button (button-primary token); apply `surface-page`, `surface-card`, `text-primary`, `text-secondary`, `text-muted` dark mode tokens to page background, cards, and text; apply `success`/`warning`/`danger`/`neutral` badge tokens to status badges
- [X] T011 [P] [US2] In src/app/admin/matches/[id]/page.tsx: add `min-h-[44px]` to the 通知を送る button (button-primary token); apply `surface-card`, `text-primary`, `text-secondary`, `text-muted` dark mode tokens to detail sections and text
- [X] T012 [P] [US2] In src/app/admin/matches/[id]/assignments/page.tsx: change stats grid from `grid-cols-4` to `grid-cols-2 gap-3 sm:grid-cols-4` (responsive-grid token); apply `surface-card`, `text-primary`, `text-secondary` dark mode tokens to stats cards and text
- [X] T013 [P] [US2] In src/components/matches/CandidateList.tsx: apply `surface-card`, `text-primary`, `text-secondary`, `text-muted` dark mode tokens to candidate rows; replace status/license badge classes with `success`/`info`/`warning`/`danger`/`license-s`/`license-1`/`license-2`/`license-default` badge tokens from contracts/design-tokens.md
- [X] T014 [P] [US2] In src/components/matches/MatchForm.tsx: change all `<input>`/`<select>`/`<textarea>` from `py-2` to `py-3` (input-base token); apply `surface-card`, `surface-input`, `text-primary`, `text-secondary`, `text-muted`, `error-banner` dark mode tokens throughout
- [X] T015 [P] [US2] In src/components/members/ApprovalList.tsx: change 承認 button to use `button-primary` token (`min-h-[44px] py-2.5`) and 却下 button to use `button-secondary` token (`min-h-[44px] py-2.5`); apply `surface-card`, `text-primary`, `text-secondary`, `text-muted` dark mode tokens to member rows and text

**Checkpoint**: Admin flow (matches list → match detail → assignments view) is fully readable on 375px mobile in both light and dark mode — User Story 2 is independently testable

---

## Phase 4: User Story 3 — テーマ切り替え時も表示が乱れない (Priority: P3)

**Goal**: All screens display correct semantic colors (error=red, success=green, etc.) and WCAG AA contrast in both `prefers-color-scheme: dark` and `light`. No text disappears or merges with background on theme switch.

**Independent Test**: In Chrome DevTools Rendering tab, toggle `prefers-color-scheme` between dark and light while viewing login, profile, admin/matches. Confirm all text and status badges remain readable in both modes.

### Implementation for User Story 3

- [X] T016 [P] [US3] In src/app/(referee)/layout.tsx: apply `surface-header` dark mode tokens (`dark:bg-gray-900 dark:border-gray-700`) to the top header bar, and `text-primary` dark mode token (`dark:text-gray-100`) to any nav link/title text
- [X] T017 [P] [US3] Audit src/components/history/AssignmentHistory.tsx and src/components/matches/CandidateList.tsx for any license-type badge classes not yet matching design-tokens.md license badge tokens (`license-s`: `dark:bg-purple-900 dark:text-purple-200`; `license-1`: `dark:bg-blue-900 dark:text-blue-200`; `license-2`: `dark:bg-green-900 dark:text-green-200`; `license-default`: `dark:bg-gray-700 dark:text-gray-300`) and apply corrections
- [X] T018 [US3] Perform complete prefers-color-scheme dark/light toggle verification across all 9 screens listed in quickstart.md step 3 — fix any text that fails WCAG AA contrast (4.5:1 for body text) by applying the correct token from contracts/design-tokens.md

**Checkpoint**: All three user stories are independently functional. Theme switching works correctly on all screens.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Build validation, minimum-width verification, and end-to-end flow confirmation

- [X] T019 [P] Run `pnpm build` from the repository root and resolve any TypeScript or ESLint errors in the 15 modified files
- [X] T020 [P] Perform 320px minimum-width test: set Chrome DevTools to custom 320×568px device and visit all 9 screens from quickstart.md step 2 — confirm no horizontal scrollbar appears on any screen
- [X] T021 [P] Verify 44px tap-target compliance: in Chrome DevTools Elements panel, inspect height of every button, link, and input across all modified components and confirm ≥44px per quickstart.md step 4
- [X] T022 Perform SC-005 referee user flow: login → profile (save) → availability (add entry) → history — complete in under 5 minutes at 375px per quickstart.md SC-005 steps
- [X] T023 Perform SC-006 admin user flow: /admin/matches → match detail → assignments view — complete in under 3 minutes at 375px per quickstart.md SC-006 steps

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup/Foundational (Phase 1)**: No external dependencies — start immediately; all three tasks are parallel
- **User Stories (Phases 2–4)**: ALL depend on Phase 1 completion (T001 enables `dark:` variants; T003 enables safe-area-inset)
  - US1 (Phase 2) and US2 (Phase 3) can proceed in parallel after Phase 1 — they touch independent files
  - US3 (Phase 4) should follow US1 + US2 (verifies their output and handles cross-cutting residuals)
- **Polish (Phase 5)**: Depends on Phases 2–4 completion

### User Story Dependencies

- **US1 (P1)**: Independent after Phase 1 — no dependencies on US2 or US3
- **US2 (P2)**: Independent after Phase 1 — no dependencies on US1 or US3
- **US3 (P3)**: Best started after US1+US2; T016–T017 are independent file edits, T018 is validation

### Within Each User Story

- All tasks within US1 and US2 are marked [P] — they all touch different files and can run fully in parallel
- US3 T016–T017 are [P]; T018 (validation) should run last

---

## Parallel Example: User Story 1

```bash
# All five US1 tasks can launch together after Phase 1:
Task T004: src/app/(auth)/login/page.tsx — dark mode tokens
Task T005: src/app/(referee)/layout.tsx — safe-area-inset
Task T006: src/components/profile/ProfileForm.tsx — tap targets + dark mode
Task T007: src/components/availability/AvailabilityCalendar.tsx — tap targets + dark mode
Task T008: src/components/history/AssignmentHistory.tsx — dark mode + badges
```

## Parallel Example: User Story 2

```bash
# All seven US2 tasks can launch together after Phase 1:
Task T009: src/app/admin/layout.tsx — header dark mode
Task T010: src/app/admin/matches/page.tsx — button + dark mode
Task T011: src/app/admin/matches/[id]/page.tsx — button + dark mode
Task T012: src/app/admin/matches/[id]/assignments/page.tsx — responsive grid + dark mode
Task T013: src/components/matches/CandidateList.tsx — dark mode + badges
Task T014: src/components/matches/MatchForm.tsx — tap targets + dark mode
Task T015: src/components/members/ApprovalList.tsx — buttons + dark mode
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup & Foundational (T001–T003)
2. Complete Phase 2: User Story 1 (T004–T008) — all tasks in parallel
3. **STOP and VALIDATE**: Login → referee screens at 375px, toggle dark mode, confirm usability
4. Ship if referee experience is acceptable

### Incremental Delivery

1. Phase 1 (T001–T003) → global config ready
2. Phase 2 (T004–T008) → referee experience fixed → demo/validate (MVP)
3. Phase 3 (T009–T015) → admin experience fixed → demo/validate
4. Phase 4 (T016–T018) → theme switching verified → demo/validate
5. Phase 5 (T019–T023) → build clean, edge cases verified → ready to merge

### Parallel Team Strategy

With multiple developers (after Phase 1):
- Developer A: US1 tasks (T004–T008)
- Developer B: US2 tasks (T009–T015)
- Both meet for US3 + Polish (T016–T023)

---

## Notes

- **No test runner** — all verification is manual via browser DevTools per quickstart.md
- **[P] tasks** = different source files, zero shared-state dependencies
- **Token reference**: contracts/design-tokens.md defines all Tailwind class combinations; never apply ad-hoc color classes — always use the token pattern
- **darkMode: 'media'** (T001) is a hard blocker — no `dark:` class will have any effect until tailwind.config.ts is updated
- **viewport-fit: cover** (T003) is required for `env(safe-area-inset-bottom)` (T005) to work on iOS Safari
- Each story's checkpoint should be validated in the browser before advancing to the next phase
- Commit after each task or logical group
