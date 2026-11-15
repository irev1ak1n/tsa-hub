-- NOT APPLIED. Review, then run in the Supabase SQL editor.
--
-- Why: public.profiles holds first and last name, school, city, grade and state
-- for 4 legacy accounts, and every row is is_private = false. The current policy
-- "read own or public profiles" lets ANY authenticated user read those rows. If
-- email sign-ups are enabled on the project, anyone with the public anon key can
-- create an account and become authenticated, so these student records are
-- readable by the public. TSA Hub has no accounts and no code reads this table
-- (src/services/profileService.js was removed), so nothing in the app depends on
-- it.
--
-- What this does: restricts reads to a user's own row. No data is changed or
-- deleted. Combine with turning sign-ups off (see docs/SECURITY_AUDIT.md).

begin;

drop policy if exists "read own or public profiles" on public.profiles;
create policy "read own profile" on public.profiles
    for select to authenticated
    using ((select auth.uid()) = id);

commit;

-- Rollback (restores the old, wider read access):
--   drop policy if exists "read own profile" on public.profiles;
--   create policy "read own or public profiles" on public.profiles
--       for select to authenticated
--       using (((select auth.uid()) = id) or (is_private = false));
--
-- Stricter option once you have decided what to do with the legacy rows (this
-- also stops owners reading their own row, which nothing uses):
--   revoke all on public.profiles from authenticated;
