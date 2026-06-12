ALTER TABLE public.assignments
  ADD COLUMN confirmed_by uuid REFERENCES public.users(id);
