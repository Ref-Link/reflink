# Research: スマートフォン対応ユーザビリティ改善

**Feature**: 002-mobile-usability | **Date**: 2026-06-05

---

## 1. ダークモード実装戦略

**Decision**: Tailwind CSS `darkMode: 'media'` + インライン `dark:` バリアント

**Rationale**:
- プロジェクトはすでにTailwindを使っており、追加ライブラリ不要
- `dark:` クラスをコンポーネントと同一箇所に書けるため可読性が高い
- Next.jsのSSR/CSRの両方でhydration mismatchが発生しない（CSS Media Queryベースのため）
- ユーザーに手動テーマ切り替えUIを提供しない前提（spec記載）のため、`class`戦略より`media`戦略が適切

**Alternatives considered**:
- CSS カスタムプロパティ（`var(--color-surface)`等）: globals.cssでは一部使われているが、全Tailwindクラスを置き換えるには大規模リファクタになる。rejected。
- `darkMode: 'class'`: 手動トグルUIが必要な場合に適切だが、今回はOS設定に追随するだけでよい。rejected。

**Implementation**:
```ts
// tailwind.config.ts
const config: Config = {
  darkMode: 'media',
  // ...
}
```

---

## 2. タッチターゲット最小サイズ

**Decision**: 全インタラクティブ要素に `min-h-[44px]` を保証。入力フィールドは `py-3`（計44px）に統一。

**Rationale**:
- Apple HIG: 44×44pt推奨
- Google Material Design: 48×48dp推奨
- WCAG 2.5.5 (Target Size AAA): 44×44px推奨（AA要件ではないが業界標準）
- FR-003「操作可能なすべてのボタン・リンク・入力要素のタップ領域は、縦横ともに44px以上」に直接対応

**Height calculation** (Tailwind text-sm baseline):
- `py-2` (8px×2) + line-height 20px = 36px → **不合格**
- `py-3` (12px×2) + line-height 20px = 44px → **合格**
- `min-h-[44px]` guard: ボタンテキストが短い場合の保険

**Current violations** (コードレビューで確認):

| ファイル | 要素 | 現状 | 修正方針 |
|---------|------|------|---------|
| `ProfileForm.tsx` | role/age_groupトグルボタン | `px-4 py-2` → ~36px | `py-3 min-h-[44px]` |
| `ProfileForm.tsx` | 全input/select | `py-2` → ~36px | `py-3` |
| `AvailabilityCalendar.tsx` | age_groupトグルボタン | `px-3 py-1 text-xs` → ~24px | `py-3 min-h-[44px]` |
| `AvailabilityCalendar.tsx` | 全input/textarea | `py-2` → ~36px | `py-3` |
| `MatchForm.tsx` | 全input/select/textarea | `py-2` → ~36px | `py-3` |
| `ApprovalList.tsx` | 承認・却下ボタン | `px-3 py-1.5` → ~32px | `min-h-[44px] py-2.5` |
| `admin/matches/page.tsx` | 試合を作成ボタン | `px-4 py-2` → ~36px | `min-h-[44px] py-2` |
| `admin/matches/[id]/page.tsx` | 通知を送るボタン | `px-4 py-2` → ~36px | `min-h-[44px] py-2` |

**Already compliant**:
- `AvailabilityList.tsx` 削除ボタン: `min-h-[44px] min-w-[44px]` ✅
- `JoinPage.tsx` 参加申請ボタン: `min-h-[44px]` ✅
- `AssignmentsPage.tsx` 確定ボタン: `min-h-[44px]` ✅
- `ProfileForm.tsx` 保存ボタン: `py-3` ✅
- `MatchForm.tsx` 送信ボタン: `py-3` ✅

---

## 3. WCAG AA コントラスト比検証

**Decision**: 以下のダークモードカラーパレットを採用。

| 用途 | ライトモード | ダークモード | コントラスト比（概算） |
|------|-----------|------------|------------------|
| ページ背景 | gray-50 (`#F9FAFB`) | gray-950 (`#030712`) | — |
| カード背景 | white (`#FFFFFF`) | gray-900 (`#111827`) | — |
| ヘッダー背景 | white | gray-900 | — |
| 本文テキスト | gray-900 (`#111827`) on white | gray-100 (`#F3F4F6`) on gray-900 | ~15:1 ✅ |
| 副テキスト | gray-700 (`#374151`) on white | gray-300 (`#D1D5DB`) on gray-900 | ~10:1 ✅ |
| 補助テキスト | gray-500 (`#6B7280`) on white | gray-400 (`#9CA3AF`) on gray-900 | ~5.5:1 ✅ |
| 最小テキスト | gray-400 (`#9CA3AF`) on white | gray-500 (`#6B7280`) on gray-900 | ~4.6:1 ✅ (AA) |
| ボーダー | gray-200 / gray-300 | gray-700 / gray-600 | — |
| 入力フィールド bg | white | gray-800 (`#1F2937`) | — |
| 入力テキスト | gray-900 on white | gray-100 on gray-800 | ~13:1 ✅ |

**Status badge dark mode mapping**:

| バッジ種別 | ライト | ダーク |
|-----------|-------|-------|
| 緑（open/approved/success） | `bg-green-100 text-green-800` | `dark:bg-green-900 dark:text-green-200` |
| 青（filled/accepted/confirmed） | `bg-blue-100 text-blue-800` | `dark:bg-blue-900 dark:text-blue-200` |
| 黄（pending/notified） | `bg-yellow-100 text-yellow-800` | `dark:bg-yellow-900 dark:text-yellow-200` |
| 赤（cancelled/declined） | `bg-red-100 text-red-800` | `dark:bg-red-900 dark:text-red-200` |
| グレー（cancelled/secondary） | `bg-gray-100 text-gray-500` | `dark:bg-gray-700 dark:text-gray-400` |
| 紫（Sライセンス） | `bg-purple-100 text-purple-800` | `dark:bg-purple-900 dark:text-purple-200` |

**Alert/feedback banners**:

| バナー種別 | ライト | ダーク |
|-----------|-------|-------|
| エラー | `bg-red-50 text-red-700` | `dark:bg-red-950 dark:text-red-300` |
| 成功 | `bg-green-50 text-green-700` | `dark:bg-green-950 dark:text-green-300` |

---

## 4. レスポンシブレイアウト問題

**Decision**: AssignmentsPage統計グリッドを `grid-cols-2 sm:grid-cols-4` に変更。

**Rationale**:
- 320px幅で `grid-cols-4` + `gap-3` の場合: (320 - 32 - 9) / 4 ≈ 70px/列
- 2桁数字 + バッジテキストが70px内に収まらず折り返し or overflow が発生する
- `grid-cols-2` に切り替えると各列 ≈ 143px となり余裕が生まれる

**Other layout issues**:
- Admin `layout.tsx` の `<div>{children}</div>`: 各ページが自前で `mx-auto max-w-2xl px-4` を持っているため、現状では崩れていない。ただしコンテンツ幅制約のないまま将来的に問題が出うる → contentラッパーに `px-4 sm:px-0` を追加することで一貫性を保つ。
- `MatchForm.tsx` の `grid-cols-2` (試合日 / 開始時間): 320pxでも (320 - 32 - 16) / 2 ≈ 136px/列で問題なし。変更不要。

---

## 5. iOS Safe Area Inset（ボトムナビゲーション）

**Decision**: referee layout のボトムナビに `env(safe-area-inset-bottom)` パディングを追加。

**Rationale**:
- iPhone X以降、ホームインジケーターの領域（~34px）がボトムナビに重なる
- `padding-bottom: env(safe-area-inset-bottom)` でこの領域を回避できる
- Next.js / Tailwindではカスタムクラスまたはinlineスタイルで対応

**Implementation**: ボトムナビの `<nav>` に `style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}` を追加。合わせて `<meta name="viewport">` に `viewport-fit=cover` が必要。

---

## 6. Overflow制御

**Decision**: `globals.css` に `body { overflow-x: hidden; }` を追加。各ページは `max-w-*` + `px-4` で横幅制御済みのため、追加対応は不要。

**Rationale**:
- 横スクロールが発生しうる要素（CandidateListのflexレイアウト等）はすでに `min-w-0` + `flex-1` で制御されている
- body レベルでの overflow-x: hidden は横スクロールバーの誤表示を防ぐ保険

---

## 7. Viewport Meta

**Decision**: 追加対応必要。`layout.tsx` の `<html>` タグに `viewport-fit=cover` を追加。

**Rationale**:
- Next.js 14 App Router は `width=device-width, initial-scale=1` を自動追加するが、`viewport-fit=cover` は自動追加されない
- Safe area insetを正しく機能させるために必要
- Next.js の `metadata` / `viewport` export で設定できる
