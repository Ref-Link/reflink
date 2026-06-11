# Implementation Plan: 審判資格なしメンバー登録

**Branch**: `014-optional-referee-qualification` | **Date**: 2026-06-11 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `specs/014-optional-referee-qualification/spec.md`

## Summary

審判ライセンスを持たないコミュニティ運営者がプロフィール登録・コミュニティ参加できるよう、プロフィールフォームと関連APIのバリデーションを緩和し、コミュニティ申請時のロール自動判定を追加する。DBマイグレーションで `users.license_level` を nullable に変更し、最小限の変更でリグレッションなく対応する。

## Technical Context

**Language/Version**: TypeScript 5.x / Node.js 18+  
**Primary Dependencies**: Next.js 14 (App Router), React 18, Supabase JS v2  
**Storage**: Supabase (PostgreSQL) — `users`, `community_members` テーブル  
**Testing**: 手動テスト（quickstart.md 参照）  
**Target Platform**: Web (PWA) / LINE内ブラウザ  
**Project Type**: Web application (Next.js + Supabase)  
**Performance Goals**: プロフィール保存・申請レスポンス < 2秒  
**Constraints**: 既存審判ユーザーへのリグレッションなし  
**Scale/Scope**: 既存機能の変更（新テーブル不要）

## Constitution Check

### I. 信頼インフラ第一 ✅

運営者ロールを明示することで、誰が審判でないかを管理者が識別できる。誤アサインを防ぎ、信頼性を高める。

### II. 既存文化の尊重 ✅

既存の LINE ベース通知フローに変更なし。審判ユーザーの操作フローも変わらない。

### III. 最小限のデジタル化 ✅

ユーザーにロール選択UIを追加せず、ライセンスの有無から自動判定。入力フローが簡略化される。

### IV. 半クローズドコミュニティ ✅

コミュニティ参加申請フローは引き続き管理者承認制。オープン登録は許可しない。

### V. 段階的な信頼可視化 ✅

ライセンスなしの運営者はアサイン候補に含まれない設計。信頼可視化の対象は審判のみに維持される。

**Post-design re-check**: Phase 1 設計後も同様に全原則クリア。

## Project Structure

### Documentation (this feature)

```text
specs/014-optional-referee-qualification/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── api-changes.md   # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit-tasks)
```

### Source Code (変更ファイル)

```text
src/
├── types/
│   └── database.ts                              # license_level nullable化
├── app/
│   ├── api/
│   │   └── profile/
│   │       └── route.ts                         # バリデーション緩和（display_name+regionのみ必須）
│   └── admin/
│       └── members/
│           └── AdminMembersClient.tsx            # null ライセンス表示対応（「なし」表示）
└── components/
    └── profile/
        └── ProfileForm.tsx                      # UI変更（required削除・ライセンスなし時の条件表示）
```

> **apply/route.ts は変更しない**: ロール自動判定は行わず、引き続き `referee` 固定。`organizer` / `manager` は管理者が手動付与する管理権限ロールであり、ライセンス有無と混同しない。

## Complexity Tracking

> 憲法違反なし。Complexity Tracking 不要。
