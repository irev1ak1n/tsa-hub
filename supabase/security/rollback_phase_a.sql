-- Reverses the behaviour changes of 01_phase_a.sql. Safe to run whether or not
-- Phase B was applied, and safe to run more than once.
--
-- Restored: the original events and profiles RLS policies, and removal of the
-- feedback length/type constraints.
--
-- Deliberately NOT restored, because restoring them would re-open holes and
-- nothing in the app depends on them:
--   * public.rate_limits and public.check_rate_limit() stay. The production API
--     refuses requests when the limiter is missing, so dropping them would take
--     feedback submissions down.
--   * The on_feedback_insert trigger stays dropped (it caused duplicate emails).
--   * notify_feedback() keeps its fixed search_path and revoked EXECUTE.
--   * anon/authenticated do not get TRUNCATE, TRIGGER or REFERENCES back.
--   * Public INSERT on feedback is neither opened nor closed here; that is
--     controlled only by Phase B and rollback_phase_b.sql.

begin;

alter table public.feedback drop constraint if exists feedback_message_length;
alter table public.feedback drop constraint if exists feedback_type_allowed;

drop policy if exists "read own or public profiles" on public.profiles;
drop policy if exists "read own profile" on public.profiles;
drop policy if exists "read public profiles" on public.profiles;
drop policy if exists "insert own profile" on public.profiles;
drop policy if exists "update own profile" on public.profiles;
create policy "read own profile"     on public.profiles for select to public using (auth.uid() = id);
create policy "read public profiles" on public.profiles for select to public using (is_private = false);
create policy "insert own profile"   on public.profiles for insert to public with check (auth.uid() = id);
create policy "update own profile"   on public.profiles for update to public using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "Public read published events" on public.events;
drop policy if exists "Public read events" on public.events;
drop policy if exists "events are readable by signed-in users" on public.events;
create policy "Public read events" on public.events for select to anon, authenticated using (true);
create policy "events are readable by signed-in users" on public.events for select to authenticated using (true);

commit;
