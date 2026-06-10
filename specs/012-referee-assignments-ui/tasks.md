# Tasks: 審判UIへの担当タブ追加（募集・履歴サブタブ）

**Input**: Design documents from `specs/012-referee-assignments-ui/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api.md

**Tests**: テストフレームワーク未導入のため省略。quickstart.md の手動確認手順で代替する。

**Organization**: タスクはユーザーストーリー単位でグループ化し、各ストーリーを独立してテスト可能にする。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 並行実行可能（別ファイル・依存関係なし）
- **[Story]**: 対応するユーザーストーリー（US1/US2/US3）

---

## Phase 1: Setup（新規パッケージ・設定変更なし確認）

**Purpose**: 既存プロジェクトへの追加機能のため、セットアップは最小限

- [x] T001 既存 `package.json` と `src/types/database.ts` を確認し、新規パッケージ不要・スキーマ変更不要を確認する

---

## Phase 2: Foundational（APIエンドポイント — 全ユーザーストーリーのブロッカー）

**Purpose**: US1の募集一覧取得とUS2のバッジカウント取得、回答操作がここに依存する

**⚠️ CRITICAL**: このフェーズが完了するまでUI実装は開始しない

- [x] T002 [P] `GET /api/assignments/pending` を実装する — ログイン中審判の `status='notified'` アサインをmatchesとJOINして返す。ソートは `match_date ASC` → `src/app/api/assignments/pending/route.ts`
- [x] T003 [P] `PATCH /api/assignments/[id]/respond` を実装する — `{ action: "accept" | "decline" }` を受け取り、LINE Webhookと同一ロジック（notified確認・二重防止・responded_at更新）で処理する → `src/app/api/assignments/[id]/respond/route.ts`

**Checkpoint**: `curl` または `fetch` でエンドポイントの動作を確認できる状態

---

## Phase 3: User Story 1 — 募集一覧の確認と回答（Priority: P1）🎯 MVP

**Goal**: 審判がアプリから未回答の募集を確認し、参加・辞退を回答できる

**Independent Test**: notifiedレコードを持つ審判アカウントでログインし、`/assignments` を開いて募集カードが表示され、「参加」ボタンを押すと `status` が `accepted` に変わることを確認する

### Implementation for User Story 1

- [x] T004 [P] [US1] `PendingList.tsx` を実装する — 募集カード一覧（試合タイトル・日時・会場・年代バッジ・担当役割）、参加・辞退ボタン、送信中のローディング状態・ボタン無効化、回答済み表示、空状態を含む → `src/components/assignments/PendingList.tsx`
- [x] T005 [P] [US1] `AssignmentTabs.tsx` を実装する — URLクエリ `?tab=recruiting`（デフォルト）/ `?tab=history` でアクティブタブを管理するサブタブUIコンポーネント（`useRouter` + `useSearchParams` 使用）→ `src/components/assignments/AssignmentTabs.tsx`
- [x] T006 [US1] `assignments/page.tsx` を実装する — `AssignmentTabs` でサブタブ切り替え、`?tab=recruiting` 時は `PendingList`、`?tab=history` 時は既存 `AssignmentHistory` を表示。未回答募集がある場合は `recruiting` タブをデフォルト表示 → `src/app/(referee)/assignments/page.tsx`

**Checkpoint**: `/assignments` にアクセスして募集一覧が表示され、参加・辞退が動作することを確認

---

## Phase 4: User Story 2 — ボトムナビの未対応バッジ（Priority: P2）

**Goal**: 未回答（notified）の募集件数をボトムナビの「担当」タブにバッジ表示し、審判が気付ける

**Independent Test**: notified募集が2件ある状態でアプリを開き、ボトムナビに「2」バッジが表示されることを確認する

### Implementation for User Story 2

- [x] T007 [US2] `RefereeBottomNav.tsx` を更新する — 「担当履歴」→「担当」に改名、`href` を `/history` → `/assignments` に変更、`useEffect` + `usePathname` で `/api/assignments/pending` をフェッチしてバッジ件数を管理、件数が0の場合はバッジ非表示 → `src/components/nav/RefereeBottomNav.tsx`

**Checkpoint**: ボトムナビに「担当」タブが表示され、未回答件数バッジが正しく表示・非表示になることを確認

---

## Phase 5: User Story 3 — 担当履歴の継続（Priority: P3）

**Goal**: 既存の「担当履歴」ページをリダイレクトし、履歴サブタブとして引き続き機能させる

**Independent Test**: `/history` に直接アクセスして `/assignments?tab=history` にリダイレクトされ、確定済み履歴が表示されることを確認する

### Implementation for User Story 3

- [x] T008 [US3] `history/page.tsx` をリダイレクトに置き換える — Next.js の `redirect('/assignments?tab=history')` を呼ぶサーバーコンポーネントとして書き換え → `src/app/(referee)/history/page.tsx`

**Checkpoint**: `/history` が `/assignments?tab=history` にリダイレクトされ、「履歴」サブタブが表示されることを確認

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: エッジケース・UX補完・全体通しの動作確認

- [x] T009 [P] 回答済み（accepted/declined）の募集カードが「参加済み」「辞退済み」状態で正しく表示されること（ボタン非活性化）を `PendingList.tsx` で確認・修正する → `src/components/assignments/PendingList.tsx`
- [x] T010 [P] `AssignmentTabs.tsx` のデフォルトタブロジックを確認する — 未回答募集がゼロ件の場合は `?tab=history` をデフォルトとして表示する → `src/components/assignments/AssignmentTabs.tsx`
- [x] T011 quickstart.md の全手順をローカルで実行し、募集確認・参加・辞退・バッジ更新・履歴表示・リダイレクトが正常動作することを確認する

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 依存なし — 即開始可能
- **Foundational (Phase 2)**: Phase 1 完了後 — **US1/US2/US3 全ストーリーのブロッカー**
- **User Stories (Phase 3/4/5)**: Phase 2 完了後に開始可能
  - US1 (Phase 3) と US3 (Phase 5) は並行実行可能
  - US2 (Phase 4) は T002 (`GET /api/assignments/pending`) に依存するため Phase 3 完了後が安全
- **Polish (Phase 6)**: US1・US2・US3 全完了後

### User Story Dependencies

- **US1 (P1)**: Phase 2 (T002, T003) 完了後に開始
- **US2 (P2)**: T002 完了後に開始可能（T007 は `RefereeBottomNav` のみ変更）
- **US3 (P3)**: Phase 2 完了後に独立して開始可能（T008 は `/history` ページのみ変更）

### Within Each User Story

- Phase 3: T004 と T005 は並行実行可能 → T006 は T004/T005 完了後
- Phase 4: T007 は T002 完了後に単独実行
- Phase 5: T008 は Phase 2 完了後に単独実行

### Parallel Opportunities

```
Phase 2:  T002 ─────┐
          T003 ─────┤
                    ↓
Phase 3:  T004 ─┐   ↓
          T005 ─┴→ T006
Phase 4:  T007 (T002 完了後に並行可能)
Phase 5:  T008 (Phase 2 完了後に並行可能)
Phase 6:  T009 ─┐
          T010 ─┘
          T011
```

---

## Parallel Example: Phase 2

```
# T002 と T003 は別ファイルなので並行実行可能
Task: "src/app/api/assignments/pending/route.ts を実装"
Task: "src/app/api/assignments/[id]/respond/route.ts を実装"
```

## Parallel Example: Phase 3 (US1)

```
# T004 と T005 は別ファイルなので並行実行可能
Task: "src/components/assignments/PendingList.tsx を実装"
Task: "src/components/assignments/AssignmentTabs.tsx を実装"
# T006 は T004/T005 完了後
Task: "src/app/(referee)/assignments/page.tsx を実装"
```

---

## Implementation Strategy

### MVP First（US1のみ）

1. Phase 1: Setup 確認
2. Phase 2: Foundational API 完成（T002, T003）
3. Phase 3: US1 完成（T004, T005, T006）
4. **STOP & VALIDATE**: `/assignments` で募集確認・参加・辞退が動作することを確認
5. MVP として利用開始可能

### Incremental Delivery

1. Phase 1 + Phase 2 → APIレイヤー完成
2. Phase 3 → US1: 募集確認・回答 → MVP
3. Phase 4 → US2: バッジ表示 → UX向上
4. Phase 5 → US3: 履歴リダイレクト → 既存ユーザー対応
5. Phase 6 → Polish → 完成

---

## Notes

- スキーマ変更なし。既存 `assignments` / `matches` テーブルをそのまま利用
- 既存 `AssignmentHistory` コンポーネントは変更なし — 履歴サブタブでそのままインポート
- LINE Webhookは変更なし — 参加・辞退の二重経路（LINE / アプリ）はどちらも正常動作
- バッジはページ遷移時に再取得（同一ページ内の回答直後は次遷移まで遅延する設計 — research.md Decision 5 参照）
