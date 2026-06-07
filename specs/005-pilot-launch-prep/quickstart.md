# Quickstart: Pilot Launch Preparation 検証手順

**Feature**: 005-pilot-launch-prep | **Date**: 2026-06-06

## 前提条件

- Node.js 20+ / pnpm 環境
- `.env.local` に Supabase / LINE 認証情報が設定済み

## 開発サーバー起動

```bash
cd /Users/kome/git/personal/reflink
pnpm dev
# http://localhost:3000 で起動
```

---

## Story 1: アプリブランディング（ファビコン・PWA・OGP）

### 1-1. ファビコン確認

1. `http://localhost:3000` をブラウザで開く
2. ブラウザタブを確認し、RefLink のアイコンが表示されることを確認
3. DevTools → Elements → `<head>` で `<link rel="icon">` タグが存在することを確認

### 1-2. OGP メタデータ確認

```bash
# curl でメタタグを確認
curl -s http://localhost:3000 | grep -E 'og:|twitter:'
```

期待される出力例:
```html
<meta property="og:title" content="RefLink"/>
<meta property="og:description" content="地域サッカー審判マッチングプラットフォーム"/>
<meta property="og:image" content="...og-image.png"/>
```

またはブラウザ DevTools → Elements → `<head>` で `og:` タグを確認。

### 1-3. PWA manifest.json 確認

1. `http://localhost:3000/manifest.json` にアクセスし、JSON が正しく返ることを確認
2. `name: "RefLink"`、`icons` の配列にアイコンパスが含まれることを確認

### 1-4. PWA インストール確認（モバイルまたは Chrome DevTools）

**Chrome DevTools 使用時**:
1. DevTools → Application → Manifest タブを開く
2. manifest.json の内容が表示されることを確認
3. アイコンが読み込まれていることを確認（プレースホルダーでも OK）

**実機（iOS Safari）使用時**:
1. `http://<dev-server-ip>:3000` に Safari でアクセス
2. 共有ボタン → 「ホーム画面に追加」を選択
3. アプリ名「RefLink」とアイコンが表示されることを確認
4. ホーム画面から起動し、URL バーなしで表示されることを確認

---

## Story 2: 利用規約ページ

### 2-1. 未認証アクセス確認

```bash
# 認証 Cookie なしでアクセス → 200 が返ること
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/terms
# 期待: 200
```

### 2-2. ページ内容確認

1. `http://localhost:3000/terms` をブラウザで開く
2. 以下のセクションが表示されることを確認（FR-006）:
   - [ ] サービスの目的
   - [ ] 利用資格
   - [ ] 禁止事項
   - [ ] 免責事項
   - [ ] 規約変更について
   - [ ] 問い合わせ先
3. 施行日が表示されることを確認

### 2-3. モバイル表示確認

1. DevTools → デバイスツールバー → iPhone SE (375×667) に設定
2. テキストが横スクロールなく、読みやすいフォントサイズで表示されることを確認
3. 行間・余白が十分であることを確認

---

## Story 3: プライバシーポリシーページ

### 3-1. 未認証アクセス確認

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/privacy
# 期待: 200
```

### 3-2. ページ内容確認

1. `http://localhost:3000/privacy` をブラウザで開く
2. 以下のセクションが表示されることを確認（FR-007）:
   - [ ] 収集する個人情報の種類
   - [ ] 利用目的
   - [ ] 第三者提供（LINE 連携含む）
   - [ ] データ保管・管理
   - [ ] ユーザーの権利（削除・訂正）
   - [ ] 問い合わせ先

---

## Story 4: フッターリンク

### 4-1. 審判ページのフッター

1. ログイン後、`http://localhost:3000/profile` を開く
2. ページを一番下までスクロール
3. フッターに「利用規約」「プライバシーポリシー」リンクが表示されることを確認
4. 各リンクをタップして正しいページに遷移することを確認

### 4-2. 管理ページのフッター

1. 管理者権限でログイン後、`http://localhost:3000/admin/matches` を開く
2. ページ下部にフッターリンクが表示されることを確認

### 4-3. ログインページのリンク

1. `http://localhost:3000/login` を開く
2. ボタン下部の文言に「利用規約」「プライバシーポリシー」のリンクが含まれることを確認
3. 各リンクが正しいページに遷移することを確認（ログイン不要でアクセスできること）

---

## ビルド確認

```bash
pnpm build
# TypeScript 型エラー・ESLint エラーがないこと
```

---

## アセット差し替え手順（Pilot 後）

正式デザインアセットが準備できた場合の差し替え手順:

```bash
# アイコン差し替え（PNG 形式）
cp <design-assets>/icon-32.png  public/icon-32.png
cp <design-assets>/icon-192.png public/icon-192.png
cp <design-assets>/icon-512.png public/icon-512.png
cp <design-assets>/og-image.png public/og-image.png

# favicon 差し替え
cp <design-assets>/favicon.ico  src/app/favicon.ico

pnpm build && pnpm start
```

## 法的文書更新手順

利用規約・プライバシーポリシーの内容を更新する場合:

1. `src/app/terms/page.tsx` の `TERMS_SECTIONS` 配列を編集
2. `src/app/privacy/page.tsx` の `PRIVACY_SECTIONS` 配列を編集
3. 施行日を更新
4. `git commit` でバージョン管理（変更履歴を git log で追跡可能）
