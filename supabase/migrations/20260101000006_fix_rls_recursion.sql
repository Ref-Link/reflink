-- Fix infinite recursion in community_members RLS policies.
--
-- The policies "manager read", "approved members read", and "manager update"
-- each subquery the community_members table itself, causing PostgreSQL to
-- re-evaluate those same policies infinitely.
--
-- Solution: SECURITY DEFINER functions bypass RLS when they execute, breaking
-- the recursive loop.

-- Helper: check if a user is an approved manager of a community (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_community_manager(
  p_community_id uuid,
  p_user_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.community_members
    WHERE community_id = p_community_id
      AND user_id = p_user_id
      AND role = 'manager'
      AND status = 'approved'
  );
$$;

-- Helper: check if a user is an approved member of a community (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_community_approved_member(
  p_community_id uuid,
  p_user_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.community_members
    WHERE community_id = p_community_id
      AND user_id = p_user_id
      AND status = 'approved'
  );
$$;

-- Drop the recursive policies
DROP POLICY IF EXISTS "community_members: manager read" ON public.community_members;
DROP POLICY IF EXISTS "community_members: approved members read" ON public.community_members;
DROP POLICY IF EXISTS "community_members: manager update" ON public.community_members;

-- Recreate using SECURITY DEFINER functions (no recursion)
CREATE POLICY "community_members: manager read" ON public.community_members
  FOR SELECT USING (is_community_manager(community_id, auth.uid()));

CREATE POLICY "community_members: approved members read" ON public.community_members
  FOR SELECT USING (
    status = 'approved'
    AND is_community_approved_member(community_id, auth.uid())
  );

CREATE POLICY "community_members: manager update" ON public.community_members
  FOR UPDATE USING (is_community_manager(community_id, auth.uid()));

-- The users policies that join community_members also trigger the recursion.
-- Recreate them using the same SECURITY DEFINER helpers.
DROP POLICY IF EXISTS "users: community members can view public profile" ON public.users;

CREATE POLICY "users: community members can view public profile" ON public.users
  FOR SELECT USING (
    -- The current user is an approved member of some community that also
    -- contains the target user as an approved member.
    EXISTS (
      SELECT 1
      FROM public.community_members cm1
      WHERE cm1.user_id = auth.uid()
        AND cm1.status = 'approved'
        AND is_community_approved_member(cm1.community_id, users.id)
    )
  );
