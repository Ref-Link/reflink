# Quickstart: ナビゲーション統一（Bottom Nav）

**Branch**: `007-unified-bottom-nav`

## Prerequisites

```bash
# Install dependencies (already done if repo is set up)
npm install

# Start dev server
npm run dev
# → http://localhost:3000
```

## Manual Smoke Tests

### Test 1: Referee Bottom Nav (FR-001, FR-002, FR-008)

1. Log in as a referee-role account
2. Navigate to `/profile`
3. Check: bottom nav shows **ホーム · プロフィール · 空き日程 · 担当履歴** (4 items, no コミュニティ)
4. Check: プロフィール icon is highlighted (active state)
5. Tap **ホーム** → should navigate to `/`
6. Repeat from `/availability` and `/history`

### Test 2: Admin Bottom Nav (FR-003, FR-004)

1. Log in as organizer/manager-role account
2. Navigate to `/admin/matches`
3. Check: **no header tabs** (header shows "RefLink 管理" only)
4. Check: bottom nav shows **ホーム · 試合管理 · メンバー管理** (3 items)
5. Check: 試合管理 icon is highlighted (active state)
6. Tap **ホーム** → should navigate to `/`
7. Tap **メンバー管理** → should navigate to `/admin/members`
8. Scroll page content to bottom — confirm it is not hidden behind the fixed nav

### Test 3: Community Section in Profile (FR-005, FR-006, FR-007)

1. Log in as referee with no community memberships
2. Navigate to `/profile`
3. Scroll past the form → check: **所属コミュニティ** section visible with empty state and "コミュニティを追加" button
4. Tap "コミュニティを追加" → should navigate to `/join`

5. Join a community (submit application)
6. Return to `/profile` → check: community appears with status badge (申請中)
7. As admin, approve the member
8. Return to `/profile` → check: community status badge changes to 承認済み

### Test 4: Edge Cases

- **Dual-role user**: Log in as a user with both organizer + referee roles. Verify that navigating from referee screens to admin screens via `/` home works smoothly.
- **`/join` page**: While in `/join`, check that the referee bottom nav is still shown (ホーム · プロフィール · 空き日程 · 担当履歴) with no item highlighted (no `/join` match).

## Key Files Changed

| File | Change |
|------|--------|
| `src/app/(referee)/layout.tsx` | Replace inline nav with `<RefereeBottomNav />` |
| `src/app/admin/layout.tsx` | Remove header tabs, add `<AdminBottomNav />`, add `pb-20` to content |
| `src/components/nav/RefereeBottomNav.tsx` | New client component: 4-item nav with active state |
| `src/components/nav/AdminBottomNav.tsx` | New client component: 3-item nav with active state |
| `src/components/profile/CommunityMemberships.tsx` | New client component: memberships list + add button |
| `src/app/(referee)/profile/page.tsx` | Render `<CommunityMemberships />` below `<ProfileForm />` |
| `src/app/api/communities/my-memberships/route.ts` | New GET route: returns user's pending/approved memberships |
