-- Update license_level CHECK constraint: remove 'S級' (coaching license, not referee license)
ALTER TABLE public.users DROP CONSTRAINT users_license_level_check;
ALTER TABLE public.users ADD CONSTRAINT users_license_level_check
  CHECK (license_level IN ('1級', '2級', '3級', '4級'));

-- Migrate existing 'S級' license entries to '4級' (entry-level referee license)
UPDATE public.users SET license_level = '4級' WHERE license_level = 'S級';
