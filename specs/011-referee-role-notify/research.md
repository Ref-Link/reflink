# Research: 審判依頼通知のロール選択UX改善

## 1. ロール選択状態の管理場所

**Decision**: `selectedRoles: Map<string, 'referee' | 'assistant_referee'>` を `match/[id]/page.tsx` で管理し、props 経由で `CandidateList` に渡す。

**Rationale**: 既存の `selectedIds: Set<string>` と同じレイヤーで管理することで、`handleNotify` がロールを直接参照できる。外部ステート管理（Zustand/Context）は不要なスコープ。

**Alternatives considered**:
- `CandidateList` 内部で管理 → `handleNotify` がロール情報を取得できないため不可。
- `Candidate` 型にロールを追加 → 候補データは読み取り専用データであり選択状態と混在させるべきでない。

---

## 2. ロール選択UIのパターン

**Decision**: 候補チェックボックス選択後、候補行の下にインラインのロールピッカー（2ボタントグル）を表示する。

**Rationale**:
- 既存の expand/collapse パターン（`▼/▲`）と同じ行内に収まる。
- モバイルでタップしやすい最小タッチターゲット（44px）を維持できる。
- 追加モーダルなし → Principle III（最小限のデジタル化）に合致。

**Alternatives considered**:
- `<select>` ドロップダウン → iOS Safari での操作性が悪い。
- モーダル → Principle III 違反（操作ステップ増加）。
- チェックボックスを主審・副審に分離 → 候補一覧の行数が2倍になり視認性が低下。

---

## 3. ロール絞り込みロジック

**Decision**: 表示するロール選択肢 = `candidate.role_type` ∩ `matchRecruitedRoles`。

```ts
// matchRecruitedRoles の導出（match/[id]/page.tsx で計算）
const matchRecruitedRoles: RefereeRole[] = [
  ...(match.referees_needed > 0 ? ['referee' as const] : []),
  ...(match.assistants_needed > 0 ? ['assistant_referee' as const] : []),
]

// 候補ごとの選択可能ロール（CandidateList 内で計算）
const availableRoles = candidate.role_type.filter(r =>
  matchRecruitedRoles.includes(r as RefereeRole)
)
```

- `availableRoles.length === 1` → 自動設定（FR-002 対応）
- `availableRoles.length === 2` → ロール選択UI表示（FR-001 対応）
- `availableRoles.length === 0` → チェックボックス非表示（既存のフィルタリングに依存。エッジケース扱い）

**Rationale**: FR-001/FR-002 の要件を最小コードで満たす。candidates API はすでに `role_type` を返しており追加クエリ不要。

**Alternatives considered**:
- サーバー側でフィルタリング → API 変更が必要。フロントで十分。

---

## 4. 通知送信バリデーション

**Decision**: 選択済み候補全員のロールが確定していない場合は送信ボタンを disabled にする。

**Rationale**:
- 2ロール対応候補を選択後にロール未選択のまま送信できると FR-003 が満たせない。
- エラーメッセージより、ボタン disabled + ヒントテキストのほうがユーザー体験が良い。

```ts
// notifyReady の計算
const notifyReady = selectedIds.size > 0 &&
  Array.from(selectedIds).every(id => selectedRoles.has(id))
```

**Alternatives considered**:
- 送信時にバリデーション → エラー発生まで分からない。UX 低下。

---

## 5. LINE通知文言の変更

**Decision**: `buildMatchNotificationMessage` に `role: RefereeRole` パラメータを追加し、ヘッダーと altText を切り替える。

```ts
// messages.ts
const HEADER = {
  referee: '【主審募集】',
  assistant_referee: '【副審募集】',
}
const ALT_TEXT_PREFIX = {
  referee: '【主審募集】',
  assistant_referee: '【副審募集】',
}
```

`altText` の既存フォーマット `【試合審判募集】${title} ${dateFormatted}` → `${ALT_TEXT_PREFIX[role]}${title} ${dateFormatted}` に変更。

**Rationale**: FR-004/FR-005 を最小変更で満たす。既存の Flex Message 構造（ヘッダーテキスト1行目）を置換するだけ。ヘッダーカラー（`#1DB446`）は変えない（緑 = 募集中の意味で共通）。

**Alternatives considered**:
- ヘッダーカラーをロール別に変える（主審=青、副審=橙） → Principle III 違反（視覚的複雑度増加）。デザイン変更リスク大。

---

## 6. APIルートへの影響

**Decision**: `POST /api/matches/[id]/assignments` のインターフェース変更なし。`role` はすでに `candidates` 配列の各要素に含まれている。`buildMatchNotificationMessage` の呼び出し時に `role` を渡すだけ。

**Rationale**: API は既設計どおり `{ candidates: Array<{ userId, role }> }` を受け取り `assignments.role` に書き込む。変更は `buildMatchNotificationMessage` 呼び出しの1行のみ。

---

## 7. 未解決事項 (NEEDS CLARIFICATION)

なし。既存コードから全情報が取得できた。
