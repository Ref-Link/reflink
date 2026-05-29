-- Users table: extends Supabase auth.users with app-specific profile data
CREATE TABLE public.users (
  id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  real_name text,
  line_user_id text UNIQUE,
  license_level text NOT NULL,
  role_type text[] NOT NULL,
  age_groups text[] NOT NULL,
  region text NOT NULL,
  travel_range_km integer,
  experience_years integer,
  referred_by uuid REFERENCES public.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_license_level_check CHECK (
    license_level IN ('S級', '1級', '2級', '3級', '4級')
  ),
  CONSTRAINT users_role_type_check CHECK (
    array_length(role_type, 1) > 0
  ),
  CONSTRAINT users_age_groups_check CHECK (
    array_length(age_groups, 1) > 0
  )
);

CREATE INDEX idx_users_line_user_id ON public.users(line_user_id);
CREATE INDEX idx_users_region ON public.users(region);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- RLS: users can read/update their own row; real_name is restricted
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users: self read" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users: self insert" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "users: self update" ON public.users
  FOR UPDATE USING (auth.uid() = id);

