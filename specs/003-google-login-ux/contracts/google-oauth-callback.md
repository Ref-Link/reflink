# Contract: GET /api/auth/callback

**Route**: `src/app/api/auth/callback/route.ts`  
**Role**: Google OAuth PKCE callback handler

## Request

```
GET /api/auth/callback?code={code}&next={next}&error={error}
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `code`    | string | conditional | OAuth authorisation code from Google |
| `next`    | string | no | URL to redirect after login (default: `/`) |
| `error`   | string | conditional | OAuth error from Google provider |

## Response

All responses are `302 Redirect`.

| Condition | Redirect target |
|-----------|----------------|
| `error` present | `/login?error={error}` |
| Code exchange fails | `/login?error={message}` |
| Session setup fails (no user) | `/login` |
| New user (no `users` row) | `/profile` |
| Returning user | `next` if `next.startsWith('/')`, else `/` |

## Side Effects (after this feature)

1. **Code exchange**: `supabase.auth.exchangeCodeForSession(code)` — establishes session cookies
2. **LINE linkage** (new): If `users.line_user_id IS NULL` for the authenticated user AND `get_line_user_id_by_email(user.email)` returns a non-null value → `UPDATE public.users SET line_user_id = ? WHERE id = user.id`
3. **No stub creation** (changed): Previously created a placeholder `users` row with default field values; this is removed. Profile creation is now deferred to the profile page via `PATCH /api/profile`.

## Error handling

- LINE linkage failure: caught silently; Google login proceeds normally (FR-004)
- Any other error in linkage: logged server-side, does not affect redirect

## Changed from previous behaviour

| Behaviour | Before | After |
|-----------|--------|-------|
| New user redirect | `/profile?setup=true` | `/profile` |
| Stub profile creation | Yes (on first login) | No |
| LINE account linkage | Metadata-only (`user_metadata.line_user_id`) | Email RPC lookup on every login when `line_user_id` is null |
