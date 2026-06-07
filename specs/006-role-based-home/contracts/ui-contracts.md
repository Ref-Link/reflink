# UI Contracts: ロールベースホーム画面

**Phase**: 1  
**Date**: 2026-06-07

---

## ルート: `/` (ホーム画面)

### レンダリング条件

```
入力:
  - user: Supabase Auth User (認証済み)
  - context: UserRoleContext

出力パターン:
  A. isAdmin=true,  isReferee=false → [AdminEntry]
  B. isAdmin=false, isReferee=true  → [RefereeEntry]
  C. isAdmin=true,  isReferee=true  → [AdminEntry, RefereeEntry]
  D. isAdmin=false, isReferee=false → [JoinEntry]

未認証: → redirect /login (ミドルウェア処理)
```

### エントリーポイント定義

| type | label | description | href |
|------|-------|-------------|------|
| admin | 試合・メンバーを管理する | 試合の登録・審判の割当・メンバー承認 | /admin/matches |
| referee | 審判として参加する | プロフィール・空き日程・担当履歴 | /profile |
| join | コミュニティに参加する | 審判として活動するにはコミュニティへの参加が必要です | /join |

### タップターゲット要件（SC-004）

- エントリーカードの最小タップ領域: 48px × 全幅
- 実装: `min-h-[80px]` + `w-full` + `p-4`（Tailwind）
- モバイル片手操作: カードを画面下部に配置しない（親指が届く中央〜下配置）

### レイアウト構造

```
<div class="min-h-screen bg-gray-50">
  <header class="sticky top-0 ...">
    <span>RefLink</span>
  </header>
  <main class="mx-auto max-w-lg px-4 py-8">
    <p class="text-sm text-gray-500">こんにちは、{displayName}さん</p>
    <h1 class="text-xl font-bold ...">何をしますか？</h1>
    <div class="mt-6 flex flex-col gap-4">
      {entries.map(entry => <EntryCard />)}
    </div>
  </main>
</div>
```

---

## レイアウト変更: 管理画面ヘッダー

**ファイル**: `src/app/admin/layout.tsx`

**変更**: 現在の `<span>RefLink 管理</span>` → `<Link href="/">RefLink 管理</Link>`

```
Before: RefLink 管理 (テキストのみ)
After:  [← RefLink 管理] (ホームへのリンク付きテキスト)
```

---

## レイアウト変更: 審判画面ヘッダー

**ファイル**: `src/app/(referee)/layout.tsx`

**変更**: 現在の `<span>RefLink</span>` → `<Link href="/">RefLink</Link>`

```
Before: RefLink (テキストのみ)
After:  [RefLink] (ホームへのリンク付きテキスト)
```

---

## アクセシビリティ

- エントリーカードは `<a>` (Link) または `<button>` として実装（`div` クリックハンドラ禁止）
- アイコンには `aria-hidden="true"` を付与
- カード全体がクリック可能なリンク領域であることを `role` 属性なしで Link 要素で表現
