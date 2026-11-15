-- APPLIED 2026-11-15 to project zpjdybbvtolwwxsfjcny (TSA Portal) as migration
-- "lock_profiles_least_privilege". Idempotent, so it is safe to run again.
--
-- Why: public.profiles holds first and last name, school, city, grade, state and
-- division for 4 legacy student accounts, all is_private = false. The policy
-- "read own or public profiles" let ANY authenticated user read every row, and
-- Supabase Auth had sign-ups enabled with auto-confirm, so anyone with the public
-- anon key could create an account and read them. Verified before this change:
-- a signed-in user with no profile saw 4 of 4 rows including names.
--
-- Dependencies checked before applying: no code in the app reads this table
-- (src/services/profileService.js was removed), no views, functions, triggers or
-- realtime publications reference it, and no one has signed in since 2026-07-31.
--
-- What this does: removes all table privileges from anon and authenticated (the
-- service role and owner are unaffected) and narrows the read policy to a user's
-- own row, so access stays closed even if a privilege is granted again by
-- mistake. No rows are changed or deleted.

begin;

revoke all on public.profiles from anon, authenticated;

drop policy if exists "read own or public profiles" on public.profiles;
drop policy if exists "read own profile" on public.profiles;
create policy "read own profile" on public.profiles
    for select to authenticated
    using ((select auth.uid()) = id);

commit;

-- Rollback (restores the previous access exactly):
--   begin;
--   grant select, insert, update on public.profiles to authenticated;
--   drop policy if exists "read own profile" on public.profiles;
--   create policy "read own or public profiles" on public.profiles
--       for select to authenticated
--       using (((select auth.uid()) = id) or (is_private = false));
--   commit;
