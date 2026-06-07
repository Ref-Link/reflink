# Research: ナビゲーション統一（Bottom Nav）

**Branch**: `007-unified-bottom-nav` | **Phase**: 0 (Research)

## Active State Detection in Next.js 14 App Router

**Decision**: Use `usePathname()` from `next/navigation` inside a `'use client'` component.

**Rationale**: App Router layouts are server components by default, but active state requires runtime path comparison. The minimal surgery is to extract each bottom nav into a dedicated client component (`RefereeBottomNav`, `AdminBottomNav`) while keeping the layout shell as a server component.

**Active state rules**:
- Home (`/`): exact match only — `pathname === '/'`
- Admin pages (`/admin/matches`, `/admin/members`): exact match — `pathname === item.href`
- Referee pages (`/profile`, `/availability`, `/history`): exact match — `pathname === item.href`
- `/join` is removed from the referee nav, so no match rule needed for it

**Alternatives considered**: Marking the whole layout as `'use client'` — rejected because it prevents future async data in the layout shell and is broader than needed.

---

## Supabase Join Query for Community Memberships

**Decision**: Use Supabase PostgREST embedded resource select to join `community_members` with `regional_communities` in a single query.

**Rationale**: Supabase JS client supports `select('*, regional_communities(name)')` syntax for foreign key joins. This avoids N+1 queries and returns community name alongside membership status in one round-trip.

**Query shape**:
```ts
supabase
  .from('community_members')
  .select('community_id, status, regional_communities(name)')
  .eq('user_id', userId)
  .in('status', ['pending', 'approved'])
  .order('created_at', { ascending: true })
```

**Response shape** (Supabase unwraps the join):
```json
[
  {
    "community_id": "uuid",
    "status": "pending",
    "regional_communities": { "name": "愛知西部FA" }
  }
]
```

The API route normalises this to `{ community_id, community_name, status }[]`.

**Alternatives considered**: Separate `regional_communities` fetch + in-memory join — rejected as two round-trips for no benefit.

---

## Admin Layout: Header Tabs → Fixed Bottom Nav

**Decision**: Remove the `<nav>` inside the `<header>` and add a fixed `<nav>` at the bottom, mirroring the referee layout pattern.

**Rationale**: The admin layout is a simple server component; no client state is needed in the layout shell itself. The bottom nav is extracted to `AdminBottomNav` (client) for active state.

**Content scroll clearance**: Admin pages need `pb-20` (or equivalent ≥ 4rem) on the content wrapper to prevent the fixed bottom nav from covering content. The referee layout already uses `pb-24` on the footer element; the admin layout will follow the same pattern.

**Alternatives considered**: Keeping header tabs as-is and adding a separate home button — rejected because the spec explicitly requires removing header tabs (FR-003, SC-003).

---

## Community Memberships API Route

**Decision**: New `GET /api/communities/my-memberships` route returning `CommunityMembership[]`.

**Rationale**: The profile page is a `'use client'` component that fetches data via `fetch('/api/...')`. A dedicated route keeps the fetch pattern consistent and avoids mixing server-side Supabase calls into a client page component.

**Response type**:
```ts
type CommunityMembership = {
  community_id: string
  community_name: string
  status: 'pending' | 'approved'
}
```

**Error handling**: Returns `[]` (empty array) when no memberships exist — the component renders an empty state with a "コミュニティを追加" button.

**Alternatives considered**: Direct Supabase client call from the profile page — possible but inconsistent with the existing fetch-from-API pattern established by `ProfileForm`.
