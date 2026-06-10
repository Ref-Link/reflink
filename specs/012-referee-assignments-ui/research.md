# Research: 審判UIへの担当タブ追加

## Decision 1: タブ状態の管理方法

**Decision**: URLクエリパラメータ（`?tab=recruiting` / `?tab=history`）でアクティブサブタブを管理する

**Rationale**: クライアントサイドのstateのみで管理するとブラウザの戻るボタンやLINEリンクからの遷移でタブが初期状態に戻る。URLベースにすることで直接リンクが可能になり、既存の`/history`からのリダイレクト先に`?tab=history`を付けてシームレスに移行できる。

**Alternatives considered**:
- クライアントstateのみ: 実装は最小限だが履歴ナビゲーションで使い勝手が落ちる
- サーバーコンポーネントでタブ分岐: 各タブがフルページロードになりUXが悪い

---

## Decision 2: ボトムナビバッジのデータ取得方法

**Decision**: `RefereeBottomNav`が`/api/assignments/pending`をclient-sideで`useEffect` + `usePathname`依存で取得し、レスポンス配列の長さをバッジ件数として使用する

**Rationale**: 専用のカウントエンドポイントを増やすより、募集一覧エンドポイントを兼用する方がシンプル。ナビはclient componentなので`usePathname`の変化をトリガーに再取得することで、ページ遷移後のバッジ更新が保証される。同一ページ内で回答操作した直後はバッジが更新されないが（次のナビゲーションで更新）、パイロット規模では許容範囲。

**Alternatives considered**:
- 専用 `GET /api/assignments/pending/count`: エンドポイントが増えるが、ペイロードは最小
- Reactコンテキストでページとナビを同期: 正確だが過剰な複雑さ
- Supabase Realtimeでリアルタイム更新: spec.mdのAssumptionsに記載の通り対象外

---

## Decision 3: `/history`ページの移行方法

**Decision**: `src/app/(referee)/history/page.tsx`をNext.jsの`redirect()`を使って`/assignments?tab=history`にリダイレクトするサーバーコンポーネントに書き換える

**Rationale**: 既存のブックマークやLINEメッセージに含まれるリンクを壊さない。永続リダイレクトではなく`redirect()`（307）を使い、将来の変更余地を残す。

**Alternatives considered**:
- `next.config.js`の`redirects`設定: 同等だがコードとの距離が遠く管理しにくい
- URLを変えず`/history`のまま担当タブを作る: 既存機能との一貫性が損なわれる

---

## Decision 4: 参加・辞退APIの設計

**Decision**: 新エンドポイント`PATCH /api/assignments/[id]/respond`を追加し、リクエストボディ`{ action: "accept" | "decline" }`を受け取る。ビジネスロジックはLINE Webhookと同一（notifiedステータスのみ許可、二重防止）

**Rationale**: LINE Webhookのビジネスロジックをそのまま流用することで不整合を防ぐ。既存の`/api/assignments/[id]/confirm`（管理者用確定API）と混同しないよう、エンドポイント名を`respond`とする。

**Alternatives considered**:
- LINE Webhookのコードを直接呼び出す: Webhookは`replyToken`が必要なため流用不可
- 既存の`assignments`ルートにアクション追加: REST的な設計を崩す

---

## Decision 5: ナビバッジとページ間の状態同期

**Decision**: ページ内で回答操作が完了した直後、ナビバッジはその場では更新しない。次のルート遷移時に`usePathname`トリガーで再フェッチされた際に更新される。

**Rationale**: パイロット規模ではこの小さな遅延は問題にならない。Context/Storeを導入するほどの規模感ではなく、Principle III（最小限のデジタル化）に沿って実装を最小限に保つ。

---

## 既存コードとの差分サマリー

| 既存の実装 | この機能での変更 |
|---|---|
| `src/app/(referee)/history/page.tsx` | `/assignments?tab=history`へのリダイレクトに置き換え |
| `src/components/history/AssignmentHistory.tsx` | そのまま再利用（変更なし） |
| `src/components/nav/RefereeBottomNav.tsx` | 「担当履歴」→「担当」、href変更、バッジ追加 |
| `src/app/api/assignments/route.ts` | 変更なし（historyタブで引き続き使用） |
| LINE Webhookのaccept/declineロジック | 新APIに同一ロジックを実装（コード共有はしない）|
