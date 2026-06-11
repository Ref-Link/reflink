-- Allow users to register without a referee license.
-- Community organizers and club managers may not hold a JFA referee license,
-- but still need to be members of a community to manage matches.
--
-- license_level: drop NOT NULL so users without a license can register.
-- The existing CHECK constraint (IN '1級'...'4級') still applies for non-NULL values;
-- NULL passes the CHECK by PostgreSQL semantics (NULL IN (...) evaluates to NULL, not FALSE).
--
-- role_type / age_groups: add DEFAULT '{}' so rows inserted without these fields
-- get an empty array instead of a NOT NULL violation.
-- The existing CHECK (array_length > 0) also passes for empty arrays
-- because array_length('{}', 1) returns NULL, not 0.

ALTER TABLE public.users ALTER COLUMN license_level DROP NOT NULL;
ALTER TABLE public.users ALTER COLUMN role_type SET DEFAULT '{}';
ALTER TABLE public.users ALTER COLUMN age_groups SET DEFAULT '{}';
