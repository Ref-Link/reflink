# Implementation Plan: 審判UIへの担当タブ追加（募集・履歴サブタブ）

**Branch**: `012-referee-assignments-ui` | **Date**: 2026-06-10 | **Spec**: [spec.md](spec.md)

## Summary

ボトムナビの「担当履歴」タブを「担当」に統合し、「募集」と「履歴」のサブタブを提供する。審判はLINE通知に頼らずアプリから未回答の募集一覧を確認し、その場で参加・辞退を回答できる。バッジで未回答件数を通知し、既存の担当履歴機能はそのまま「履歴」サブタブに引き継ぐ。

## Technical Context

**Language/Version**: TypeScript 5 / Next.js 14.2 (App Router)  
**Primary Dependencies**: @supabase/ssr 0.10, @supabase/supabase-js 2.106, @line/bot-sdk 11, Tailwind CSS 3.4, React 18  
**Storage**: Supabase PostgreSQL（スキーマ変更なし）  
**Testing**: TypeScript型チェック + ESLint（自動テストフレームワークなし）  
**Target Platform**: Web PWA、モバイルファースト、Vercel  
**Project Type**: web-service (Next.js PWA)  
**Performance Goals**: 標準的なWebレスポンス。バッジカウントはページロード時取得  
**Constraints**: LINEが審判の主チャネル（置き換えない）。Principle III準拠で審判側UIの複雑さを最小化  
**Scale/Scope**: パイロット20〜30名規模

## Constitution Check

*GATE: Phase 0 研究前に確認。Phase 1 設計後に再確認済み。*

| Principle | 判定 | 根拠 |
|---|---|---|
| I. 信頼インフラ第一 | ✅ | 審判が募集状況を把握できることで、見落としによる信頼毀損を防ぐ |
| II. 既存文化の尊重 | ✅ | LINE通知・Webhookによる参加・辞退は変更なし。UIは代替手段として追加 |
| III. 最小限のデジタル化 | ✅ | 審判側のUIは既存タブへのサブタブ追加のみ。LINE Webhookと同じ「1タップ回答」パターンを維持 |
| IV. 半クローズドコミュニティ | ✅ | ログイン済みの審判本人の募集のみ表示。クロスユーザー参照なし |
| V. 段階的な信頼可視化 | ✅ | スコア・評価機能なし |

**Principle IIIについての補足**: Constitutionは「審判側: LINE通知+1タップ回答」と規定しているが、本機能はLINEの代替として同等のUXをアプリ内で提供するもので、LINEを排除しない。通知の見落としリスクを減らし信頼インフラを強化するため、Principle Iとの整合からも適切と判断する。

## Project Structure

### Documentation (this feature)

```text
specs/012-referee-assignments-ui/
├── plan.md           # This file
├── spec.md           # Feature specification
├── research.md       # Phase 0 output
├── data-model.md     # Phase 1 output
├── quickstart.md     # Phase 1 output
├── contracts/
│   └── api.md        # API contracts
└── tasks.md          # Phase 2 output (/speckit-tasks で生成)
```

### Source Code (変更・新規ファイル)

```text
src/
├── app/
│   ├── (referee)/
│   │   ├── assignments/
│   │   │   └── page.tsx              # [NEW] 担当ページ（募集・履歴サブタブ）
│   │   └── history/
│   │       └── page.tsx              # [MOD] /assignments?tab=history へリダイレクト
│   └── api/
│       └── assignments/
│           ├── pending/
│           │   └── route.ts          # [NEW] GET /api/assignments/pending
│           └── [id]/
│               └── respond/
│                   └── route.ts      # [NEW] PATCH /api/assignments/[id]/respond
└── components/
    ├── assignments/                  # [NEW dir]
    │   ├── AssignmentTabs.tsx        # [NEW] サブタブUI（募集/履歴切り替え）
    │   └── PendingList.tsx           # [NEW] 募集一覧（参加・辞退ボタン付き）
    └── nav/
        └── RefereeBottomNav.tsx      # [MOD] タブ名「担当」・href `/assignments`・バッジ
```

**変更なし（再利用）**:
- `src/components/history/AssignmentHistory.tsx` — 履歴サブタブでそのまま利用
- `src/app/api/assignments/route.ts` — 履歴タブで引き続き使用
- `src/app/api/webhook/line/route.ts` — 変更なし

**Structure Decision**: Next.js App Router の既存構成に従い、referee グループルート `(referee)/assignments/` に新ページを追加。コンポーネントは `src/components/assignments/` ディレクトリに新設。
