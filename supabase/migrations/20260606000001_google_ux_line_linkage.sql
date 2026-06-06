-- Returns the line_user_id for any user whose auth email matches lookup_email.
-- Called from the Google OAuth callback (admin client) to link LINE accounts.
-- SECURITY DEFINER allows querying auth.users despite RLS restrictions.
CREATE OR REPLACE FUNCTION public.get_line_user_id_by_email(lookup_email TEXT)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.line_user_id
  FROM public.users u
  JOIN auth.users a ON a.id = u.id
  WHERE lower(a.email) = lower(lookup_email)
    AND u.line_user_id IS NOT NULL
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_line_user_id_by_email(TEXT) TO service_role;
