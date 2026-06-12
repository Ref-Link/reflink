# Feature Specification: 試合操作権限の限定（作成者＋マネージャー方針）

**Feature Branch**: `019-match-owner-permission`  
**Created**: 2026-06-12  
**Status**: Draft  
**Input**: 方針C: 試合操作権限を作成者＋マネージャーに限定する

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 試合作成者が自分の試合を確定操作できる (Priority: P1)

コミュニティ内に複数の運営者（organizer）がいる場合、自分が登録した試合に対してのみ審判確定・候補者選出などの操作が行える。他の運営者が作成した試合は閲覧はできるが、操作ボタンは表示・実行できない。

**Why this priority**: 複数 organizer がいる場合の誤操作（他人の試合を意図せず確定するなど）を防ぐ最小単位の制御。

**Independent Test**: 2名の organizer でログインし、片方が作成した試合の確定ボタンがもう片方には無効・非表示であることを確認する。

**Acceptance Scenarios**:

1. **Given** organizer A が試合Xを作成している、**When** organizer B がその試合の審判確定を試みる、**Then** 操作は拒否され、エラーが返る
2. **Given** organizer A が試合Xを作成している、**When** organizer A が審判確定を実行する、**Then** 確定が成功する
3. **Given** 試合一覧画面、**When** organizer B が自分の試合でない試合Xを閲覧する、**Then** 確定ボタンは非活性または非表示である

---

### User Story 2 - マネージャーが任意の試合を操作できる (Priority: P1)

マネージャー（manager ロール）はコミュニティ内の全試合に対して確定・候補者選出などの操作が行える。organizer が不在・連絡不通の緊急時に代理対応するために必要。

**Why this priority**: organizer 不在時の試合孤立を防ぐ唯一の手段であり、P1と同等の重要度。

**Independent Test**: manager ロールのアカウントでログインし、他の organizer が作成した試合の審判確定が実行できることを確認する。

**Acceptance Scenarios**:

1. **Given** organizer A が試合Xを作成している、**When** manager が審判確定を実行する、**Then** 確定が成功する
2. **Given** manager がログインしている、**When** コミュニティ内の任意の試合の候補者一覧を閲覧・操作する、**Then** 全操作が有効である

---

### User Story 3 - Organizer は自分の試合のみ管理画面に表示される (Priority: P2)

organizer が管理画面で試合一覧を見たとき、自分が作成した試合のみが表示される。他の organizer が作成した試合は一覧にも詳細にも表示されない。

**Why this priority**: 「閲覧のみ」を区別表示するより、そもそも見えない方がシンプルで認知負荷が低い。

**Independent Test**: organizer B でログインし、organizer A が作成した試合が一覧・詳細画面のどこにも表示されないことを確認する。

**Acceptance Scenarios**:

1. **Given** organizer A が試合X・試合Y を作成し、organizer B が試合Z を作成している、**When** organizer B が試合一覧を開く、**Then** 試合Z のみが表示され、試合X・Y は表示されない
2. **Given** organizer B がログインしている、**When** 試合X の URL に直接アクセスする、**Then** アクセスは拒否される（404 または 403）
3. **Given** manager がログインしている、**When** 試合一覧を開く、**Then** コミュニティ内の全試合が表示される

---

### Edge Cases

- 試合の作成者（organizer）が後から manager に昇格した場合 → manager として全試合を操作できる（問題なし）
- 試合の作成者（organizer）がコミュニティから退会・役職を失った場合 → manager のみが該当試合を操作できる（孤立せず）
- manager が自分で作成した試合を操作する → 作成者として、かつ manager として操作できる（重複許容）
- コミュニティに manager が1人もいない状態 → 各 organizer は自分の試合のみ操作可能（既存制約どおり）
- organizer が自分の試合を別の organizer に引き継ぎたい場合 → 現在の仕様では直接引き継ぎ機能なし（manager に依頼して代理対応）

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 試合の確定操作（審判確定）は、当該試合の作成者 OR manager ロールのユーザーのみが実行できる
- **FR-002**: 試合の候補者選出・通知操作は、当該試合の作成者 OR manager ロールのユーザーのみが実行できる
- **FR-003**: 試合の閲覧（一覧・詳細・アサイン一覧）は、当該試合の作成者 OR manager ロールのユーザーのみが行える。他の organizer には表示されない
- **FR-004**: 権限のないユーザーが操作を試みた場合、システムはエラーを返す（HTTPステータス 403）
- **FR-005**: 管理画面上で、操作権限のない試合の操作ボタンは非活性または非表示にする
- **FR-006**: manager ロールのユーザーはコミュニティ内の全試合を操作できる（作成者に関わらず）
- **FR-007**: 権限チェックはAPIレベルとUIレベルの両方で実施する（UIのみの制御では不十分）
- **FR-008**: 審判確定時に `confirmed_by`（確定操作者のユーザーID）を記録する
- **FR-009**: 審判の担当履歴画面では、試合作成者の連絡先を常に表示する。確定操作者が試合作成者と異なる場合は、代理確定者の連絡先も追加で表示する

### Key Entities

- **試合 (Match)**: 作成者（created_by）を持ち、所属コミュニティと紐づく。操作権限は created_by と manager ロールで判定する
- **コミュニティメンバー (CommunityMember)**: role（referee / organizer / manager）と status（approved など）を持つ。権限判定に使用する
- **アサイン (Assignment)**: 試合に紐づく審判のアサイン。確定操作の対象。`confirmed_by` に確定操作者を記録し、試合作成者と異なる場合は代理確定として扱う

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 権限のない organizer による確定操作が、バックエンドで 100% 拒否される
- **SC-002**: manager は全コミュニティ試合の確定操作が行える（代理対応率 100%）
- **SC-003**: 試合作成者の organizer は既存と同等の操作が行える（リグレッションなし）
- **SC-004**: organizer の試合一覧・詳細画面に、自分が作成していない試合が一切表示されない

## Assumptions

- コミュニティには少なくとも1名の manager が常に存在することが運用上の前提（システムは強制しないが、ドキュメントで案内する）
- 審判の「担当履歴」画面に表示される運営者連絡先は、試合作成者（organizer）の連絡先を常に表示する。manager が代理確定した場合は、作成者連絡先に加えて代理確定者（manager）の連絡先も表示する（確定者と作成者が同一の場合は1件のみ表示）
- `confirmed_by` を `assignments` テーブルに追加する（DBスキーマ変更あり）
- 試合の「引き継ぎ（作成者の変更）」機能は本仕様には含まない。孤立した試合は manager が代理対応する
- 既存の `matches.created_by` フィールドを権限判定に利用する
- DBスキーマ変更: `assignments` テーブルに `confirmed_by uuid REFERENCES users(id)` 列を追加する。RLSポリシーは変更しない
- 権限チェック（試合作成者 or manager のみ操作可能）はアプリケーションレイヤーで実施する
- 試合詳細画面・一覧は作成者と manager のみがアクセス可能。他の organizer には表示・アクセスともに不可
