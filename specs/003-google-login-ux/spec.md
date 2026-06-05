# Feature Specification: Google Login UX Parity

**Feature Branch**: `003-google-login-ux`  
**Created**: 2026-06-06  
**Status**: Draft  
**Input**: User description: "Googleアカウントでログインした場合にはmailベースでLINEログインした際と同じようなユーザー体験が得られるような機能拡張を行います。"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Google 初回ログイン時のオンボーディング統一 (Priority: P1)

LINEログインユーザーと同じオンボーディング体験をGoogleログインユーザーにも提供する。現在、Googleでログインした新規ユーザーは `/profile?setup=true` にリダイレクトされるが、LINEログインユーザーは `/profile` にリダイレクトされており、挙動が不統一になっている。また、Googleから取得できる表示名（フルネーム）をプロフィールのデフォルト値として適切に設定する。

**Why this priority**: オンボーディング体験はすべての新規ユーザーに影響する。一貫した初回ログインフローはユーザーの混乱を防ぎ、プロフィール設定完了率を向上させる。

**Independent Test**: Google アカウントで初めてログインし、プロフィール設定画面に正しくリダイレクトされること、かつ表示名がGoogle アカウントの名前で事前入力されていることを確認することで単独テスト可能。

**Acceptance Scenarios**:

1. **Given** 初回のGoogleログインユーザーが, **When** Googleでサインインを完了すると, **Then** `/profile` にリダイレクトされ（`?setup=true` なし）、プロフィール設定画面に「プロフィール登録」と表示される
2. **Given** プロフィール画面に到達したGoogleユーザーが, **When** フォームを開くと, **Then** 表示名フィールドにGoogleアカウントのフルネームが事前入力されている
3. **Given** プロフィールを登録したGoogleユーザーが, **When** 保存ボタンを押すと, **Then** `/availability`（空き日程登録）に遷移する

---

### User Story 2 - メールアドレスによるLINEアカウント連携 (Priority: P1)

Googleアカウントのメールアドレスと同一メールアドレスで登録されたLINEアカウントが存在する場合、ログイン時に自動的にアカウントを連携し、`line_user_id` をGoogleユーザーのプロフィールに設定する。これにより、Googleでログインしているユーザーも試合割り当てや確認時のLINEプッシュ通知を受け取れるようになる。

**Why this priority**: LINEプッシュ通知は審判への試合割り当て・確認の主要な通知手段。Googleログインユーザーがこれを受け取れないことはサービスの中核機能の欠落であり、P1相当。

**Independent Test**: LINEで登録済みのメールアドレスを持つGoogleアカウントでログインし、プロフィールの `line_user_id` が自動連携されることを確認し、その後試合割り当て通知がLINEで届くことを確認することで単独テスト可能。

**Acceptance Scenarios**:

1. **Given** LINEアカウント（line_user_id 保持）と同一メールアドレスのGoogleアカウントでログインしたとき, **When** 認証コールバックが処理されると, **Then** ユーザープロフィールの `line_user_id` にLINEアカウントの値が設定される
2. **Given** `line_user_id` が連携されたGoogleユーザーが試合に割り当てられたとき, **When** 管理者が割り当てを実行すると, **Then** そのユーザーのLINEアカウントに試合通知が送信される
3. **Given** Googleアカウントのメールアドレスに対応するLINEアカウントが存在しないとき, **When** Googleログインが完了すると, **Then** 連携なしで通常通りログインが完了し、エラーは発生しない
4. **Given** LINEで偽メールアドレス（`line_XXX@line.reflink.local`）を使って登録されたLINEユーザーが, **When** 同一ユーザーがGoogleでログインしようとすると, **Then** 偽メールはGoogleメールと一致しないため連携は行われず、通常のGoogleログインが完了する

---

### User Story 3 - Googleログイン後の返却URLの一貫性 (Priority: P2)

LINEログインと同様に、Googleログイン後も `next` パラメータで指定したURLに正しくリダイレクトされること。現在のLINEフローでは返却先URLがセッションに保持され、ログイン後に正確に復元される。Googleログインも同じ挙動を保証する。

**Why this priority**: 深いリンク（特定試合へのURL等）からログインを求められた場合の体験に影響するため重要だが、既存の実装でほぼ機能しているため P2。

**Independent Test**: `/login?next=/availability` にアクセスしてGoogleログインを完了し、`/availability` に正しくリダイレクトされることで単独テスト可能。

**Acceptance Scenarios**:

1. **Given** `next=/availability` パラメータ付きのログインURLにアクセスしたユーザーが, **When** Googleログインを完了すると, **Then** `/availability` にリダイレクトされる
2. **Given** 既存プロフィール済みのGoogleユーザーが, **When** `next` なしでログインすると, **Then** デフォルトのトップページ（`/`）にリダイレクトされる

---

### Edge Cases

- Googleアカウントのメールが同一で、LINE・Googleで別々のSupabaseアカウントが既に存在する場合（データ不整合）の対応はどうするか？
- LINE側で実メールアドレスが使用されていても、Google側のメールと大文字小文字が異なる場合の照合
- Googleログイン中にアカウント連携処理が失敗した場合（LINEアカウント検索エラー等）は連携スキップでログインを継続させる
- 初回ログイン時にGoogleからフルネームが取得できない場合は、メールアドレスをデフォルト表示名として使用する

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Googleログイン後のコールバックは、初回ユーザーを `/profile`（`?setup=true` なし）にリダイレクトしなければならない
- **FR-002**: Googleアカウントから取得したフルネームをプロフィールスタブの `display_name` として設定しなければならない（フルネームが取得できない場合はメールアドレスを代替値として使用）
- **FR-003**: Googleログインのコールバック処理時に、Googleアカウントのメールアドレスと一致する `line_user_id` 保有ユーザーを検索し、見つかった場合は `line_user_id` をそのユーザーのプロフィールに設定しなければならない
- **FR-004**: LINEアカウントとの連携処理が失敗した場合でも、Googleログイン自体は正常に完了しなければならない（エラーでログインがブロックされてはならない）
- **FR-005**: `line_user_id` が設定されたGoogleログインユーザーは、試合割り当て時および確認時にLINEプッシュ通知を受信できなければならない
- **FR-006**: 既存のGoogleログインユーザー（既にプロフィールを持つ返却ユーザー）は、ログインのたびにメールアドレスによるLINEアカウント連携チェックを実行し、新たに`line_user_id`が設定可能になった場合は更新しなければならない
- **FR-007**: Googleログイン後の `next` パラメータによるリダイレクト挙動はLINEログインと同等でなければならない

### Key Entities

- **ユーザープロフィール（users テーブル）**: `id`（Supabaseユーザーと連動）、`display_name`、`line_user_id`（LINE連携用）、`email`相当（Supabaseの auth.users 経由）
- **LINE連携情報**: `line_user_id` はLINEのユーザーID。この値があることでLINEプッシュ通知APIが使用可能になる。メールアドレスを鍵としてGoogleアカウントと紐付ける

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 同一メールアドレスでLINEアカウントが存在するGoogleログインユーザーの `line_user_id` 自動連携率が 100%
- **SC-002**: Googleログイン後の初回オンボーディング完了率（プロフィール登録→空き日程登録）がLINEログインと同水準（測定可能になった時点で ±5% 以内の差）
- **SC-003**: `line_user_id` が連携されたGoogleログインユーザーへの試合割り当て通知送達率がLINEログインユーザーと同等
- **SC-004**: Googleログインのコールバック処理時間が既存と比較して 500ms 以上増加しない（連携チェック追加後）

## Assumptions

- LINEログインで実メールアドレスが取得できた場合のみ連携対象とする（`line_XXX@line.reflink.local` 形式の偽メールを持つユーザーはGoogleとの連携対象外）
- メールアドレスの照合は大文字小文字を区別しない（case-insensitive）
- Googleアカウントからはフルネームと認証済みメールアドレスが常に取得できると仮定する
- 既存の LINE 通知送信ロジック（`pushMessage`, `pushTextMessage`）は変更せず、`line_user_id` の有無による条件分岐をそのまま活用する
- Supabase のメール重複制約上、同一メールアドレスの LINE・Google アカウントは既に同一の Supabase ユーザーとして統合されている可能性がある（LINE コールバックの `createUser` が既存メールを返す場合）。このケースでは `line_user_id` の同期のみ行う
