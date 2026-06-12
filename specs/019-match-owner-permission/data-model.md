# Data Model: 試合操作権限の限定

## スキーマ変更

### assignments テーブル（変更）

```sql
ALTER TABLE public.assignments
  ADD COLUMN confirmed_by uuid REFERENCES public.users(id);
```

| 列 | 型 | NULL | 説明 |
|----|----|----|------|
| confirmed_by | uuid | 許容 | 確定操作を実行したユーザーのID。status = 'confirmed' のときに設定。既存レコードはNULL |

**インデックス**: 不要（JOIN・フィルタのユースケースなし）

---

## 権限判定ロジック

```
isOwnerOrManager(user, match, membership):
  if membership.role === 'manager' → true
  if match.created_by === user.id → true
  else → false (403)
```

### 適用箇所

| エンドポイント | 現在 | 変更後 |
|--------------|------|--------|
| `GET /api/matches` | コミュニティ全試合 | organizer: 自分の試合のみ / manager: 全件 |
| `GET /api/matches/[id]` | コミュニティ内任意 | isOwnerOrManager チェック追加 |
| `GET /api/matches/[id]/candidates` | コミュニティ内任意 | isOwnerOrManager チェック追加 |
| `POST /api/matches/[id]/assignments` | コミュニティ内任意 | isOwnerOrManager チェック追加 |
| `PATCH …/confirm` | コミュニティ内任意 | isOwnerOrManager チェック + confirmed_by 保存 |

---

## 担当履歴の連絡先表示ロジック

`GET /api/assignments` のレスポンスに `proxy_confirmer_phone` / `proxy_confirmer_name` を追加する。

```
if assignment.confirmed_by != null AND confirmed_by != match.created_by:
  fetch users where id = confirmed_by → proxy_confirmer_phone, proxy_confirmer_name
else:
  proxy_confirmer_phone = null
  proxy_confirmer_name = null
```

### レスポンス形状（matches フィールド内）

```typescript
{
  organizer_phone: string | null      // 試合作成者の電話番号（既存）
  organizer_name: string | null       // 試合作成者の氏名（既存）
  proxy_confirmer_phone: string | null // 代理確定者の電話番号（新規、nullなら非表示）
  proxy_confirmer_name: string | null  // 代理確定者の氏名（新規、nullなら非表示）
}
```

---

## TypeScript 型変更

### `Database['public']['Tables']['assignments']['Row']`

```typescript
confirmed_by: string | null   // 追加
```

### `AssignmentHistoryItem['matches']`

```typescript
proxy_confirmer_phone: string | null  // 追加
proxy_confirmer_name: string | null   // 追加
```
