# Data Model: プロフィール選択項目のJFA準拠化

**Branch**: `009-profile-jfa-options` | **Phase**: 1

## 変更対象エンティティ

### users

既存テーブル。変更箇所のみ記載。

| カラム | 旧許容値 | 新許容値 | 変更内容 |
|--------|---------|---------|---------|
| `license_level` | `'S級', '1級', '2級', '3級', '4級'` | `'1級', '2級', '3級', '4級'` | CHECK 制約を更新。既存 `'S級'` 値を `'4級'` へマイグレーション |
| `age_groups` | `{'U12', 'U15', 'U18', 'Senior'}` の組み合わせ | `{'第4種(U-12)', '第3種(U-15)', '第2種(U-18)', '第1種(大学・社会人)'}` の組み合わせ | 既存データを一括変換 |

### availabilities

| カラム | 変更内容 |
|--------|---------|
| `age_groups` | 既存データを users と同様の値マッピングで変換 |

### matches

| カラム | 変更内容 |
|--------|---------|
| `age_group` | 既存データを同様のマッピングで変換（CHECK 制約なし） |

---

## マイグレーション SQL（概要）

```sql
-- 1. CHECK制約の更新（S級を除外）
ALTER TABLE public.users DROP CONSTRAINT users_license_level_check;
ALTER TABLE public.users ADD CONSTRAINT users_license_level_check
  CHECK (license_level IN ('1級', '2級', '3級', '4級'));

-- 2. license_level の S級 → 4級
UPDATE public.users SET license_level = '4級' WHERE license_level = 'S級';

-- 3. users.age_groups の一括変換
UPDATE public.users SET age_groups = array_replace(age_groups, 'U12',   '第4種(U-12)');
UPDATE public.users SET age_groups = array_replace(age_groups, 'U15',   '第3種(U-15)');
UPDATE public.users SET age_groups = array_replace(age_groups, 'U18',   '第2種(U-18)');
UPDATE public.users SET age_groups = array_replace(age_groups, 'Senior','第1種(大学・社会人)');

-- 4. availabilities.age_groups の一括変換（同様）
-- 5. matches.age_group の一括変換（同様）
```

---

## TypeScript 型定義（変更後）

```typescript
// src/types/domain.ts

// JFA審判ライセンス（1〜4級）
export type LicenseLevel = '1級' | '2級' | '3級' | '4級'

// JFA登録種別（第4種〜第1種）
export type AgeGroup = '第4種(U-12)' | '第3種(U-15)' | '第2種(U-18)' | '第1種(大学・社会人)'
```

---

## フロントエンド定数（変更後）

```typescript
const LICENSE_LEVELS: LicenseLevel[] = ['1級', '2級', '3級', '4級']

const AGE_GROUPS: AgeGroup[] = [
  '第4種(U-12)',
  '第3種(U-15)',
  '第2種(U-18)',
  '第1種(大学・社会人)',
]
```

---

## 変更対象ソースファイル一覧

| ファイル | 変更内容 |
|---------|---------|
| `src/types/domain.ts` | `LicenseLevel`・`AgeGroup` 型定義を更新 |
| `src/components/profile/ProfileForm.tsx` | `LICENSE_LEVELS`・`AGE_GROUPS` 定数を更新 |
| `src/components/matches/MatchForm.tsx` | `AGE_GROUPS` 定数を更新 |
| `src/components/matches/CandidateList.tsx` | `LICENSE_ORDER` から `'S級': 0` を除去、残り繰り上げ |
| `src/components/history/AssignmentHistory.tsx` | `AGE_GROUP_COLORS` のキーを新値に更新 |
| `src/components/availability/AvailabilityCalendar.tsx` | `AGE_GROUPS` 定数を更新 |
| `src/app/(referee)/history/page.tsx` | `AGE_GROUPS` 定数を更新 |
| `src/app/api/auth/line/callback/route.ts` | 新規ユーザーのデフォルト `age_groups` を `['第4種(U-12)']` に更新 |
| `supabase/seed.sql` | 開発シードデータの年代値・ライセンス値を更新 |
| `supabase/migrations/20260609000001_update_jfa_profile_options.sql` | 新規マイグレーション |
