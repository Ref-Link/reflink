-- Development seed data
-- Run with: supabase db seed
-- Requires: supabase/migrations to have been applied

-- Note: auth.users rows are created by Supabase Auth.
-- In local dev, create users via the Supabase dashboard or supabase auth commands,
-- then run this seed to populate public.users and related tables.
-- The UUIDs below are placeholders for local development.

DO $$
DECLARE
  v_manager_id uuid := '00000000-0000-0000-0000-000000000001';
  v_organizer_id uuid := '00000000-0000-0000-0000-000000000002';
  v_referee1_id uuid := '00000000-0000-0000-0000-000000000003';
  v_referee2_id uuid := '00000000-0000-0000-0000-000000000004';
  v_referee3_id uuid := '00000000-0000-0000-0000-000000000005';
  v_community_id uuid := '10000000-0000-0000-0000-000000000001';
BEGIN

-- Insert auth.users stubs for local testing
INSERT INTO auth.users (id, email, created_at, updated_at, email_confirmed_at, raw_app_meta_data, raw_user_meta_data)
VALUES
  (v_manager_id, 'manager@example.com', now(), now(), now(), '{"provider":"google"}', '{"full_name":"田中 管理者"}'),
  (v_organizer_id, 'organizer@example.com', now(), now(), now(), '{"provider":"google"}', '{"full_name":"佐藤 運営者"}'),
  (v_referee1_id, 'referee1@example.com', now(), now(), now(), '{"provider":"line"}', '{"full_name":"鈴木 太郎"}'),
  (v_referee2_id, 'referee2@example.com', now(), now(), now(), '{"provider":"line"}', '{"full_name":"山田 次郎"}'),
  (v_referee3_id, 'referee3@example.com', now(), now(), now(), '{"provider":"google"}', '{"full_name":"中村 三郎"}')
ON CONFLICT (id) DO NOTHING;

-- Users
INSERT INTO public.users (id, display_name, real_name, license_level, role_type, age_groups, region, experience_years)
VALUES
  (v_manager_id, '田中さん', '田中 管理者', '1級', ARRAY['referee', 'assistant_referee'], ARRAY['U15', 'U18', 'Senior'], '愛知西部', 15),
  (v_organizer_id, '佐藤さん', '佐藤 運営者', '2級', ARRAY['organizer'], ARRAY['U15', 'U18'], '愛知西部', 10),
  (v_referee1_id, '鈴木さん', '鈴木 太郎', '3級', ARRAY['referee'], ARRAY['U12', 'U15'], '愛知西部', 5),
  (v_referee2_id, '山田さん', '山田 次郎', '2級', ARRAY['assistant_referee'], ARRAY['U15', 'U18'], '愛知西部', 8),
  (v_referee3_id, '中村さん', '中村 三郎', '4級', ARRAY['referee', 'assistant_referee'], ARRAY['U12'], '愛知西部', 2)
ON CONFLICT (id) DO NOTHING;

-- Regional community
INSERT INTO public.regional_communities (id, name, region, description, created_by)
VALUES (
  v_community_id,
  '愛知西部U15リーグ',
  '愛知西部',
  '愛知県西部地区のU15年代を中心とした審判コミュニティ',
  v_manager_id
) ON CONFLICT (id) DO NOTHING;

-- Community memberships
INSERT INTO public.community_members (community_id, user_id, role, status, approved_by, approved_at)
VALUES
  (v_community_id, v_manager_id, 'manager', 'approved', v_manager_id, now()),
  (v_community_id, v_organizer_id, 'organizer', 'approved', v_manager_id, now()),
  (v_community_id, v_referee1_id, 'referee', 'approved', v_manager_id, now()),
  (v_community_id, v_referee2_id, 'referee', 'approved', v_manager_id, now()),
  (v_community_id, v_referee3_id, 'referee', 'approved', v_manager_id, now())
ON CONFLICT (community_id, user_id) DO NOTHING;

-- Sample availabilities
INSERT INTO public.availabilities (user_id, date, start_time, end_time, age_groups)
VALUES
  (v_referee1_id, CURRENT_DATE + 7, '09:00', '18:00', ARRAY['U12', 'U15']),
  (v_referee1_id, CURRENT_DATE + 14, '09:00', '18:00', ARRAY['U12', 'U15']),
  (v_referee2_id, CURRENT_DATE + 7, '10:00', '17:00', ARRAY['U15', 'U18']),
  (v_referee3_id, CURRENT_DATE + 7, NULL, NULL, ARRAY['U12'])
ON CONFLICT DO NOTHING;

END $$;
