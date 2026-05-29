# Contract: LINE Webhook Endpoint

**Endpoint**: `POST /api/webhook/line`  
**Direction**: LINE Platform → RefLink Server  
**Auth**: LINE signature validation (`x-line-signature` header)

---

## Request

### Headers

| Header | Required | Description |
|--------|----------|-------------|
| `x-line-signature` | Yes | HMAC-SHA256 of request body, Base64 encoded. Must be verified against Channel Secret before processing. |
| `content-type` | Yes | `application/json` |

### Body

LINE Webhook Events envelope:

```json
{
  "destination": "<LINE Bot User ID>",
  "events": [
    {
      "type": "postback",
      "replyToken": "<token>",
      "source": {
        "type": "user",
        "userId": "<LINE User ID>"
      },
      "timestamp": 1234567890000,
      "postbackData": {
        "data": "<postback data string>"
      }
    }
  ]
}
```

### Postback Data Format

Assignment responses use the following format:

```
action=accept&assignmentId=<uuid>
action=decline&assignmentId=<uuid>
```

| Field | Values | Description |
|-------|--------|-------------|
| `action` | `accept` \| `decline` | Referee's response |
| `assignmentId` | UUID | References `assignments.id` |

---

## Processing Logic

1. Verify `x-line-signature` header. Return `400` if invalid.
2. Parse events array. Ignore non-`postback` events (return `200` immediately).
3. For each `postback` event:
   a. Extract `userId` from `source`
   b. Look up `users` table by `line_user_id = userId`
   c. Parse `data` field: extract `action` and `assignmentId`
   d. Verify `assignments.user_id` matches the looked-up user (prevent spoofing)
   e. Update `assignments.status`:
      - `action=accept` → `accepted`, set `responded_at = now()`
      - `action=decline` → `declined`, set `responded_at = now()`
   f. Send reply message via LINE Reply API (using `replyToken`)

### Reply Messages

**On accept**:
```
参加を受け付けました。
運営者が確定次第、改めてお知らせします。
```

**On decline**:
```
辞退を受け付けました。
またの機会にご協力をお願いします。
```

**On error** (user not found, assignment not found, already responded):
```
処理できませんでした。管理者にお問い合わせください。
```

---

## Response

Always return `200 OK` to LINE Platform (even on business logic errors), to prevent LINE from retrying.

```json
{ "status": "ok" }
```

Return `400` only for signature verification failure.

---

## Outbound: Match Notification Message

Direction: RefLink Server → LINE Platform  
Endpoint: `POST https://api.line.me/v2/bot/message/push`

### Payload

```json
{
  "to": "<LINE User ID>",
  "messages": [
    {
      "type": "flex",
      "altText": "【試合審判募集】{title} {match_date}",
      "contents": {
        "type": "bubble",
        "body": {
          "type": "box",
          "layout": "vertical",
          "contents": [
            { "type": "text", "text": "【審判募集】", "weight": "bold" },
            { "type": "text", "text": "{title}" },
            { "type": "text", "text": "{match_date} {start_time}" },
            { "type": "text", "text": "{venue}" },
            { "type": "text", "text": "年代: {age_group}" },
            { "type": "text", "text": "報酬: {compensation}円" }
          ]
        },
        "footer": {
          "type": "box",
          "layout": "horizontal",
          "contents": [
            {
              "type": "button",
              "action": {
                "type": "postback",
                "label": "参加",
                "data": "action=accept&assignmentId={assignmentId}"
              },
              "style": "primary"
            },
            {
              "type": "button",
              "action": {
                "type": "postback",
                "label": "辞退",
                "data": "action=decline&assignmentId={assignmentId}"
              },
              "style": "secondary"
            }
          ]
        }
      }
    }
  ]
}
```

### Template Variables

| Variable | Source |
|----------|--------|
| `{title}` | `matches.title` |
| `{match_date}` | `matches.match_date` formatted as `M月D日(曜日)` |
| `{start_time}` | `matches.start_time` formatted as `H:MM` |
| `{venue}` | `matches.venue` |
| `{age_group}` | `matches.age_group` |
| `{compensation}` | `matches.compensation` (omit row if null) |
| `{assignmentId}` | `assignments.id` |
