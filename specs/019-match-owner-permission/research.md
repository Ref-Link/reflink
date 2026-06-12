# Research: 試合操作権限の限定（作成者＋マネージャー方針）

## 既存権限チェックの構造

すべての試合系 API route が `getOrganizerMembership()` を持ち、`role IN ('organizer', 'manager')` と `status = 'approved'` をチェックして `community_id` を返す。その後、試合を `community_id` でフィルタしている。

**変更点**: `role` も返り値に含まれており（既に含まれている）、match の `created_by` と照合する処理を各 route に追加するだけで権限制限を実現できる。

## 権限チェック方式

- **Decision**: アプリケーションレイヤーで実施。RLS変更なし。
- **Rationale**: assignments テーブルへのアクセスに admin client を使っている箇所が多く、RLS を変更しても効果が限定的。一方 API ルートは全件サーバーサイドで完結しているため、アプリケーションレイヤーのチェックで十分。
- **Alternatives considered**: RLS で `matches.created_by = auth.uid() OR manager` という制約を追加する案 → admin client を使うルートには効かないため不採用。

## `confirmed_by` カラム

- **Decision**: `assignments` テーブルに `confirmed_by uuid REFERENCES public.users(id)` を追加（NULL許容）。
- **Rationale**: 既存の confirmed レコードは NULL になるが、NULL の場合は代理確定者の連絡先を表示しない（= 試合作成者のみ表示）ので UI の動作として自然。マイグレーション後の新規 confirm からは常に記録する。
- **Alternatives considered**: `confirmed_by` をNOT NULLにして既存レコードに created_by を埋める → データ正確性が下がるため不採用（誰が確定したか不明なため）。

## 試合一覧フィルタ

- **Decision**: `GET /api/matches` で organizer の場合は `AND created_by = user.id` を追加、manager の場合はフィルタなし（全件）。
- **Rationale**: UI（admin/matches/page.tsx）は `/api/matches` のレスポンスをそのまま表示するだけなので、APIで絞ればフロントの変更は不要。
- **Alternatives considered**: フロントでフィルタする → URL 直接アクセスを防げないため不採用。

## 影響ファイル

| ファイル | 変更種別 |
|---------|---------|
| `supabase/migrations/YYYYMMDD_assignments_confirmed_by.sql` | 新規（DBスキーマ） |
| `src/types/database.ts` | 既存変更（confirmed_by フィールド追加） |
| `src/app/api/matches/route.ts` | 既存変更（GETに owner/manager フィルタ） |
| `src/app/api/matches/[id]/route.ts` | 既存変更（ownership チェック追加） |
| `src/app/api/matches/[id]/candidates/route.ts` | 既存変更（ownership チェック追加） |
| `src/app/api/matches/[id]/assignments/route.ts` | 既存変更（ownership チェック追加） |
| `src/app/api/matches/[id]/assignments/[assignmentId]/confirm/route.ts` | 既存変更（ownership チェック + confirmed_by 保存） |
| `src/app/api/assignments/route.ts` | 既存変更（confirmed_by 連絡先取得を追加） |
| `src/components/history/AssignmentHistory.tsx` | 既存変更（代理確定者連絡先の表示追加） |

新規ファイル: 1（マイグレーション）。UIファイルの変更: 1（AssignmentHistory）。管理画面ページは変更不要（APIが絞ることで自動的に反映）。
