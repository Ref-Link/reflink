# API Contract: 試合操作権限変更

## 変更されるエンドポイント

### GET /api/matches

**変更点**: organizer は自分が作成した試合のみ返す。manager は全件返す（既存と同じ）。

**エラーなし**（返る件数が減るだけ）

---

### GET /api/matches/[id]

**変更点**: ownership チェックを追加。

| 条件 | レスポンス |
|------|-----------|
| manager、または `match.created_by === user.id` | 200（既存と同じ） |
| organizer で自分の試合でない | 404（存在しないのと同等に扱う） |

**404を返す理由**: 他の organizer の試合が「存在はするが権限なし」だとわかるのは情報漏洩になるため。

---

### GET /api/matches/[id]/candidates

**変更点**: ownership チェックを追加。上記 GET /api/matches/[id] と同じ 404 パターン。

---

### POST /api/matches/[id]/assignments

**変更点**: ownership チェックを追加。同 404 パターン。

---

### PATCH /api/matches/[id]/assignments/[assignmentId]/confirm

**変更点**:
1. ownership チェック追加（同 404 パターン）
2. 確定成功時に `assignments.confirmed_by = user.id` を保存

```
PATCH /api/matches/{matchId}/assignments/{assignmentId}/confirm

Request: (変更なし、body不要)
Response 200: AssignmentRow (confirmed_by フィールドが追加される)
Response 404: { error: "Match not found" }  ← 権限なしの場合も同じ
```

---

### GET /api/assignments （審判向け担当履歴）

**変更点**: `matches` 内に `proxy_confirmer_phone` / `proxy_confirmer_name` を追加。

```typescript
// レスポンス型（matches フィールドの差分）
{
  // 既存フィールド
  organizer_phone: string | null
  organizer_name: string | null
  // 追加フィールド（代理確定者が作成者と異なる場合のみ非null）
  proxy_confirmer_phone: string | null
  proxy_confirmer_name: string | null
}
```
