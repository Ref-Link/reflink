# Data Model: Google Login UX Parity

**Branch**: `003-google-login-ux` | **Phase**: 1

## Existing Schema (unchanged)

The `public.users` table requires no column changes.

```
public.users
├── id           uuid (PK, FK → auth.users.id)
├── display_name text NOT NULL
├── real_name    text
├── line_user_id text UNIQUE  ← populated by this feature for Google users
├── license_level text
├── role_type    text[]
├── age_groups   text[]
├── region       text
└── ...
```

`auth.users` (Supabase-managed):
```
auth.users
├── id    uuid (PK)
├── email text UNIQUE  ← used for LINE → Google email matching
└── raw_user_meta_data jsonb  ← contains full_name for Google OAuth users
```

---

## New Database Object: `get_line_user_id_by_email` RPC

**Migration**: `supabase/migrations/20260606000001_google_ux_line_linkage.sql`

```sql
-- Returns the line_user_id for any user whose auth email matches lookup_email.
-- Called from the Google OAuth callback (admin client) to link LINE accounts.
-- SECURITY DEFINER allows querying auth.users despite RLS restrictions.
CREATE OR REPLACE FUNCTION public.get_line_user_id_by_email(lookup_email TEXT)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.line_user_id
  FROM public.users u
  JOIN auth.users a ON a.id = u.id
  WHERE lower(a.email) = lower(lookup_email)
    AND u.line_user_id IS NOT NULL
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_line_user_id_by_email(TEXT) TO service_role;
```

**Behaviour**:
| Scenario | Result |
|----------|--------|
| Google + LINE accounts share same UUID (Supabase default) and `users.line_user_id` is set | Returns existing `line_user_id` |
| Google user's `users.line_user_id` is null (LINE not yet linked) | Returns NULL |
| LINE user used fake email (`line_XXX@line.reflink.local`) | Returns NULL (no email match) |
| Email match, but `line_user_id` is NULL in users row | Returns NULL |

**Security**: `service_role` only (called exclusively from server-side admin client). Not exposed to `authenticated` or `anon` roles.

---

## State Transitions: Google Login Flow

```
Google OAuth complete
        │
        ▼
GET /api/auth/callback
        │
        ├─ exchangeCodeForSession
        ├─ getUser()
        │
        ├─ Check users table ──────────────── profile exists?
        │                                        │
        │           NO (new user)               YES (returning user)
        │           │                            │
        │           ▼                            ▼
        │    stub NOT created            check line_user_id is null?
        │           │                            │
        │           │                    YES     │    NO
        │           │                     │      │     └─ skip linkage
        │           │                     ▼      │
        │           └──────────────► get_line_user_id_by_email(email)
        │                                   │
        │                           found?  │
        │                           YES     │  NO
        │                            │      └─ skip
        │                            ▼
        │                    UPDATE users SET line_user_id = ?
        │
        └─ Redirect:
            new user    → /profile
            returning   → next ?? /
```

---

## Affected Files Summary

| File | Change Type | Reason |
|------|-------------|--------|
| `src/app/api/auth/callback/route.ts` | Modify | Remove `?setup=true`, remove stub, add LINE linkage |
| `src/app/(referee)/profile/page.tsx` | Modify | Pre-fill display_name from auth metadata when new |
| `supabase/migrations/20260606000001_google_ux_line_linkage.sql` | Create | New RPC function |
