# TSA Hub security audit

Audit date: 2026-11-15. Scope: the repository, the live Supabase project `TSA Portal` (read-only queries through the Supabase tools), the Vercel configuration files, and the Capacitor iOS project files. Nothing was changed in production. No load, scan or attack traffic was sent to any live service.

This is a review of what could be inspected, not a guarantee. Passing tests do not make the app secure. Items marked **Not verified** need a person to check them in a dashboard or on a real device.

## 1. Summary

| | Count |
|---|---|
| Confirmed vulnerabilities | **1** (Low) |
| Potential risks hardened in code | 7 (all Low or Info) |
| Potential risk needing your action | 1 (**Medium to High if sign-ups are on**, see S1) |
| Already protected | 12 areas |
| Attack classes that do not apply | 7 |

Confirmed: V1, feedback with an unpaired Unicode surrogate returned a 500 and used up the sender's rate-limit allowance.

The most important open item is S1: `public.profiles` holds names and schools of 4 real students and is readable by any signed-in user. Whether the public can sign in depends on a Supabase Auth setting that could not be read. See section 3 and the manual steps in section 12.

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
| Edge Functions | `ai-feedback` and `feedback-email` are ACTIVE, `verify_jwt = true`, and their source only returns 410. The anon key is a valid JWT, so the JWT check does not stop anyone calling them, but they do nothing. Recommend deleting (S3). |
| Service-role key in bundles | **Not present.** Scanned `dist/` and `ios/App/App/public/`: one JWT, role `anon`. The string `sb_secret_` appears only inside supabase-js's own key-format check. |
| Constraints | `feedback.message` 1 to 12000 characters; `type` still allows `get-involved` (see S2). |
| Advisors | `rls_enabled_no_policy` on `feedback` and `rate_limits` (INFO, intended). `pg_net` in the public schema (WARN, unused by the app). Leaked-password protection off (WARN, only relevant if sign-ups are on). |

Repository SQL (`supabase/security/`) matches what is live for events, feedback, rate limiting and the function; `03` is the only file not applied.

**S1. Student data in `public.profiles` (Potential risk, Medium to High if sign-ups are enabled) Not fixed in production.**

- **Evidence:** the table holds first and last name, school, city, grade, state and division for 4 legacy accounts, all `is_private = false`. The policy `read own or public profiles` lets any authenticated user read them. Whether a stranger can become authenticated depends on whether email sign-ups are enabled in Supabase Auth. That setting cannot be read from SQL and was not available through the tools used.
- **Exploitation (if sign-ups are on):** call `/auth/v1/signup` with the public anon key, then `GET /rest/v1/profiles`. No app code is needed.
- **App dependence:** none. `profileService.js` was dead code and has been deleted.
- **Prepared fix:** `supabase/security/04_lock_profiles.sql` (own row only, with rollback and a stricter option). Not applied.
- **Manual:** turn off sign-ups, then run `04`. See section 12.

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
- **Gap:** Vercel's CSP header does not apply to the bundled app, which loads from `capacitor://localhost`. A CSP meta tag would help but could blank the app if wrong, so it was **not added without a device to test it**. Suggested policy to try in a TestFlight build: `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; img-src 'self' data: blob:; connect-src 'self' https://*.supabase.co https://tsa-hub.vercel.app; object-src 'none'; base-uri 'self'; form-action 'none'`.
- Nothing in this audit was run on macOS or iOS.

### F11. Dependencies and supply chain

- `npm audit --omit=dev`: **0 vulnerabilities** in what ships.
- `npm audit`: 4 moderate, all in the dev-only chain `@capacitor/assets` to `@trapezedev/project` to `xcode` to `uuid` (missing buffer bounds check in uuid v3/v5/v6 when a buffer is passed). It runs only on your machine to generate icons, never in the app. The only automatic fix downgrades `@capacitor/assets`, so it was left. Re-check on upgrade.
- No install scripts were added. No GitHub Actions exist. `codemagic.yaml` keeps secrets in Codemagic variable groups and integrations, not in the file; the compile-check workflow needs no Apple account.
- Capacitor packages are on 7.x. `npm outdated` could not run (the C: drive is full, see section 12).
- An unused dependency check was not run; the production dependency list is short and all are imported.

## 4. Already protected

Public read of private feedback and rate-limit data (no grants, RLS on); writes to `events` (no policy, no grant); privileged RPCs (service role only); service-role key in bundles (absent); SQL injection through the API (parameterized client calls, enum and length validation); CSRF and cross-site calls (origin check, no cookies or sessions); clickjacking (`frame-ancestors none`); MIME sniffing; email injection (fixed subject, fixed recipient, plain text); cache poisoning of API responses (`no-store`); hardcoded secrets in git; stored XSS (feedback is never rendered); open redirects (no redirect endpoints); mixed content (https only).

## 5. Do not apply to TSA Hub

Session fixation, JWT validation weaknesses and token timing attacks (no sessions or tokens issued by the app); password storage or credential stuffing (no logins); authorization bypass inside the app (no roles); file upload attacks (none); server-side request forgery (the server only calls Resend at a fixed URL); GraphQL and WebSocket abuse (not used by the app); native deep-link hijacking (no scheme registered).

## 6. Residual and accepted risks

- Anyone can send feedback up to the limits; the global cap can be exhausted, which blocks feedback for everyone for up to an hour.
- Origin and Host checks do not stop scripted clients.
- Feedback and reports may contain personal information typed by users. They are unauthenticated, stored indefinitely until you delete them, and emailed to the maintainer.
- Hosting providers see IP addresses in their own logs.
- The 13 existing `feedback` rows and the 4 `profiles` rows were left untouched.
- `style-src 'unsafe-inline'`.
- Future tables created in the `public` schema get default grants to `anon` and `authenticated` (Supabase default). Enable RLS on every new table and review its grants.

## 7. Verification performed

| Check | Result |
|---|---|
| `npx vitest run` | 6,461 tests pass (42 files) |
| `npm run build` | passes |
| `npm audit --omit=dev` | 0 vulnerabilities |
| `npm audit` | 4 moderate, dev-only (F11) |
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

The repository SQL could be compared with live state for tables, policies, grants and functions. These were **not** available and need the dashboard: Authentication > Sign In / Providers (are email sign-ups enabled?), Authentication > Attack Protection (leaked-password protection, rate limits), Project Settings > API (which keys exist and whether the legacy `service_role` JWT has been rotated), and Network restrictions.

## 11. What changed in code

`api/_lib/security.js` (IP derivation, keyed hash), `api/submit-feedback.js` (surrogates, page sanitising, keyed hashes), `src/utils/safeUrl.js` (new), `src/screens/resources/resourcesShared.jsx`, `src/screens/calendar/CalendarPanels.jsx`, `src/native/platform.js`, `src/services/supabase.js`, `src/services/chatbot/engine.js`, `src/screens/resources/resourceSearch.jsx`, `src/data/helpContent.js`, four search inputs, `vercel.json`, `.env.example`; deleted `src/services/profileService.js`; new `supabase/security/04_lock_profiles.sql`.

## 12. Manual steps

**Supabase** (highest priority first)
1. Authentication > Sign In / Providers: turn **off** "Allow new users to sign up" (the app has no accounts). Then run `supabase/security/04_lock_profiles.sql` in the SQL editor. Decide whether to delete the 4 legacy users and profile rows.
2. Edge Functions: delete `ai-feedback` and `feedback-email`.
3. Optionally run `supabase/security/03_retire_get_involved.sql` (it refuses to run if any such row exists).
4. If sign-ups stay on for any reason, enable leaked-password protection.
5. Optionally move `pg_net` out of the public schema (advisor warning).

**Vercel**
6. Add `RATE_LIMIT_SALT` (a long random value) to Production and Preview. Optional, the service-role key is used otherwise.
7. After the next deploy, run the curl checks in section 9.
8. Remove `RESEND_API_KEY` or `FEEDBACK_TO_EMAIL` only if you ever retire feedback; they are in use.

**GitHub:** nothing required. Enable Dependabot alerts and secret scanning if not already on.

**Codemagic and Apple Developer:** nothing required from this audit. When you have a first TestFlight build, test on a device: external links open in the in-app browser, feedback sends, and try the suggested native CSP from F10 before adding it.

**Your computer:** the C: drive reported 0 GB free while running `npm` (the npm cache lives there). Free some space or builds and installs will fail.
