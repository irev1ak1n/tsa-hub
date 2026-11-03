-- NOT APPLIED. Optional cleanup after the Get Involved feature was removed from
-- the app and the API. Review, then run in the Supabase SQL editor (or
-- `supabase db query --linked -f supabase/security/03_retire_get_involved.sql`).
--
-- Before running, confirm nothing of that type exists (it was 0 at audit time)
-- and review any rows by hand. This script never deletes data. It refuses to run
-- if any such row exists, because tightening the constraint would fail anyway.

do $$
begin
    if exists (select 1 from public.feedback where type = 'get-involved') then
        raise exception 'public.feedback still has get-involved rows. Review and delete them first.';
    end if;
end $$;

alter table public.feedback drop constraint if exists feedback_type_allowed;
alter table public.feedback
    add constraint feedback_type_allowed check (type in ('feedback', 'report'));

-- Rollback (restores the old, wider constraint):
--   alter table public.feedback drop constraint feedback_type_allowed;
--   alter table public.feedback add constraint feedback_type_allowed
--       check (type in ('feedback', 'report', 'get-involved'));
