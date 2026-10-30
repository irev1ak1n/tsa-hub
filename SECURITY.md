# TSA Hub security notes

## Request flow

- Browser: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` only. The anon key is public by design; RLS limits it to reading published events.
- `POST /api/submit-feedback` (Vercel): the only write path for Feedback, Report Incorrect Information and Get Involved. Holds `SUPABASE_SERVICE_ROLE_KEY` and `RESEND_API_KEY`, and sends the single notification email.
- `supabase/functions/ai-feedback`: not called by the current app (the recommender runs locally). Deploy it only if that feature is switched on.

## What the API enforces

Same-origin check (own host plus `ALLOWED_ORIGINS`), JSON-only, 32 KB body cap, field validation and control-character stripping, honeypot and minimum fill time for Get Involved, identical-resubmission dedupe, and rate limits shared across instances through `public.check_rate_limit` (8 per IP per 10 min, 3 per email per hour for Get Involved, 120 per hour overall). If the limiter is unavailable it falls back to per-instance memory. Errors returned to clients carry no internal detail. `vercel.json` sets CSP, HSTS, frame, referrer and permissions headers.

## Deployment order

1. Take a backup: Supabase Dashboard > Database > Backups, and run `supabase/security/00_backup.sql`.
2. Vercel env vars (Production and Preview): add `SUPABASE_SERVICE_ROLE_KEY` (server only, never `VITE_`), optionally `ALLOWED_ORIGINS`. Confirm `RESEND_API_KEY`, `FEEDBACK_TO_EMAIL`, `RESEND_FROM_EMAIL` are set.
3. Deploy this commit to Vercel.
4. Run `supabase/security/01_phase_a.sql`. It adds the rate limiter, drops the duplicate-email trigger, locks down `notify_feedback()`, adds feedback constraints, trims table privileges and consolidates RLS policies. Validated in a rolled-back transaction against production; not applied.
5. Submit one test of each form on the deployed site. Confirm one email each and a new row in `feedback`.
6. Run `supabase/security/02_phase_b.sql` to remove public inserts into `feedback`. Do this only after step 5 passes; it breaks submissions if the service key is missing.
7. Undeploy the retired function: `supabase functions delete feedback-email`.
8. If `ai-feedback` stays deployed: redeploy it (JWT verification on), set `ALLOWED_ORIGINS` and `GEMINI_API_KEY` as secrets, and set `GEMINI_MODEL` to a current model, or delete it.
9. Dashboard: enable leaked-password protection under Auth.

Rollback: `supabase/security/rollback.sql` (and `security_backup_20261030` holds the original rows, policies and function definitions).

## Known remaining risks

- Per-IP limits can be sidestepped by rotating IPs; the global and per-email caps bound the damage.
- Origin checks stop browsers on other sites, not scripts that set headers themselves.
- `react-router` 6.x has moderate advisories fixed only in v7 (a major upgrade). The app has no SSR and navigates only to internal routes.
- `vite`/`esbuild` advisories affect the development server only.
- `pg_net` is installed in `public`; it can be dropped once nothing else uses it.
- The `feedback-email` and `ai-feedback` functions stay publicly reachable until steps 7-8.
