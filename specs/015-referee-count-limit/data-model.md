# Data Model: 審判確定人数の上限チェック

**Branch**: `015-referee-count-limit` | **Date**: 2026-06-11

## 既存エンティティ（変更なし）

本機能はDB変更を必要としない。既存フィールドのみを使用する。

### Match

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `id` | uuid | 試合ID |
| `referees_needed` | integer | 主審募集人数（確定上限値） |
| `assistants_needed` | integer | 副審募集人数（確定上限値） |
| `status` | text | `open` / `filled` / `cancelled` |

### Assignment

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `id` | uuid | アサインID |
| `match_id` | uuid | 紐づく試合 |
| `user_id` | uuid | 審判ユーザー |
| `role` | text | `referee`（主審）/ `assistant_referee`（副審） |
| `status` | text | `notified` / `accepted` / `declined` / `confirmed` / `cancelled` |
| `confirmed_at` | timestamptz | 確定日時（nullable） |

## ビジネスルール（新規追加）

- 同一試合・同一ロールの `status = 'confirmed'` なアサインの件数が `referees_needed`（主審の場合）または `assistants_needed`（副審の場合）以上であれば、新たな確定操作を拒否する
- 主審と副審のカウントは独立して管理する
- 既確定アサインが後からキャンセルされた場合、枠が再び空く（キャンセル処理は既存実装に依存）
