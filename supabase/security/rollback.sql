-- Restores the pre-hardening state. Applies Phase B and Phase A reversals;
-- skip statements for a phase you never applied (they error if objects exist).

begin;

-- Phase B
create policy feedback_insert_all on public.feedback for insert to public with check (true);
grant insert on public.feedback to anon, authenticated;

-- Phase A
alter table public.feedback drop constraint if exists feedback_message_length;
alter table public.feedback drop constraint if exists feedback_type_allowed;

drop policy if exists "read own or public profiles" on public.profiles;
drop policy if exists "insert own profile" on public.profiles;
drop policy if exists "update own profile" on public.profiles;
create policy "read own profile"     on public.profiles for select to public using (auth.uid() = id);
create policy "read public profiles" on public.profiles for select to public using (is_private = false);
create policy "insert own profile"   on public.profiles for insert to public with check (auth.uid() = id);
create policy "update own profile"   on public.profiles for update to public using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "Public read published events" on public.events;
create policy "Public read events" on public.events for select to anon, authenticated using (true);
create policy "events are readable by signed-in users" on public.events for select to authenticated using (true);

grant truncate, trigger, references on public.events, public.feedback, public.profiles to anon, authenticated;

create or replace function public.notify_feedback()
returns trigger
language plpgsql
security definer
as $$
begin
  perform net.http_post(
    url := 'https://zpjdybbvtolwwxsfjcny.supabase.co/functions/v1/feedback-email',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := jsonb_build_object('record', to_jsonb(new))
  );
  return new;
end;
$$;
grant execute on function public.notify_feedback() to public, anon, authenticated;
-- Re-creating the trigger brings back the duplicate email, and the
-- feedback-email function now requires a WEBHOOK_SECRET header the trigger
-- does not send, so leave it off unless you also change both:
-- create trigger on_feedback_insert after insert on public.feedback for each row execute function notify_feedback();

-- rate_limits / check_rate_limit are additive and harmless; drop only if desired:
-- drop function public.check_rate_limit(text, integer, integer);
-- drop table public.rate_limits;

commit;
