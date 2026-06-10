# Quickstart: 審判UIへの担当タブ追加

## 開発環境での確認手順

### 前提

- `pnpm dev` または `npm run dev` でローカル起動済み
- Supabase local or remote に接続済み
- 審判ロールのユーザーアカウントでログイン済み

---

### 募集タブの動作確認

1. Supabaseダッシュボード（または SQL Editor）で、テスト用の`assignments`レコードを`status = 'notified'`でINSERTする

   ```sql
   INSERT INTO assignments (match_id, user_id, role, status, notified_at)
   VALUES ('<match_id>', '<your_user_id>', 'referee', 'notified', now());
   ```

2. アプリのボトムナビに「担当」タブが表示され、バッジに件数が表示されることを確認する

3. 「担当」タブを開き、デフォルトで「募集」サブタブが選択されていることを確認する

4. 募集カードに試合情報が表示されていることを確認する

5. 「参加」ボタンを押し、カードが「参加済み」状態に変わることを確認する

6. Supabaseでレコードの`status`が`accepted`、`responded_at`がセットされていることを確認する

---

### 履歴タブの動作確認

1. 「担当」タブ内で「履歴」サブタブに切り替える

2. 既存の`status = 'confirmed'`のレコードが表示されることを確認する

3. `/history` に直接アクセスし、`/assignments?tab=history`にリダイレクトされることを確認する

---

### バッジ更新の確認

1. 募集カードで「辞退」を押してからホームタブに移動する

2. 「担当」タブのバッジ件数が1減っていることを確認する（ページ遷移後に更新）

---

## ファイル構成（実装後）

```text
src/
├── app/
│   ├── (referee)/
│   │   ├── assignments/
│   │   │   └── page.tsx              # 新規: 担当ページ（募集・履歴サブタブ）
│   │   └── history/
│   │       └── page.tsx              # 変更: /assignments?tab=history へリダイレクト
│   └── api/
│       └── assignments/
│           ├── pending/
│           │   └── route.ts          # 新規: GET notified assignments
│           └── [id]/
│               └── respond/
│                   └── route.ts      # 新規: PATCH accept/decline
└── components/
    ├── assignments/
    │   ├── AssignmentTabs.tsx        # 新規: サブタブUI
    │   └── PendingList.tsx           # 新規: 募集一覧コンポーネント
    └── nav/
        └── RefereeBottomNav.tsx      # 変更: タブ名・href・バッジ追加
```
