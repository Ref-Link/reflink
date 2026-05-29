# Implementation Plan: RefLink MVP

**Branch**: `001-mvp-implementation` | **Date**: 2026-05-29 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `specs/001-mvp-implementation/spec.md`

---

## Summary

地域サッカーの審判と運営者をつなぐ、信頼ベースのマッチングプラットフォームの MVP。審判はプロフィール・空き日程を登録し、LINE でワンタップ回答。運営者は Web 管理画面で試合作成・候補検索・一括通知・アサイン確定を行う。地域管理者がコミュニティ承認を管理し、半クローズドな信頼環境を維持する。

**技術アプローチ**: Next.js 14 (App Router, PWA) + Supabase (PostgreSQL, Auth, Realtime) + LINE Messaging API。詳細は [research.md](./research.md) を参照。

---

## Technical Context

**Language/Version**: TypeScript 5.x / Node.js 20 LTS  
**Primary Dependencies**: Next.js 14 (App Router), @supabase/ssr v0.x, @line/bot-sdk v9.x, Tailwind CSS  
**Storage**: PostgreSQL via Supabase（RLS によるアクセス制御）  
**Testing**: Jest + React Testing Library（unit）, Playwright（E2E）  
**Target Platform**: Web (mobile-first PWA) + LINE Messaging チャネル  
**Project Type**: Web application（Next.js fullstack + LINE webhook）  
**Performance Goals**: 審判フロー < 5分完了、運営者フロー < 3分完了、LINE 通知 24/7 稼働  
**Constraints**: 決済なし、評点なし、単一地域、RLS によるデータ隔離  
**Scale/Scope**: MVP: 1地域・審判 20〜30名・数クラブ・1大会運営

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

### Pre-Phase 0 Check

| Principle | Status | Verification |
|-----------|--------|--------------|
| I. 信頼インフラ第一 | ✅ PASS | 設計の中心が「信頼できる接続の増加」。審判候補は担当履歴・継続参加で選ぶ。評点なし |
| II. 既存文化の尊重 | ✅ PASS | LINE 通知・ワンタップ回答。新チャネル移行なし。既存調整役が管理者ロールに収まる |
| III. 最小限のデジタル化 | ✅ PASS | 審判側は LINE のみ（LIFF なし）。運営側は最小限の Web 管理画面 |
| IV. 半クローズドコミュニティ | ✅ PASS | 招待/承認制。公開検索なし。DM なし。実名はアサイン確定後のみ開示 |
| V. 段階的な信頼可視化 | ✅ PASS | 評点なし。担当履歴・継続参加・紹介関係のみ可視化 |

### Post-Phase 1 Check

| Principle | Status | Verification |
|-----------|--------|--------------|
| I. 信頼インフラ第一 | ✅ PASS | `assignments` の状態遷移が信頼フロー（通知→承諾→確定）を反映 |
| II. 既存文化の尊重 | ✅ PASS | LINE Flex Message + Postback で既存 LINE 体験内に収まる |
| III. 最小限のデジタル化 | ✅ PASS | API Routes は最小限。Supabase Realtime で余分なポーリング不要 |
| IV. 半クローズドコミュニティ | ✅ PASS | RLS ポリシーで `approved` メンバーのみデータにアクセス可能。実名カラムは制限付き |
| V. 段階的な信頼可視化 | ✅ PASS | `data-model.md` の信頼可視化クエリは履歴ベース。`ratings` テーブルなし |

**GATE RESULT**: すべてのゲートを通過。実装を進めてよい。

---

## Project Structure

### Documentation (this feature)

```text
specs/001-mvp-implementation/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   ├── line-webhook.md  # LINE Webhook & Push Message contract
│   └── api-routes.md    # Internal API routes contract
└── tasks.md             # Phase 2 output (/speckit-tasks で生成)
```

### Source Code (repository root)

```text
reflink/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # ログイン・OAuth コールバック
│   │   ├── (referee)/          # 審判向けページ
│   │   │   ├── profile/        # プロフィール登録・編集
│   │   │   ├── availability/   # 空き日程管理
│   │   │   └── history/        # 担当履歴
│   │   ├── (admin)/            # 運営者・管理者向けページ
│   │   │   ├── matches/        # 試合管理・候補一覧
│   │   │   └── members/        # メンバー承認（管理者のみ）
│   │   └── api/
│   │       ├── auth/callback/  # OAuth コールバック
│   │       ├── availability/   # 空き日程 CRUD
│   │       ├── matches/        # 試合管理・候補検索
│   │       ├── assignments/    # 通知送信・確定
│   │       ├── communities/    # コミュニティ参加申請・承認
│   │       └── webhook/line/   # LINE Postback 受信
│   ├── components/             # 共通 UI コンポーネント
│   ├── lib/
│   │   ├── supabase/           # server / client Supabase インスタンス
│   │   └── line/               # LINE SDK ラッパー (send / verify)
│   └── types/                  # DB 型定義・ドメイン型
├── supabase/
│   ├── migrations/             # DB マイグレーション
│   └── seed.sql                # 開発用シード
└── tests/
    ├── unit/
    └── integration/
```

**Structure Decision**: Next.js fullstack 単一プロジェクト。Supabase のマイグレーションは `supabase/` ディレクトリで管理。モノレポ構成は MVP では不要（Principle III: Minimal Digitization）。

---

## Complexity Tracking

Constitution Check がすべて通過したため、ジャスティフィケーションは不要。
