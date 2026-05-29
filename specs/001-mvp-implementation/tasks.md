# Tasks: RefLink MVP

**Input**: Design documents from `/specs/001-mvp-implementation/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US5)
- Exact file paths are included in each task description

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: プロジェクト初期化・基本構造

- [ ] T001 Initialize Next.js 14 App Router project with TypeScript 5.x and pnpm in repository root
- [ ] T002 [P] Install and configure Tailwind CSS in tailwind.config.ts and src/app/globals.css
- [ ] T003 [P] Configure ESLint and Prettier with TypeScript rules in .eslintrc.json and .prettierrc
- [ ] T004 Initialize Supabase project with local development config in supabase/config.toml
- [ ] T005 [P] Create .env.local.example with all required environment variables (SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, LINE_CHANNEL_SECRET, LINE_CHANNEL_ACCESS_TOKEN, LINE_LOGIN_CHANNEL_ID, LINE_LOGIN_CHANNEL_SECRET)
- [ ] T006 Create project directory structure per plan.md (src/app/(auth), src/app/(referee), src/app/(admin), src/app/api, src/components, src/lib/supabase, src/lib/line, src/types, supabase/migrations, tests/unit, tests/integration)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: すべてのユーザーストーリーが依存するコアインフラ

**⚠️ CRITICAL**: このフェーズが完了するまでユーザーストーリーの実装は開始できない

- [ ] T007 Create Supabase migration for `users` table with all columns (id, display_name, real_name, line_user_id, license_level, role_type, age_groups, region, travel_range_km, experience_years, referred_by, created_at, updated_at) in supabase/migrations/20260101000001_users.sql
- [ ] T008 Create Supabase migration for `regional_communities` and `community_members` tables with status transitions and unique constraint (community_id, user_id) in supabase/migrations/20260101000002_communities.sql
- [ ] T009 Create Supabase migration for `availabilities`, `matches`, and `assignments` tables with all columns, status enums, and indexes (idx_availabilities_user_date, idx_assignments_match_id, idx_assignments_status, idx_matches_match_date, idx_matches_community_status) in supabase/migrations/20260101000003_core_tables.sql
- [ ] T010 Create Supabase migration for all RLS policies (availabilities, matches, assignments, community_members, users real_name disclosure) in supabase/migrations/20260101000004_rls_policies.sql
- [ ] T011 [P] Setup Supabase server-side client using @supabase/ssr in src/lib/supabase/server.ts
- [ ] T012 [P] Setup Supabase browser-side client using @supabase/ssr in src/lib/supabase/client.ts
- [ ] T013 [P] Define TypeScript types for all DB entities matching data-model.md schemas in src/types/database.ts
- [ ] T014 [P] Define domain types (AssignmentStatus, CommunityMemberRole, CommunityMemberStatus) in src/types/domain.ts
- [ ] T015 Implement OAuth callback route handler for Google and LINE Login in src/app/api/auth/callback/route.ts
- [ ] T016 Create Next.js middleware for route protection (referee routes require approved community member, admin routes require organizer/manager role) in src/middleware.ts
- [ ] T017 Create login page with Google OAuth and LINE Login buttons in src/app/(auth)/login/page.tsx
- [ ] T018 [P] Setup LINE SDK wrapper with push message sender and HMAC-SHA256 signature verification in src/lib/line/client.ts
- [ ] T019 Create development seed data with 1 community, 3 referees, 1 organizer, 1 manager in supabase/seed.sql

**Checkpoint**: Foundation ready — user story implementation can now begin in parallel

---

## Phase 3: User Story 1 — 審判がプロフィールと空き日程を登録する (Priority: P1) 🎯 MVP

**Goal**: 審判が初回ログインからプロフィール・空き日程を登録でき、「審判データベース」として機能する状態を実現する

**Independent Test**: 審判ユーザーとしてログイン → プロフィール登録（資格・役割・年代・地域）→ 空き日程登録 → DB に保存されていることを確認できれば、この機能単体で価値検証可能

- [ ] T020 [P] [US1] Implement GET (list own) and POST (create) availability API in src/app/api/availability/route.ts using Supabase server client with referee auth check
- [ ] T021 [P] [US1] Implement DELETE availability API in src/app/api/availability/[id]/route.ts with ownership validation
- [ ] T022 [P] [US1] Implement GET and PATCH user profile API in src/app/api/profile/route.ts (update display_name, real_name, license_level, role_type, age_groups, region, travel_range_km, line_user_id)
- [ ] T023 [P] [US1] Create ProfileForm component with fields for license_level (S級/1級/2級/3級/4級), role_type (主審/副審/両方), age_groups (U12/U15/U18/Senior), region, travel_range_km in src/components/profile/ProfileForm.tsx
- [ ] T024 [P] [US1] Create AvailabilityCalendar component for selecting dates, time ranges, and age_groups in src/components/availability/AvailabilityCalendar.tsx
- [ ] T025 [US1] Create referee profile registration and edit page using ProfileForm component in src/app/(referee)/profile/page.tsx
- [ ] T026 [US1] Create availability management page using AvailabilityCalendar component with list and delete functionality in src/app/(referee)/availability/page.tsx
- [ ] T027 [US1] Add redirect-to-profile guard: when LINE webhook processes a postback from a user without a profile, return appropriate error and LINE reply message "プロフィールを登録してください" in src/lib/line/client.ts

**Checkpoint**: User Story 1 complete — referee can register profile and availability independently

---

## Phase 4: User Story 2 — 運営者が試合を作成して審判候補を確認する (Priority: P1)

**Goal**: 運営者が試合情報を入力し、空き日程・地域・資格・担当履歴でフィルタされた審判候補一覧を閲覧できる

**Independent Test**: 運営者としてログイン → 試合作成（日時・場所・年代・主副審数・報酬）→ 候補一覧表示（登録済み審判が条件でフィルタされて表示される）の流れが通れば価値検証可能

- [ ] T028 [P] [US2] Implement GET (list by community) and POST (create) matches API in src/app/api/matches/route.ts with organizer/manager auth check
- [ ] T029 [P] [US2] Implement GET match detail API in src/app/api/matches/[id]/route.ts
- [ ] T030 [P] [US2] Implement GET candidates API in src/app/api/matches/[id]/candidates/route.ts — filter by: availability date match, region overlap, license_level, age_groups compatibility; include assignment history summary (total_assignments, last_active_date) per candidate using trust visibility query from data-model.md
- [ ] T031 [P] [US2] Create MatchForm component with fields for title, match_date, start_time, venue, age_group, referees_needed, assistants_needed, compensation, notes in src/components/matches/MatchForm.tsx
- [ ] T032 [P] [US2] Create CandidateList component showing referee display_name, license_level, role_type, age_groups, total_assignments, last_active_date in src/components/matches/CandidateList.tsx
- [ ] T033 [US2] Create admin matches list page showing all community matches with status badges in src/app/(admin)/matches/page.tsx
- [ ] T034 [US2] Create match detail page with candidate list display, including empty state message when no candidates match in src/app/(admin)/matches/[id]/page.tsx

**Checkpoint**: User Story 2 complete — organizer can create matches and view filtered candidates independently

---

## Phase 5: User Story 3 — 運営者が審判へLINE通知を送りアサインを確定する (Priority: P2)

**Goal**: 通知送信 → 審判ワンタップ回答 → アサイン確定という完全なマッチングフローを実現する

**Independent Test**: 運営者が候補選択してLINE通知送信 → 審判がLINEで「参加」タップ → 管理画面リアルタイム更新 → 運営者がアサイン確定 → 確定通知が届く、という一連フローが通れば価値検証可能

- [ ] T035 [P] [US3] Build LINE Flex Message builder for match notification (title, match_date formatted as M月D日(曜日), start_time, venue, age_group, compensation, accept/decline postback buttons with assignmentId) in src/lib/line/messages.ts
- [ ] T036 [P] [US3] Implement POST assignments API in src/app/api/matches/[id]/assignments/route.ts: create assignment records (status=notified), send LINE push messages via src/lib/line/client.ts for each selected referee using Flex Message template
- [ ] T037 [P] [US3] Implement PATCH assignment confirm API in src/app/api/matches/[id]/assignments/[assignmentId]/confirm/route.ts: update status to confirmed, set confirmed_at, send LINE confirmation message "アサインが確定しました"
- [ ] T038 [US3] Implement POST /api/webhook/line route: verify x-line-signature HMAC-SHA256, parse postback events, lookup user by line_user_id, validate assignment ownership, update assignment status (accept→accepted/decline→declined with responded_at), send reply message in src/app/api/webhook/line/route.ts
- [ ] T039 [US3] Create assignment status page with Supabase Realtime subscription to assignments table changes (INSERT/UPDATE) showing notified/accepted/declined/confirmed counts in src/app/(admin)/matches/[id]/assignments/page.tsx
- [ ] T040 [US3] Add confirm assignment action button in assignment status page that calls PATCH confirm API and updates UI in src/app/(admin)/matches/[id]/assignments/page.tsx
- [ ] T041 [US3] Create Supabase Edge Function for daily reminder: query assignments WHERE status='confirmed' AND match_date = tomorrow, send LINE push message "【リマインド】明日の試合があります: {title} {venue}" in supabase/functions/send-reminders/index.ts
- [ ] T042 [US3] Configure pg_cron schedule to run reminder Edge Function nightly at 20:00 JST in supabase/migrations/20260101000005_cron.sql

**Checkpoint**: User Story 3 complete — full match-to-assignment flow works end-to-end

---

## Phase 6: User Story 4 — 地域管理者が審判の参加を承認する (Priority: P2)

**Goal**: 新規審判の参加申請から管理者承認まで、信頼性担保のための承認フローを実現する

**Independent Test**: 新規ユーザー登録申請 → 管理者が承認待ちリスト確認 → 承認アクション → 当該ユーザーが試合候補として表示されるようになる流れが確認できれば価値検証可能

- [ ] T043 [P] [US4] Implement POST community apply API in src/app/api/communities/[id]/apply/route.ts: create community_members record with status=pending
- [ ] T044 [P] [US4] Implement GET community members list API in src/app/api/communities/[id]/members/route.ts: return pending/approved/rejected members (manager role only)
- [ ] T045 [P] [US4] Implement PATCH approve member API in src/app/api/communities/[id]/members/[userId]/approve/route.ts: update status to approved, set approved_by and approved_at (manager role only)
- [ ] T046 [P] [US4] Implement PATCH reject member API in src/app/api/communities/[id]/members/[userId]/reject/route.ts: update status to rejected (manager role only)
- [ ] T047 [P] [US4] Create ApprovalList component showing pending members with approve/reject buttons and member display_name, region, license_level in src/components/members/ApprovalList.tsx
- [ ] T048 [US4] Create members management page for managers with ApprovalList and approved members overview in src/app/(admin)/members/page.tsx
- [ ] T049 [US4] Create community join application page for referees showing community name, description and apply button in src/app/(referee)/join/page.tsx
- [ ] T050 [US4] Verify RLS policies: unapproved (pending/rejected) users are excluded from candidates API response by testing with pending-status test user

**Checkpoint**: User Story 4 complete — trusted community management flow works independently

---

## Phase 7: User Story 5 — 審判が自分の担当履歴を確認する (Priority: P3)

**Goal**: 審判が過去の確定済みアサイン履歴を閲覧・フィルタできる

**Independent Test**: アサイン確定済みの審判ユーザーとして履歴ページにアクセスし、日時・会場・年代・カテゴリが一覧表示され、フィルタが機能すれば価値検証可能

- [ ] T051 [P] [US5] Implement GET assignments history API in src/app/api/assignments/route.ts: return confirmed assignments for the authenticated referee with match details (title, match_date, venue, age_group, role) ordered by match_date desc; support optional query params age_group and date_from/date_to for filtering
- [ ] T052 [P] [US5] Create AssignmentHistory component displaying assignment cards with match_date (M月D日(曜日)), venue, age_group, role badge in src/components/history/AssignmentHistory.tsx
- [ ] T053 [US5] Create referee history page with AssignmentHistory component and filter controls (age_group select, date range picker) in src/app/(referee)/history/page.tsx

**Checkpoint**: User Story 5 complete — referee can view and filter assignment history independently

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: 複数ユーザーストーリーに影響する横断的な改善

- [ ] T054 [P] Create shared UI component library (Button, Card, Badge, LoadingSpinner, EmptyState) with Tailwind CSS in src/components/ui/
- [ ] T055 [P] Implement error boundary component and global error page in src/app/error.tsx and src/components/ErrorBoundary.tsx
- [ ] T056 [P] Mobile-first responsive layout review and adjustment across all referee pages (profile, availability, history, join) in src/app/(referee)/
- [ ] T057 [P] Mobile-first responsive layout review across all admin pages (matches, members) in src/app/(admin)/
- [ ] T058 Validate all RLS policies in Supabase local environment using Supabase dashboard table editor with test users of each role
- [ ] T059 End-to-end flow validation following quickstart.md: setup → seed → full referee registration flow → full organizer match + notification flow
- [ ] T060 [P] Configure Vercel deployment settings and document required environment variables in README deployment section

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 依存なし — 即座に開始可能
- **Foundational (Phase 2)**: Phase 1 完了後に開始 — **全ユーザーストーリーをブロック**
- **US1 (Phase 3)** & **US2 (Phase 4)**: Phase 2 完了後に並列実行可能（どちらも P1）
- **US3 (Phase 5)** & **US4 (Phase 6)**: US1 + US2 完了後に開始（US3 は候補一覧に依存、US4 は承認済みメンバーが候補表示に影響）
- **US5 (Phase 7)**: US3 完了後（確定済みアサインが存在して初めて意味を持つ）
- **Polish (Phase 8)**: 対象ユーザーストーリーがすべて完了後

### User Story Dependencies

- **US1 (P1)**: Phase 2 完了後に開始可能 — 他のストーリーへの依存なし
- **US2 (P1)**: Phase 2 完了後に開始可能 — US1 と並列実行可能
- **US3 (P2)**: US1 + US2 完了後 — 候補一覧（US2）と審判プロフィール（US1）に依存
- **US4 (P2)**: Phase 2 完了後に開始可能 — ただし US1 完了後に E2E で検証推奨
- **US5 (P3)**: US3 完了後 — 確定済みアサインデータが必要

### Within Each User Story

- API routes → UI components → Page integration の順で実装
- 並列マーク [P] のタスクは同時実行可能（異なるファイル、依存関係なし）
- 各ストーリーの最終タスクで独立テストを実施してから次フェーズへ進む

---

## Parallel Examples

### User Story 1 (Phase 3) — 同時実行可能なタスク

```bash
# API層 (T020, T021, T022) を同時実行
Task T020: src/app/api/availability/route.ts
Task T021: src/app/api/availability/[id]/route.ts
Task T022: src/app/api/profile/route.ts

# コンポーネント層 (T023, T024) を同時実行
Task T023: src/components/profile/ProfileForm.tsx
Task T024: src/components/availability/AvailabilityCalendar.tsx
```

### User Story 2 (Phase 4) — 同時実行可能なタスク

```bash
# API層 (T028, T029, T030) を同時実行
Task T028: src/app/api/matches/route.ts
Task T029: src/app/api/matches/[id]/route.ts
Task T030: src/app/api/matches/[id]/candidates/route.ts

# コンポーネント層 (T031, T032) を同時実行
Task T031: src/components/matches/MatchForm.tsx
Task T032: src/components/matches/CandidateList.tsx
```

### User Story 3 (Phase 5) — 同時実行可能なタスク

```bash
# LINE層 + API層を同時実行
Task T035: src/lib/line/messages.ts  (Flex Message builder)
Task T036: src/app/api/matches/[id]/assignments/route.ts
Task T037: src/app/api/matches/[id]/assignments/[assignmentId]/confirm/route.ts
```

---

## Implementation Strategy

### MVP First (P1 Stories Only — US1 + US2)

1. Phase 1: Setup を完了
2. Phase 2: Foundational を完了（CRITICAL — 全ストーリーをブロック）
3. Phase 3: US1（審判登録）を完了
4. Phase 4: US2（試合作成・候補確認）を完了
5. **STOP and VALIDATE**: US1 + US2 で「審判データベース + 候補一覧」として機能するか確認
6. 必要に応じてデモ・パイロット開始

### Incremental Delivery

1. Setup + Foundational → 基盤完成
2. US1 完了 → 審判が登録できる → 価値検証
3. US2 完了 → 運営者が候補を探せる → MVP 最小機能セット
4. US3 完了 → LINE 通知 + アサイン確定 → コア価値提供
5. US4 完了 → 信頼ベース承認 → 本番運用に必要な安全機構
6. US5 完了 → 担当履歴可視化 → 信頼の蓄積機能
7. Polish → 本番品質へ

### Parallel Team Strategy

Phase 2 完了後:
- **Developer A**: US1（審判プロフィール・空き日程）
- **Developer B**: US2（試合作成・候補検索）
- Phase 3/4 完了後 → Developer A: US3、Developer B: US4、Developer C: US5

---

## Summary

| Phase | User Story | Priority | Tasks | Notes |
|-------|-----------|----------|-------|-------|
| 1 | Setup | — | T001–T006 (6) | 即座に開始可能 |
| 2 | Foundational | — | T007–T019 (13) | 全フェーズをブロック |
| 3 | US1 審判登録 | P1 🎯 | T020–T027 (8) | MVP |
| 4 | US2 試合作成・候補確認 | P1 | T028–T034 (7) | US1と並列可 |
| 5 | US3 LINE通知・アサイン確定 | P2 | T035–T042 (8) | US1+US2完了後 |
| 6 | US4 管理者承認 | P2 | T043–T050 (8) | Phase 2後に開始可 |
| 7 | US5 担当履歴 | P3 | T051–T053 (3) | US3完了後 |
| 8 | Polish | — | T054–T060 (7) | 全ストーリー完了後 |
| **合計** | | | **60 tasks** | |

## Notes

- **[P]** タスクは異なるファイルを扱い、未完了タスクへの依存がないため並列実行可能
- **[US?]** ラベルはユーザーストーリーとタスクのトレーサビリティを示す
- 各ユーザーストーリーはチェックポイントで独立してテスト可能
- Phase 2 の RLS ポリシーは各ストーリーのセキュリティ要件を一括カバー
- LINE Webhook (T038) は ngrok を使ったローカルテストが必要（quickstart.md 参照）
- Supabase Edge Function (T041) は `supabase functions serve` でローカルテスト可能
