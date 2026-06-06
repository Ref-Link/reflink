# Implementation Plan: Google Login UX Parity

**Branch**: `003-google-login-ux` | **Date**: 2026-06-06 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `/specs/003-google-login-ux/spec.md`

## Summary

Bring Google OAuth login to parity with LINE login: redirect new users to `/profile` (no `?setup=true`), pre-fill `display_name` from Google account metadata, and automatically link a matching LINE account's `line_user_id` to the Google user's profile on every login. A new Supabase RPC function performs the email-based LINE lookup safely from the server-side callback.

## Technical Context

**Language/Version**: TypeScript 5 / Node.js 20 (Next.js 14.2)  
**Primary Dependencies**: Next.js 14, @supabase/ssr 0.10, @supabase/supabase-js 2.106, @line/bot-sdk 11  
**Storage**: Supabase PostgreSQL — `public.users` table (extends `auth.users`)  
**Testing**: No automated test framework configured; manual test flows defined in [quickstart.md](quickstart.md)  
**Target Platform**: Vercel (Next.js App Router, server-side API routes)  
**Project Type**: Web application (Next.js PWA)  
**Performance Goals**: SC-004 — Google callback processing time increase < 500 ms after LINE linkage check added  
**Constraints**: Supabase RLS; admin client restricted to server-side routes only; LINE `line_user_id` is the sole push notification key  
**Scale/Scope**: Pilot — ~20–30 referees; single region

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Assessment |
|-----------|------------|
| **I. 信頼インフラ第一** | ✅ LINE push notification linkage directly strengthens match coordination trust |
| **II. 既存文化の尊重** | ✅ LINE as primary channel is preserved and extended; no channel migration |
| **III. 最小限のデジタル化** | ✅ Changes are backend-only (callback) and minor UI (profile page default value); zero new screens |
| **IV. 半クローズドコミュニティ** | ✅ No open search, no new social graph features |
| **V. 段階的な信頼可視化** | ✅ No ratings/scoring introduced |
| **Tech Stack** | ✅ Next.js + Supabase + LINE Messaging API; no new third-party services |

**Post-Phase-1 re-check**: No constitution violations introduced by the RPC function or callback changes.

## Project Structure

### Documentation (this feature)

```text
specs/003-google-login-ux/
├── plan.md              ← this file
├── research.md          ← Phase 0 decisions
├── data-model.md        ← Phase 1 schema + flow
├── quickstart.md        ← manual test guide
├── contracts/
│   └── google-oauth-callback.md   ← modified route contract
└── tasks.md             ← Phase 2 output (/speckit-tasks — not yet created)
```

### Source Code (impacted files)

```text
src/
├── app/
│   ├── api/auth/callback/
│   │   └── route.ts          ← (1) Google callback: LINE linkage + redirect fix
│   └── (referee)/profile/
│       └── page.tsx          ← (2) Pre-fill display_name from auth metadata
supabase/
└── migrations/
    └── 20260606000001_google_ux_line_linkage.sql  ← (3) New RPC function
```

**Structure Decision**: Single Next.js web app (Option 1 variant). No new directories needed. All changes are contained to two existing route files and one new migration.

## Complexity Tracking

No constitution violations. Table not required.

---

## Phase 0: Research

See [research.md](research.md) for full findings. Key decisions:

1. **Supabase email merging**: Same-email Google + LINE accounts share one UUID by default. `users.line_user_id` set by LINE callback persists. The gap is that Google sessions don't include LINE `user_metadata`, so the existing `if (lineUserId)` guard in the callback misses already-linked users. Fix: check `users.line_user_id` directly.

2. **Email-based LINE lookup**: New `SECURITY DEFINER` Postgres function `get_line_user_id_by_email(text)` JOINs `auth.users` with `public.users`. Called via admin client from server-side callback. Fake emails (`line_XXX@line.reflink.local`) are automatically excluded because they don't match real Google emails.

3. **Display name pre-fill**: Remove stub profile creation from Google callback. Profile page reads `supabase.auth.getUser()` client-side and seeds `display_name` from `user.user_metadata.full_name` when no profile exists. This also fixes the "プロフィール登録" vs "プロフィール編集" title issue.

4. **`next` redirect (FR-007)**: Already works correctly. No changes required.

5. **LINE notifications (FR-005)**: Already conditioned on `line_user_id IS NOT NULL`. No changes required once FR-003 sets the value.

---

## Phase 1: Design & Contracts

### New DB object

**`public.get_line_user_id_by_email(lookup_email TEXT) → TEXT`**

```sql
CREATE OR REPLACE FUNCTION public.get_line_user_id_by_email(lookup_email TEXT)
RETURNS TEXT LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT u.line_user_id
  FROM public.users u
  JOIN auth.users a ON a.id = u.id
  WHERE lower(a.email) = lower(lookup_email)
    AND u.line_user_id IS NOT NULL
  LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.get_line_user_id_by_email(TEXT) TO service_role;
```

Full schema: [data-model.md](data-model.md)

### Modified: `src/app/api/auth/callback/route.ts`

**Change 1 — remove stub creation and `?setup=true`**:
```typescript
// BEFORE (new user path):
await supabase.from('users').insert({ id: user.id, display_name: ..., ... })
return NextResponse.redirect(`${origin}/profile?setup=true`)

// AFTER (new user path):
// No stub. Profile is created by the user via PATCH /api/profile on the profile page.
return NextResponse.redirect(`${origin}/profile`)
```

**Change 2 — LINE linkage on every login when `line_user_id` is null**:
```typescript
// After checking profile existence:
const currentLineUserId = profile?.line_user_id ?? null
if (!currentLineUserId && user.email) {
  try {
    const adminSupabase = createAdminClient()
    const { data: linkedId } = await adminSupabase
      .rpc('get_line_user_id_by_email', { lookup_email: user.email })
    if (linkedId) {
      await supabase.from('users').update({ line_user_id: linkedId }).eq('id', user.id)
    }
  } catch {
    // FR-004: linkage failure must not block login
  }
}
```

Full route contract: [contracts/google-oauth-callback.md](contracts/google-oauth-callback.md)

### Modified: `src/app/(referee)/profile/page.tsx`

**Change — pre-fill display_name from auth metadata when no profile**:
```typescript
// Add to useEffect or fetchProfile:
if (!profile) {
  const supabase = createClient()  // browser client
  const { data: { user } } = await supabase.auth.getUser()
  const defaultName = user?.user_metadata?.full_name ?? user?.email ?? ''
  setDefaultDisplayName(defaultName)
}
```
Pass `defaultDisplayName` as `initialData.display_name` to `ProfileForm` when `profile` is null.

---

## Implementation Order (for /speckit-tasks)

Suggested task sequencing:
1. Migration: add `get_line_user_id_by_email` RPC + grant (no app-code dependency)
2. Modify Google callback: LINE linkage logic using new RPC
3. Modify Google callback: remove stub creation + `?setup=true` redirect
4. Modify profile page: pre-fill display_name from auth metadata
5. Manual verification using quickstart.md flows
