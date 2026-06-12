# Implementation Plan: 試合操作権限の限定（作成者＋マネージャー方針）

**Branch**: `019-match-owner-permission` | **Date**: 2026-06-12 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `specs/019-match-owner-permission/spec.md`

## Summary

試合の閲覧・操作（候補者選出・審判確定）を「試合の作成者 organizer」または「manager ロール」のユーザーに限定する。DBへは `assignments.confirmed_by` の追加のみ（マイグレーション1本）。権限チェックはアプリケーションレイヤーの各 API route に追加する。審判の担当履歴では、代理確定者（manager）と試合作成者が異なる場合に代理確定者の連絡先も追加表示する。

## Technical Context

**Language/Version**: TypeScript 5.x / Node.js 18+  
**Primary Dependencies**: Next.js 14 (App Router), React 18, Supabase JS v2  
**Storage**: Supabase (PostgreSQL) — `matches`, `assignments`, `community_members` テーブル（既存）  
**Testing**: 手動テスト（quickstart.md 参照）  
**Target Platform**: Web (PWA) / LINE内ブラウザ  
**Project Type**: Web application (Next.js + Supabase)  
**Performance Goals**: 確定操作レスポンス < 2秒（既存と同等）  
**Constraints**: 既存フローへのリグレッションなし。DBスキーマ変更は `assignments.confirmed_by` 追加のみ  
**Scale/Scope**: 変更対象は API routes 5本 + UI 1本 + 型定義 1本 + マイグレーション 1本（計8ファイル）

## Constitution Check

### I. 信頼インフラ第一 ✅

誤操作（他人の試合への意図せぬ確定）を防ぐことで、運営者間の信頼を維持する。代理確定者の連絡先開示により、審判が確実に連絡できる相手を把握できる。

### II. 既存文化の尊重 ✅

LINEベースの確定通知フローに変更なし。管理者側の操作手順は変わらず、「自分の試合しか見えなくなる」という制限が加わるのみ。

### III. 最小限のデジタル化 ✅

管理画面に新規UI要素を追加しない（試合一覧はAPIで絞るだけ）。審判側の担当履歴に連絡先1行の追加のみ。

### IV. 半クローズドコミュニティ ✅

他の organizer の試合情報が見えなくなることで、コミュニティ内の情報制御がより厳密になる。既存の認証・認可ゲートに変更なし。

### V. 段階的な信頼可視化 ✅

評価・スコアリング機能なし。信頼可視化の方針に変更なし。

**Post-design re-check**: `confirmed_by` 追加は最小限のスキーマ変更。RLS変更なし。全原則クリア。

## Project Structure

### Documentation (this feature)

```text
specs/019-match-owner-permission/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── match-permission.md
└── tasks.md             # Phase 2 output (not yet created)
```

### Source Code (変更対象ファイル)

```text
supabase/migrations/
└── 20260612000001_assignments_confirmed_by.sql   # [新規] confirmed_by カラム追加

src/types/
└── database.ts                                    # [変更] AssignmentRow に confirmed_by 追加

src/app/api/matches/
├── route.ts                                       # [変更] GETに owner/manager フィルタ追加
└── [id]/
    ├── route.ts                                   # [変更] ownership チェック追加
    ├── candidates/route.ts                        # [変更] ownership チェック追加
    └── assignments/
        ├── route.ts                               # [変更] ownership チェック追加
        └── [assignmentId]/confirm/route.ts        # [変更] ownership チェック + confirmed_by 保存

src/app/api/assignments/
└── route.ts                                       # [変更] proxy_confirmer 連絡先取得を追加

src/components/history/
└── AssignmentHistory.tsx                          # [変更] 代理確定者連絡先の表示追加
```

## Implementation Phases

### Phase A: DBマイグレーション + 型定義（基盤）

**対象**: マイグレーションファイル + `src/types/database.ts`

**変更内容**:

1. マイグレーション: `assignments` テーブルに `confirmed_by uuid REFERENCES public.users(id)` を追加（NULL許容）

2. `database.ts` の `assignments` Row/Insert/Update に `confirmed_by: string | null` を追加

---

### Phase B: API 権限チェック（P1 spec 対応）

**対象**: 試合系 API route 5本

**共通パターン**（各 route に追加）:

```
1. getOrganizerMembership() で membership.role を取得（既存）
2. match の created_by を取得（既存クエリに created_by を追加、または別クエリ）
3. if (membership.role !== 'manager' && match.created_by !== user.id) → 404
```

**`GET /api/matches`** のみ挙動が異なる:

```
- organizer: .eq('created_by', user.id) を追加
- manager: フィルタなし（既存と同じ）
```

---

### Phase C: confirmed_by の保存（P1 spec 対応）

**対象**: `src/app/api/matches/[id]/assignments/[assignmentId]/confirm/route.ts`

**変更内容**: 既存の `assignments.update` に `confirmed_by: user.id` を追加:

```typescript
.update({ status: 'confirmed', confirmed_at: new Date().toISOString(), confirmed_by: user.id })
```

---

### Phase D: 代理確定者連絡先の取得と表示（P2 spec 対応）

**対象**: `src/app/api/assignments/route.ts` + `src/components/history/AssignmentHistory.tsx`

**API変更**:

1. assignments の select クエリに `confirmed_by` を追加
2. `confirmed_by != null AND confirmed_by != match.created_by` のケースを検出
3. 該当ユーザーの `phone_number`, `real_name` を取得して `proxy_confirmer_phone`, `proxy_confirmer_name` としてレスポンスに追加

**UI変更** (`AssignmentHistory.tsx`):

4. `proxy_confirmer_phone` が null でない場合、「代理確定者連絡先」ブロックを `ContactInfo` コンポーネントで追加表示

## Testing

quickstart.md のシナリオ 1〜5 を手動で実行して確認。

- シナリオ 1: Organizer は自分の試合のみ閲覧・操作できる
- シナリオ 2: Manager はすべての試合を操作できる
- シナリオ 3: 代理確定者の連絡先が担当履歴に表示される
- シナリオ 4: 同一人物確定の場合は代理確定者欄が非表示
- シナリオ 5: API 直接アクセスによる権限バイパス試行が 404 で拒否される
