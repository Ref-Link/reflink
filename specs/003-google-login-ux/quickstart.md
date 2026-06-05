# Quickstart: Testing Google Login UX Parity

## Prerequisites

- Local Supabase running (`supabase start`)
- Google OAuth app configured with `http://localhost:3000/api/auth/callback` as redirect URI
- A test Google account with email that matches an existing LINE test user

## Run locally

```bash
pnpm dev
```

## Manual test flows

### Flow 1: New Google user (FR-001, FR-002)
1. Open `http://localhost:3000/login`
2. Click "Googleでログイン" — use a Google account that has **no** existing `users` row
3. Expected: redirected to `/profile` (NOT `/profile?setup=true`)
4. Expected: title shows **プロフィール登録**
5. Expected: `display_name` field is pre-filled with the Google account's full name

### Flow 2: First-time Google user completes profile (US-1 acceptance scenario 3)
1. Continue from Flow 1
2. Fill in all required fields and click "登録して空き日程へ進む"
3. Expected: redirected to `/availability`

### Flow 3: LINE account linkage (FR-003)
1. Sign in with LINE using a **real email address** (not a fake `line_XXX@...` address)
2. Sign out
3. Sign in with Google using **the same email**
4. Run: `SELECT line_user_id FROM users WHERE id = '<google_user_id>'`
5. Expected: `line_user_id` is populated with the LINE user's ID

### Flow 4: Returning user LINE linkage re-check (FR-006)
1. Sign in with Google first (no LINE account yet)
2. Note the user ID
3. Sign in with LINE using the same email
4. Sign out from LINE
5. Sign in with Google again
6. Expected: `users.line_user_id` is now set (LINE callback set it on step 3, still present)

### Flow 5: next parameter redirect (FR-007)
1. Open `http://localhost:3000/login?next=/availability`
2. Sign in with Google (use a user who already has a profile)
3. Expected: redirected to `/availability`

### Flow 6: No LINE match (no error)
1. Sign in with Google using an email that has no LINE account
2. Expected: login completes normally, `line_user_id` remains null, no error shown

## Verify LINE notifications (FR-005)
After Flow 3, trigger a match assignment for the linked user via admin panel.  
Expected: LINE push notification received on the user's LINE account.
