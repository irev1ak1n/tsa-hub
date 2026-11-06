# Privacy and data collection audit

Audit date 2026-11-03, based on the code in `main`, the live Supabase project (read-only queries) and the Vercel deployment. The public Privacy Policy (`/privacy`) and Terms (`/terms`) were rewritten from this audit. Re-run it before any release that adds a feature, SDK or permission.

This is an engineering inventory, not legal advice. Items that need a legal or manual decision are marked **DECISION**.

## 1. Summary

- No accounts exist in the app, no analytics, no advertising, no crash reporting, no push notifications, no tracking.
- Personal data can still reach us in four ways: free text in Feedback messages, technical data (IP address and device details) seen by Vercel, Supabase and Resend, a hashed IP in the rate limiter, and **legacy account data still stored in Supabase** (section 4).
- Get Involved has been removed everywhere. No Get Involved records exist in the database (0 rows of that type at audit time).

## 2. Data inventory

| Data | Where it is stored | Purpose | Shared with | Retention |
| --- | --- | --- | --- | --- |
| Theme, chosen state, saved event ids, Quick Actions layout (`localStorage` key `tsa-hub-state-v1`) | The user's device only | Remember choices | Nobody | Until the user deletes the app or site data |
| Personal calendar items, notes, reminder settings (IndexedDB `tsa-hub-personal-calendar`) | Device only | Personal calendar | Nobody | Same |
| Saved events list (`tsa-hub-events-cache-v1`, public data) | Device only | Offline use | Nobody | Same |
| Recent searches (`ev-recent`, `rs-recent`), calendar view (`tsa-hub-calendar-view`), open section (`sessionStorage rs-conf-open`) | Device only | Convenience | Nobody | Same (session item clears when the tab closes) |
| Search and TSA Coach questions | Processed in the browser, not sent anywhere | Answer the question | Nobody | Not stored |
| Local reminders | Scheduled by iOS (native app) or held in the open browser tab (web) | Remind the user | Nobody | Until fired or cancelled |
| Notification permission | iOS or the browser | Allow reminders | Nobody | Controlled by the user in system settings |
| `.ics` calendar export | Written to the app cache then handed to the iOS share sheet | Add to calendar | Whatever app the user picks | Cache is cleared by iOS |
| Event list requests | Supabase API logs (IP address, user agent, time) | Serve public event data | Supabase | Per Supabase plan, **not verified in the dashboard** |
| Page and API requests | Vercel request and function logs (IP address, user agent, URL, status) | Hosting and security | Vercel | Per Vercel plan, **not verified in the dashboard**. Our own function logs record error codes only, never message text |
| Feedback messages | Supabase table `feedback` (`id`, `message`, `type`, `created_at`), RLS on with no policies, written only by the server with the service-role key | Fix problems, improve the app | Supabase | **Indefinite. No automatic deletion.** 13 rows at audit time (11 feedback, 2 report, 7 of them test messages). None contained an email-like string |
| Same message as an email notification (message, type, page path, timestamp) | Resend, then the maintainer's inbox | Notify the maintainer | Resend | Per Resend and the mail provider, **not verified** |
| Rate-limit records | Supabase table `rate_limits` (`key`, `window_start`, `hits`). Keys are `feedback:ip:<sha256 of IP>`, `feedback:global`, `feedback:dup:<sha256 of type and message>` | Stop spam and double submits | Supabase | Cleaned opportunistically (rows older than 2 days are deleted on about 2 percent of calls). Oldest row at audit time was 4 days old, so the policy says "a few days" |

Not present anywhere in the code: analytics, advertising IDs, cookies set by TSA Hub, third-party SDKs other than Capacitor plugins (App, Browser, Filesystem, Keyboard, Local Notifications, Share, Splash Screen, Status Bar), location, contacts, photos, camera, microphone, health data, payments, and any account or login screen. Fonts are bundled, so no third-party font requests are made. The Supabase client is configured to persist an auth session, but nothing in the app signs in, so no token is stored.

### Notes on the IP hash

The IP address is hashed with plain SHA-256. IPv4 addresses are few enough that a determined person could reverse the hash, so treat it as pseudonymous, not anonymous. The policy words it as "scrambled (hashed)". A stronger setup is a keyed HMAC with a server-side secret plus a scheduled cleanup job. That needs a new Vercel environment variable, so it was not changed here.

### Apple data collection definition

Apple counts data as "collected" when it leaves the device and is kept longer than needed to answer the request in real time. Message content clearly qualifies. IP addresses in provider logs may also qualify. See section 6.

## 3. Get Involved removal

Removed: the home-screen card and its image, the Settings row, the modal component, its styles (dark and light theme), the client function `submitGetInvolved`, and all server handling (validation, honeypot, per-email rate limit, email template, US state list). The API now accepts only `feedback` and `report`; anything else returns 400 and is never stored or emailed (covered by tests). The Privacy Policy, Terms, README, SECURITY.md and App Store notes were updated.

Left on purpose:

- **Database constraint.** `public.feedback` still allows type `get-involved` in production. `supabase/security/03_retire_get_involved.sql` tightens it. It was **not applied**. There are no such rows.
- **Stored submissions.** None. No records to review or delete.
- "Get involved" in the National Service Project content is TSA's own program text and is unrelated.

## 3b. Contact Support removal (Feedback and Report restored)

Contact Support was removed for good: the Help Center row, its modal and mailto builder, its article, and the Coach's support draft flow. Send Feedback and Report Incorrect Information stay, and neither asks for a name, email, phone number or other contact detail. Report uses one modal (category, description, preview, then sent) from Settings, the Home Quick Action and the Help Center. The route is captured automatically, and there is no page field.

Existing records: `public.feedback` holds 13 rows (11 feedback, 7 of them starting with "TEST", and 2 report), all untouched.

## 4. Legacy account data (needs your review)

The production Supabase project still holds data from an earlier version of the app that had accounts:

- `auth.users`: **4 users**, all with an email address, created between 2026-07-23 and 2026-07-31 (last sign-in 2026-07-31), none anonymous.
- `public.profiles`: **4 rows** with first name, last name, username, grade, division, state, city, school, headline, avatar and cover URLs, privacy flag and role.
- `profiles` has a row-level-security policy that lets **any signed-in user read other users' profiles that are not marked private**. Because the Supabase anon key is public, anyone could create an account through the Supabase API if email sign-ups are still enabled in the Auth settings and then read those profiles.

Nothing in the current app reads or writes these (`src/services/profileService.js` is unused). No data was changed or deleted during this audit.

**DECISION, recommended order:**

1. In Supabase, Authentication, Providers (and Sign In / Up settings), turn off new sign-ups, or confirm they are off.
2. Check whether the 4 accounts are yours or test accounts. If anyone else's, decide whether to notify them.
3. Export if wanted, then delete the 4 `auth.users` rows (this removes the linked profiles) and drop the unused `profiles` table. Delete `src/services/profileService.js`.
4. If you keep any of it, the Privacy Policy needs a section for it. The current policy says TSA Hub has no accounts, which describes the app, and adds a sentence that earlier test accounts can be deleted on request.

## 5. What the policies now say

- **Privacy Policy:** no accounts (and a note about earlier test accounts), what stays on the device, what Vercel and Supabase receive, feedback contents, the hashed IP for spam control, notification permission and what is not requested, links to other sites, the three service providers, a section for students and users under 13, how to request access or deletion, security, changes, contact.
- **Terms and Policies:** independent project, permitted use, check official sources, limits of recommendations, search and Coach, device-only storage, feedback, other websites, ownership, availability, limits of responsibility, younger users, changes, contact.
- Both avoid colons, semicolons, en dashes and em dashes. `src/screens/profile/__tests__/policies.test.js` enforces that, requires the disclaimer, contact address and date, and fails if Get Involved, AI answers or project management come back.
- The feedback window now tells users to leave out personal information and to ask a parent or teacher first if under 13.

## 6. Open items for you

1. **Retention.** Pick a real retention rule for the `feedback` table (for example delete after 12 months) and run it. The policy says messages are deleted when no longer useful, which is only true if you do it. Delete the 7 test rows now.
2. **Provider log retention.** Check Vercel and Supabase log retention for your plan and Resend's email retention, and make the policy match.
3. **COPPA.** The audience includes children under 13. The app does not ask for personal information, has no accounts, tracking or ads, and the only free-text boxes now warn users. Free text can still contain personal information and IP addresses are processed by providers. Whether that is acceptable, and whether to add an age gate or parental notice, needs legal review. Nothing here claims COPPA compliance.
4. **Rate-limit hash.** Optional hardening in the IP-hash note above.
5. **Support and privacy contact.** The policy lists `tsastudentshub@gmail.com`. Make sure that inbox is monitored, since Apple requires a working contact and the policy promises replies to deletion requests.
6. **Legal review** of both documents before the App Store submission.
