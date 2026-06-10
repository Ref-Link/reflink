# Implementation Plan: 審判依頼通知のロール選択UX改善

**Branch**: `011-referee-role-notify` | **Date**: 2026-06-10 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `/specs/011-referee-role-notify/spec.md`

## Summary

主催者が審判候補を選択する際に各候補のロール（主審/副審）を明示的に指定できるUIを追加し、LINEの通知文言をそのロールに応じて切り替える。DBスキーマ変更は不要（`assignments.role`は既存）。変更対象はフロントエンドの候補リスト・試合詳細ページ、LINEメッセージビルダーの3ファイル＋APIルート1ファイル。

## Technical Context

**Language/Version**: TypeScript 5 / Next.js 14.2.35  
**Primary Dependencies**: `@supabase/supabase-js`, `@line/bot-sdk`, Tailwind CSS 3  
**Storage**: Supabase PostgreSQL — `assignments.role ('referee' | 'assistant_referee')` already exists  
**Testing**: Empty test suite (tests/unit, tests/integration directories exist but no files)  
**Target Platform**: Web browser (admin side), LINE app (referee notification display)  
**Project Type**: web-service (Next.js full-stack on Vercel + Supabase)  
**Performance Goals**: <500ms API response for assignment creation  
**Constraints**: Mobile-first UI; LINE Flex Message spec compliance; no DB migration  
**Scale/Scope**: Pilot — ~30 referees, ~10 matches/month per community

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Assessment |
|-----------|------------|
| I. 信頼インフラ第一 | ✅ ロールを正しく通知することで審判員の混乱を防ぎ、信頼を高める |
| II. 既存文化の尊重 | ✅ LINEチャンネルを継続利用。ワークフロー変更なし |
| III. 最小限のデジタル化 | ✅ 1ロールのみ対応候補は操作不要（自動設定）。2ロール候補のみ追加タップ1回 |
| IV. 半クローズドコミュニティ | ✅ アクセスモデル変更なし |
| V. 段階的な信頼可視化 | ✅ スコアリング・評価機能の追加なし |

**判定: PASS — 違反なし。Complexity Tracking 不要。**

Post-design re-check: ✅ Phase 1 設計後も全原則に適合。追加複雑度なし。

## Project Structure

### Documentation (this feature)

```text
specs/011-referee-role-notify/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── assignments-api.md
└── tasks.md             # Phase 2 output (/speckit-tasks)
```

### Source Code (changed files only)

```text
src/
├── components/matches/
│   └── CandidateList.tsx          # ロール選択UIの追加
├── app/admin/matches/[id]/
│   └── page.tsx                   # ロール選択ステートの追加・handleNotify修正
├── app/api/matches/[id]/assignments/
│   └── route.ts                   # role を buildMatchNotificationMessage に渡す
└── lib/line/
    └── messages.ts                # role パラメータ追加・ヘッダー/altText のロール対応

(既存ファイルの変更のみ。新規ファイル・DBマイグレーション不要)
```

**Structure Decision**: Option 2 相当（Next.js full-stack）。既存ディレクトリ構造を維持し、4ファイルへの局所的変更のみで実装できる。

## Complexity Tracking

> 違反なし — このセクションは空白のまま。
