# Quickstart: モバイルユーザビリティ改善の検証手順

**Feature**: 002-mobile-usability | **Date**: 2026-06-05

## 前提条件

- Node.js 20+ / pnpm 環境
- `.env.local` に Supabase / LINE 認証情報が設定済み

## 開発サーバー起動

```bash
cd /Users/kome/git/personal/reflink
pnpm dev
# http://localhost:3000 で起動
```

## テスト方法

### 1. モバイル幅エミュレーション（Chrome）

1. Chrome で `http://localhost:3000/login` を開く
2. DevTools を開く（F12）
3. デバイスツールバーをオン（Cmd+Shift+M）
4. デバイスを **iPhone SE** (375×667) に設定

確認する画面:
- `/login` — ログインボタンが全幅で表示されるか
- `/profile` — フォームが横スクロールなく表示されるか
- `/availability` — 日程追加フォーム・一覧が正しく表示されるか
- `/history` — 履歴リストが読みやすく表示されるか
- `/join` — 参加申請ボタンがタップ可能サイズか
- `/admin/matches` — 試合一覧・作成ボタンが表示されるか
- `/admin/matches/[id]` — 詳細・候補リストが表示されるか
- `/admin/matches/[id]/assignments` — 統計グリッドが2カラムで表示されるか
- `/admin/members` — 承認/却下ボタンが正しく表示されるか

### 2. 最小幅（320px）検証

1. DevTools でカスタムデバイスを作成: 320×568px
2. 全画面で横スクロールバーが発生しないことを確認

### 3. ダークモード切り替え

**Chromeの場合**:
1. DevTools を開く
2. レンダリングタブ（More tools → Rendering）を開く
3. 「Emulate CSS media feature prefers-color-scheme」を **dark** に切り替え

確認ポイント:
- [ ] カード背景が暗い色（`bg-gray-900`相当）に変わる
- [ ] テキストが白〜薄いグレーで読める
- [ ] ボタン・バッジの色が適切な色で表示される（赤＝エラー、緑＝成功が視認できる）
- [ ] 入力フィールドが暗い背景 + 薄いテキストで読める
- [ ] ヘッダー・ボトムナビが暗い背景で表示される
- light に戻したとき元のスタイルに戻る

### 4. タップターゲットサイズ確認

DevTools の Elements パネルで各インタラクティブ要素の `height` を確認:
- 全ボタン・リンク: 44px以上
- 全入力フィールド: 44px以上
- ボトムナビ各タブ: 44px以上（アイコン + テキスト合計）

または Chrome DevTools の Accessibility タブで「Clickable elements might not be large enough」を確認。

### 5. SC-005 / SC-006 フロー検証

**SC-005**: 審判フロー（5分以内）
1. `/login` → ログイン
2. `/profile` → プロフィール確認 → 「保存する」タップ
3. `/availability` → 日程追加 → 「追加する」タップ
4. `/history` → 一覧確認

**SC-006**: 管理者フロー（3分以内）
1. `/admin/matches` → 試合一覧確認
2. 任意の試合 → 詳細ページ確認
3. `/admin/matches/[id]/assignments` → アサイン状況確認

## ビルド確認

```bash
pnpm build
# TypeScript型エラー・ESLintエラーがないこと
```
