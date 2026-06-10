# Research: UX改善（審判・運営者）

## 1. アコーディオン（タップ展開）パターン

**Decision**: `useState<string | null>(null)` で `expandedId` を管理するシンプルな単一展開アコーディオンを実装する。

**Rationale**: 
- 現行コードベースにはアコーディオンUIが存在しない（CandidateList・AssignmentHistory・ApprovalList すべてフラット表示）
- 外部ライブラリ不要。`useState` + 条件付き `className` + `transition-all` Tailwind クラスで十分。
- FR-009「同時に1件のみ展開」は `expandedId` が単一値（null or string id）であることで自然に満たされる。

**Alternatives considered**: 
- HeadlessUI Disclosure — オーバーキル、ライブラリ追加が必要
- CSS-only details/summary — `key` ベースのリセットが難しく制御しにくい

**Implementation pattern**:
```tsx
const [expandedId, setExpandedId] = useState<string | null>(null)

function toggle(id: string) {
  setExpandedId(prev => prev === id ? null : id)
}

// In list item:
<li onClick={() => toggle(item.id)}>
  {/* always visible summary */}
  {expandedId === item.id && (
    <div>/* detail content */</div>
  )}
</li>
```

---

## 2. 確定人数集計（FR-004/005）

**Decision**: `GET /api/matches` のサーバーサイド処理で、試合一覧取得後に `assignments` テーブルから confirmed 件数をロール別に集計し、各試合オブジェクトにマージして返す。

**Rationale**: 
- スキーマ変更不要（Supabase View や computed column は不使用）
- `GET /api/matches` はすでに organizer の community_id で絞っているため、その community のすべての match id に対して assignments を一括クエリすれば N+1 にならない
- `GET /api/matches/[id]` も同様のパターン（単一 match id に対して）

**Implementation**:
```ts
// After fetching matches:
const matchIds = matches.map(m => m.id)
const { data: confirmed } = await supabase
  .from('assignments')
  .select('match_id, role')
  .in('match_id', matchIds)
  .eq('status', 'confirmed')

// Build count map: { matchId: { referee: n, assistant_referee: n } }
const countMap = buildCountMap(confirmed)

// Merge into response
const result = matches.map(m => ({
  ...m,
  confirmed_referees: countMap[m.id]?.referee ?? 0,
  confirmed_assistants: countMap[m.id]?.assistant_referee ?? 0,
}))
```

**Alternatives considered**: 
- PostgreSQL aggregate function / view — requires DB migration, violates "no schema changes" assumption
- Count in frontend from assignment data — assignments endpoint is scoped to the current user (referee), not available to organizer list view

---

## 3. 試合ステータス自動更新（FR-006）

**Decision**: `PATCH confirm` API でアサイン確定後、即座に当該試合の confirmed 数を再集計し、`referees_needed + assistants_needed` を満たしていれば `status = 'filled'` に更新する。

**Rationale**: 
- サーバーサイドの atomic な操作として実装することで、競合状態（2名が同時に確定）でも正確に動作する
- DB トリガー・関数を使わない。アプリ層で完結させるプロジェクト方針に合致

**Edge case**: `referees_needed = 0` の試合では、referee ロールの confirmed 数が 0 でも条件を満たす（0 >= 0）。

**Logic**:
```ts
// After updating assignment to 'confirmed':
const { data: allConfirmed } = await supabase
  .from('assignments')
  .select('role')
  .eq('match_id', params.id)
  .eq('status', 'confirmed')

const confirmedReferees = allConfirmed.filter(a => a.role === 'referee').length
const confirmedAssistants = allConfirmed.filter(a => a.role === 'assistant_referee').length

if (confirmedReferees >= match.referees_needed && confirmedAssistants >= match.assistants_needed) {
  await supabase.from('matches').update({ status: 'filled' }).eq('id', params.id)
}
```

**Alternatives considered**: 
- DB trigger — no migration possible in this project
- LINE webhook side-effect — wrong place; webhook handles referee responses, not organizer confirmations

---

## 4. プロフィール年代プリセット（FR-001）

**Decision**: `AvailabilityPage` が mount 時に `GET /api/profile` を呼び出し、取得した `age_groups` を `AvailabilityCalendar` の `defaultAgeGroups` prop として渡す。フォームリセット後も同値を再適用する。

**Rationale**: 
- `GET /api/profile` はすでに `select('*')` で `age_groups` を返している。追加 API 変更不要。
- `AvailabilityCalendar` にプロップを追加するだけでよく、既存の `existingDates` パターンと同様

**Handling**: 
- profile 未取得中（loading）: デフォルト空配列 → ボタンすべて未選択（spec edge case と一致）
- profile.age_groups が空配列: ボタンすべて未選択（同上）

---

## 5. 担当履歴拡張フィールド（FR-003）

**Decision**: `GET /api/assignments` の Supabase select 文に `referees_needed, assistants_needed, compensation, notes` を追加する。型定義（`AssignmentHistoryItem.matches`）も拡張。

**Rationale**: 
- assignments テーブルと matches テーブルは既に join 済み。SELECT リスト追加のみ。
- Supabase の nested select 構文 `matches(...)` で追加フィールドを列挙するだけ。

---

## 6. メンバー一覧拡張フィールド（FR-008）

**Decision**: `GET /api/communities/[id]/members` の `users!user_id(...)` select に `age_groups, role_type, travel_range_km` を追加する。型定義（`MemberWithUser.users`）も拡張。

**Rationale**: 
- 現在 `display_name, license_level, region` のみ。3フィールド追加は SELECT 変更のみ。
- real_name, phone_number は明示的に含めない（FR-010 準拠）
