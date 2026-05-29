-- Availabilities table: referee availability slots
CREATE TABLE public.availabilities (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  start_time time,
  end_time time,
  age_groups text[] NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT availabilities_pkey PRIMARY KEY (id),
  CONSTRAINT availabilities_time_check CHECK (
    start_time IS NULL OR end_time IS NULL OR end_time > start_time
  ),
  CONSTRAINT availabilities_date_check CHECK (date >= CURRENT_DATE)
);

CREATE INDEX idx_availabilities_user_date ON public.availabilities(user_id, date);
CREATE INDEX idx_availabilities_date ON public.availabilities(date);

ALTER TABLE public.availabilities ENABLE ROW LEVEL SECURITY;

-- Referees manage their own availability
CREATE POLICY "availabilities: self read" ON public.availabilities
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "availabilities: self insert" ON public.availabilities
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "availabilities: self delete" ON public.availabilities
  FOR DELETE USING (user_id = auth.uid());

-- Approved community members can view availability of other approved members
CREATE POLICY "availabilities: community members read" ON public.availabilities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.community_members cm1
      JOIN public.community_members cm2
        ON cm1.community_id = cm2.community_id
      WHERE cm1.user_id = auth.uid()
        AND cm1.status = 'approved'
        AND cm2.user_id = availabilities.user_id
        AND cm2.status = 'approved'
    )
  );

-- Matches table
CREATE TABLE public.matches (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL REFERENCES public.regional_communities(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES public.users(id),
  title text NOT NULL,
  match_date date NOT NULL,
  start_time time NOT NULL,
  venue text NOT NULL,
  age_group text NOT NULL,
  referees_needed integer NOT NULL DEFAULT 1,
  assistants_needed integer NOT NULL DEFAULT 2,
  compensation integer,
  notes text,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT matches_pkey PRIMARY KEY (id),
  CONSTRAINT matches_status_check CHECK (
    status IN ('open', 'filled', 'cancelled')
  )
);

CREATE INDEX idx_matches_match_date ON public.matches(match_date);
CREATE INDEX idx_matches_community_status ON public.matches(community_id, status);

CREATE TRIGGER matches_updated_at
  BEFORE UPDATE ON public.matches
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- Approved community members (organizers/managers) can create matches
CREATE POLICY "matches: organizer insert" ON public.matches
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.community_members cm
      WHERE cm.community_id = matches.community_id
        AND cm.user_id = auth.uid()
        AND cm.role IN ('organizer', 'manager')
        AND cm.status = 'approved'
    )
  );

-- All approved community members can view matches
CREATE POLICY "matches: community read" ON public.matches
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.community_members cm
      WHERE cm.community_id = matches.community_id
        AND cm.user_id = auth.uid()
        AND cm.status = 'approved'
    )
  );

-- Organizers/managers can update matches
CREATE POLICY "matches: organizer update" ON public.matches
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.community_members cm
      WHERE cm.community_id = matches.community_id
        AND cm.user_id = auth.uid()
        AND cm.role IN ('organizer', 'manager')
        AND cm.status = 'approved'
    )
  );

-- Assignments table
CREATE TABLE public.assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role text NOT NULL,
  status text NOT NULL DEFAULT 'notified',
  notified_at timestamptz,
  responded_at timestamptz,
  confirmed_at timestamptz,
  reminder_sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT assignments_pkey PRIMARY KEY (id),
  CONSTRAINT assignments_unique_match_user UNIQUE (match_id, user_id),
  CONSTRAINT assignments_role_check CHECK (
    role IN ('referee', 'assistant_referee')
  ),
  CONSTRAINT assignments_status_check CHECK (
    status IN ('notified', 'accepted', 'declined', 'confirmed')
  )
);

CREATE INDEX idx_assignments_match_id ON public.assignments(match_id);
CREATE INDEX idx_assignments_user_id ON public.assignments(user_id);
CREATE INDEX idx_assignments_status ON public.assignments(status);

ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

-- Referees can view their own assignments
CREATE POLICY "assignments: self read" ON public.assignments
  FOR SELECT USING (user_id = auth.uid());

-- Referees can update their own assignment status (accept/decline via webhook)
CREATE POLICY "assignments: self update status" ON public.assignments
  FOR UPDATE USING (user_id = auth.uid());

-- Organizers/managers can create assignments for their community matches
CREATE POLICY "assignments: organizer insert" ON public.assignments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.matches m
      JOIN public.community_members cm ON cm.community_id = m.community_id
      WHERE m.id = assignments.match_id
        AND cm.user_id = auth.uid()
        AND cm.role IN ('organizer', 'manager')
        AND cm.status = 'approved'
    )
  );

-- Organizers/managers can view and confirm assignments in their community
CREATE POLICY "assignments: organizer read" ON public.assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.matches m
      JOIN public.community_members cm ON cm.community_id = m.community_id
      WHERE m.id = assignments.match_id
        AND cm.user_id = auth.uid()
        AND cm.role IN ('organizer', 'manager')
        AND cm.status = 'approved'
    )
  );

CREATE POLICY "assignments: organizer update" ON public.assignments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.matches m
      JOIN public.community_members cm ON cm.community_id = m.community_id
      WHERE m.id = assignments.match_id
        AND cm.user_id = auth.uid()
        AND cm.role IN ('organizer', 'manager')
        AND cm.status = 'approved'
    )
  );
