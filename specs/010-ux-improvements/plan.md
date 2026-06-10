# Implementation Plan: UX改善（審判・運営者）

**Branch**: `010-ux-improvements` | **Date**: 2026-06-10 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `/specs/010-ux-improvements/spec.md`

## Summary

6つのUX改善を実施する：審判の空き日程フォームにプロフィール年代を自動プリセット、備考欄削除、担当履歴のタップ展開、試合一覧・詳細への確定人数表示、アサイン確定時の試合ステータス自動更新、審判候補・メンバー一覧のタップ展開。すべてフロントエンド変更とAPI拡張のみで実現でき、DBスキーマ変更は不要。

## Technical Context

**Language/Version**: TypeScript / Next.js 14 (App Router)  
**Primary Dependencies**: Next.js, Supabase JS SDK, Tailwind CSS, LINE Messaging API  
**Storage**: Supabase PostgreSQL — no schema changes; SELECT field expansion + server-side aggregation only  
**Testing**: No automated test framework in project; manual browser testing per acceptance scenario  
**Target Platform**: Mobile-first PWA (iOS Safari / Android Chrome) + desktop admin  
**Project Type**: web-service (Next.js SSR + client components + API routes)  
**Performance Goals**: UI interaction < 200ms; accordion open/close must feel instant  
**Constraints**: No DB migrations; backward-compatible API changes only (additive fields); real_name/phone never shown in profile expansions  
**Scale/Scope**: 20–30 referees per community, up to ~50 matches per community

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Evaluation | Status |
|-----------|------------|--------|
| I. 信頼インフラ第一 | 確定人数表示・自動ステータス更新・プロフィール詳細展開はいずれも信頼情報の可視化を高め、スループット最大化とは無関係 | ✅ PASS |
| II. 既存文化の尊重 | 既存のLINE通知・既存ワークフロー変更なし。フォームUX改善と情報追加のみ | ✅ PASS |
| III. 最小限のデジタル化 | 備考欄削除・プリセット・タップ展開はすべて操作ステップの削減。新画面遷移なし | ✅ PASS |
| IV. 半クローズドコミュニティ | FR-010でreal_name・電話番号を展開表示から明示除外。コミュニティ内のみ | ✅ PASS |
| V. 段階的な信頼可視化 | ライセンス・年代・役割・移動範囲は客観的な検証可能データ。スコア・評価は不使用 | ✅ PASS |

**GATE RESULT: PASS** — 違反なし。Complexity Tracking 不要。

## Project Structure

### Documentation (this feature)

```text
specs/010-ux-improvements/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   ├── api-matches-get.md
│   ├── api-assignments-get.md
│   ├── api-communities-members-get.md
│   └── api-assignments-confirm-patch.md
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── (referee)/
│   │   ├── availability/page.tsx          # FR-001: fetch profile → pass age_groups to calendar
│   │   └── history/page.tsx               # (no change; component handles display)
│   └── admin/
│       ├── matches/
│       │   ├── page.tsx                   # FR-004: display confirmed_referees/assistants
│       │   └── [id]/page.tsx              # FR-005: display confirmed counts in detail dl
│       └── members/
│           └── AdminMembersClient.tsx     # FR-008: expand member profile detail
├── components/
│   ├── availability/
│   │   └── AvailabilityCalendar.tsx       # FR-001: defaultAgeGroups prop; FR-002: remove notes UI
│   ├── history/
│   │   └── AssignmentHistory.tsx          # FR-003: accordion expand with detail fields
│   ├── matches/
│   │   └── CandidateList.tsx              # FR-007: accordion tap-to-expand profile detail
│   └── members/
│       └── ApprovalList.tsx               # FR-008: accordion + expanded user profile fields
└── app/
    └── api/
        ├── assignments/route.ts           # FR-003: add matches.referees_needed/assistants_needed/compensation/notes
        ├── matches/route.ts               # FR-004: enrich response with confirmed_referees/assistants
        ├── matches/[id]/route.ts          # FR-005: same enrichment for single match
        ├── matches/[id]/assignments/
        │   └── [assignmentId]/confirm/route.ts  # FR-006: auto-status to 'filled'
        └── communities/[id]/members/route.ts    # FR-008: add age_groups/role_type/travel_range_km
```

**Structure Decision**: Single Next.js project (Option 1 equivalent). No new directories.

## Complexity Tracking

> **No constitution violations — table intentionally empty.**
