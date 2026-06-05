# Design Tokens Contract: スマートフォン対応ユーザビリティ改善

**Feature**: 002-mobile-usability | **Date**: 2026-06-05

このドキュメントはフィーチャー全体で一貫して使用するTailwindクラスの組み合わせ（セマンティックトークン）を定義する。実装時はこのコントラクトに従い、個別判断でクラスを追加しない。

---

## Surface Tokens（背景・ボーダー）

| Token Name | Light Classes | Dark Classes | 用途 |
|-----------|--------------|-------------|------|
| `surface-page` | `bg-gray-50` | `dark:bg-gray-950` | ページ全体の背景 |
| `surface-card` | `bg-white` | `dark:bg-gray-900` | カード・フォームコンテナ |
| `surface-header` | `bg-white border-b border-gray-200` | `dark:bg-gray-900 dark:border-gray-700` | ナビゲーションヘッダー |
| `surface-input` | `bg-white border-gray-300` | `dark:bg-gray-800 dark:border-gray-600` | テキスト入力・select |
| `surface-hover` | `hover:bg-gray-50` | `dark:hover:bg-gray-800` | ホバー状態の背景 |

---

## Text Tokens

| Token Name | Light Classes | Dark Classes | 用途 |
|-----------|--------------|-------------|------|
| `text-primary` | `text-gray-900` | `dark:text-gray-100` | 見出し・重要ラベル |
| `text-secondary` | `text-gray-700` | `dark:text-gray-300` | 本文・フォームラベル |
| `text-muted` | `text-gray-500` | `dark:text-gray-400` | 補助テキスト・プレースホルダー情報 |
| `text-subtle` | `text-gray-400` | `dark:text-gray-500` | タイムスタンプ・最小情報 |
| `text-link` | `text-blue-600` | `dark:text-blue-400` | リンク |
| `text-link-hover` | `hover:text-blue-500` | `dark:hover:text-blue-300` | リンクホバー |

---

## Badge / Status Tokens

| Status | Light Classes | Dark Classes |
|--------|--------------|-------------|
| `success` (open, approved, confirmed) | `bg-green-100 text-green-800` | `dark:bg-green-900 dark:text-green-200` |
| `info` (filled, accepted, notified) | `bg-blue-100 text-blue-800` | `dark:bg-blue-900 dark:text-blue-200` |
| `warning` (pending) | `bg-yellow-100 text-yellow-800` | `dark:bg-yellow-900 dark:text-yellow-200` |
| `danger` (declined, cancelled) | `bg-red-100 text-red-800` | `dark:bg-red-900 dark:text-red-200` |
| `neutral` (secondary info) | `bg-gray-100 text-gray-500` | `dark:bg-gray-700 dark:text-gray-400` |
| `license-s` | `bg-purple-100 text-purple-800` | `dark:bg-purple-900 dark:text-purple-200` |
| `license-1` | `bg-blue-100 text-blue-800` | `dark:bg-blue-900 dark:text-blue-200` |
| `license-2` | `bg-green-100 text-green-800` | `dark:bg-green-900 dark:text-green-200` |
| `license-default` | `bg-gray-100 text-gray-700` | `dark:bg-gray-700 dark:text-gray-300` |

---

## Alert Banner Tokens

| Type | Light Classes | Dark Classes |
|------|--------------|-------------|
| `error-banner` | `bg-red-50 text-red-700` | `dark:bg-red-950 dark:text-red-300` |
| `success-banner` | `bg-green-50 text-green-700` | `dark:bg-green-950 dark:text-green-300` |
| `warning-banner` | `bg-yellow-50 text-yellow-700` | `dark:bg-yellow-950 dark:text-yellow-300` |

---

## Touch Target Tokens

| Token | Classes | 用途 |
|-------|---------|------|
| `input-base` | `block w-full rounded-md border px-3 py-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500` | 全フォーム入力（text, date, time, number） |
| `input-select` | (same as input-base) | select要素 |
| `button-primary` | `min-h-[44px] rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50` | プライマリアクションボタン |
| `button-full` | `w-full min-h-[44px] rounded-md bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50` | フォーム送信ボタン（フル幅） |
| `button-secondary` | `min-h-[44px] rounded-md bg-white px-3 py-2 text-xs font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50` | セカンダリボタン（却下等） |
| `toggle-chip` | `min-h-[44px] rounded-full px-3 py-1 text-xs font-medium border transition-colors` | トグルチップ（年代・役割選択） |
| `danger-text-btn` | `min-h-[44px] min-w-[44px] rounded-md px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50` | テキストスタイル危険ボタン（削除等） |

---

## Responsive Grid Tokens

| Context | Classes |
|---------|---------|
| Stats cards (2→4 columns) | `grid grid-cols-2 gap-3 sm:grid-cols-4` |
| Form date/time pair | `grid grid-cols-2 gap-4` (変更なし、幅が狭くても2カラムは許容) |
| Form count pair | `grid grid-cols-2 gap-4` (変更なし) |
