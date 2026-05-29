# Contract: Internal API Routes

**Base URL**: `/api`  
**Auth**: Supabase session cookie (via `@supabase/ssr`)  
**Format**: JSON request/response

---

## Auth

| Route | Method | Description |
|-------|--------|-------------|
| `/api/auth/callback` | GET | OAuth callback (Google / LINE Login) |

---

## Community Membership

| Route | Method | Auth Role | Description |
|-------|--------|-----------|-------------|
| `/api/communities/:id/apply` | POST | authenticated | コミュニティ参加申請 |
| `/api/communities/:id/members` | GET | manager | 承認待ち一覧取得 |
| `/api/communities/:id/members/:userId/approve` | PATCH | manager | 承認 |
| `/api/communities/:id/members/:userId/reject` | PATCH | manager | 却下 |

---

## Availability

| Route | Method | Auth Role | Description |
|-------|--------|-----------|-------------|
| `/api/availability` | GET | referee | 自分の空き日程一覧 |
| `/api/availability` | POST | referee | 空き日程登録 |
| `/api/availability/:id` | DELETE | referee | 空き日程削除 |

---

## Matches

| Route | Method | Auth Role | Description |
|-------|--------|-----------|-------------|
| `/api/matches` | GET | organizer/manager | 試合一覧 |
| `/api/matches` | POST | organizer/manager | 試合作成 |
| `/api/matches/:id` | GET | organizer/manager | 試合詳細 |
| `/api/matches/:id/candidates` | GET | organizer/manager | 審判候補一覧（空き・地域・資格でフィルタ済み） |

---

## Assignments

| Route | Method | Auth Role | Description |
|-------|--------|-----------|-------------|
| `/api/matches/:id/assignments` | POST | organizer/manager | LINE 通知送信 & assignment レコード作成 |
| `/api/matches/:id/assignments/:assignmentId/confirm` | PATCH | organizer/manager | アサイン確定 |
| `/api/assignments` | GET | referee | 自分のアサイン履歴 |

---

## Webhook

| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/webhook/line` | POST | LINE signature | LINE Postback イベント受信（参加/辞退） |

詳細は [line-webhook.md](./line-webhook.md) を参照。
