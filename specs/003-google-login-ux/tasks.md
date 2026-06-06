# Tasks: Google Login UX Parity

**Input**: Design documents from `/specs/003-google-login-ux/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Tests**: No automated tests — project has no test framework configured. Manual verification via quickstart.md.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)

---

## Phase 1: Setup

**Purpose**: Confirm environment before making changes

- [X] T001 Verify `supabase/migrations/` directory — confirm no file with timestamp `20260606000001` already exists; list existing migration files to confirm the new migration name is unique

---

## Phase 2: Foundational (Blocking Prerequisite)

**Purpose**: Create the Supabase RPC function that the Google callback depends on for US2

**⚠️ CRITICAL**: T005 (LINE linkage in callback) cannot be completed until this migration exists and is applied

- [X] T002 Create `supabase/migrations/20260606000001_google_ux_line_linkage.sql` — add `public.get_line_user_id_by_email(lookup_email TEXT) RETURNS TEXT` as a `SECURITY DEFINER` SQL function (exact SQL from `specs/003-google-login-ux/data-model.md`) with `GRANT EXECUTE ON FUNCTION public.get_line_user_id_by_email(TEXT) TO service_role`

**Checkpoint**: Migration file created — run `supabase db reset` or `supabase migration up` locally to apply

---

## Phase 3: User Story 1 — Google 初回ログイン時のオンボーディング統一 (Priority: P1) 🎯 MVP

**Goal**: New Google users are redirected to `/profile` (not `/profile?setup=true`) and see their Google full name pre-filled in the display_name field.

**Independent Test**: Use a Google account with no existing `users` row. Log in via Google. Verify: (1) redirect goes to `/profile` with no `?setup=true`, (2) page title shows "プロフィール登録", (3) display_name field is pre-filled with the Google account's full name. See quickstart.md Flow 1 & 2.

### Implementation for User Story 1

- [X] T003 [P] [US1] Read `src/app/(referee)/profile/page.tsx` in full, then add a `defaultDisplayName` state variable and a `supabase.auth.getUser()` call (using the browser client) inside the effect or fetch logic that runs when `profile` is null — seed `defaultDisplayName` from `user.user_metadata.full_name ?? user.email ?? ''` — pass it as the initial `display_name` value to `ProfileForm` (or equivalent form component) when rendering the new-user state
- [X] T004 [US1] Read `src/app/api/auth/callback/route.ts` in full, then: (a) remove the `supabase.from('users').insert(...)` stub creation block that runs on new user detection, and (b) change the new-user redirect target from `` `${origin}/profile?setup=true` `` to `` `${origin}/profile` ``

**Checkpoint**: User Story 1 independently testable — verify Flow 1 and Flow 2 from `specs/003-google-login-ux/quickstart.md`

---

## Phase 4: User Story 2 — メールアドレスによるLINEアカウント連携 (Priority: P1)

**Goal**: When a Google user whose email matches an existing LINE account's email logs in, their `users.line_user_id` is automatically populated so they receive LINE push notifications for match assignments.

**Independent Test**: Sign in with LINE using a real email address → sign out → sign in with Google using the same email → run `SELECT line_user_id FROM users WHERE id = '<google_user_id>'` → `line_user_id` must be populated. See quickstart.md Flow 3 & 4.

### Implementation for User Story 2

- [X] T005 [US2] In `src/app/api/auth/callback/route.ts` (already read in T004), after the profile existence check, add the LINE linkage block: get `currentLineUserId` from `profile?.line_user_id ?? null`; if `!currentLineUserId && user.email`, wrap in try/catch — call `createAdminClient().rpc('get_line_user_id_by_email', { lookup_email: user.email })` — if `linkedId` is returned, call `supabase.from('users').update({ line_user_id: linkedId }).eq('id', user.id)` — catch block must be silent (FR-004: linkage failure must not block login). Exact code pattern in `specs/003-google-login-ux/plan.md` Phase 1 "Change 2".

**Checkpoint**: User Story 2 independently testable — verify Flow 3, Flow 4, and Flow 6 from `specs/003-google-login-ux/quickstart.md`

---

## Phase 5: User Story 3 — Googleログイン後の返却URLの一貫性 (Priority: P2)

**Goal**: Google login respects the `next` URL parameter and redirects the user to the requested page after login, matching LINE login behaviour.

**Independent Test**: Open `http://localhost:3000/login?next=/availability` → complete Google login as a user with an existing profile → must redirect to `/availability`. See quickstart.md Flow 5.

### Implementation for User Story 3

- [X] T006 [US3] Read `src/app/api/auth/callback/route.ts` and confirm the `next` parameter handling already exists (per `specs/003-google-login-ux/research.md` Decision 4: line ~29 reads `const redirectTo = next.startsWith('/') ? \`${origin}${next}\` : origin`). **No code change is required.** Verify by running quickstart.md Flow 5 manually.

**Checkpoint**: User Story 3 independently testable — verify Flow 5 from `specs/003-google-login-ux/quickstart.md`

---

## Final Phase: Polish & Verification

**Purpose**: End-to-end manual validation of all acceptance criteria

- [ ] T007 Run `pnpm dev` and execute all 6 manual test flows from `specs/003-google-login-ux/quickstart.md`: Flow 1 (new user → `/profile`, display_name pre-filled), Flow 2 (profile save → `/availability`), Flow 3 (LINE linkage via same email), Flow 4 (returning user LINE linkage re-check), Flow 5 (next param redirect to `/availability`), Flow 6 (no LINE match, login completes without error). All flows must pass.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — BLOCKS T005
- **US1 (Phase 3)**: Independent of migration; T003 and T004 can begin after Phase 1
  - T003 `[P]` and T004 can run in parallel (different files)
- **US2 (Phase 4)**: T005 depends on T002 (migration must exist) and must run after T004 (same file)
- **US3 (Phase 5)**: T006 can run any time — read-only verification, no code change
- **Polish (Final Phase)**: Depends on all phases complete

### Story Dependencies

- **US1 (P1)**: Independent of migration — T003 and T004 can start immediately after Phase 1
- **US2 (P1)**: Depends on T002 (migration) and T004 (callback already read/modified)
- **US3 (P2)**: No blocking dependencies — verification only

### Within Each Phase

- T003 [P] and T004 touch different files → run in parallel
- T005 must follow T004 (same file, `route.ts`)
- T005 must follow T002 (RPC must exist before callback calls it)

### Parallel Opportunities

```bash
# After T001 completes:
Task T002: Create migration SQL file
Task T003 [P]: Profile page display_name pre-fill  ← parallel with T002
Task T004: Callback redirect + stub removal         ← parallel with T002, sequential after T003 not needed

# After T002 + T004 complete:
Task T005: Callback LINE linkage logic

# Any time:
Task T006: Verify next redirect (read-only)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001)
2. Complete US1 tasks: T003 + T004 in parallel
3. **STOP and VALIDATE**: quickstart.md Flow 1 & 2
4. Deploy/demo if ready — Google onboarding parity achieved

### Incremental Delivery

1. Setup (T001) → Foundational (T002) → foundation ready
2. US1: T003 + T004 in parallel → test Flows 1 & 2 → deploy (MVP)
3. US2: T005 → test Flows 3, 4, 6 → deploy (LINE linkage)
4. US3: T006 verify → test Flow 5 → (no deploy needed; already works)
5. Final: T007 full end-to-end validation

---

## Notes

- No automated tests — project uses manual test flows (see `specs/003-google-login-ux/quickstart.md`)
- [P] = different files, safe to run concurrently
- LINE stub creation (`LINE callback`) is intentionally left unchanged — this spec only covers Google parity
- `createAdminClient()` must only be used server-side (API route); never in client components
- Fake LINE emails (`line_XXX@line.reflink.local`) are automatically excluded by the RPC `WHERE` clause — no special handling needed
- Linkage failure must always be silent (FR-004): the `catch` block must never re-throw
