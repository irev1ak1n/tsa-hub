-- Run first, in the Supabase SQL editor. Copies the rows and the security
-- configuration that the later scripts touch into a private schema.
-- Also take a full backup from Dashboard > Database > Backups (or pg_dump).

create schema if not exists security_backup_20261030;
revoke all on schema security_backup_20261030 from public, anon, authenticated;

create table security_backup_20261030.feedback as table public.feedback;
create table security_backup_20261030.events   as table public.events;
create table security_backup_20261030.profiles as table public.profiles;

create table security_backup_20261030.policies as
    select * from pg_policies where schemaname = 'public';

create table security_backup_20261030.table_grants as
    select * from information_schema.role_table_grants where table_schema = 'public';

create table security_backup_20261030.function_defs as
    select p.proname, pg_get_functiondef(p.oid) as definition, p.proacl::text as acl
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public';

create table security_backup_20261030.trigger_defs as
    select tgrelid::regclass::text as table_name, tgname, pg_get_triggerdef(oid) as definition
    from pg_trigger where not tgisinternal and tgrelid::regclass::text like 'public.%';
