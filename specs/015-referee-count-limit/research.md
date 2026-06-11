# Research: 審判確定人数の上限チェック

**Branch**: `015-referee-count-limit` | **Date**: 2026-06-11

## Findings

### 1. 既存の確定ロジック（confirm route）

**Decision**: バックエンドの確定エンドポイント（`PATCH /api/matches/[id]/assignments/[assignmentId]/confirm`）にカウントチェックを追加する。

**Rationale**:
- `assignments` テーブルの `role` フィールド（`referee` / `assistant_referee`）が既存
- `matches` テーブルの `referees_needed` / `assistants_needed` フィールドが既存
- 確定処理時に `match` データを既に取得しているため、追加クエリは最小限（同一ロールの確定済み件数のみ）

**現状のコードパス**（`confirm/route.ts`）:
1. 認証チェック
2. `match` 取得（`referees_needed`, `assistants_needed` を含む）
3. `assignment` 取得（現在 `role` を取得していない ← ここに問題あり）
4. `status === 'confirmed'` の重複チェック
5. 電話番号チェック（主催者・審判）
6. `status` を `confirmed` に更新
7. 全確定件数をカウントして `match.status` を `filled` に更新するかチェック

**修正箇所**: ステップ4と5の間に、`assignment.role` を取得して同ロールの確定済み件数を確認し、上限に達していれば 409 を返す。

**Alternatives considered**:
- DB制約（CHECK constraint）で防ぐ → アプリ側でのエラーメッセージ制御が難しく、既存テーブル変更も必要。棄却。
- トランザクションで SERIALIZABLE 分離レベルを使う → 同時確定の競合は極めて稀（管理者1名操作が前提）。現状の実装パターンに合わせて楽観的チェックで十分。棄却。

---

### 2. フロントエンドのボタン制御

**Decision**: `assignments/page.tsx` でロールごとの確定済み件数を計算し、上限に達したロールの確定ボタンを `disabled` にする。

**Rationale**:
- `assignments` state に全アサインが既にある
- `match` state に `referees_needed` / `assistants_needed` が既にある
- 追加APIコールなしに計算可能

**計算式**:
```
confirmedReferees = assignments.filter(a => a.role === 'referee' && a.status === 'confirmed').length
confirmedAssistants = assignments.filter(a => a.role === 'assistant_referee' && a.status === 'confirmed').length

isSlotFull(role) = role === 'referee'
  ? confirmedReferees >= match.referees_needed
  : confirmedAssistants >= match.assistants_needed
```

**Alternatives considered**:
- ボタンを非表示にする → 候補が存在するのにボタンが消えると混乱する。`disabled` + tooltip が適切。
- サーバーコンポーネントで制御 → 現ページはクライアントコンポーネント（リアルタイム購読あり）。変更最小化のためクライアントサイドで計算。棄却。

---

### 3. エラーハンドリングの統一

**Decision**: バックエンドの新しいエラーコードは `SLOT_FULL` とし、フロントエンドで専用のメッセージを表示する。

**Rationale**: 既存エラーコード（`ORGANIZER_PHONE_MISSING`, `REFEREE_PHONE_MISSING`）と同じパターンで実装することで一貫性を保つ。

---

### 4. 変更ファイル一覧

| ファイル | 変更内容 |
|---------|---------|
| `src/app/api/matches/[id]/assignments/[assignmentId]/confirm/route.ts` | `assignment` の select に `role` 追加、確定前にロール別カウントチェック追加 |
| `src/app/admin/matches/[id]/assignments/page.tsx` | ロール別確定済み件数の計算、確定ボタンの disabled 制御、`SLOT_FULL` エラーメッセージ追加 |

**新規ファイル**: なし  
**DBマイグレーション**: なし  
**新規依存ライブラリ**: なし
