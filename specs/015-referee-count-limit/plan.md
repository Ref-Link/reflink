# Implementation Plan: 審判確定人数の上限チェック

**Branch**: `015-referee-count-limit` | **Date**: 2026-06-11 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `specs/015-referee-count-limit/spec.md`

## Summary

確定APIで `assignment.role` を取得し、同ロールの確定済み件数が募集人数以上であれば 409 を返す（2行の追加クエリ）。フロントエンドでは同じ情報を既存 state から計算して確定ボタンを非活性化する。DBマイグレーション・新規ファイルなし。変更対象は2ファイルのみ。

## Technical Context

**Language/Version**: TypeScript 5.x / Node.js 18+  
**Primary Dependencies**: Next.js 14 (App Router), React 18, Supabase JS v2  
**Storage**: Supabase (PostgreSQL) — `matches`, `assignments` テーブル（既存）  
**Testing**: 手動テスト（quickstart.md 参照）  
**Target Platform**: Web (PWA) / LINE内ブラウザ  
**Project Type**: Web application (Next.js + Supabase)  
**Performance Goals**: 確定操作レスポンス < 2秒（既存と同等）  
**Constraints**: 既存の確定フローへのリグレッションなし、DBスキーマ変更なし  
**Scale/Scope**: 既存2ファイルの最小限変更

## Constitution Check

### I. 信頼インフラ第一 ✅

過剰確定による誤通知・二重手配を防ぐことで、審判・主催者間の信頼を維持する。

### II. 既存文化の尊重 ✅

LINEベースの確定通知フローに変更なし。管理者の操作画面のみ変更。

### III. 最小限のデジタル化 ✅

管理者側に追加UI要素なし（ボタンのdisabled化のみ）。審判側には影響なし。

### IV. 半クローズドコミュニティ ✅

コミュニティ管理者のみが操作可能な機能。既存の認証・認可ゲートに変更なし。

### V. 段階的な信頼可視化 ✅

評価・スコアリング機能なし。信頼可視化の方針に変更なし。

**Post-design re-check**: DBスキーマ変更なし、新規依存なし。全原則クリア。

## Project Structure

### Documentation (this feature)

```text
specs/015-referee-count-limit/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── confirm-assignment.md
└── tasks.md             # Phase 2 output (not yet created)
```

### Source Code (変更対象ファイルのみ)

```text
src/app/api/matches/[id]/assignments/[assignmentId]/confirm/
└── route.ts             # [変更] role取得追加 + 確定前カウントチェック追加

src/app/admin/matches/[id]/assignments/
└── page.tsx             # [変更] ロール別確定済みカウント計算 + ボタンdisabled制御
```

## Implementation Phases

### Phase A: バックエンド上限チェック（P1 spec 対応）

**対象**: `src/app/api/matches/[id]/assignments/[assignmentId]/confirm/route.ts`

**変更内容**:

1. `assignment` の select クエリに `role` を追加:
   ```
   .select('id, user_id, match_id, status, role')
   ```

2. 既存の `status === 'confirmed'` チェック直後に、ロール別カウントチェックを追加:
   ```
   - 同じ match_id・同じ role・status = 'confirmed' のレコード数をカウント
   - カウントが referees_needed（role = 'referee'）または assistants_needed（role = 'assistant_referee'）以上なら 409 を返す
   - エラーコード: SLOT_FULL
   - エラーメッセージ: ロールに応じた日本語メッセージ
   ```

**追加クエリ**: 1件（COUNT クエリ）

---

### Phase B: フロントエンドボタン制御（P2 spec 対応）

**対象**: `src/app/admin/matches/[id]/assignments/page.tsx`

**変更内容**:

1. ロール別確定済み件数の計算（既存 `assignments` / `match` state から）:
   ```
   confirmedByRole = {
     referee: assignments.filter(a => a.role === 'referee' && a.status === 'confirmed').length,
     assistant_referee: assignments.filter(a => a.role === 'assistant_referee' && a.status === 'confirmed').length,
   }
   ```

2. スロット満杯判定ヘルパー:
   ```
   isSlotFull(role) = match が null なら false
     referee → confirmedByRole.referee >= match.referees_needed
     assistant_referee → confirmedByRole.assistant_referee >= match.assistants_needed
   ```

3. 確定ボタンの `disabled` 条件に `isSlotFull(assignment.role)` を追加

4. `SLOT_FULL` エラーコードをフロントのハンドラーに追加（既存の `ORGANIZER_PHONE_MISSING` / `REFEREE_PHONE_MISSING` と同パターン）

**注意**: `match` state の型（`MatchRow`）が `referees_needed` / `assistants_needed` を含むことを確認する（`fetchMatch` は `/api/matches/${params.id}` を呼んでおり、既に両フィールドが含まれる）。

## Testing

quickstart.md のシナリオ1〜3 を手動で実行して確認。

- シナリオ1: 上限超過がAPIレベルで拒否されること
- シナリオ2: 上限到達後にボタンが非活性になること
- シナリオ3: 複数枠での正常ケース（リグレッション）
