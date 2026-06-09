# Implementation Plan: プロフィール選択項目のJFA準拠化

**Branch**: `009-profile-jfa-options` | **Date**: 2026-06-09 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `specs/009-profile-jfa-options/spec.md`

## Summary

審判ライセンス選択肢からJFA非公式の「S級」を除外し、対応年代をJFA登録種別（第4種〜第1種）へ統一する。DB CHECK制約の更新・既存データのマイグレーション・全フロントエンド定数の更新を含む。

## Technical Context

**Language/Version**: TypeScript / Next.js 14 (App Router)  
**Primary Dependencies**: React 18, Supabase JS Client, Tailwind CSS  
**Storage**: Supabase PostgreSQL  
**Testing**: 手動テスト（プロジェクトに自動テストスイートなし）  
**Target Platform**: Web PWA（モバイルファースト）  
**Project Type**: web-service  
**Performance Goals**: 標準的な Web アプリ（特別な制約なし）  
**Constraints**: Supabase の CHECK 制約変更は既存データを先にマイグレーションする必要あり  
**Scale/Scope**: パイロット規模（20〜30 審判員）

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. 信頼インフラ第一 | ✅ Pass | 正確なJFA用語を使用することで、ライセンス・年代という信頼シグナルの精度が上がる |
| II. 既存文化の尊重 | ✅ Pass | ワークフロー変更なし。データの正規化のみ |
| III. 最小限のデジタル化 | ✅ Pass | UI 複雑性の増加なし。選択肢数は現行と同等（年代は4→4） |
| IV. 半クローズドコミュニティ | ✅ N/A | アクセスモデルの変更なし |
| V. 段階的な信頼可視化 | ✅ Pass | ライセンス・年代は客観的な信頼シグナル。JFA正規値にすることで信頼性が向上 |

**Post-Phase 1 re-check**: 全原則継続 Pass。新規テーブル・エンドポイント・外部依存なし。

## Project Structure

### Documentation (this feature)

```text
specs/009-profile-jfa-options/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit-tasks command)
```

### Source Code (repository root)

```text
src/
├── types/
│   └── domain.ts                          ← LicenseLevel / AgeGroup 型更新
├── components/
│   ├── profile/
│   │   └── ProfileForm.tsx                ← LICENSE_LEVELS / AGE_GROUPS 定数更新
│   ├── matches/
│   │   ├── MatchForm.tsx                  ← AGE_GROUPS 定数更新
│   │   └── CandidateList.tsx              ← LICENSE_ORDER から S級 除去
│   ├── history/
│   │   └── AssignmentHistory.tsx          ← AGE_GROUP_COLORS キー更新
│   └── availability/
│       └── AvailabilityCalendar.tsx       ← AGE_GROUPS 定数更新
└── app/
    ├── (referee)/history/
    │   └── page.tsx                       ← AGE_GROUPS 定数更新
    └── api/auth/line/callback/
        └── route.ts                       ← デフォルト age_groups 更新

supabase/
├── migrations/
│   └── 20260609000001_update_jfa_profile_options.sql  ← 新規
└── seed.sql                               ← 開発データ更新
```

**Structure Decision**: 既存 Next.js 単一プロジェクト構造。新規ファイルは DB マイグレーションのみ。

## Implementation Tasks (overview)

| # | 作業内容 | 対象ファイル | 優先度 |
|---|---------|------------|--------|
| 1 | DBマイグレーション作成 | `supabase/migrations/20260609000001_*.sql` | P1 |
| 2 | TypeScript 型定義更新 | `src/types/domain.ts` | P1 |
| 3 | ProfileForm 定数更新 | `src/components/profile/ProfileForm.tsx` | P1 |
| 4 | MatchForm 定数更新 | `src/components/matches/MatchForm.tsx` | P1 |
| 5 | CandidateList LICENSE_ORDER 更新 | `src/components/matches/CandidateList.tsx` | P1 |
| 6 | AssignmentHistory カラーマップ更新 | `src/components/history/AssignmentHistory.tsx` | P1 |
| 7 | AvailabilityCalendar 定数更新 | `src/components/availability/AvailabilityCalendar.tsx` | P1 |
| 8 | history page 定数更新 | `src/app/(referee)/history/page.tsx` | P1 |
| 9 | LINE callback デフォルト値更新 | `src/app/api/auth/line/callback/route.ts` | P1 |
| 10 | シードデータ更新 | `supabase/seed.sql` | P2 |

*詳細タスクは `/speckit-tasks` で生成*
