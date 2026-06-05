# Data Model: スマートフォン対応ユーザビリティ改善

**Feature**: 002-mobile-usability | **Date**: 2026-06-05

## Database Changes

**なし** — このフィーチャーはUI/CSSレイヤーの変更のみであり、データベーススキーマ変更・マイグレーション・新テーブルは不要。

---

## UI Design Patterns

データモデルの代わりに、UIパターンの変更前後を定義する。

### パターン A: 入力フィールド（タップ領域）

**Before**:
```tsx
<input className="... px-3 py-2 text-sm ..." />
// Height ≈ 36px — FR-003違反
```

**After**:
```tsx
<input className="... px-3 py-3 text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 ..." />
// Height ≈ 44px — FR-003適合
```

### パターン B: アクションボタン（タップ領域）

**Before**:
```tsx
<button className="rounded-md bg-blue-600 px-4 py-2 text-sm ..." />
// Height ≈ 36px — FR-003違反
```

**After**:
```tsx
<button className="min-h-[44px] rounded-md bg-blue-600 px-4 py-2 text-sm ..." />
// min-height: 44px — FR-003適合
```

### パターン C: トグル/チップボタン（タップ領域）

**Before**:
```tsx
<button className="rounded-full px-3 py-1 text-xs ..." />
// Height ≈ 24px — FR-003違反
```

**After**:
```tsx
<button className="min-h-[44px] rounded-full px-3 py-1 text-xs ..." />
// min-height: 44px — FR-003適合
```

### パターン D: カード / コンテナ（ダークモード）

**Before**:
```tsx
<div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
  <p className="text-sm font-semibold text-gray-900">...</p>
  <p className="text-xs text-gray-500">...</p>
</div>
```

**After**:
```tsx
<div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 shadow-sm">
  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">...</p>
  <p className="text-xs text-gray-500 dark:text-gray-400">...</p>
</div>
```

### パターン E: ステータスバッジ（ダークモード）

**Before**:
```tsx
<span className="bg-green-100 text-green-800">確定済</span>
```

**After**:
```tsx
<span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">確定済</span>
```

### パターン F: フィードバックバナー（ダークモード）

**Before**:
```tsx
<div className="rounded-md bg-red-50 p-3 text-sm text-red-700">...</div>
```

**After**:
```tsx
<div className="rounded-md bg-red-50 dark:bg-red-950 p-3 text-sm text-red-700 dark:text-red-300">...</div>
```

### パターン G: レスポンシブグリッド

**Before** (`AssignmentsPage` 統計):
```tsx
<div className="grid grid-cols-4 gap-3">
  {/* 320px幅で各列~70px — 狭すぎる */}
</div>
```

**After**:
```tsx
<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
  {/* 320px幅で各列~143px ✓ */}
</div>
```

---

## 変更対象ファイル一覧

| ファイル | 変更カテゴリ | 詳細 |
|---------|-----------|------|
| `tailwind.config.ts` | 設定 | `darkMode: 'media'` 追加 |
| `src/app/layout.tsx` | Viewport | `viewport.viewportFit = 'cover'` export追加 |
| `src/app/globals.css` | グローバルCSS | `overflow-x: hidden` 追加 |
| `src/app/(auth)/login/page.tsx` | パターンD | ダークモード: 背景・テキスト・ボーダー |
| `src/app/(referee)/layout.tsx` | Safe Area | ボトムナビに `env(safe-area-inset-bottom)` 追加 |
| `src/app/admin/layout.tsx` | パターンD | ヘッダーダークモード |
| `src/app/admin/matches/page.tsx` | パターンB + D | ボタン44px化・ダークモード |
| `src/app/admin/matches/[id]/page.tsx` | パターンB + D | ボタン44px化・ダークモード |
| `src/app/admin/matches/[id]/assignments/page.tsx` | パターンG + D | グリッドレスポンシブ化・ダークモード |
| `src/components/availability/AvailabilityCalendar.tsx` | パターンA + C + D | 入力44px化・ダークモード |
| `src/components/history/AssignmentHistory.tsx` | パターンD + E | ダークモード |
| `src/components/matches/CandidateList.tsx` | パターンD + E | ダークモード |
| `src/components/matches/MatchForm.tsx` | パターンA + D | 入力44px化・ダークモード |
| `src/components/members/ApprovalList.tsx` | パターンB + D | ボタン44px化・ダークモード |
| `src/components/profile/ProfileForm.tsx` | パターンA + B + C + D | 入力・ボタン44px化・ダークモード |
