-- Phase B: close direct public inserts into feedback.
-- Apply ONLY after SUPABASE_SERVICE_ROLE_KEY is set on Vercel (Production and
-- Preview), the app is redeployed, and a test submission has gone through.
-- Until the service key is in place the API inserts with the anon key, which
-- this script removes.

begin;

drop policy if exists feedback_insert_all on public.feedback;
revoke insert on public.feedback from anon, authenticated;

commit;
