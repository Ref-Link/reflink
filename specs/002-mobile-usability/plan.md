# Implementation Plan: スマートフォン対応ユーザビリティ改善

**Branch**: `002-mobile-usability` | **Date**: 2026-06-05 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/002-mobile-usability/spec.md`

## Summary

スマートフォン（375px以上、最小320px）でのレイアウト崩れ・タップ操作不良・ダーク/ライトテーマ表示乱れを修正する。Tailwindの`dark:`バリアントを全コンポーネントに追加しWCAG AA基準のコントラストを確保するとともに、全インタラクティブ要素のタップ領域を44px以上に統一し、管理画面のレスポンシブ対応を補完する。新しいDB変更・依存ライブラリ追加は一切なく、既存Tailwind/Next.jsの範囲内で完結する。

## Technical Context

**Language/Version**: TypeScript 5 / React 18  
**Primary Dependencies**: Next.js 14.2 (App Router), Tailwind CSS 3.4, Supabase SSR  
**Storage**: N/A — DB変更なし  
**Testing**: テストランナー未設定。手動ブラウザ検証（375px / 320px幅エミュレーション、Chromeデベロッパーツールprefers-color-scheme切り替え）  
**Target Platform**: iOS Safari / Android Chrome (最新版); 最小サポート幅320px  
**Project Type**: Web application (Next.js PWA, monorepo)  
**Performance Goals**: N/A — レイアウト修正のみ  
**Constraints**: Tailwindのみ（追加CSSライブラリ禁止）; 既存コンポーネント構造維持; 新規ライブラリ不採用  
**Scale/Scope**: 変更対象ファイル約15件（コンポーネント8件、ページ6件、設定1件）

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 原則 | 評価 | 判定 |
|------|------|------|
| I. 信頼インフラ第一 | モバイルでの基本操作可能性を回復する。審判はLINEからアクセスするためモバイル使用が前提であり、レイアウト崩れは機能的な利用不能を意味する。本改善は信頼インフラとしての最低品質を担保する。 | ✅ PASS |
| II. 既存文化の尊重 | UIレイアウト修正のみ。ワークフロー・通知チャネル・操作手順に変更なし。 | ✅ PASS |
| III. 最小限のデジタル化 | 複雑性を増さず、既存UIの視認性と操作性を改善する。新機能追加なし。 | ✅ PASS |
| IV. 半クローズドコミュニティ | アクセス制御・認証・メンバーシップモデルに変更なし。 | ✅ PASS |
| V. 段階的な信頼可視化 | 評価・スコア機能なし。 | ✅ PASS |

**Gate結果**: 違反なし。研究フェーズへ進む。

## Project Structure

### Documentation (this feature)

```text
specs/002-mobile-usability/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── design-tokens.md # Phase 1 output — dark/light色token定義
└── tasks.md             # Phase 2 output (/speckit-tasks command)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── layout.tsx                          # viewport meta確認・overflow-x制御
│   ├── globals.css                         # body overflow-x: hidden 追加
│   ├── (auth)/login/page.tsx               # ダークモード対応
│   ├── (referee)/layout.tsx                # ボトムナビ safe-area-inset 追加
│   ├── admin/layout.tsx                    # ダークモード対応・コンテンツpadding追加
│   └── admin/matches/
│       ├── page.tsx                        # ボタンタップ領域・ダークモード
│       ├── [id]/page.tsx                   # ボタンタップ領域・ダークモード
│       └── [id]/assignments/page.tsx       # stats grid cols-2/cols-4 レスポンシブ・ダークモード
└── components/
    ├── availability/AvailabilityCalendar.tsx  # age-groupボタン44px化・ダークモード
    ├── history/AssignmentHistory.tsx          # ダークモード対応
    ├── matches/
    │   ├── CandidateList.tsx               # ダークモード対応
    │   └── MatchForm.tsx                   # 入力44px化・ダークモード
    ├── members/ApprovalList.tsx            # 承認/却下ボタン44px化・ダークモード
    └── profile/ProfileForm.tsx             # 入力・ボタン44px化・ダークモード

tailwind.config.ts                          # darkMode: 'media' 追加
```

**Structure Decision**: 既存のmonorepo構造を維持。新規ファイル・ディレクトリ作成なし（ドキュメント除く）。

## Complexity Tracking

*Constitution Check に違反なし。このセクションは空のまま。*

---

*Phase 0/1 詳細は [research.md](./research.md), [data-model.md](./data-model.md), [contracts/design-tokens.md](./contracts/design-tokens.md), [quickstart.md](./quickstart.md) を参照。*
