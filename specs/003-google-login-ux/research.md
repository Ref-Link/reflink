# Research: Google Login UX Parity

**Branch**: `003-google-login-ux` | **Phase**: 0

## Decision 1: Supabase same-email account merging behavior

**Decision**: Rely on Supabase's default "link by email" behavior as the primary linkage mechanism.

**Rationale**: Supabase enforces unique emails in `auth.users` and, by default, links OAuth sign-ins with the same email to the same `auth.users` UUID. A LINE user who signed up with their real email (`user@gmail.com`) and a Google user with the same email will share one UUID. The LINE callback already writes `users.line_user_id` for that UUID, so on subsequent Google logins the `users` row already has the correct value.

**Gap**: `user.user_metadata.line_user_id` is NOT reliably present in Google OAuth sessions even when the same UUID was previously used for LINE sign-in — Supabase does not merge `user_metadata` across providers on re-authentication. So the current guard `if (lineUserId)` in the Google callback misses the case where the metadata is absent but `users.line_user_id` is already populated.

**Solution**: Query `users.line_user_id` directly after obtaining the profile, instead of relying solely on metadata. For FR-006 (returning user re-check), always perform the email-based RPC lookup when `users.line_user_id` is null.

**Alternatives considered**:
- Store email in `users` table: Adds redundancy, requires migration; rejected in favour of querying via `auth.users` JOIN.
- `supabaseAdmin.auth.admin.getUserByEmail()`: Returns the current user only (same email = same UUID under default config); insufficient for cross-account lookup.

---

## Decision 2: Email-based LINE linkage via Supabase RPC

**Decision**: Add a `SECURITY DEFINER` Postgres function `get_line_user_id_by_email(lookup_email text)` that JOINs `auth.users` with `public.users` to return `line_user_id` for any user whose auth email matches the given email (case-insensitive).

**Rationale**: Row-level security prevents the app client from reading `auth.users` directly. A `SECURITY DEFINER` function runs as the schema owner and can access `auth.users`. Called from the Google callback via `createAdminClient().rpc(...)`, this is safe because the admin client is server-only. The function handles both:
- Same UUID: returns own `line_user_id` (noop if already set)
- Different UUID (rare; would require Supabase "allow multiple" config): copies `line_user_id` from the matching user

**Fake email exclusion**: The function's `WHERE` clause excludes `line_XXX@line.reflink.local` fake emails naturally — they won't match a real Google email.

**Performance**: Single indexed lookup; adds < 5 ms to callback latency (well within SC-004's 500 ms budget).

**Alternatives considered**:
- `listUsers()` scan: O(N) over all users; rejected.
- `getUserByEmail()` admin API: returns current user only; insufficient.

---

## Decision 3: Display name pre-fill for new Google users

**Decision**: Remove stub profile creation from the Google callback. The profile page reads `supabase.auth.getUser()` (client-side) when no profile exists and initialises `display_name` from `user.user_metadata.full_name ?? user.email`.

**Rationale**: The current callback creates a stub in `users` table before redirecting. Because the stub exists, `GET /api/profile` returns 200 and the profile page sets `isNew = false`, showing "プロフィール編集" — which contradicts acceptance scenario 1 ("プロフィール登録"). Removing stub creation means `/api/profile` returns 404 for a true new user, `isNew = true`, and the title is correct. Google OAuth always provides `full_name` in `user_metadata` (verified by Supabase docs and Google OIDC spec).

**Alternatives considered**:
- Pass `display_name` as URL search param: Exposes PII in URL / browser history; rejected.
- Add `setup_completed` flag to `users` table: Extra schema complexity; rejected.
- Keep stub, check for sentinel region value: Fragile; rejected.

**LINE callback unchanged**: The LINE callback continues to create a stub because LINE's display name is available server-side and LINE users currently see "プロフィール編集". This spec only addresses Google parity; aligning LINE onboarding title is out of scope.

---

## Decision 4: `next` redirect handling (FR-007)

**Decision**: No changes required. The `next` parameter is already preserved through the OAuth PKCE flow via the `redirectTo` option in `signInWithOAuth` (login page passes `?next=...` in `redirectTo`), and the Google callback (`/api/auth/callback/route.ts`) already reads and applies `next`.

**Rationale**: Manual testing trace: `login?next=/availability` → Google OAuth → `/api/auth/callback?next=%2Favailability` → profile check → redirect to `/availability`. The code at line 29 of the callback already does `const redirectTo = next.startsWith('/') ? \`${origin}${next}\` : origin`. No change needed.

---

## Decision 5: LINE notification after linkage (FR-005)

**Decision**: No changes to notification code. The existing `pushMessage` / `pushTextMessage` in `src/lib/line/` already conditions on `line_user_id IS NOT NULL`. Once FR-003 sets `line_user_id` on the Google user's profile, notifications work automatically.

**Rationale**: The notification path reads `line_user_id` from the `users` table at send time. Setting it correctly via the Google callback is sufficient.
