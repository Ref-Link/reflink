-- Explicitly grant table-level privileges to Supabase roles.
--
-- supabase start (local) applies these automatically via default privileges,
-- but supabase db push to a remote project only runs migration files.
-- Without explicit GRANTs, RLS policy evaluation that joins another table
-- (e.g. "users: community members can view public profile" joining community_members)
-- fails with "permission denied for table X" before RLS is even checked.

GRANT SELECT, INSERT, UPDATE        ON public.users                TO authenticated;
GRANT SELECT                        ON public.users                TO anon;
GRANT SELECT, INSERT, UPDATE        ON public.community_members    TO authenticated;
GRANT SELECT, INSERT                ON public.regional_communities TO authenticated;
GRANT SELECT, INSERT, UPDATE        ON public.availabilities       TO authenticated;
GRANT SELECT, INSERT, UPDATE        ON public.matches              TO authenticated;
GRANT SELECT, INSERT, UPDATE        ON public.assignments          TO authenticated;

GRANT ALL ON ALL TABLES    IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

GRANT EXECUTE ON FUNCTION public.is_community_manager(uuid, uuid)         TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_community_approved_member(uuid, uuid) TO authenticated;
