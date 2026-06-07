# Implementation Plan: ロールベースホーム画面

**Branch**: `006-role-based-home` | **Date**: 2026-06-07 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `/specs/006-role-based-home/spec.md`

## Summary

ログイン後の `/` ルートで `community_members` テーブルを参照してロールを判定し、organizer/manager には管理機能エントリー、referee には審判機能エントリー、兼任ユーザーには両方、未参加ユーザーには `/join` エントリーを表示する Server Component ホーム画面を実装する。既存の即時リダイレクト（→ `/profile`）を廃止し、管理・審判両レイアウトにホームへ戻るリンクを追加する。

## Technical Context

**Language/Version**: TypeScript 5.x / Next.js 14.2.35  
**Primary Dependencies**: @supabase/ssr ^0.10.3, @supabase/supabase-js ^2.106.2, Tailwind CSS  
**Storage**: Supabase PostgreSQL — `community_members`（role, status, user_id）, `users`（display_name）  
**Testing**: 手動テスト（User Story ごとのアカウント別検証）  
**Target Platform**: Web PWA、Mobile-first（iOS Safari 含む）  
**Project Type**: Next.js 14 App Router フルスタック Web アプリ  
**Performance Goals**: ホーム画面初回表示 < 300ms（DB クエリ 2 本）  
**Constraints**: モバイルファースト、PWA、Pilot スケール（20–30 名）  
**Scale/Scope**: Pilot — 単一リージョン、~30 ユーザー

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Check | Status |
|-----------|-------|--------|
| I. 信頼インフラ第一 | ロール別エントリーが審判・管理双方の信頼機能への導線を提供する | ✅ PASS |
| II. 既存文化の尊重 | LINE/電話などの既存フローへの変更なし。ナビゲーション改善のみ | ✅ PASS |
| III. 最小限のデジタル化 | 1 タップで機能到達。新規 UI 複雑性なし | ✅ PASS |
| IV. 半クローズドコミュニティ | サーバー側ロール判定で非承認ユーザーへの管理アクセスを遮断 | ✅ PASS |
| V. 段階的な信頼可視化 | 評価・スコア機能なし | ✅ PASS |
| Tech Stack | Next.js + Supabase + Tailwind — 全て Constitution 規定内 | ✅ PASS |

**Post-design re-check**: DB 変更なし、新サービス導入なし。全ゲート通過。

## Project Structure

### Documentation (this feature)

```text
specs/006-role-based-home/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── contracts/
│   └── ui-contracts.md  # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit-tasks command)
```

### Source Code Changes

```text
src/
├── app/
│   ├── page.tsx                     # REPLACE: リダイレクト廃止 → ロール判定 Server Component
│   ├── (referee)/
│   │   └── layout.tsx               # MODIFY: RefLink テキスト → ホームリンク
│   └── admin/
│       └── layout.tsx               # MODIFY: RefLink 管理テキスト → ホームリンク
└── components/
    └── home/
        └── HomeScreen.tsx           # NEW: ロールベースエントリーポイント UI
```

**Structure Decision**: 既存の Next.js App Router 構造を最小限の変更で拡張。ホーム画面は 1 ページのみのため新規ルートグループは作らず `src/app/page.tsx` を直接置き換える。UI コンポーネントは `src/components/home/` に分離して Server Component の page.tsx をシンプルに保つ。

## Implementation Approach

### Step 1: HomeScreen コンポーネント（新規）

`src/components/home/HomeScreen.tsx` — クライアントコンポーネント不要のため Server Component。

**Props**:
```typescript
interface HomeScreenProps {
  displayName: string
  isAdmin: boolean
  isReferee: boolean
}
```

**エントリーカード構造**:
- Tailwind `Card` ライクなデザイン（`bg-white rounded-xl shadow-sm border`）
- `min-h-[80px]` でタップターゲット確保（SC-004）
- `<Link>` でカード全体をリンク化

### Step 2: page.tsx 置き換え

```typescript
// src/app/page.tsx (置き換え後)
export default async function RootPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  // middleware が未認証をブロックするが念のため
  if (!user) redirect('/login')

  const [{ data: userData }, { data: memberships }] = await Promise.all([
    supabase.from('users').select('display_name').eq('id', user.id).single(),
    supabase.from('community_members').select('role, status').eq('user_id', user.id),
  ])

  const isAdmin = memberships?.some(
    m => ['organizer', 'manager'].includes(m.role) && m.status === 'approved'
  ) ?? false
  const isReferee = memberships?.some(m => m.role === 'referee') ?? false

  return (
    <HomeScreen
      displayName={userData?.display_name ?? ''}
      isAdmin={isAdmin}
      isReferee={isReferee}
    />
  )
}
```

### Step 3: レイアウト変更（FR-009）

**admin/layout.tsx**: `<span>RefLink 管理</span>` → `<Link href="/">RefLink 管理</Link>`  
**(referee)/layout.tsx**: `<span>RefLink</span>` → `<Link href="/">RefLink</Link>`

## Complexity Tracking

> 該当なし — Constitution Check 全ゲート通過、Constitution 違反なし。
