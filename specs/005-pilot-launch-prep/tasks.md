---

description: "Task list for Pilot Launch Preparation"
---

# Tasks: Pilot Launch Preparation

**Input**: Design documents from `/specs/005-pilot-launch-prep/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/public-pages.md ✅, quickstart.md ✅

**Tests**: No test tasks — テストランナー未設定（手動ブラウザ検証は quickstart.md 参照）。

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US4)
- Exact file paths included in every task description

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: `public/` ディレクトリが存在しないため、アセット配置前に新規作成する。

- [ ] T001 Create `public/` directory at repository root (required before any asset can be placed)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 法的ページへの認証なしアクセスを許可するミドルウェア変更。`/terms` と `/privacy` のルート実装前に必須。

**⚠️ CRITICAL**: このフェーズが完了するまでユーザーストーリーフェーズを開始してはならない。

- [ ] T002 Add `/terms` and `/privacy` to `publicPaths` array in `src/middleware.ts` (change: `['/login', '/api/auth', '/api/webhook', '/auth']` → add `/terms` and `/privacy`)

**Checkpoint**: ミドルウェア更新完了 — 以降のユーザーストーリー実装を並行して開始できる

---

## Phase 3: User Story 1 - アプリブランディング設定 (Priority: P1) 🎯 MVP

**Goal**: ファビコン・PWAアイコン・OGPメタデータを設定し、Pilot参加者がRefLinkをスマートフォンのホーム画面に追加したとき、または SNS でシェアしたときに適切なブランディングが表示される。

**Independent Test**: `http://localhost:3000/manifest.json` が正しい JSON を返し、ブラウザ DevTools → Application → Manifest でアイコンが読み込まれることを確認。`curl -s http://localhost:3000 | grep -E 'og:|twitter:'` でOGPメタタグが出力されることを確認。

### Implementation for User Story 1

- [ ] T003 [P] [US1] Create `public/manifest.json` with PWA manifest (name: "RefLink", short_name: "RefLink", description: "地域サッカー審判マッチングプラットフォーム", start_url: "/", display: "standalone", background_color: "#F9FAFB", theme_color: "#2563EB", lang: "ja", icons for icon-192.png and icon-512.png)
- [ ] T004 [P] [US1] Create placeholder PNG icon files in `public/`: `icon-32.png` (32×32), `icon-192.png` (192×192), `icon-512.png` (512×512), and `og-image.png` (1200×630) — use Node.js or any available tool to generate solid-color PNGs (background #2563EB); must be valid PNG files (not empty) so browsers can load them
- [ ] T005 [US1] Update `metadata` export in `src/app/layout.tsx`: set `title: "RefLink"`, `description: "地域サッカー審判マッチングプラットフォーム"`, add `openGraph` block (title, description, type: "website", locale: "ja_JP", siteName: "RefLink", images: [{url: "/og-image.png", width: 1200, height: 630, alt: "RefLink"}]), add `icons` block (icon: [{url: "/icon-32.png", sizes: "32x32"}, {url: "/icon-192.png", sizes: "192x192"}], apple: [{url: "/icon-192.png", sizes: "192x192"}]), add `manifest: "/manifest.json"` — depends on T003, T004

**Checkpoint**: User Story 1 完了 — ブランディング設定が独立して検証可能

---

## Phase 4: User Story 2 - 利用規約ページ (Priority: P2)

**Goal**: 未認証ユーザーが `/terms` にアクセスし、FR-006 の全セクションを含む利用規約ページを閲覧できる。

**Independent Test**: `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/terms` → 200。ページに「サービスの目的」「利用資格」「禁止事項」「免責事項」「規約変更について」「問い合わせ先」の各セクションが表示されることをブラウザで確認。

### Implementation for User Story 2

- [ ] T006 [US2] Create `src/app/terms/page.tsx`: export metadata with title "利用規約 | RefLink", define `TERMS_SECTIONS` array with `LegalSection[]` type containing all 6 required sections (FR-006: サービスの目的・利用資格・禁止事項・免責事項・規約変更について・問い合わせ先) with Pilot-appropriate Japanese content, render using the layout pattern from data-model.md (max-w-2xl, px-4 py-8, section headings h2, paragraph text-sm leading-7)

**Checkpoint**: User Story 2 完了 — 利用規約ページが独立して検証可能（認証なしで 200 OK）

---

## Phase 5: User Story 3 - プライバシーポリシーページ (Priority: P3)

**Goal**: 未認証ユーザーが `/privacy` にアクセスし、FR-007 の全セクションを含むプライバシーポリシーページを閲覧できる。

**Independent Test**: `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/privacy` → 200。ページに「収集する個人情報の種類」「利用目的」「第三者提供」「データ保管・管理」「ユーザーの権利」「問い合わせ先」の各セクションが表示されることを確認。

### Implementation for User Story 3

- [ ] T007 [US3] Create `src/app/privacy/page.tsx`: export metadata with title "プライバシーポリシー | RefLink", define `PRIVACY_SECTIONS` array with `LegalSection[]` type containing all 6 required sections (FR-007: 収集する個人情報の種類・利用目的・第三者提供（LINE連携含む）・データ保管管理・ユーザーの権利（削除・訂正）・問い合わせ先) with Pilot-appropriate Japanese content, render using same layout pattern as terms page

**Checkpoint**: User Story 3 完了 — プライバシーポリシーページが独立して検証可能（認証なしで 200 OK）

---

## Phase 6: User Story 4 - フッターからのアクセス (Priority: P4)

**Goal**: 認証済みユーザーがアプリ内の任意のページからフッターの利用規約・プライバシーポリシーリンクにアクセスでき、ログインページからも規約リンクが参照できる。

**Independent Test**: ログイン後 `http://localhost:3000/profile` を開きページ最下部にフッターリンクが表示されることを確認。`http://localhost:3000/login` で免責テキストにリンクが含まれることを確認。

### Implementation for User Story 4

- [ ] T008 [P] [US4] Update `src/app/(referee)/layout.tsx`: add `<footer>` element after the `flex-1` content div and before the fixed bottom nav — use `border-t border-gray-200 dark:border-gray-700 py-4 pb-24 text-center` with flex row containing `<Link href="/terms">利用規約</Link>` and `<Link href="/privacy">プライバシーポリシー</Link>` (text-xs text-gray-400); change existing `flex-1` div's `pb-20` to `pb-0` to avoid double padding
- [ ] T009 [P] [US4] Update `src/app/admin/layout.tsx`: add same `<footer>` element with `pb-4` (no fixed nav in admin) containing `<Link href="/terms">利用規約</Link>` and `<Link href="/privacy">プライバシーポリシー</Link>`
- [ ] T010 [US4] Update disclaimer text in `src/app/(auth)/login/page.tsx`: replace plain text `"ログインすることで利用規約に同意したとみなされます"` with inline-linked version containing `<Link href="/terms" className="underline ...">利用規約</Link>` および `<Link href="/privacy" className="underline ...">プライバシーポリシー</Link>` per the pattern in data-model.md

**Checkpoint**: User Story 4 完了 — 全フッター・ログインページのリンクが検証可能

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: ビルド検証と手動検証シナリオの実行

- [ ] T011 Run `pnpm build` from repository root and confirm zero TypeScript type errors and zero ESLint errors
- [ ] T012 Run quickstart.md validation scenarios manually: Story 1 (1-1 to 1-3), Story 2 (2-1 to 2-3), Story 3 (3-1 to 3-2), Story 4 (4-1 to 4-3) — confirm all acceptance criteria pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — BLOCKS all user story pages from being publicly accessible
- **US1 (Phase 3)**: Depends on Phase 1 (public/ directory); T005 depends on T003, T004
- **US2 (Phase 4)**: Depends on Phase 2 (middleware publicPaths)
- **US3 (Phase 5)**: Depends on Phase 2 (middleware publicPaths)
- **US4 (Phase 6)**: No hard dependency on US2/US3, but links are meaningful only after pages exist
- **Polish (Phase 7)**: Depends on all phases complete

### User Story Dependencies

- **US1 (P1)**: Can start after Phase 1 — independent of US2, US3, US4
- **US2 (P2)**: Can start after Phase 2 — independent of US1, US3, US4
- **US3 (P3)**: Can start after Phase 2 — independent of US1, US2, US4
- **US4 (P4)**: Can start after Phase 2; logically after US2/US3 pages exist to link to

### Within Each User Story

- US1: T003 and T004 are parallel; T005 depends on T003 + T004
- US4: T008 and T009 are parallel; T010 is independent (different file)

### Parallel Opportunities

- T003 and T004 can run in parallel (manifest.json vs PNG files — different files)
- T008 and T009 can run in parallel (referee layout vs admin layout — different files)
- US1, US2, US3 phases can run in parallel once Phase 2 is complete

---

## Parallel Example: User Story 1

```bash
# Launch in parallel (different files, no dependencies on each other):
Task T003: "Create public/manifest.json with PWA manifest"
Task T004: "Create placeholder PNG icon files in public/"

# Then sequentially (depends on T003 + T004):
Task T005: "Update metadata export in src/app/layout.tsx"
```

## Parallel Example: User Story 4

```bash
# Launch in parallel (different layout files):
Task T008: "Add footer to src/app/(referee)/layout.tsx"
Task T009: "Add footer to src/app/admin/layout.tsx"

# Independent (different file, run anytime after Phase 2):
Task T010: "Update login page disclaimer in src/app/(auth)/login/page.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001)
2. Complete Phase 2: Foundational (T002)
3. Complete Phase 3: User Story 1 (T003 → T004 in parallel → T005)
4. **STOP and VALIDATE**: Check OGP tags with curl, check manifest.json in browser, verify favicon in tab
5. Proceed to US2/US3/US4 for legal compliance

### Incremental Delivery

1. Phase 1 + Phase 2 → Public directory + middleware ready
2. Phase 3 (US1) → Branding ready — validate in browser
3. Phase 4 (US2) → /terms live — validate unauthenticated access
4. Phase 5 (US3) → /privacy live — validate unauthenticated access
5. Phase 6 (US4) → Footer links live — validate from authenticated pages
6. Phase 7 — Build + manual quickstart.md validation

### Suggested MVP Scope

**Minimum for Pilot launch**: T001 → T002 → T003 → T004 → T005 (US1) + T006 (US2) + T007 (US3) + T010 (login page links) — フッター追加（T008, T009）は US1–US3 完了後に追加可能。

---

## Notes

- No new libraries — すべて Next.js 14 標準 API と Tailwind CSS で実装
- PNG placeholder files must be valid binary PNGs (not empty files) for browsers to load them
- Legal document content (`TERMS_SECTIONS`, `PRIVACY_SECTIONS`) should be Pilot-appropriate Japanese draft text; update via git diff when final copy is ready
- `pb-20` → `pb-0` change in referee layout is required to prevent double-padding when footer is added
- Admin layout has no fixed bottom nav, so footer uses `pb-4` not `pb-24`
- Commit after each phase or logical group for clean git history
