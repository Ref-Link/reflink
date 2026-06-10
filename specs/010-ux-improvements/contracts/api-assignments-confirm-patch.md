# Contract: PATCH /api/matches/[id]/assignments/[assignmentId]/confirm

**変更種別**: 既存エンドポイントに auto-status 副作用を追加。レスポンス形式に変更なし。

## Request

```
PATCH /api/matches/:id/assignments/:assignmentId/confirm
Authorization: session cookie (organizer/manager role required)
```

## Response

**200 OK** — 変更なし（`AssignmentRow` を返す）

## New Side Effect (FR-006)

アサインを `confirmed` に更新した後:

1. 当試合の全 confirmed アサインをクエリ
2. `role='referee'` の件数 ≥ `match.referees_needed` **AND** `role='assistant_referee'` の件数 ≥ `match.assistants_needed` の場合
3. `matches.status` を `'filled'` に更新

### Edge Cases

| ケース | 動作 |
|--------|------|
| `referees_needed = 0` | referee 件数は 0 ≥ 0 で条件を満たす |
| `assistants_needed = 0` | assistant 件数は 0 ≥ 0 で条件を満たす |
| すでに `status = 'filled'` | 再更新しても冪等 |
| 複数オーガナイザーが同時確定 | DB UPDATE は最後のリクエストが勝つ（重複確定は `409` で防止済み） |

### Implementation Note

```ts
// After updating assignment status:
const { data: allConfirmed } = await supabase
  .from('assignments')
  .select('role')
  .eq('match_id', params.id)
  .eq('status', 'confirmed')

const confirmedReferees = (allConfirmed ?? []).filter(a => a.role === 'referee').length
const confirmedAssistants = (allConfirmed ?? []).filter(a => a.role === 'assistant_referee').length

if (
  confirmedReferees >= match.referees_needed &&
  confirmedAssistants >= match.assistants_needed
) {
  await supabase
    .from('matches')
    .update({ status: 'filled', updated_at: new Date().toISOString() })
    .eq('id', params.id)
}
```

**注**: `match` オブジェクトはすでに取得済み（`referees_needed`, `assistants_needed` を含む select に拡張が必要）。
