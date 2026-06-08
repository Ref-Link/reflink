---

description: "Task list for アサイン確定後の連絡先情報開示"
---

# Tasks: アサイン確定後の連絡先情報開示

**Input**: Design documents from `/specs/008-contact-disclosure/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US5)
- Exact file paths are included in every task description

---

## Phase 1: Foundational (Blocking Prerequisites)

**Purpose**: Database schema change and shared utilities that ALL user stories depend on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T001 Create `supabase/migrations/20260608000001_add_phone_number.sql` — `ALTER TABLE public.users ADD COLUMN phone_number text CONSTRAINT users_phone_number_check CHECK (phone_number ~ '^0[0-9]{9,10}$')` per data-model.md
- [X] T002 [P] Add `phone_number: string | null` to `Row`, `Insert`, and `Update` in `src/types/database.ts` users table type per data-model.md
- [X] T003 [P] Create `src/lib/phone.ts` with `normalizePhoneNumber`, `isValidPhoneNumber`, and `formatPhoneNumber` — exact implementations from data-model.md (11-digit: `0XX-XXXX-XXXX`, 10-digit: `0X-XXXX-XXXX`)

**Checkpoint**: Migration ready, TypeScript types updated, phone utilities available — user story implementation can begin

---

## Phase 2: User Story 1 — 運営者がアサイン確定前に双方の電話番号を確認する (Priority: P1) 🎯 MVP

**Goal**: 確定APIが電話番号チェックゲートを持ち、運営者はインラインフォームで自身の電話番号を登録してそのまま確定できる。審判が未登録の場合はエラーメッセージのみ表示されて確定がブロックされる。

**Independent Test**: 電話番号未登録の運営者で「確定」ボタンを押してインラインフォームが表示され、入力後に確定が完了することを確認。次に運営者登録済み・審判未登録の状態で「確定」を押し、「審判の連絡先が未登録のため確定できません」が表示されることを確認。フロントエンドを迂回したAPI直接呼び出しでも400が返ることを確認。

- [X] T004 [US1] Add phone check gate to `src/app/api/matches/[id]/assignments/[assignmentId]/confirm/route.ts` — fetch organizer's and referee's `phone_number` using service_role client; return `{ error: 'ORGANIZER_PHONE_MISSING' }` (400) or `{ error: 'REFEREE_PHONE_MISSING' }` (400) per contracts/confirm-assignment.md before the existing confirm logic
- [X] T005 [P] [US1] Create `src/components/ui/ContactInfo.tsx` — accepts `phone: string | null`; renders `formatPhoneNumber(phone)` + `<a href="tel:...">📞 発信</a>` + `<a href="sms:...">💬 SMS</a>` when non-null; renders「連絡先未登録」text only when null
- [X] T006 [US1] Update `src/app/admin/matches/[id]/assignments/page.tsx` to handle confirm errors: on `ORGANIZER_PHONE_MISSING` show inline phone input form that calls `PATCH /api/profile` then retries confirm; on `REFEREE_PHONE_MISSING` show error message「審判の連絡先が未登録のため確定できません。審判に登録を依頼してください。」

**Checkpoint**: User Story 1 fully functional — confirm gate works at API level, inline organizer phone registration completes the confirmation flow

---

## Phase 3: User Story 2 — 確定後に運営者が審判の電話番号を確認する (Priority: P1)

**Goal**: 運営者がアサイン状況画面で確定済み審判の電話番号とハイフン補完表示・発信・SMSボタンを確認できる。未確定（accepted）審判の行では電話番号は表示されない。

**Independent Test**: 確定済みアサインのある試合のアサイン状況画面を開き、確定済み審判の行に「090-1234-5678」形式の電話番号と「📞 発信」「💬 SMS」ボタンが表示されることを確認。accepted 状態の行では電話番号が表示されないことも確認。

- [X] T007 [US2] Create `src/app/api/matches/[id]/assignments/contact-info/route.ts` — GET endpoint for organizer/admin role; queries assignments where `match_id=[id]` and `status='confirmed'`; fetches each referee's `users.phone_number` via service_role client; returns `{ [assignmentId]: string | null }` per contracts/confirm-assignment.md
- [X] T008 [US2] Update `src/app/admin/matches/[id]/assignments/page.tsx` — after realtime subscription updates, fetch from `GET /api/matches/[id]/assignments/contact-info`; render `<ContactInfo phone={contactMap[assignment.id]}>` in each confirmed assignment row

**Checkpoint**: User Story 2 complete — admin sees referee phone numbers with call/SMS buttons on assignment status page

---

## Phase 4: User Story 3 — 確定後に審判が運営者の電話番号を確認する (Priority: P1)

**Goal**: 審判が担当履歴画面で確定済み試合の運営者の電話番号と発信・SMSボタンを確認できる。notified/accepted 状態の試合では電話番号は表示されない。

**Independent Test**: 確定済みアサインのある審判アカウントで担当履歴画面を開き、運営者の電話番号（ハイフン補完済み）と2ボタンが表示されることを確認。notified または accepted 状態の試合では電話番号が表示されないことを確認。

- [X] T009 [US3] Update `src/app/api/assignments/route.ts` — add `organizer:users!created_by(phone_number)` to the Supabase select; flatten to `matches.organizer_phone` in response shape (existing `status='confirmed'` filter already satisfies disclosure condition) per contracts/profile.md
- [X] T010 [US3] Add `organizer_phone: string | null` to `AssignmentHistoryItem.matches` type in `src/components/history/AssignmentHistory.tsx`
- [X] T011 [US3] Render `<ContactInfo phone={item.matches?.organizer_phone ?? null}>` for confirmed assignments in `src/components/history/AssignmentHistory.tsx` (depends on T010 and T005)
- [X] T012 [US3] Update `src/app/(referee)/history/page.tsx` — ensure data from `GET /api/assignments` is typed as the updated `AssignmentHistoryItem[]` shape and passed to `<AssignmentHistory>`

**Checkpoint**: User Story 3 complete — referee sees organizer phone numbers with call/SMS buttons on assignment history page

---

## Phase 5: User Story 4 — 審判がLINEで参加回答後に電話番号登録を促される (Priority: P1)

**Goal**: LINE Webhook の `accept` アクション処理後、電話番号が未登録の審判に自動でフォローアップLINEメッセージを送信する。登録済み審判にはメッセージを送らない。

**Independent Test**: 電話番号未登録の審判がLINEで「参加」をタップし、アサインが `accepted` に更新された後にフォローアップメッセージ（`${NEXT_PUBLIC_APP_URL}/profile` リンク付き）が届くことを確認。電話番号登録済みの審判の場合はメッセージが送信されないことも確認。

- [X] T013 [US4] Update `src/app/api/webhook/line/route.ts` — in the `accept` action handler, after updating assignment to `accepted`, fetch `user.phone_number`; if null, call existing `pushTextMessage` with the follow-up template from research.md:「【電話番号登録のお願い】アサイン確定時に運営者との緊急連絡手段として電話番号が必要です。以下のリンクからプロフィールに電話番号をご登録ください。\n{NEXT_PUBLIC_APP_URL}/profile」

**Checkpoint**: User Story 4 complete — LINE follow-up message sent automatically to referees who accept without a registered phone number

---

## Phase 6: User Story 5 — 審判がプロフィールで電話番号を登録・更新する (Priority: P2)

**Goal**: 審判がプロフィール画面から電話番号を登録または変更できる。保存時に正規化（ハイフン除去）、表示時にハイフン補完される。

**Independent Test**: プロフィール画面に電話番号入力欄が表示され、「090-1234-5678」を入力して保存すると「09012345678」として保存され、次回表示時は「090-1234-5678」で表示されることを確認。「0901234」（桁数不足）入力でエラーが表示されることを確認。

- [X] T014 [US5] Update `src/app/api/profile/route.ts` — if `phone_number` present in request body: call `normalizePhoneNumber`, validate with `isValidPhoneNumber`, return `{ error: '電話番号は0始まりの10〜11桁の数字で入力してください' }` (400) if invalid, otherwise include normalized value in `updatePayload` per contracts/profile.md
- [X] T015 [P] [US5] Add `phone_number` text input field to `src/components/profile/ProfileForm.tsx` — add to `ProfileFormData` interface and render an `<input type="tel">` with format hint; normalize display value using `formatPhoneNumber` when pre-filling existing number
- [X] T016 [US5] Update `src/app/(referee)/profile/page.tsx` — pass `user.phone_number` from the profile fetch as initial value to `<ProfileForm>` so existing number is pre-filled

**Checkpoint**: User Story 5 complete — referee can register and update their phone number through the profile page

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Type safety verification and edge case validation across all stories.

- [X] T017 Run `tsc --noEmit` from repo root and fix any TypeScript errors introduced by `phone_number` additions across all modified files
- [X] T018 [P] Verify `ContactInfo` renders both 10-digit (`0X-XXXX-XXXX`) and 11-digit (`0XX-XXXX-XXXX`) formats correctly by inspecting the rendered HTML for both cases
- [X] T019 [P] Verify that admin assignments page and referee history page do NOT show phone numbers for `accepted` (unconfirmed) assignments — confirmed-only disclosure (FR-011, FR-012, SC-004)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 1)**: No dependencies — start immediately
- **User Stories (Phases 2–6)**: All depend on Phase 1 (T001 migration, T002 types, T003 phone utils)
  - US1 (Phase 2): First — creates `ContactInfo` component (T005) reused by US2 and US3
  - US2 (Phase 3): Depends on Phase 1 + T005 from US1
  - US3 (Phase 4): Depends on Phase 1 + T005 from US1
  - US4 (Phase 5): Depends on Phase 1 only — fully independent of UI stories
  - US5 (Phase 6): Depends on Phase 1 only — enables the profile registration path referenced by US4's follow-up link
- **Polish (Phase 7)**: Depends on all user story phases complete

### User Story Dependencies

- **US1 (P1)**: Depends on Phase 1. Produces `ContactInfo` (T005) reused by US2 and US3
- **US2 (P1)**: Depends on Phase 1 + T005 (ContactInfo)
- **US3 (P1)**: Depends on Phase 1 + T005 (ContactInfo)
- **US4 (P1)**: Depends on Phase 1 only
- **US5 (P2)**: Depends on Phase 1 only

### Within Each User Story

- Phase 1: T002 and T003 are [P] — run in parallel with T001
- US1: T005 is [P] with T004 — different files, no dependency between them; T006 waits for both
- US2: T007 and T008 are sequential — T008 depends on T006 (admin page base) and T007 (contact-info API)
- US3: T010 → T011 sequential (type before implementation); T009 can run in parallel with T010
- US5: T015 is [P] with T014 — different files; T016 waits for both

### Parallel Opportunities

- T001, T002, T003 can all run in parallel (different files)
- T004 and T005 within US1 run in parallel (different files)
- After US1 completes: US2 (T007), US3 (T009+T010), US4 (T013), US5 (T014+T015) can all start in parallel
- T018 and T019 in Phase 7 run in parallel

---

## Parallel Example: Phase 1

```bash
# All three tasks target different files — run in parallel:
Task T001: Create supabase/migrations/20260608000001_add_phone_number.sql
Task T002: Update src/types/database.ts (phone_number types)
Task T003: Create src/lib/phone.ts (normalize/validate/format)
```

## Parallel Example: User Story 1

```bash
# T004 and T005 target different files — run in parallel:
Task T004: Add phone check gate to confirm/route.ts
Task T005: Create src/components/ui/ContactInfo.tsx
# T006 depends on both T004 and T005 — run after both complete:
Task T006: Update admin/matches/[id]/assignments/page.tsx
```

## Parallel Example: After US1 Completes

```bash
# Once Phase 2 (US1) is done, these story starts can run in parallel:
Task T007: Create contact-info/route.ts        (US2)
Task T009: Update api/assignments/route.ts     (US3)
Task T013: Update webhook/line/route.ts        (US4)
Task T014: Update api/profile/route.ts         (US5)
Task T015: Update ProfileForm.tsx              (US5, parallel with T014)
```

---

## Implementation Strategy

### MVP First (P1 User Stories 1–4)

1. Complete Phase 1: Foundational (migration + types + phone utils)
2. Complete Phase 2: US1 (confirm gate + inline organizer form) — core safety gate
3. Complete Phase 3: US2 (admin views referee phone) — organizer contact access
4. Complete Phase 4: US3 (referee views organizer phone) — bidirectional contact
5. Complete Phase 5: US4 (LINE follow-up) — proactive registration nudge
6. **STOP and VALIDATE**: All P1 stories working end-to-end
7. Deploy/demo if ready

### Full Delivery (Including P2)

8. Complete Phase 6: US5 (profile phone registration UI)
9. Complete Phase 7: Polish & type checks
10. Final validation and deploy

### Parallel Team Strategy

After Phase 1 completes and US1 T005 (ContactInfo) is done:
- Developer A: US1 T006 → US2 (T007, T008)
- Developer B: US3 (T009–T012) — ContactInfo from T005 available
- Developer C: US4 (T013) + US5 (T014–T016) — independent of UI stories

---

## Notes

- [P] tasks = different files, no blocking dependencies within the same phase
- [Story] label maps each task to a specific user story for traceability
- Phone numbers must NEVER be returned from a direct Supabase client call — always use server-side API routes with service_role client per research.md SC-004
- `tel:` / `sms:` links are mobile-only; PC non-functionality is accepted per spec Assumptions
- Verify `tsc --noEmit` passes after Phase 1 before starting user story work — TypeScript type errors will cascade
