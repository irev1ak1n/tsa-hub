# TSA Hub security audit

Audit date: 2026-11-15. Scope: the repository, the live Supabase project `TSA Portal` (read-only queries through the Supabase tools), the Vercel configuration files, and the Capacitor iOS project files. Nothing was changed in production. No load, scan or attack traffic was sent to any live service.

This is a review of what could be inspected, not a guarantee. Passing tests do not make the app secure. Items marked **Not verified** need a person to check them in a dashboard or on a real device.

## 1. Summary

Three passes: the audit (`889d68b`), the remediation (`fa03ddf`) and the final cleanup (this version). Status on 2026-11-15:

| | Count |
|---|---|
| Confirmed vulnerabilities | **2**, both fixed and verified: V1 (Low) unpaired-surrogate 500, V2 (**High**) student data in `profiles` readable by any signed-in user while sign-ups were open |
| Potential risks hardened in code | 7 (all Low or Info) |
| Already protected | 12 areas |
| Attack classes that do not apply | 7 |
| Open items | Turn off Auth sign-ups (dashboard only), native CSP device test, decisions about the legacy accounts |

V2 was found in the second pass: Supabase Auth had `disable_signup: false` and `mailer_autoconfirm: true`, and a simulated signed-in user with no profile could read all 4 rows including names. The table is now locked (S1). Sign-ups themselves are still enabled because the Auth setting cannot be changed with the tools available (section 12).

## 2. Attack surface

**Public endpoints**

| Endpoint | Methods | What it does |
|---|---|---|
| `POST /api/submit-feedback` (Vercel function) | POST, OPTIONS (preflight only for `capacitor://localhost`) | Validates a feedback or report message, rate-limits, inserts into `public.feedback`, sends one plain-text email through Resend. The only function in `api/`. |
| Static site | GET | The Vite bundle. |
| Supabase REST (`<project>.supabase.co/rest/v1`) | Anything the anon key and RLS allow | Used by the app only to read `events`. |
| Supabase Auth (`/auth/v1`) | Per project settings | Not used by the app. Reachable with the public anon key. |
| Supabase Edge Functions `ai-feedback`, `feedback-email` | Any | Retired, still deployed, return 410. |

**Environment variables**

| Variable | Where | Exposure |
|---|---|---|
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | Build time, bundled | Public by design. The bundle holds one JWT and its role claim is `anon`. |
| `VITE_API_BASE_URL` | Native build only | An https URL, not secret. |
| `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `FEEDBACK_TO_EMAIL`, `RESEND_FROM_EMAIL`, `ALLOWED_ORIGINS`, optional `RATE_LIMIT_SALT`, `TRUSTED_PROXY_HEADER` | Vercel server env only | Read only in `api/`. No `VITE_` prefix. |

**User-controlled input:** the feedback and report message and page; the Coach, Resources, Events, Help and event-theme search boxes; personal calendar items (stored only on the device); URL paths and hashes; Capacitor deep links.

**Client storage:** `localStorage` for theme, state, saved events, calendar items, recent searches and an events cache. No tokens (the Supabase client no longer persists a session, see F7).

**Trust boundaries:** browser or app to Vercel (anyone, no authentication); Vercel to Supabase (service-role key, server only); browser to Supabase directly (anon key plus RLS); web content to the native shell (Capacitor bridge); Resend (outbound email).

An unauthenticated attacker can: call the API with any headers (Origin and Host checks do not stop non-browser clients), call Supabase REST and Auth with the public anon key, and read anything RLS exposes.

## 3. Findings

### V1. Unpaired surrogate in feedback caused a 500 (Confirmed, Low) **Fixed**

- **Where:** `api/submit-feedback.js`.
- **Evidence:** JSON may contain `"\ud800"`. Postgres rejects it (`Unicode low surrogate must follow a high surrogate`, reproduced with a read-only `select '{"m":"\ud800"}'::jsonb`). The old code passed it through, so the insert failed and the caller got a 500. The IP quota had already been charged.
- **Exploitation:** any caller, one request. Impact is limited to the sender's own allowance and noisy errors.
- **Fix:** unpaired surrogates are replaced with U+FFFD before validation.
- **Tests:** `submitFeedback.api.test.js`, "replaces unpaired surrogates so the database insert cannot fail".

### F1. Client IP derivation (Potential risk, Low) **Hardened**

- **Where:** `api/_lib/security.js`, `getClientIp()`.
- **Evidence:** the old code used the first `X-Forwarded-For` entry. Vercel's documentation says it overwrites `X-Forwarded-For` and `X-Real-IP` with the real address and does not forward external values, so on the current deployment the old code was **not exploitable**. It would have been exploitable anywhere a proxy appends rather than overwrites (local dev, a CDN in front, a host change), because the first entry is client-controlled.
- **Fix:** on Vercel it uses `x-vercel-forwarded-for`, then `x-real-ip`, then the last `X-Forwarded-For` entry. Off Vercel all forwarding headers are ignored and the connection address is used, unless `TRUSTED_PROXY_HEADER` names a header your own proxy controls. Values are validated with `net.isIP`, ports, brackets and zones are stripped, IPv4-mapped IPv6 becomes IPv4, and IPv6 is reduced to its /64 so one subscriber cannot rotate addresses. Invalid or missing values share one `unknown` bucket instead of a caller-chosen key.
- **Tests:** `clientIp.test.js` and "rate limits cannot be bypassed with forged IPs" in `submitFeedback.api.test.js` (forged header, /64 rotation, malformed bodies, 30 concurrent requests allow exactly 8).
- **Limits:** the Vercel behaviour is from Vercel's documentation, not from a live probe, since probing production with forged headers was out of scope.

### F2. Rate-limit store (Already protected, plus hardening)

- **Atomic:** `public.check_rate_limit` is one `INSERT ... ON CONFLICT DO UPDATE ... RETURNING`, so concurrent callers cannot both read the same count. Verified against the live function body.
- **Shared across instances:** counts live in `public.rate_limits`. `SECURITY DEFINER`, `search_path = ''`, `EXECUTE` granted to `service_role` only (verified live). `anon` and `authenticated` have no grants on the table.
- **Fails closed:** in production, a missing service key returns 503 and so does a limiter error or throw (tests "production failure modes"). The in-memory limiter is used only outside production.
- **Responses:** 429 for limits, 403 for untrusted origin, 405, 413, 415, 400.
- **Hardening added:** stored keys now use an HMAC with a server secret (`keyedHash`, key `RATE_LIMIT_SALT` or the service-role key). A plain SHA-256 of an IPv4 address can be reversed by hashing all 4 billion addresses. Existing old-style keys simply age out.
- **Remaining:** the global limit (120 per hour) means a determined attacker with many addresses can exhaust it and block feedback for everyone. This is an availability trade-off, accepted. Preview deployments (`VERCEL_ENV=preview`) use the per-instance fallback limiter if the shared one errors.

### F3. Supabase (live inspection, read-only)

| Item | Result |
|---|---|
| Tables | `events`, `feedback`, `profiles`, `rate_limits`, all with RLS enabled. No views. |
| `events` | Policy "Public read published events" SELECT only. `anon` and `authenticated` hold only SELECT. Nobody but the service role can insert, update or delete. **Already protected.** |
| `feedback` | RLS on, no policies, **no grants** to `anon`/`authenticated`. Unreadable and unwritable from the public API. **Already protected.** |
| `rate_limits` | Same. **Already protected.** |
| Functions | Only `check_rate_limit` (service role only) and `notify_feedback` (no callable roles; trigger already removed). Both `SECURITY DEFINER` with an empty `search_path`. |
| Storage | No buckets. |
| Edge Functions | `ai-feedback` and `feedback-email` were ACTIVE and inert (returned 410). **Deleted 2026-11-15** after confirming no code references them and 0 invocations in 24 hours. `supabase functions list` is now empty. |
| Service-role key in bundles | **Not present.** Scanned `dist/` and `ios/App/App/public/`: one JWT, role `anon`. The string `sb_secret_` appears only inside supabase-js's own key-format check. |
| Constraints | `feedback.message` 1 to 12000 characters; `type` is now limited to `feedback` and `report` (migration `retire_get_involved_type`, applied 2026-11-15, 0 rows of the old type, all 15 rows kept). |
| Advisors | `rls_enabled_no_policy` on `feedback` and `rate_limits` (INFO, intended). `pg_net` in the public schema (WARN, unused by the app). Leaked-password protection off (WARN, only relevant if sign-ups are on). |

Repository SQL (`supabase/security/`) matches what is live for events, feedback, rate limiting and the function; `03` is the only file not applied.

**S1 / V2. Student data in `public.profiles` (Confirmed, High) Fixed and verified 2026-11-15.**

- **Evidence before the fix:** 4 legacy accounts with first and last name, school, city, grade, state and division, all `is_private = false`. The policy `read own or public profiles` let any authenticated user read every row. `GET /auth/v1/settings` (public, read-only) reported `disable_signup: false` and `mailer_autoconfirm: true`, so anyone with the public anon key could create an account with no email confirmation and become authenticated. A simulated signed-in user with no profile (role switched inside a rolled-back transaction) saw **4 of 4 rows with names**. Not exercised against the real signup endpoint, because that would have created a production account.
- **Dependencies checked:** no application code reads the table (`profileService.js` was removed in `889d68b`); no views, functions, triggers or realtime publications reference it; no one has signed in since 2026-07-31; the only foreign key is `profiles.id` to `auth.users`.
- **Fix applied (migration `lock_profiles_least_privilege`):** all privileges on `public.profiles` revoked from `anon` and `authenticated`, and the read policy narrowed to the user's own row so access stays closed even if a privilege is granted again. Script and rollback: `supabase/security/04_lock_profiles.sql`.
- **Verified after:** 4 profile rows and 4 users intact, 0 client grants left, the simulated signed-in user now gets `permission denied for table profiles`, and an anonymous REST read returns 401 `permission denied`. No data was changed or deleted.
- **Still open:** sign-ups are still enabled. They no longer expose any student data, but they let anyone create accounts. Turn them off (section 12, step 1). The tools available could not change Auth settings.

### F4. API input handling (Already protected, tests added)

Methods limited to POST (and OPTIONS for the app origin). Body limit 32 KB (config plus a post-parse length check). Content-Type must be JSON. `type` is an enum; `message` is a string clamped to 5000 characters with control characters removed; unknown, nested and `__proto__` fields are ignored and never stored; non-string types are rejected. Errors are generic and never include database or provider details. The email is plain text only with a fixed subject and a recipient from the environment.

Added: the `page` value is accepted only if it is a plain in-app path, since it goes into the email. Tests cover non-object bodies, arrays, bad JSON, nested objects, header-injection attempts in `page`, HTML in the message, and a failing database that throws with secrets in its message.

### F5. Injection and the SVG rendering (Potential risk, Low) **Hardened**

- **`dangerouslySetInnerHTML`:** one use, `RowIcon` in `src/screens/resources/resourcesShared.jsx`. Its input is `YOUTUBE_SVG`, a constant in `resourceSearch.jsx`, passed through the Resources index and Quick Actions. No external or user data reaches it, so it is **not exploitable today**.
- **Fix:** `isSafeSvgFragment` (`src/utils/safeUrl.js`) allows only a flat list of self-closing shape elements with allow-listed attributes. Anything else falls back to a normal icon. The real icon passes (tested against the live index); script tags, event handlers, links, `foreignObject`, style attributes and oversize input are rejected.
- **No other** `innerHTML`, `eval`, `new Function` or `document.write`. React escapes all other rendering. Feedback and report content is never displayed in the app.
- **Links:** every link is a constant in `src/data`, except an event's source URL, which comes from the `events` table (writable only by the service role today). `safeHttpUrl` now restricts it to http(s).
- **Prototype pollution:** no deep merges of user input; the API reads named fields only (tested).

### F6. Resource exhaustion and ReDoS (Potential risk, Low) **Hardened**

- The Coach engine ran on every keystroke of the Resources search with no length limit. Probes with 50,000-character hostile strings (repeated characters, near-match phrases, punctuation, combining marks, emoji, NULs) completed quickly, so **no catastrophic backtracking was found**, but cost grew with input size.
- **Fix:** the Coach truncates input to 500 characters; Resources and Help search truncate to 200; the search boxes have `maxLength=200`.
- **Tests:** `resource-limits.qa.test.js` (budgets of 0.5 to 1.5 seconds on 50,000-character inputs, and a 2,000,000-character input that must not cost more than a short one).
- Search remains synchronous and client-side. No artificial delay was added.

### F7. Client auth storage (Info) **Hardened**

The Supabase client was configured to persist and refresh a session although the app has no accounts. It now sets `persistSession`, `autoRefreshToken` and `detectSessionInUrl` to false, so no token is ever stored in `localStorage` or read from a URL.

### F8. HTTP, CORS and cache (Already protected, one tightening)

- **CORS:** `Access-Control-Allow-Origin` is sent only for the exact origin `capacitor://localhost`, with `Vary: Origin`, methods `POST, OPTIONS`, header `Content-Type`. Other origins get no CORS headers and a 403 or 405 (tested). No wildcard.
- **Origin check** is not authentication: a script can send any Origin. The rate limits are the real control.
- **Cache:** API responses send `Cache-Control: no-store`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`. The `Origin` response varies by `Vary`. No user-specific data is returned, so cache poisoning has nothing to poison.
- **Site headers** (`vercel.json`): CSP (`script-src 'self'`, `object-src 'none'`, `frame-ancestors 'none'`, `base-uri 'self'`, `upgrade-insecure-requests`), HSTS 2 years with subdomains, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`.
- **Changed:** `img-src` no longer allows any https host (the app loads no remote images; checked the built CSS and JS and the event image loader). Added `Cross-Origin-Opener-Policy: same-origin`.
- **Remaining:** `style-src 'unsafe-inline'` (React inline styles). HSTS has no `preload` (adding it is permanent, so left to you).
- **Request smuggling and HTTP/2 abuse** are properties of Vercel's edge, not of this code. No application-level workaround is appropriate; keep the project on Vercel's current runtime and watch their advisories.

### F9. Cryptography, tokens and secrets (Already protected)

- No `Math.random()` for anything security-related. Two uses remain on purpose: a fallback ICS event UID and a local calendar item id. Neither authorizes anything.
- No hardcoded credentials, no secret comparisons (so no timing issue), no JWT verification in app code. Hashing is described in F2.
- Git history (176 commits) was searched for JWT-shaped strings, `.env` and key files, and `RESEND_API_KEY` or `SUPABASE_SERVICE_ROLE_KEY` assignments. Nothing found. `.env` exists locally but is untracked. **No rotation needed on the evidence available.** The earlier backup of feedback data lives outside the repo and is mentioned in `SECURITY.md`.

### F10. Capacitor iOS (Configuration reviewed only, **Not verified on a device**)

- No App Transport Security exceptions, no `server.url`, no cleartext, no `allowNavigation`, no URL scheme or associated domain registered, no extra permission strings in `Info.plist`. Plugins: app, browser, filesystem, keyboard, local-notifications, share, splash-screen, status-bar. Filesystem and Share are used only to write and share one ICS file.
- External links open through `@capacitor/browser`, and only http(s) links to other sites.
- `routeFromAppUrl` (deep links) is hardened: it now refuses double-slash and backslash paths, so a crafted link cannot become a protocol-relative address or throw. It is currently unreachable because no scheme or universal link is registered. Tested.
- **Gap and status:** Vercel's CSP header does not apply to the bundled app, which loads from `capacitor://localhost`. A CSP meta tag is now **built and tested but off by default**, because a wrong policy shows a blank screen and that can only be ruled out on a device. `scripts/nativeCsp.mjs` builds the policy and `NATIVE_CSP=1 node scripts/buildNative.mjs` adds it to the app's `index.html`. Checked on Windows: the real production build has no inline script, no `eval` or `Function`, and loads everything from its own origin; with the policy applied, a desktop browser rendered Home, Events (67 events from Supabase), Calendar, Resources and Help with fonts and zero CSP violations. **Not checked: the iOS WebView itself.** Enable it only after the device check in `docs/IOS_BUILD.md`, "Native CSP check".
- Nothing in this audit was run on macOS or iOS.

### F11. Dependencies and supply chain (Fixed)

- `npm audit` now reports **0 vulnerabilities** (production and development). The 4 moderate findings came from one dev-only chain (`@capacitor/assets` to `@trapezedev/project` to `xcode` to `uuid@7`, fixed in `uuid` 11.1.1). It is pinned with an `overrides` entry in `package.json`. `xcode` still parses the real iOS project and generates identifiers after the override. No breaking upgrade was needed.
- **Not in the production bundle:** `@capacitor/assets` is a dev dependency, `npm audit --omit=dev` was clean before and after, and `uuid` does not appear in `dist/`.
- No install scripts were added. No GitHub Actions exist. `codemagic.yaml` keeps secrets in Codemagic variable groups and integrations, not in the file.
- Capacitor packages are on 7.x. An unused-dependency check was not run.

## 4. Already protected

Public read of private feedback and rate-limit data (no grants, RLS on); writes to `events` (no policy, no grant); privileged RPCs (service role only); service-role key in bundles (absent); SQL injection through the API (parameterized client calls, enum and length validation); CSRF and cross-site calls (origin check, no cookies or sessions); clickjacking (`frame-ancestors none`); MIME sniffing; email injection (fixed subject, fixed recipient, plain text); cache poisoning of API responses (`no-store`); hardcoded secrets in git; stored XSS (feedback is never rendered); open redirects (no redirect endpoints); mixed content (https only).

## 5. Do not apply to TSA Hub

Session fixation, JWT validation weaknesses and token timing attacks (no sessions or tokens issued by the app); password storage or credential stuffing (no logins); authorization bypass inside the app (no roles); file upload attacks (none); server-side request forgery (the server only calls Resend at a fixed URL); GraphQL and WebSocket abuse (not used by the app); native deep-link hijacking (no scheme registered).

## 6. Residual and accepted risks

See section 13.

## 7. Verification performed

| Check | Result |
|---|---|
| `npx vitest run` | 6,482 tests pass (43 files) |
| `npm run build` | passes |
| `npm audit` (with and without `--omit=dev`) | 0 vulnerabilities |
| Bundle scan for service-role or Resend keys | none |
| Git history scan | no secrets |
| Supabase RLS, grants, functions, buckets, constraints, advisors, edge functions | inspected live, read-only |
| Static analysis | no ESLint config exists in the repo; searched for `dangerouslySetInnerHTML`, `innerHTML`, `eval`, `Function(`, `Math.random` by hand |

## 8. Regression tests added

`clientIp.test.js`, `safeUrl.test.js`, `resource-limits.qa.test.js`, additions to `submitFeedback.api.test.js` and `native/__tests__/platform.test.js`.

## 9. Live checks to run yourself (low volume)

```bash
# 403 for an untrusted origin, 405 for GET, 400 for an empty body from the site's own origin
curl -s -o /dev/null -w "%{http_code}\n" -X POST https://tsa-hub.vercel.app/api/submit-feedback -H "Content-Type: application/json" -H "Origin: https://evil.example" -d "{}"
curl -s -o /dev/null -w "%{http_code}\n" https://tsa-hub.vercel.app/api/submit-feedback
curl -s -o /dev/null -w "%{http_code}\n" -X POST https://tsa-hub.vercel.app/api/submit-feedback -H "Content-Type: application/json" -H "Origin: https://tsa-hub.vercel.app" -d "{}"
# Security headers on the site
curl -sI https://tsa-hub.vercel.app/ | grep -iE "content-security|strict-transport|cross-origin-opener|x-frame|nosniff"
# Can the public anon key read private tables? Expect 401/403/empty, never rows
curl -s "$SUPABASE_URL/rest/v1/feedback?select=*&limit=1" -H "apikey: $ANON_KEY"
```

## 10. Verifying the live Supabase configuration

Tables, policies, grants, functions, buckets, constraints, advisors and Edge Functions were inspected live (read-only) and match the repository SQL. Auth sign-up status can be read without a login from `GET /auth/v1/settings` (`disable_signup`, `mailer_autoconfirm`). Still dashboard-only: Authentication > Attack Protection (leaked-password protection, rate limits), Project Settings > API (whether the legacy `service_role` JWT has been rotated) and Network restrictions.

## 11. What changed in code

`api/_lib/security.js` (IP derivation, keyed hash), `api/submit-feedback.js` (surrogates, page sanitising, keyed hashes), `src/utils/safeUrl.js` (new), `src/screens/resources/resourcesShared.jsx`, `src/screens/calendar/CalendarPanels.jsx`, `src/native/platform.js`, `src/services/supabase.js`, `src/services/chatbot/engine.js`, `src/screens/resources/resourceSearch.jsx`, `src/data/helpContent.js`, four search inputs, `vercel.json`, `.env.example`; deleted `src/services/profileService.js`; new `supabase/security/04_lock_profiles.sql`.

## 12. Final status

### Completed and verified

| Item | How it was verified |
|---|---|
| V1 unpaired surrogate | Postgres rejection reproduced read-only; unit tests |
| V2 / S1 `profiles` exposure | Role-simulation queries before and after; an anonymous request returns 401; 4 profiles and 4 users intact |
| Legacy accounts do not affect the app | See S2 below |
| `feedback.type` allowed `get-involved` | Constraint is now `feedback` or `report`; no rows lost |
| Retired Edge Functions | Deleted; `supabase functions list` is empty |
| Production deployment | `027124d` (includes `889d68b` and `fa03ddf`) is READY on Vercel production |
| Feedback and report submissions in production | One test submission of each type on 2026-11-15 returned `{"ok":true}` and both rows exist. Vercel runtime logs show no error or warning (the handler logs one when the email provider rejects). Inbox delivery was not checked. |
| Rate limiting and IP handling in production | Nine requests with rotating forged `X-Forwarded-For` and `X-Real-IP` shared one bucket (400 seven times, then 429). The 429 body is generic. |
| CORS, headers, caching, errors | 405 GET, 403 untrusted origin, 415 wrong content type, 405 and no CORS headers for another origin's preflight, 204 with `Access-Control-Allow-Origin: capacitor://localhost` for the app, `Cache-Control: no-store`, generic JSON errors. Site: CSP, HSTS, COOP, frame, nosniff, referrer and permissions policies |
| Public events load | 79 events returned to an anonymous client; `feedback`, `rate_limits`, `profiles` and the backup schema are unreadable |
| `RATE_LIMIT_SALT` | Set as a Sensitive variable for Production and Preview, never displayed |
| Dependencies | `npm audit`: 0 vulnerabilities (with and without `--omit=dev`); `uuid` pinned to 11.1.1 through `overrides`; `npm ci --dry-run` resolves |
| GitHub | Dependabot alerts enabled (204), secret scanning and push protection enabled, 0 open alerts of either kind |
| Secrets in git | All branches' added lines scanned for JWTs, Resend keys, `sb_secret_` keys, private keys, AWS and GitHub tokens: no matches. No `.env`, key or provisioning files tracked. Contents were not displayed. |
| Native project on Windows | `node scripts/buildNative.mjs` builds the bundle and `cap sync ios` finds all 8 plugins and leaves the git tree clean. The synced app has no CSP (off by default) |
| Automated tests and build | 6,482 tests pass, production build passes |

**S2. Legacy Supabase accounts (reviewed, nothing deleted).**

- **Facts:** 4 email accounts, all confirmed, created 2026-07-23 or later, last sign-in 2026-07-31, no phone numbers, one provider (`email`), each with user metadata, 4 profile rows (role `student`) linked one to one, and 1 live session with 167 refresh tokens.
- **The app does not depend on them:** no code reads `auth` or `profiles`; the Supabase client no longer stores sessions; no function, view, trigger or realtime publication uses them; `grep` finds no reference to the Edge Functions that were deleted.
- **Access:** anonymous clients and a signed-in user who owns none of the rows both get "permission denied" on `profiles`, and no client role has any privilege on it. The schema `security_backup_20261030` (a copy of events, feedback and profiles made before the first hardening) is not exposed through the API (`PGRST106`) and neither client role has USAGE on it.
- **Would deleting them help?** A little, and only as data minimization. The accounts hold email addresses (in `auth.users`) and names, schools and cities (in `profiles`) of students who may be minors, and nothing needs them. Deleting reduces what exists to leak through a future mistake, a dashboard or backup exposure, or a legal request, and it removes the live session and tokens. It does not fix any current vulnerability. It would not remove the copy in `security_backup_20261030` or in Supabase's own backups, so a full removal also means dropping that schema and waiting for backups to age out. It cannot be undone. If you decide to delete, export the data first and do it from Authentication > Users (this removes the matching `profiles` rows), then drop the backup schema. Nothing was deleted.

### Awaiting native iOS testing

| Item | Needs |
|---|---|
| Native CSP (built, tested, off by default) | The "Native CSP check" in `docs/IOS_BUILD.md` on a TestFlight build, then set `NATIVE_CSP=1` |
| Compile, signing and App Review behaviour of the whole iOS app, external-link sheet, local notifications, `.ics` share sheet, keyboard, safe areas, offline launch | First Codemagic run and a real iPhone. Nothing has been compiled or run on macOS or iOS |

### Requires your Apple Developer account

Enrolment, registering the Bundle ID, the App Store Connect app record and API key, the Codemagic integration named `TSA Hub App Store Connect`, running the `iOS TestFlight` workflow, screenshots, and submission. The unsigned `iOS compile check` workflow does not need an account.

### Requires dashboard access

1. **Supabase: turn off sign-ups** (exact steps in the final message and below).
2. **Supabase: decide about the legacy accounts** (S2).
3. **Optional, Supabase:** enable leaked-password protection (only matters if sign-ups stay on) and move `pg_net` out of the public schema.
4. **Optional, GitHub:** Dependabot security updates (automatic fix pull requests).
5. **Optional, Vercel:** nothing required.

Turn-off steps: Supabase Dashboard > project `TSA Portal` > Authentication > Sign In / Providers > Email > switch off **Allow new users to sign up** > Save. Then check: `curl -s "$VITE_SUPABASE_URL/auth/v1/settings" -H "apikey: $VITE_SUPABASE_ANON_KEY"` should show `"disable_signup":true`. If it is on, an unauthenticated request to `/auth/v1/signup` is refused (do not test this by creating an account).

### Optional improvements that can wait

- Delete the legacy accounts and the backup schema (S2).
- Delete the test rows in `feedback` that begin with "TEST", including the two added on 2026-11-15.
- A retention rule for `feedback`.
- HSTS `preload`, tightening `style-src 'unsafe-inline'`, an ESLint config, an unused-dependency check.
- Universal Links (needs an Associated Domains entitlement).

## 13. Accepted risks and remaining limitations

- Anyone can send feedback up to the limits. The global cap (120 per hour) can be exhausted by an attacker with many addresses, blocking feedback for everyone for up to an hour.
- Origin and Host checks do not stop scripted clients; the rate limits are the real control.
- Feedback and reports may contain personal information typed by users, are stored until you delete them, and are emailed to the maintainer. 15 earlier rows and 2 test rows from 2026-11-15 exist and were left untouched.
- Hosting providers see IP addresses in their own logs.
- `style-src 'unsafe-inline'` (React inline styles). HSTS has no `preload` (permanent, so left to you).
- Future tables in the `public` schema get default grants to `anon` and `authenticated` (Supabase default). Enable RLS and review grants on every new table.
- Preview deployments use the per-instance fallback limiter if the shared one errors, and have no service key, so they cannot write feedback.
- Vercel's IP-header behaviour is confirmed by its documentation and by the production test, not by reading its source. Request smuggling and HTTP/2 abuse are Vercel's to defend.
- Nothing was run on macOS or iOS.
