# App Store preparation

Everything here is a working draft for the person publishing the app. Apple revises the [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/) and [screenshot specifications](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications/) several times a year, and the automated review could not load Apple's pages. Re-read the live versions before submitting; section numbers below are the long-standing ones and may have moved.

TSA Hub is an independent, student-built project. It is not made, sponsored, approved or endorsed by the Technology Student Association, and no page, screenshot or metadata may suggest otherwise.

## 1. Guideline review

| Area | What Apple checks | Status in TSA Hub |
| --- | --- | --- |
| **2.1 App completeness** | Final build, no crashes, no placeholder content, working demo access | No login needed. No lorem ipsum or "coming soon" screens in the UI. A crash screen exists (`ErrorBoundary`). The production database still holds test feedback rows (see checklist) that do not show in the app. |
| **4.2 Minimum functionality** | A repackaged website is rejected; the app must add app-like value | Offline-capable bundled content, local notification reminders that fire when the app is closed, share-sheet calendar export, saved events and a personal calendar stored on device, event recommender, in-app search and coach. Describe these in the review notes. This is the most likely rejection reason, so keep the native features visible in screenshots. |
| **4.1(c) / 5.2 Intellectual property** | No use of another party's name, logo or content without permission; no implied affiliation | **Open risk, needs your action.** See section 3. |
| **5.1.1 Data collection and storage** | Privacy policy link in the app and in metadata, purpose strings, minimal collection | In-app policy at `/privacy` (public URL `https://tsa-hub.vercel.app/privacy`). No account, no tracking, no ads. Only the optional Feedback and Report forms send data, and their windows tell users to leave out personal information. |
| **5.1.1(v) Account deletion** | Apps with account creation must allow deletion | Not applicable, there are no accounts. Submitted form data can be deleted on request by email (state this in the policy, done). |
| **5.1.2 Data use and sharing / App Tracking Transparency** | Declare tracking; ask permission if tracking | No tracking, no advertising identifiers, no analytics SDKs. No ATT prompt needed. |
| **1.3 / 5.1.4 Kids** | Strict rules for the Kids Category and for apps directed at children under 13 | Do **not** choose the Kids Category (external links would need a parental gate). Middle-school students (about 11 to 14) are in the audience, so see the COPPA note in section 3. |
| **1.2 User-generated content** | Moderation, reporting, blocking for apps showing other users' content | Not applicable. Submissions go privately to the maintainer and are never shown to other users. |
| **2.3 Accurate metadata** | Screenshots and description match the app | Take screenshots from the real build. Do not show other apps' UI or TSA marks beyond what the app displays. |
| **4.0 Design** | Native look, no broken links, works on iPad if declared | Layout verified at 375 px and 768 px widths with no horizontal overflow. iPad is enabled; supply iPad screenshots or remove iPad support (`TARGETED_DEVICE_FAMILY = 1`). |

Technical requirements already handled: privacy manifest (`ios/App/App/PrivacyInfo.xcprivacy`, no tracking, no tracking domains, no required-reason APIs used by app code), `ITSAppUsesNonExemptEncryption = false` (HTTPS only), 1024 px opaque icon, launch screen, no private APIs, no permission prompts other than notifications (requested only when the user sets a reminder).

## 2. App Store Connect metadata (draft)

- **Name** (30 characters max): `TSA Hub` (see the naming risk in section 3 before settling).
- **Subtitle** (30): `Event prep, dates, resources`
- **Category**: Education (primary), Reference (secondary).
- **Age rating**: answer the questionnaire honestly; expected 4+ (no mature content, no unrestricted web access beyond linked official sites, no user-to-user content). Do not select the Kids Category.
- **Keywords** (100 characters, comma separated, no spaces after commas): `student competition,STEM,events,conference,calendar,rules,deadlines,middle school,high school,prep`. Avoid trademarked terms you have no right to use.
- **Promotional text** (170): `Explore competitive events, check requirements, track dates and get event recommendations, all in one place. Independent and student-built.`
- **Description**: reuse the capability sections from `README.md` (events, recommender, search, calendar and reminders, resources, feedback). Open with the independence statement: "TSA Hub is an independent app and is not affiliated with, endorsed by, or sponsored by the Technology Student Association."
- **What's New (1.0)**: `First release of TSA Hub.`
- **Support URL**: a public page with contact info. The Help Center no longer has a contact option, so use `https://tsa-hub.vercel.app/privacy`, which lists the maintainer email `tsastudentshub@gmail.com`. Apple requires a working support contact, so confirm this page is acceptable before submitting.
- **Marketing URL** (optional): `https://tsa-hub.vercel.app`
- **Privacy Policy URL** (required): `https://tsa-hub.vercel.app/privacy`
- **Copyright**: `2026 <your legal name>`.
- **Review notes**: "No sign-in is required. TSA Hub is an independent reference and planning app for students in the Technology Student Association (TSA). It is not operated by TSA. Core features: event browser, event recommender, in-app search, calendar with local reminders, resources. Reminders use local notifications. The Feedback and Report forms send optional messages to the developer. Contact: <your email and phone>."
- **Screenshots**: PNG or JPEG, RGB, no transparency. Apple currently asks for the 6.9-inch iPhone size (1320 x 2868 portrait) and, because iPad is enabled, a 13-inch iPad size (2064 x 2752 portrait); other sizes scale from these. Confirm on Apple's page. From Windows there is no Simulator, so capture them from the TestFlight build on a real iPhone Pro Max and an iPad Pro 13-inch (or borrow one), then check the pixel sizes against Apple's page. Suggested shots: Home, Events list, an Event detail, Recommender result, Calendar with a reminder, Resources, Light theme.

## 3. Items that need you (legal or account decisions)

1. **TSA name, logo and content (highest risk).** The app is named "TSA Hub", shows TSA event names, themes, rules summaries, official PDFs and links, the national officers' photos and biographies, and conference material. "TSA" is a trademark of the Technology Student Association, and the name also reads like the US Transportation Security Administration. Apple rejects apps that imply affiliation or use another party's marks or content without permission (5.2). Before submitting: email TSA National (the contacts listed in the app) and ask for written permission to use the name and to republish or link their material, or rename the app to a name that does not use their mark (a fully distinct name is safest). Keep the "independent, not affiliated" statement everywhere. Do not use the official TSA logo.
2. **Officer photos and biographies.** These identify named students, some under 18. Confirm TSA or each officer's guardian agrees to the use, or remove or replace them for the App Store build.
3. **Children's privacy (COPPA and similar).** The audience includes students under 13. Get Involved is gone, and the app has no accounts, tracking, ads or required personal information. The remaining exposure is free-text messages and IP addresses handled by Vercel, Supabase and Resend. The policy says we do not knowingly collect personal information from children under 13 and tells young users to ask an adult first. Do not describe the app as COPPA compliant. Have a lawyer decide whether that is enough or whether to add an age gate or parental notice. The Kids Category rules do not apply because the app is not in that category.
4. **Privacy policy and terms review.** Both pages were rewritten to match the app, but neither is legal advice. Have the final text reviewed.
5. **Apple Developer Program.** Enroll ($99 per year; an individual or an organization). You need this account to register the Bundle ID, sign, upload to TestFlight and submit. This cannot be done by anyone else.
6. **Bundle ID.** `com.tsahub.app` is a placeholder. Register the real one in the developer portal and update it (see `docs/IOS_BUILD.md`).
7. **Business details.** Seller name shown on the App Store, contact email and phone for App Review, tax and banking only if you ever charge (the app is free, so you can skip agreements for paid apps).
8. **Data held in production.** Delete the test rows in the `feedback` table before launch (they all begin with "TEST") so the first real owner review is clean.

## 4. App Privacy answers (App Store Connect, "App Privacy")

Based on what the app does after the privacy audit (`docs/PRIVACY_AUDIT.md`). The privacy manifest matches this.

- **Do you or your third-party partners collect data from this app?** Yes. Only through the optional Feedback form, plus technical data seen by hosting providers (see the decision below).
- **User Content, Other User Content**: the free-text message in Feedback. Purpose: App Functionality. Linked to the user: No (there is no account, name or email). Used for tracking: No.
- **Contact Info (name, email)**: not collected. Get Involved was removed.
- **Identifiers, Usage Data, Location, Contacts, Health, Financial, Purchases, Browsing history, Search history**: not collected. Search and TSA Coach questions stay on the device.
- **Tracking**: No. No ATT prompt is needed.
- **DECISION, diagnostics and IP address.** Vercel and Supabase receive the IP address and device details of every request and may keep them in logs, and the rate limiter stores a hash of the IP for a few days. Apple counts data kept longer than needed to answer the request in real time. If you judge that these logs count, also declare Diagnostics, Other Diagnostic Data (Purpose: App Functionality, not linked, no tracking). Declaring it is the conservative choice. Confirm the log retention first (see the audit).
- **Third parties that process submitted data**: Supabase (database), Resend (notification email), Vercel (hosting and the API). All act as processors for the developer. Disclose them in the policy if you add or change any.
- **Legacy accounts.** The Supabase project still holds 4 old test accounts (email, profile data). They are not part of the app, but review them before answering the App Privacy questions. See audit section 4.

If a future version adds analytics, crash reporting, accounts or a push provider, update this section, `PrivacyInfo.xcprivacy` and the policy before shipping it.

## 5. What cannot be verified without a Mac and Apple account

- Compiling and archiving the Xcode project, code signing, and upload validation (first checked by the Codemagic builds described in `docs/IOS_BUILD.md`).
- Real-device behavior: safe areas, status bar contrast, keyboard, notification delivery with the app closed, share sheet.
- TestFlight processing and App Review itself.

These were not run during preparation. They are listed in `docs/RELEASE_CHECKLIST.md` as manual steps.
