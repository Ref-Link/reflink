# Data Model: ナビゲーション統一（Bottom Nav）

**Branch**: `007-unified-bottom-nav` | **Phase**: 1 (Design)

## Entities

### BottomNavItem (Referee)

UI-only configuration object. No DB persistence.

| Field  | Type   | Description                          |
|--------|--------|--------------------------------------|
| href   | string | Route path                           |
| label  | string | Display label (Japanese)             |
| icon   | ReactNode | SVG icon element                  |

**Items (ordered)**:
1. `href: '/'`, label: `ホーム`
2. `href: '/profile'`, label: `プロフィール`
3. `href: '/availability'`, label: `空き日程`
4. `href: '/history'`, label: `担当履歴`

---

### BottomNavItem (Admin)

UI-only configuration object. No DB persistence.

| Field  | Type   | Description                          |
|--------|--------|--------------------------------------|
| href   | string | Route path                           |
| label  | string | Display label (Japanese)             |
| icon   | ReactNode | SVG icon element                  |

**Items (ordered)**:
1. `href: '/'`, label: `ホーム`
2. `href: '/admin/matches'`, label: `試合管理`
3. `href: '/admin/members'`, label: `メンバー管理`

---

### CommunityMembership (API response shape)

Derived view: `community_members` JOIN `regional_communities`. Not a new DB table.

| Field          | Type                    | Source                              |
|----------------|-------------------------|-------------------------------------|
| community_id   | string (UUID)           | `community_members.community_id`    |
| community_name | string                  | `regional_communities.name`         |
| status         | `'pending' \| 'approved'` | `community_members.status`       |

**Filter**: Only `pending` and `approved` rows are returned. `rejected` rows are excluded.

**Sort**: `community_members.created_at ASC` (oldest membership first).

---

## State Transitions

### Active Nav Item Detection

```
pathname (string)
  │
  ├── === '/'              → Home item active
  ├── === '/profile'       → Profile item active
  ├── === '/availability'  → Availability item active
  ├── === '/history'       → History item active
  ├── === '/admin/matches' → Matches item active
  └── === '/admin/members' → Members item active
```

All comparisons use strict equality (`pathname === item.href`). Prefix matching (e.g. `/admin/*`) is not used since the nav items have specific, non-nested routes.

---

## Validation Rules

- `CommunityMembership`: Only surface `status ∈ {pending, approved}` — rejected memberships are invisible to the referee.
- Nav active state: If `pathname` matches no nav item (e.g. `/join` while in referee layout), no item is highlighted (all default style). This is acceptable per spec assumptions.
