-- Reverses 02_phase_b.sql only. Safe to run whether or not Phase A was applied,
-- and safe to run more than once.
--
-- This re-opens direct public INSERTs into public.feedback. Use it only as an
-- emergency step, e.g. if you must redeploy an older API version that writes
-- with the anon key. The current API writes with the service-role key and does
-- not need it.

begin;

drop policy if exists feedback_insert_all on public.feedback;
create policy feedback_insert_all on public.feedback for insert to public with check (true);
grant insert on public.feedback to anon, authenticated;

commit;
