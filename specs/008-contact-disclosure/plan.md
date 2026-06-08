# Implementation Plan: アサイン確定後の連絡先情報開示

**Branch**: `008-contact-disclosure` | **Date**: 2026-06-08 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/008-contact-disclosure/spec.md`

## Summary

`users` テーブルに `phone_number text` カラムを追加し、アサインが `confirmed` 状態のときのみ、運営者⇔審判間で相互に電話番号を開示する。運営者は確定前の電話番号未登録をAPIレベルでブロックされ、審判はLINE参加回答時にフォローアップで登録を促される。開示はアサイン状況画面（運営者）と担当履歴画面（審判）にて `tel:` / `sms:` 2ボタンつきで表示する。電話番号は保存時に数字のみへ正規化し、表示時にハイフン補完する。

## Technical Context

**Language/Version**: TypeScript / Next.js 14 (App Router)  
**Primary Dependencies**: Supabase JS (`@supabase/supabase-js`), LINE Messaging API (`@line/bot-sdk`)  
**Storage**: PostgreSQL via Supabase — `phone_number text` を `users` テーブルに追加  
**Testing**: TypeScript type-check (`tsc --noEmit`); 自動テストスイートなし  
**Target Platform**: PWA (モバイルファースト — iOS Safari / Android Chrome; `tel:`/`sms:` はネイティブデバイス必須)  
**Project Type**: Web application (Next.js full-stack, single repo)  
**Performance Goals**: 標準 Vercel Edge/Node レスポンスタイム。特別なスループット要件なし  
**Constraints**: `tel:`/`sms:` プロトコルはモバイルのみ動作 (PCでは無動作許容)。電話番号の取得は必ずサーバーサイドAPI経由 (SC-004 準拠)  
**Scale/Scope**: パイロット (審判20〜30名、クラブ数件); `users` テーブルへの単一カラム追加  

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. 信頼インフラ第一 | ✅ PASS | 確定後のみ電話番号を開示 — 当日緊急連絡の保証であり信頼インフラの中核 |
| II. 既存文化の尊重 | ✅ PASS | `tel:` / `sms:` でネイティブアプリを起動; LINE フォローアップで既存チャネルを補完 |
| III. 最小限のデジタル化 | ✅ PASS | 審判側: プロフィールに1フィールド追加 + LINEリマインド。管理側: 既存画面にインライン表示 |
| IV. 半クローズドコミュニティ | ✅ PASS | 開示は確定ペア（運営者↔審判）の1対1に限定; 審判同士・コミュニティ全体への露出なし |
| V. 段階的な信頼可視化 | ✅ PASS | 電話番号は客観的緊急連絡先情報; 評価・スコア要素なし |
| Tech Stack | ✅ PASS | Next.js + Supabase + LINE Messaging API — すべて憲法内 |

**違反なし。Complexity Tracking 不要。**

**Post-Design Re-check (Phase 1 後)**: 同上。RLS方針（サーバーサイドAPIで電話番号をフィルタリング）がIV原則に適合していることを確認済み。

## Project Structure

### Documentation (this feature)

```text
specs/008-contact-disclosure/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── contracts/
│   ├── confirm-assignment.md   # Phase 1 output
│   └── profile.md              # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit-tasks)
```

### Source Code (repository root)

```text
supabase/migrations/
└── 20260608000001_add_phone_number.sql   # NEW: phone_number column + RLS update

src/
├── types/
│   └── database.ts          # phone_number をUserRow/Insert/Updateに追加
├── lib/
│   └── phone.ts             # NEW: normalize / validate / format utilities
├── app/
│   ├── api/
│   │   ├── profile/
│   │   │   └── route.ts     # phone_number フィールドを受け付け・正規化・保存
│   │   └── matches/[id]/assignments/[assignmentId]/confirm/
│   │       └── route.ts     # 確定前に運営者・審判の電話番号チェックを追加
│   ├── (referee)/
│   │   ├── profile/
│   │   │   └── page.tsx     # phone_number を ProfileForm に渡す
│   │   └── history/
│   │       └── page.tsx     # /api/assignments のレスポンス型を更新
│   └── admin/
│       └── matches/[id]/assignments/
│           └── page.tsx     # 確定フロー改修 + ContactInfo 表示
├── components/
│   ├── profile/
│   │   └── ProfileForm.tsx  # phone_number 入力フィールドを追加
│   ├── history/
│   │   └── AssignmentHistory.tsx  # 確定済み試合に運営者連絡先を表示
│   └── ui/
│       └── ContactInfo.tsx  # NEW: 電話番号 + 発信/SMSボタン
```

**Structure Decision**: Single Next.js project (Option 1)。新規トップレベルディレクトリ不要 — 既存モジュールの拡張のみ。
