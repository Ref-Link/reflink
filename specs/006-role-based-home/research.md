# Research: ロールベースホーム画面

**Phase**: 0 — All NEEDS CLARIFICATION resolved from existing codebase  
**Date**: 2026-06-07

---

## 1. 現在のルーティング動作

**Decision**: `src/app/page.tsx` を、リダイレクトを廃止したロール判定 Server Component に置き換える。

**Finding**: 現在の `page.tsx` は `redirect(user ? '/profile' : '/login')` のみ。ミドルウェアは `/` を public path として扱わないため、未認証ユーザーは `/login` にリダイレクトされる。認証済みユーザーは `page.tsx` まで到達するので、そこでロール判定を行うだけでよい。

**Rationale**: ミドルウェアへの変更なし。`page.tsx` の中身を置き換えるだけで FR-001 を満たせる。

**Alternatives considered**: ミドルウェアでロール判定しリダイレクト先を振り分ける案 → DB クエリをミドルウェアで毎リクエスト走らせることになり不要な計算コストが生じる。Page レベルで一度だけ取得するほうがシンプル。

---

## 2. ロール判定クエリ

**Decision**: `community_members` テーブルに対して `user_id = <id>` で全行フェッチし、アプリ層でフラグを導出する。

```typescript
const { data: memberships } = await supabase
  .from('community_members')
  .select('role, status')
  .eq('user_id', user.id)

const isAdmin = memberships?.some(
  m => ['organizer', 'manager'].includes(m.role) && m.status === 'approved'
) ?? false

const isReferee = memberships?.some(m => m.role === 'referee') ?? false
```

**Rationale**: 1 クエリで全ロールを取得できる。Pilot スケール（20–30 名）では行数が少なく集約コストは無視できる。Edge Case（organizer 承認前は管理エントリーポイント非表示）も `status === 'approved'` チェックで対応。

**Alternatives considered**: 2 クエリに分けて isAdmin/isReferee を別々に取る案 → 不要なラウンドトリップ。

---

## 3. レイアウト戦略

**Decision**: `src/app/page.tsx` にミニマルレイアウト（ヘッダー）をインラインで定義する。新しいルートグループは作らない。

**Rationale**: ホーム画面は 1 ページのみ。`(referee)` グループのような専用 layout.tsx を作るほどのスコープではない。Constitution Principle III（最小限のデジタル化）に従い、最小構造を選択。

**Alternatives considered**: `(home)` ルートグループを作成する案 → `(referee)` パターンと一貫性が取れるが、1 ページのためにグループを作るのは過剰。

---

## 4. 「ホームへ戻る」ナビゲーション（FR-009）

**Decision**: 管理画面レイアウト（`src/app/admin/layout.tsx`）と審判レイアウト（`src/app/(referee)/layout.tsx`）のヘッダーに `/` へのホームリンクを追加する。

**Finding**: 現在両レイアウトともホームへ戻るリンクが存在しない。admin レイアウトはヘッダーに `RefLink 管理` のテキストのみ。referee レイアウトは `RefLink` テキストのみ。

**Rationale**: ブランド名テキストをホームリンクにするのが UX 的にも直感的（多くの Web アプリの慣例）かつ実装が最小。

**Alternatives considered**: ハンバーガーメニューや専用「ホーム」ボタンを追加する案 → 不要な UI 複雑性。

---

## 5. ユーザー名の表示

**Decision**: `users` テーブルの `display_name` を取得して挨拶文に使う。

**Finding**: `users.display_name` は `database.ts` で `string`（not null）として定義されている。認証済みユーザーは必ず `users` テーブルに行を持つ（login フローで挿入される）。

**Rationale**: `supabase.auth.getUser()` で取得した `user.id` をキーに `users` テーブルを 1 クエリで引ける。community_members と同一のサーバーコンポーネントで並列フェッチ可能。

**Alternatives considered**: Auth メタデータ（user.user_metadata）から取得する案 → DB の display_name と乖離する可能性があるため却下。

---

## 6. 表示条件のまとめ

| 条件 | 管理エントリーポイント | 審判エントリーポイント | 参加案内 |
|------|-------------------|--------------------|--------|
| isAdmin=true, isReferee=false | ✅ 表示 | ❌ 非表示 | ❌ 非表示 |
| isAdmin=false, isReferee=true | ❌ 非表示 | ✅ 表示 | ❌ 非表示 |
| isAdmin=true, isReferee=true | ✅ 表示 | ✅ 表示 | ❌ 非表示 |
| isAdmin=false, isReferee=false | ❌ 非表示 | ❌ 非表示 | ✅ 表示 |

上記ルールで spec の全 User Story と Edge Case を網羅。
