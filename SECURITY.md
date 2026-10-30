# TSA Hub security notes and deployment runbook

## Architecture

- Browser: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` only. The anon key is public by design; RLS limits it to reading published events.
- `POST /api/submit-feedback` (Vercel): the only write path for Feedback, Report Incorrect Information and Get Involved. It holds `SUPABASE_SERVICE_ROLE_KEY` and `RESEND_API_KEY` and sends the single notification email.
- `supabase/functions/ai-feedback`: never called by the app (no reference in `src/` or `api/`, and none in any commit). Retire it.
- `supabase/functions/feedback-email`: only ever called by the `on_feedback_insert` trigger, which Phase A drops. Retire it.

## What the API enforces

Same-origin check (own host plus `ALLOWED_ORIGINS`), JSON only, 32 KB body cap, field validation, control-character stripping, honeypot and minimum fill time for Get Involved, and de-duplication of identical resubmissions. Rate limits are shared across serverless instances through `public.check_rate_limit`: 8 per IP per 10 minutes, 3 per email per hour (Get Involved), 120 per hour overall.

Production fails closed. When `VERCEL_ENV=production` (or `NODE_ENV=production` outside Vercel):

- no `SUPABASE_SERVICE_ROLE_KEY` -> `503`, nothing written (no anon-key fallback);
- shared limiter missing, erroring or unreachable -> `503`, nothing written (no in-memory fallback).

Only development, tests and non-production deployments use the anon key and per-instance memory. `vercel.json` sets CSP, HSTS, frame, referrer and permissions headers.

## State on 2026-10-30 (verified, not assumed)

- Commit `c05ac7d` auto-deployed to Vercel Production: deployment `dpl_9pvtmuVGanqHA5L5w2qH1YyKBzxb`, state `READY`, aliased to `tsa-hub.vercel.app`. The live site serves the new CSP headers and returns `403` to a cross-origin POST.
- The Vercel project has only four variables, all Production-only: `FEEDBACK_TO_EMAIL`, `RESEND_API_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`. There is no `SUPABASE_SERVICE_ROLE_KEY` yet and nothing for Preview.
- Database rollout update (2026-10-30): after independently verifying the offsite logical dump, `00_backup.sql` and `01_phase_a.sql` were applied successfully to production. Verification showed 83 events (79 active), 13 feedback rows, 4 profiles, a service-role-only limiter, and no `on_feedback_insert` trigger. Phase B and both Edge Functions remain unchanged.
- Vercel `SUPABASE_SERVICE_ROLE_KEY` was added through the dashboard; a new production deployment and live feedback checks are required before Phase B.
- **Consequence:** the build that adds the fail-closed behavior returns `503` for all three forms until steps 3 and 4 below are done. Do them in one sitting. Event browsing and the recommender are unaffected.

## Environment variables

- Add `SUPABASE_SERVICE_ROLE_KEY` to the **Production** environment only, as a **Sensitive** variable. Do not tick Preview or Development. Preview deployments must never hold unrestricted production credentials; without it they simply refuse submissions.
- Optional Production variables: `RESEND_FROM_EMAIL` (currently the `onboarding@resend.dev` default), `ALLOWED_ORIGINS` (extra custom domains).
- Never prefix the service key with `VITE_`, never commit it, and do not run `vercel env pull` into a tracked file.

## Backup (a gate before any production change)

`supabase/security/00_backup.sql` is only an in-database snapshot of the rows and security settings the scripts touch. It lives in the same database, so it is lost with it. It is not a backup. Take a full logical export first.

Get the connection details from Dashboard > Project Settings > Database (reset the DB password there if you do not have it). Keep the password in an environment variable, not in the command.

Option 1, Supabase CLI (needs Docker Desktop running):

```bash
supabase link --project-ref zpjdybbvtolwwxsfjcny
mkdir -p backup-20261030
supabase db dump --linked -f backup-20261030/roles.sql --role-only
supabase db dump --linked -f backup-20261030/schema.sql
supabase db dump --linked -f backup-20261030/data.sql --data-only --use-copy
```

Option 2, `pg_dump` 17 (matches the server's Postgres 17):

```bash
pg_dump "$SUPABASE_DB_URL" --format=custom --no-owner --file=backup-20261030/tsa-hub.dump
```

Keep `backup-20261030/` outside the repo (it contains feedback submissions, including names and emails). Also confirm the dashboard backups under Database > Backups.

Verify the export is usable before continuing:

1. Files exist and are non-empty. For the CLI dump, `grep -c "^COPY public\." backup-20261030/data.sql` should be at least 3; for the custom dump, `pg_restore --list backup-20261030/tsa-hub.dump` should list `TABLE DATA public events`, `feedback` and `profiles`.
2. Restore into a scratch database that is not production: `supabase start` (local, Docker), then load `roles.sql`, `schema.sql` and `data.sql` with `psql` (or `pg_restore --no-owner -d <scratch>`).
3. In the scratch database, confirm the counts match production at export time (last seen: 83 events of which 79 have `archived = false`, 13 feedback rows, 4 profiles):

```sql
select (select count(*) from public.events) events,
       (select count(*) from public.events where archived = false) active_events,
       (select count(*) from public.feedback) feedback,
       (select count(*) from public.profiles) profiles;
```

Do not go past this step until the restore check passes.

Status (2026-10-30): done and verified. `pg_dump` 18.6 (installed with Scoop, no Docker) exported `public`, `auth` and `storage` to `C:\Users\illia\tsa-hub-backups\20261030\tsa-portal.dump` (outside the repo; SHA-256 in `tsa-portal.dump.sha256`). It was restored twice into a local scratch PostgreSQL (127.0.0.1:54329, never production). Row counts, row-content checksums, columns, indexes, RLS flags, policies, grants, triggers and functions all match production. The only differences are PostgreSQL 18 listing NOT NULL rules as constraints and a different ordering inside one `auth.jwt()` permission list. A schema dump does not capture, and a brand-new project would need set up separately: database roles and extensions (`pg_net`, `pgcrypto`, `uuid-ossp`, which Supabase provides), Auth settings (providers, SMTP, JWT secret), API keys, Edge Function code and secrets, and Vercel variables. The `auth` data (4 users, 167 refresh tokens) restored; `storage` has no buckets or files.

Also run `supabase/security/00_backup.sql` for the in-database snapshot.

## Deployment runbook

Run SQL with `supabase db query --linked -f <file>` (project is linked) or paste it into the Dashboard SQL editor.

**1. Export and verify** as above. Rollback: none needed.

**2. Snapshot** with `00_backup.sql`.

**3. Phase A SQL** - `supabase/security/01_phase_a.sql` (one transaction, idempotent). Adds the shared limiter, drops the duplicate-email trigger, locks down `notify_feedback()`, bounds feedback rows, removes unused table privileges and consolidates RLS policies. Verify:

```sql
select to_regclass('public.rate_limits') as limiter_table,
       (select count(*) from pg_trigger where tgname = 'on_feedback_insert') as trigger_left,
       (select count(*) from public.events where archived = false) as active_events,
       has_function_privilege('anon', 'public.check_rate_limit(text,integer,integer)', 'execute') as anon_can_call_limiter;
```

Expect `public.rate_limits`, `0`, `79`, `false`. Public event reads must still work and exclude archived rows:

```bash
curl -s "$SUPABASE_URL/rest/v1/events?select=id&archived=eq.false" -H "apikey: $ANON_KEY" | python -c "import json,sys; print(len(json.load(sys.stdin)))"
```

Expect `79`. Rollback: `rollback_phase_a.sql`.

**4. Service-role key and redeploy.** In Vercel > tsa-hub > Settings > Environment Variables, add `SUPABASE_SERVICE_ROLE_KEY` (Dashboard > Project Settings > API Keys > service_role), Environment = Production only, Sensitive on. Then Deployments > latest Production > Redeploy (variables apply only to new deployments). Verify these probes, none of which store anything:

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST https://tsa-hub.vercel.app/api/submit-feedback -H "Content-Type: application/json" -H "Origin: https://evil.example" -d "{}"        # 403
curl -s -o /dev/null -w "%{http_code}\n" -X POST https://tsa-hub.vercel.app/api/submit-feedback -H "Content-Type: application/json" -H "Origin: https://tsa-hub.vercel.app" -d "{}"   # 400 (503 means key or limiter missing)
curl -s -o /dev/null -w "%{http_code}\n" https://tsa-hub.vercel.app/api/submit-feedback    # 405
```

Rollback: remove the variable and redeploy. Forms then return `503` (safe, not insecure); to restore the old anon behavior instead, redeploy commit `c05ac7d` and run `rollback_phase_b.sql` if Phase B was applied.

**5. Test each form on the live site**, one submission each, using obviously fake text (start it with `TEST`): Feedback, Report Incorrect Information, Get Involved. Expect for each: success message, exactly one email, one new `feedback` row, and a row per key in `select key, hits from public.rate_limits order by window_start desc limit 10;`. Submit one a second time unchanged: no second row, no second email. Optionally remove the test rows afterwards: `delete from public.feedback where message like 'TEST%';`.

**6. Phase B SQL** - `02_phase_b.sql`, only after step 5 passes. Verify direct anonymous writes are now refused (expect HTTP 401 or 403 with code 42501) and a form still works:

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST "$SUPABASE_URL/rest/v1/feedback" -H "apikey: $ANON_KEY" -H "Content-Type: application/json" -d '{"message":"TEST direct insert","type":"feedback"}'
```

Do not run this probe before Phase B: it would insert a row. Rollback: `rollback_phase_b.sql` (re-opens public inserts; emergency only).

**7. Retire `feedback-email`** (after step 3 the trigger no longer calls it, and it requires a secret header it will never receive): `supabase functions delete feedback-email --project-ref zpjdybbvtolwwxsfjcny`. Verify with `supabase functions list --project-ref zpjdybbvtolwwxsfjcny`, and by submitting one form: still exactly one email. Rollback: redeploy the previous version from git history with `supabase functions deploy feedback-email --no-verify-jwt` (and re-create the trigger only if you want the duplicate email back).

**8. Retire `ai-feedback`.** First check Dashboard > Edge Functions > ai-feedback > Invocations/Logs for traffic, and your Gemini usage page for unexplained spend; the function has been open to anyone, so any traffic there is not from this app. Then `supabase functions delete ai-feedback --project-ref zpjdybbvtolwwxsfjcny`. If you later add an AI feature, redeploy the hardened version from this repo with JWT verification on, `supabase secrets set ALLOWED_ORIGINS=... GEMINI_API_KEY=... GEMINI_MODEL=<current model>` and use the shared limiter. Delete the `GEMINI_API_KEY` secret if you stop using it.

**9. Dashboard:** Authentication > Settings > enable leaked-password protection.

## Rollback reference

| Undo | Run | Effect |
| --- | --- | --- |
| Phase B | `rollback_phase_b.sql` | Re-opens public inserts into `feedback`. Independent of Phase A. |
| Phase A | `rollback_phase_a.sql` | Restores original `events`/`profiles` policies, drops feedback constraints. Independent of Phase B. |
| Everything | Phase B rollback, then Phase A rollback | See below. |

`rollback_phase_a.sql` deliberately keeps the rate limiter, the dropped trigger, the hardened `notify_feedback()` and the revoked TRUNCATE/TRIGGER/REFERENCES privileges, so rolling back never re-opens a hole and never breaks the fail-closed API. Both scripts and Phase A are idempotent. Last resort is restoring the verified export from step 1.

## Mobile (Capacitor) readiness

Not implemented yet. These are the decisions to keep in mind so the backend does not need rebuilding.

1. **API base URL.** A relative `/api/...` call inside a native WebView resolves to the app's own origin. The feedback client now reads `VITE_API_BASE_URL` (empty on the web, the deployed origin in a native build). Any new endpoint call must go through a base-URL helper the same way.
2. **Origins and CORS.** A native WebView calls the site cross-origin (`capacitor://localhost` on iOS, `https://localhost` on Android), and a JSON POST triggers a preflight. The API sends no CORS headers and rejects `OPTIONS`, so native calls would fail. Two fixes for when Capacitor is added: use Capacitor's native HTTP (`CapacitorHttp`), which bypasses WebView CORS, or add exact-origin CORS plus `OPTIONS` handling for just those two origins through `ALLOWED_ORIGINS`. Never `*`. The origin check is not authentication, so rate limits stay the real control; plan Play Integrity / App Attest if abuse appears. Per-IP limits can throttle many students behind one carrier or school NAT address, so revisit the 8-per-10-minutes limit with real traffic.
3. **Local data.** Preferences and saved events live in `localStorage` (`tsa-hub-state-v1`), the personal calendar in IndexedDB (`tsa-hub-personal-calendar`, versioned). A native app has a different origin from the website, so web data does not carry over, reinstalling deletes it, and iOS can evict WebView storage under pressure. Keep all access inside `AppContext` and `personalCalendarDb`; before launch add an export/import (or account sync) path and consider Capacitor Preferences for the small state blob. Never drop the IndexedDB store on upgrade.
4. **Reminders and calendar export.** `notificationService` already isolates the browser Notification API and documents the native swap (Local Notifications plugin). `deviceCalendarService` downloads an `.ics` through a Blob link, which does not work in a WebView; replace it with Filesystem plus Share or a calendar plugin behind the same function.
5. **Offline.** Rules, resources, themes and the calendar are bundled and work offline. The `events` table is fetched at launch with no cache, so an offline launch shows the error state. Add a last-good-copy cache (optionally a bundled snapshot) for events. Data that changes often (calendar, deadlines) needs either an app update or a remote JSON with a bundled fallback.
6. **Navigation and links.** `BrowserRouter` works in Capacitor with the index fallback. Universal/App Links need files under `/.well-known/`; the Vercel rewrite skips any path containing a dot, so those static files are served as-is. External links and `mailto:` should open through the system browser or mail app; handle the Android hardware back button with the App plugin.
7. **Security headers.** The CSP in `vercel.json` protects the website only. A native build ships its assets locally and needs its own CSP.

## Known remaining risks

- Per-IP limits can be sidestepped by rotating IPs; the global and per-email caps bound the damage.
- The origin check stops browsers on other sites, not scripts that set headers themselves.
- `react-router` 6.x has moderate advisories fixed only in v7 (a major upgrade). The app has no SSR and navigates only to internal routes. `vite`/`esbuild` advisories affect the development server only.
- `pg_net` is installed in `public`; it can be dropped once nothing else uses it.
- The two Edge Functions remain publicly reachable until steps 7 and 8.
- Preview deployments cannot load data or submit forms (they have no variables); that is intentional.
