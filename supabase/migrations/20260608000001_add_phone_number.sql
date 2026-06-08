ALTER TABLE public.users
  ADD COLUMN phone_number text
  CONSTRAINT users_phone_number_check CHECK (phone_number ~ '^0[0-9]{9,10}$');
