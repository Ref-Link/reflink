# Implementation Plan: Pilot Launch Preparation

**Branch**: `005-pilot-launch-prep` | **Date**: 2026-06-06 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/005-pilot-launch-prep/spec.md`

## Summary

Pilot 公開に向けたブランディング設定・法的文書ページ追加を行う。具体的には: (1) OGP メタデータ・ファビコン・PWA アイコン設定を `layout.tsx` と `public/manifest.json` に集約、(2) 利用規約 `/terms` とプライバシーポリシー `/privacy` の静的ページを新規作成（認証不要）、(3) ログインページおよび全アプリフッターから両規約ページへのリンクを追加する。DB 変更・新規ライブラリなし。

## Technical Context

**Language/Version**: TypeScript 5 / React 18  
**Primary Dependencies**: Next.js 14.2 (App Router), Tailwind CSS 3.4, Supabase SSR  
**Storage**: N/A — DB 変更なし（静的コンテンツ）  
**Testing**: テストランナー未設定。手動ブラウザ検証（Chrome DevTools + iOS Safari 実機）  
**Target Platform**: iOS Safari / Android Chrome（最新版）、LINE 内ブラウザ対応  
**Project Type**: Web application (Next.js PWA, mono-project)  
**Performance Goals**: 法的ページは 3 秒以内に表示（SC-002）— 静的生成により自然に達成  
**Constraints**: 追加ライブラリ禁止; `public/` ディレクトリが存在しないため新規作成; アイコン・OGP 画像はデザインアセット未確定のためプレースホルダーを使用  
**Scale/Scope**: Pilot 規模 30 ユーザー; 変更対象ファイル 5 件、新規ファイル 7 件

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 原則 | 評価 | 判定 |
|------|------|------|
| I. 信頼インフラ第一 | 法的文書の開示とアプリブランディングはサービスへの信頼感を直接強化する。Pilot 参加者（審判・運営者）への第一印象と、個人情報保護の透明性を担保する。 | ✅ PASS |
| II. 既存文化の尊重 | LINE・電話・対面ワークフローへの変更なし。既存ページのレイアウト変更はフッターリンク追加のみ。 | ✅ PASS |
| III. 最小限のデジタル化 | 静的ページ 2 件とメタデータ設定のみ。DB 不使用。複雑性ゼロ。 | ✅ PASS |
| IV. 半クローズドコミュニティ | `/terms` と `/privacy` を公開パスにするのは法的義務のための例外。個人情報・コミュニティ情報は開示しない。アクセスモデルの変更なし。 | ✅ PASS |
| V. 段階的な信頼可視化 | 評価・スコア機能なし。 | ✅ PASS |

**Gate 結果**: 違反なし。研究フェーズへ進む。

**Post-Phase 1 Re-check**: 設計を通じて Constitution 違反なし。DB 変更・外部サービス追加なし。

## Project Structure

### Documentation (this feature)

```text
specs/005-pilot-launch-prep/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── public-pages.md  # Phase 1 output — 公開ページ・PWA・OGP 契約
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
public/                                 # 新規作成
├── manifest.json                       # 新規: PWA マニフェスト
├── icon-32.png                         # 新規: ブラウザアイコン 32×32（プレースホルダー）
├── icon-192.png                        # 新規: PWA アイコン 192×192（プレースホルダー）
├── icon-512.png                        # 新規: PWA アイコン 512×512（プレースホルダー）
└── og-image.png                        # 新規: OGP 画像 1200×630（プレースホルダー）

src/
├── app/
│   ├── layout.tsx                      # 更新: metadata（title・OGP・icons・manifest）
│   ├── favicon.ico                     # 既存（差し替え推奨）
│   ├── (auth)/
│   │   └── login/page.tsx              # 更新: 免責テキストを利用規約・PP リンク付きに変更
│   ├── (referee)/
│   │   └── layout.tsx                  # 更新: フッターリンク追加（pb-24 で固定ナビ回避）
│   ├── admin/
│   │   └── layout.tsx                  # 更新: フッターリンク追加
│   ├── terms/
│   │   └── page.tsx                    # 新規: 利用規約ページ（静的コンテンツ）
│   └── privacy/
│       └── page.tsx                    # 新規: プライバシーポリシーページ（静的コンテンツ）
└── middleware.ts                        # 更新: publicPaths に /terms・/privacy 追加
```

**Structure Decision**: 既存の single Next.js project 構造を維持。`public/` ディレクトリを新規作成し、アイコン・manifest・OGP 画像を集約。法的ページは App Router の `src/app/terms/` および `src/app/privacy/` 以下に追加。

## Complexity Tracking

*Constitution Check に違反なし。このセクションは空のまま。*

---

*Phase 0/1 詳細は [research.md](./research.md), [data-model.md](./data-model.md), [contracts/public-pages.md](./contracts/public-pages.md), [quickstart.md](./quickstart.md) を参照。*
