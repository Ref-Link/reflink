# Contract: アサイン確定 API

## `PATCH /api/matches/[id]/assignments/[assignmentId]/confirm`

**変更内容**: 既存エンドポイントに電話番号チェックゲートを追加する。

### Request

変更なし (リクエストボディなし)

### Response — Success

変更なし。`200 OK` + 更新された assignment オブジェクト。

### Response — Errors (新規)

**運営者の電話番号未登録**:
```json
{
  "error": "ORGANIZER_PHONE_MISSING",
  "message": "電話番号を登録してからアサインを確定してください"
}
```
HTTP status: `400`

**審判の電話番号未登録**:
```json
{
  "error": "REFEREE_PHONE_MISSING",
  "message": "審判の連絡先が未登録のため確定できません。審判に登録を依頼してください。"
}
```
HTTP status: `400`

### Server-side logic (変更点)

```
1. 認証チェック (既存)
2. 運営者ロール確認 (既存)
3. 試合・アサイン取得 (既存)
4. [NEW] 運営者の phone_number を取得
   → null の場合: { error: 'ORGANIZER_PHONE_MISSING' } を返して中断
5. [NEW] 審判の phone_number を取得
   → null の場合: { error: 'REFEREE_PHONE_MISSING' } を返して中断
6. assignment を confirmed に更新 (既存)
7. LINE確定通知を送信 (既存)
```

---

## `GET /api/matches/[id]/assignments/contact-info` (新規)

admin assignments page がリアルタイム購読後に確定済みアサインの電話番号を取得するためのエンドポイント。

### Auth

運営者/管理者ロール必須。

### Response

```json
{
  "abc123": "09012345678",
  "def456": null,
  "ghi789": "08087654321"
}
```

- キー: assignment ID
- 値: 審判の `phone_number` (確定済みのみ非null; 未確定は含まない)

### Server-side logic

```
1. 認証チェック
2. 運営者ロール確認
3. assignments を取得 (match_id = [id], status = 'confirmed')
4. 各 assignment の users.phone_number を取得 (service_role クライアント使用)
5. { [assignmentId]: phone_number | null } マップを返す
```

**Note**: `service_role` クライアントを使用するのは、RLS が電話番号取得を妨げないようにするため。エンドポイント自体で認可チェックを実施する。
