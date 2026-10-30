-- Phase A: safe to apply once the new api/submit-feedback.js is deployed.
-- Nothing here changes what the current app can do. Applies as one transaction.

begin;

-- 1. Shared rate limiter used by api/submit-feedback.js and the ai-feedback
--    Edge Function. Reachable only with the service-role key.
create table if not exists public.rate_limits (
    key          text primary key,
    window_start timestamptz not null default now(),
    hits         integer     not null default 0
);
alter table public.rate_limits enable row level security;
revoke all on public.rate_limits from anon, authenticated;
grant all on public.rate_limits to service_role;

create or replace function public.check_rate_limit(p_key text, p_limit integer, p_window_seconds integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_hits integer;
begin
    insert into public.rate_limits as r (key, window_start, hits)
    values (p_key, now(), 1)
    on conflict (key) do update set
        window_start = case when r.window_start < now() - make_interval(secs => p_window_seconds) then now() else r.window_start end,
        hits         = case when r.window_start < now() - make_interval(secs => p_window_seconds) then 1 else r.hits + 1 end
    returning hits into v_hits;

    if random() < 0.02 then
        delete from public.rate_limits where window_start < now() - interval '2 days';
    end if;

    return v_hits <= p_limit;
end;
$$;
revoke execute on function public.check_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.check_rate_limit(text, integer, integer) to service_role;

-- 2. Retire the duplicate-email path. Vercel now sends the one notification
--    email, so the trigger that called the feedback-email Edge Function goes.
drop trigger if exists on_feedback_insert on public.feedback;

create or replace function public.notify_feedback()
returns trigger
language plpgsql
security definer
set search_path = ''
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
revoke execute on function public.notify_feedback() from public, anon, authenticated;

-- 3. Bound what a feedback row can contain, whoever inserts it.
alter table public.feedback
    add constraint feedback_message_length check (char_length(message) between 1 and 12000),
    add constraint feedback_type_allowed   check (type in ('feedback', 'report', 'get-involved'));

-- 4. Table privileges the API never needs (RLS does not cover these).
revoke truncate, trigger, references on public.events, public.feedback, public.profiles from anon, authenticated;

-- 5. events: one public read policy, published events only. The app already
--    queries archived = false.
drop policy if exists "events are readable by signed-in users" on public.events;
drop policy if exists "Public read events" on public.events;
create policy "Public read published events" on public.events
    for select to anon, authenticated
    using (archived is not true);

-- 6. profiles: same access as today, one SELECT policy, auth.uid() evaluated once.
drop policy if exists "read own profile" on public.profiles;
drop policy if exists "read public profiles" on public.profiles;
drop policy if exists "insert own profile" on public.profiles;
drop policy if exists "update own profile" on public.profiles;
create policy "read own or public profiles" on public.profiles
    for select to authenticated
    using ((select auth.uid()) = id or is_private = false);
create policy "insert own profile" on public.profiles
    for insert to authenticated
    with check ((select auth.uid()) = id);
create policy "update own profile" on public.profiles
    for update to authenticated
    using ((select auth.uid()) = id)
    with check ((select auth.uid()) = id);

commit;
