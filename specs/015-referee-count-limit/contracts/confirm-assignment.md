# Contract: Confirm Assignment

**Endpoint**: `PATCH /api/matches/[id]/assignments/[assignmentId]/confirm`  
**Auth**: Session cookie (organizer or manager role required)

## Success Response

**Status**: 200  
**Body**: Updated assignment row

## Error Responses

| Status | Error Code | Condition |
|--------|-----------|-----------|
| 401 | — | Unauthenticated |
| 403 | — | Not an organizer/manager of this community |
| 404 | — | Match or assignment not found |
| 409 | `ALREADY_CONFIRMED` | Assignment already in confirmed state |
| 409 | `SLOT_FULL` | Confirmed count for this role already meets required count ← **NEW** |
| 400 | `ORGANIZER_PHONE_MISSING` | Organizer has no phone number registered |
| 400 | `REFEREE_PHONE_MISSING` | Referee has no phone number registered |
| 500 | — | DB update failed |

### SLOT_FULL response body

```json
{
  "error": "SLOT_FULL",
  "message": "主審（または副審）の確定人数が募集人数に達しています"
}
```
