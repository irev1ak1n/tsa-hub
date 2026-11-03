# iOS release readiness

Legend: **Done** = implemented and verified here. **Done, unverified on device** = implemented, builds and unit-tests pass, but it needs a Mac or iPhone to confirm. **Blocked** = waiting on something only the owner can provide. **Manual** = a step you do in Xcode, App Store Connect or by email.

Last updated 2026-11-03.

## Web app (the same code the iOS app bundles)

| Item | Status |
| --- | --- |
| Production build (`npm run build`) | Done |
| Unit and integration tests (6,349, `npm test`) | Done |
| Crawl of every in-app route (84 pages) for console errors, 404s and broken images | Done, none found |
| Layout overflow check at 375 px and 768 px across 16 routes | Done, none found |
| Accessibility scan (names on buttons, links, inputs, image alt text) across 11 routes | Done; three list pages have no `h1` (Events, Event Search, Resource Search), cosmetic |
| Security headers, rate limiting, fail-closed API, RLS, verified backup | Done (see `SECURITY.md`) |
| Dependency audit | Done, 0 known vulnerabilities (upgraded `vite` 5 to 7 and `react-router-dom` 6 to 7) |
| Leftover Project Management text and routes | Done, removed; the old route shows the 404 page |
| Fonts self-hosted (no request to Google Fonts; tightened the CSP to match) | Done |
| Events list cached for offline launches | Done |
| Crash screen instead of a blank page | Done |
| Linting and type checking | Not available: the project has no ESLint config and no TypeScript. Add them later if wanted; nothing was invented to claim a pass. |

## iOS project

| Item | Status |
| --- | --- |
| Capacitor 7 project in `ios/`, app name "TSA Hub", bundle id `com.tsahub.app` (placeholder) | Done, unverified on device |
| App icon (1024 px, opaque) and splash screens generated from the existing icon | Done |
| Launch behavior: splash held until first paint, then fades out | Done, unverified on device |
| Status bar overlay, text color follows light/dark theme | Done, unverified on device |
| Safe areas: tab bar and content padding include bottom inset; notch insets on the sides | Done, unverified on device |
| Keyboard: native resize, focused field scrolled into view | Done, unverified on device |
| External links open in the in-app Safari sheet; `mailto:` handed to Mail | Done, unverified on device |
| Reminders as OS local notifications, permission asked only when a reminder is set | Done, unit-tested with a mocked plugin; unverified on device |
| Calendar export via the share sheet (`.ics`) | Done, unverified on device |
| Deep link handler (`appUrlOpen`) | Done in code. Universal Links additionally need an Associated Domains entitlement and an `apple-app-site-association` file; not set up because nothing links into the app yet. |
| App can reach its API: absolute API base URL in native builds, CORS for `capacitor://localhost` with tests | Done, unit-tested; unverified from a real device |
| Privacy manifest, export-compliance flag, no unused permission strings | Done |
| `ios/` committed with LF line endings, generated folders ignored | Done |
| Codemagic cloud-build config (`codemagic.yaml`): unsigned compile check and signed TestFlight workflows, no secrets in git, shared Xcode scheme | Done on Windows (config parsed and tested); **unverified until the first Codemagic run** |
| Create the Codemagic account, add the app, add the `tsa_hub_web_env` variables, run **iOS compile check** | **Manual** (no Apple account needed) |
| `pod install`, Xcode compile for Simulator and device | **Manual**: happens in the compile check workflow |
| Run on a real iPhone and iPad (via TestFlight) | **Manual** |

## App Store

| Item | Status |
| --- | --- |
| Privacy policy and terms rewritten to match the app; public URL available | Done, legal review **Blocked** on you |
| Metadata, keywords, review notes, privacy labels drafted (`docs/APP_STORE.md`) | Done |
| Permission from TSA for name, content and officer photos | **Blocked** (highest rejection risk) |
| Age gate or consent decision for the Get Involved form (under-13 users) | **Blocked** (needs legal or school input) |
| Enroll in the Apple Developer Program | **Blocked** (your account and payment) |
| Register the real Bundle ID, create the App Store Connect app record and API key, add the Codemagic integration | **Manual** (needs enrollment) |
| Run the **iOS TestFlight** Codemagic workflow | **Manual** (needs enrollment) |
| Screenshots (6.9-inch iPhone and 13-inch iPad) | **Manual** (no Simulator on Windows: capture from the TestFlight build on a real iPhone and iPad) |
| TestFlight upload, internal testing, external beta review | **Manual** |
| Delete the 7 production `feedback` rows that begin with "TEST" | **Manual** (production data; deliberately not touched) |
| Submit for App Review | **Manual** |

## Known limitations and risks

- **Guideline 4.2 (minimum functionality).** Apple can reject apps that look like a wrapped website. The app has bundled content, offline use, local notifications and a share-sheet export; show these in screenshots and review notes.
- **Local data is per install.** Saved events, the personal calendar and settings live on the device. Deleting the app deletes them, and the website's data does not carry over. An export/import path is a sensible post-launch addition.
- **Events need one online launch.** The first launch with no network and no cache shows the retry screen.
- **Rate limits are per IP.** Many students on one school or carrier network share a limit (8 submissions per 10 minutes). Watch real usage after launch.
- **Anyone can send API requests.** The origin check blocks browsers on other sites, not scripts. Consider Apple App Attest if abuse appears.
- **Supabase advisories left as is.** `pg_net` sits in `public`, and leaked-password protection is off (the app has no password sign-in, so it does not apply). Both are in the security runbook.
- **Test data in Supabase** (see the table above).
