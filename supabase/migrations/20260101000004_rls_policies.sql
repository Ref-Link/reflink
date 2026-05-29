-- Real-name disclosure: confirmed assignment parties can see each other's real profile
-- Organizers/managers can see real_name of referees with confirmed assignments
CREATE POLICY "users: confirmed assignment organizer sees real profile" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.assignments a
      JOIN public.matches m ON m.id = a.match_id
      JOIN public.community_members cm ON cm.community_id = m.community_id
      WHERE a.user_id = users.id
        AND a.status = 'confirmed'
        AND cm.user_id = auth.uid()
        AND cm.role IN ('organizer', 'manager')
        AND cm.status = 'approved'
    )
  );

-- Referees can see real_name of organizer who confirmed their assignment
CREATE POLICY "users: confirmed assignment referee sees organizer" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.assignments a
      JOIN public.matches m ON m.id = a.match_id
      WHERE a.user_id = auth.uid()
        AND a.status = 'confirmed'
        AND m.created_by = users.id
    )
  );

-- Enable Supabase Realtime for assignments table (for real-time status updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.assignments;
