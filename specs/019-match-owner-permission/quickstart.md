# Quickstart: 手動テストシナリオ

## 前提条件

テスト用アカウントとして以下の3種を用意する：

| アカウント | ロール |
|-----------|--------|
| organizer_A | organizer（approved） |
| organizer_B | organizer（approved） |
| manager_M | manager（approved） |

## シナリオ 1: Organizer は自分の試合のみ閲覧・操作できる

1. organizer_A でログインし、試合を1件作成する（試合X）
2. organizer_B でログインし、試合を1件作成する（試合Y）
3. organizer_A の管理画面（/admin/matches）を開く
   - **期待**: 試合X のみ表示される。試合Y は表示されない
4. organizer_A で試合Y のURL（/admin/matches/[試合YのID]）に直接アクセスする
   - **期待**: 404 またはエラー表示になる
5. organizer_A で試合X のアサイン確定を行う
   - **期待**: 確定が成功する

## シナリオ 2: Manager はすべての試合を操作できる

1. manager_M でログインし、管理画面（/admin/matches）を開く
   - **期待**: 試合X・試合Y の両方が表示される
2. manager_M で試合X（organizer_A 作成）のアサイン確定を行う
   - **期待**: 確定が成功する

## シナリオ 3: 代理確定者の連絡先が担当履歴に表示される

1. シナリオ 2 で確定した審判のアカウントでログインし、担当履歴（/assignments?tab=history）を開く
2. 確定済みのアサインを展開する
   - **期待**: 「運営者連絡先」として organizer_A の連絡先が表示される
   - **期待**: 「代理確定」として manager_M の連絡先が追加表示される

## シナリオ 4: Organizer が自分の試合を確定した場合は代理確定者が表示されない

1. organizer_A でログインし、試合X のアサイン確定を行う
2. 確定した審判の担当履歴を開く
   - **期待**: 「運営者連絡先」のみ表示（代理確定の欄は表示されない）

## シナリオ 5: API レベルの不正アクセス防止（権限バイパス試行）

1. organizer_B のセッションで以下のリクエストを直接発行する：
   - `PATCH /api/matches/[試合XのID]/assignments/[assignmentId]/confirm`
   - **期待**: 404 が返る（403 ではなく 404 を返すことで試合の存在を漏らさない）
