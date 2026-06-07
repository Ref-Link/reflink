# Implementation Plan: ナビゲーション統一（Bottom Nav）

**Branch**: `007-unified-bottom-nav` | **Date**: 2026-06-07 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `/specs/007-unified-bottom-nav/spec.md`

## Summary

Unify navigation across referee and admin layouts by (1) adding a "ホーム" link to the referee bottom nav and removing the "コミュニティ" slot, (2) replacing the admin layout's header tabs with a fixed bottom nav, and (3) moving community join discovery into the referee profile page as a "所属コミュニティ" section. All changes are pure frontend — no schema migrations required.

## Technical Context

**Language/Version**: TypeScript 5 / Next.js 14.2 (App Router)  
**Primary Dependencies**: React 18, Tailwind CSS, Supabase JS (`@supabase/supabase-js`), `next/navigation`  
**Storage**: Supabase (PostgreSQL) — `community_members` JOIN `regional_communities` (no schema changes)  
**Testing**: No automated test suite in project  
**Target Platform**: Web PWA, mobile-first (iOS Safari / Android Chrome)  
**Project Type**: Web application (Next.js PWA)  
**Performance Goals**: No new latency requirements; community membership fetch is a single Supabase join query  
**Constraints**: Mobile safe-area-inset support (`env(safe-area-inset-bottom)`) must be preserved  
**Scale/Scope**: Pilot scale — single community, 20–30 referees

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. 信頼インフラ第一 | ✅ Pass | Navigation UX improvement; does not affect trust model |
| II. 既存文化の尊重 | ✅ Pass | No workflow changes; purely visual navigation reorg |
| III. 最小限のデジタル化 | ✅ Pass | Reduces nav clutter; community join moved to profile (less prominent = correct) |
| IV. 半クローズドコミュニティ | ✅ Pass | No change to access model or community discovery |
| V. 段階的な信頼可視化 | ✅ Pass | No rating or scoring features introduced |
| Tech Stack | ✅ Pass | Next.js + Supabase + Tailwind — no new dependencies |

**Post-Phase 1 re-check**: All gates still pass. No new external services, no schema changes, no access-model changes.

## Project Structure

### Documentation (this feature)

```text
specs/007-unified-bottom-nav/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit-tasks command)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── (referee)/
│   │   ├── layout.tsx                          # MODIFY: replace inline nav with <RefereeBottomNav />
│   │   └── profile/
│   │       └── page.tsx                        # MODIFY: add <CommunityMemberships /> below form
│   ├── admin/
│   │   └── layout.tsx                          # MODIFY: remove header tabs, add <AdminBottomNav />, pb-20
│   └── api/
│       └── communities/
│           └── my-memberships/
│               └── route.ts                    # NEW: GET returns CommunityMembership[]
├── components/
│   ├── nav/
│   │   ├── RefereeBottomNav.tsx                # NEW: 'use client', usePathname, 4-item nav
│   │   └── AdminBottomNav.tsx                  # NEW: 'use client', usePathname, 3-item nav
│   └── profile/
│       └── CommunityMemberships.tsx            # NEW: 'use client', fetch + display section
```

**Structure Decision**: Existing single-app Next.js structure. Nav components go into `src/components/nav/` (new directory) to keep layout files thin. Profile section goes into `src/components/profile/` consistent with `ProfileForm.tsx` co-location.

## Implementation Details

### 1. RefereeBottomNav (`src/components/nav/RefereeBottomNav.tsx`)

- `'use client'`
- `usePathname()` for active state: `pathname === item.href` (strict equality)
- Nav items: `[{ href: '/', label: 'ホーム', icon: HomeIcon }, { href: '/profile', ... }, { href: '/availability', ... }, { href: '/history', ... }]`
- Active item: `text-blue-600 dark:text-blue-400`; inactive: `text-gray-500 dark:text-gray-400`
- Preserve `style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}`
- Home icon: house SVG (not currently in referee nav — needs new icon)

### 2. AdminBottomNav (`src/components/nav/AdminBottomNav.tsx`)

- `'use client'`
- `usePathname()` for active state: `pathname === item.href`
- Nav items: `[{ href: '/', label: 'ホーム', icon: HomeIcon }, { href: '/admin/matches', label: '試合管理', icon: CalendarIcon }, { href: '/admin/members', label: 'メンバー管理', icon: UsersIcon }]`
- Same active/inactive color pattern as referee nav
- Same `style` for safe-area-inset

### 3. Referee Layout Update (`src/app/(referee)/layout.tsx`)

- Remove `NAV_ITEMS` array and inline `<nav>` block
- Import and render `<RefereeBottomNav />`
- Remove `pb-24` from `<footer>` (now handled inside RefereeBottomNav's safe-area padding)

### 4. Admin Layout Update (`src/app/admin/layout.tsx`)

- Remove `NAV_ITEMS` constant and the `<nav aria-label="管理ナビゲーション">` inside the header
- Remove extra header height caused by tab row
- Add `pb-20` to the content `<div className="px-4">` wrapper (so `<div className="px-4 pb-20">`)
- Add `<AdminBottomNav />` before `<footer>`
- Add same `pb-4` padding to footer (was already there)

### 5. Community Memberships API (`src/app/api/communities/my-memberships/route.ts`)

```ts
// GET /api/communities/my-memberships
// Returns: { community_id, community_name, status }[]
// Auth: required (401 if not authenticated)
// Filter: status IN ('pending', 'approved') — rejected excluded
// Join: community_members + regional_communities(name)
```

### 6. CommunityMemberships Component (`src/components/profile/CommunityMemberships.tsx`)

- `'use client'`
- `useEffect` fetch from `/api/communities/my-memberships` on mount
- Loading state: small spinner or `読み込み中...` text
- Empty state: "まだコミュニティに参加していません" + "コミュニティを追加" button → `/join`
- Populated state: list of `{ community_name, status }` with status badge (pending: 申請中/yellow, approved: 承認済み/green) + "コミュニティを追加" button always visible at bottom
- Status badge colors match existing `STATUS_COLORS` pattern from `AdminMembersClient`

### 7. Profile Page Update (`src/app/(referee)/profile/page.tsx`)

- Import `CommunityMemberships` from `@/components/profile/CommunityMemberships`
- Render `<CommunityMemberships />` after the closing tag of `<ProfileForm .../>` inside `<main>`
- Only show on edit mode (i.e., when `!isNew`) — new users are redirected to `/availability` after form submit, so the community section is irrelevant during first-time registration

## Complexity Tracking

No constitution violations. No complexity table needed.
