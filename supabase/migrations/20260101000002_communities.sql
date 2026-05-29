-- Regional communities table
CREATE TABLE public.regional_communities (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  region text NOT NULL,
  description text,
  created_by uuid NOT NULL REFERENCES public.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT regional_communities_pkey PRIMARY KEY (id)
);

CREATE INDEX idx_regional_communities_region ON public.regional_communities(region);

ALTER TABLE public.regional_communities ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can view communities (for join page)
CREATE POLICY "communities: authenticated read" ON public.regional_communities
  FOR SELECT TO authenticated USING (true);

-- Only managers within the community can insert (initial bootstrap: anyone can create)
CREATE POLICY "communities: authenticated insert" ON public.regional_communities
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

-- Community members table
CREATE TABLE public.community_members (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL REFERENCES public.regional_communities(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  approved_by uuid REFERENCES public.users(id),
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT community_members_pkey PRIMARY KEY (id),
  CONSTRAINT community_members_unique_member UNIQUE (community_id, user_id),
  CONSTRAINT community_members_role_check CHECK (
    role IN ('referee', 'organizer', 'manager')
  ),
  CONSTRAINT community_members_status_check CHECK (
    status IN ('pending', 'approved', 'rejected')
  )
);

CREATE INDEX idx_community_members_community_status ON public.community_members(community_id, status);
CREATE INDEX idx_community_members_user_id ON public.community_members(user_id);

ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;

-- Users can view their own membership
CREATE POLICY "community_members: self read" ON public.community_members
  FOR SELECT USING (user_id = auth.uid());

-- Users can apply (insert pending)
CREATE POLICY "community_members: self insert" ON public.community_members
  FOR INSERT WITH CHECK (user_id = auth.uid() AND status = 'pending');

-- Managers can view all members in their community
CREATE POLICY "community_members: manager read" ON public.community_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.community_members cm
      WHERE cm.community_id = community_members.community_id
        AND cm.user_id = auth.uid()
        AND cm.role = 'manager'
        AND cm.status = 'approved'
    )
  );

-- Approved members can see other approved members in the same community
CREATE POLICY "community_members: approved members read" ON public.community_members
  FOR SELECT USING (
    status = 'approved'
    AND EXISTS (
      SELECT 1 FROM public.community_members cm
      WHERE cm.community_id = community_members.community_id
        AND cm.user_id = auth.uid()
        AND cm.status = 'approved'
    )
  );

-- Managers can approve/reject (update status)
CREATE POLICY "community_members: manager update" ON public.community_members
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.community_members cm
      WHERE cm.community_id = community_members.community_id
        AND cm.user_id = auth.uid()
        AND cm.role = 'manager'
        AND cm.status = 'approved'
    )
  );

-- Approved community members can see public profile of other approved members in the same community
-- (real_name excluded via application layer)
CREATE POLICY "users: community members can view public profile" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.community_members cm1
      JOIN public.community_members cm2
        ON cm1.community_id = cm2.community_id
      WHERE cm1.user_id = auth.uid()
        AND cm1.status = 'approved'
        AND cm2.user_id = users.id
        AND cm2.status = 'approved'
    )
  );
