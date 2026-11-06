# Building TSA Hub for iOS

TSA Hub is one codebase: the React web app is bundled into a [Capacitor](https://capacitorjs.com) iOS project in `ios/`. The website build and deploy are unchanged.

Apple only lets iOS apps be compiled and signed on macOS. If you develop on Windows, use **Codemagic**, a cloud macOS build service. [`codemagic.yaml`](../codemagic.yaml) in the repo root defines the builds, so you never need local Xcode. If you do have a Mac, the local path is at the end of this page.

## Which steps need Apple Developer enrollment?

| Step | Needs a paid Apple Developer Program membership ($99/year)? |
| --- | --- |
| Run all web tests and the production build on Windows | No |
| Create a Codemagic account and connect GitHub | No |
| Run the **iOS compile check** workflow (proves the project builds on macOS) | **No**, no Apple account at all |
| Register the Bundle ID, create the App Store Connect app record | **Yes** |
| Create the App Store Connect API key and add it to Codemagic | **Yes** (Account Holder or Admin role) |
| Run the **iOS TestFlight** workflow (signed build uploaded to TestFlight) | **Yes** |
| Install on an iPhone through TestFlight, add testers | **Yes** |
| Submit to App Review (done by hand in App Store Connect, never by CI) | **Yes** |

Do the compile check first. It tells you whether anything is wrong with the project before you pay for enrollment.

## What is stored where

Nothing secret is committed to GitHub. `codemagic.yaml` only contains names.

| Item | Where it lives |
| --- | --- |
| Apple signing certificate, provisioning profile | Created and kept by Codemagic from your API key; never in the repo |
| App Store Connect API key (`.p8`), Issuer ID, Key ID | Codemagic, Teams, Integrations, App Store Connect |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `APP_STORE_APPLE_ID` | Codemagic app, Environment variables, group `tsa_hub_web_env` (mark them secure) |
| `VITE_API_BASE_URL` | `codemagic.yaml` (public site address, not a secret) |
| `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY` | Vercel only. The iOS build never needs them; do not add them to Codemagic. |

`.gitignore` blocks `*.p12`, `*.p8`, `*.cer`, `*.pem`, `*.key`, `*.mobileprovision`, `*.certSigningRequest`, `AuthKey_*.p8`, `ExportOptions.plist` and `.env*`. A test (`src/native/__tests__/codemagic.test.js`) fails if signing files are tracked or key material appears in `codemagic.yaml`. If an Apple key or certificate is ever committed by mistake, revoke it in Apple Developer or App Store Connect immediately; deleting it from git history is not enough.

## Part 1: Compile check on Codemagic (no Apple account)

1. Make sure the latest code is pushed to GitHub `main`.
2. Sign up at [codemagic.io](https://codemagic.io) with your GitHub account (the free personal plan includes macOS build minutes; check current limits on their pricing page).
3. **Add application**, choose GitHub, select `irev1ak1n/tsa-hub`, and choose **Codemagic.yaml** as the configuration type when asked.
4. Open the app, **Environment variables**, and create a group named exactly `tsa_hub_web_env` with these variables (tick *Secure*):
   - `VITE_SUPABASE_URL`: from your local `.env`
   - `VITE_SUPABASE_ANON_KEY`: from your local `.env`
5. **Start new build**, branch `main`, workflow **iOS compile check (no signing)**.
6. The build installs dependencies, runs the 6,300+ tests, builds the web app for native, runs `cap sync ios` (which runs `pod install`), then compiles the app for the iOS Simulator and for devices, both without signing.
7. If it fails, open the failing step's log. Copy the error to whoever is helping you fix the project; nothing needs to change on your Apple account.

A green compile check means the Xcode project, CocoaPods, all Capacitor plugins and the native code build on macOS. It does not mean the app is signed or uploadable.

## Part 2: Apple Developer enrollment and App Store Connect

Do this once, from any computer:

1. Enroll in the [Apple Developer Program](https://developer.apple.com/programs/enroll/) (individual or organization; an organization needs a D-U-N-S number and takes longer).
2. In **Certificates, Identifiers & Profiles, Identifiers**, register an **App ID** of type App with an explicit **Bundle ID**. The repo uses `com.tsahub.app` as a placeholder. If you choose another, change it in all three places and commit: `appId` in `capacitor.config.json`, `PRODUCT_BUNDLE_IDENTIFIER` (twice) in `ios/App/App.xcodeproj/project.pbxproj`, and `bundle_identifier` in `codemagic.yaml`. The test suite fails if they disagree.
3. In [App Store Connect](https://appstoreconnect.apple.com), **My Apps, +, New App**: platform iOS, name, language, the Bundle ID from step 2, a SKU. Open the new app, **App Information**, and copy its numeric **Apple ID**; this is `APP_STORE_APPLE_ID`.
4. **Users and Access, Integrations, App Store Connect API, Team Keys, +**: create a key with the **App Manager** role. Download the `.p8` file once (Apple will not show it again), and note the **Key ID** and **Issuer ID**. Keep the file out of the repo and out of shared folders.

## Part 3: TestFlight build on Codemagic

1. In Codemagic, **Teams, Integrations, App Store Connect, Connect**. Name it exactly **`TSA Hub App Store Connect`** (the name in `codemagic.yaml`), paste the Issuer ID and Key ID, and upload the `.p8`.
2. In the app's `tsa_hub_web_env` group add `APP_STORE_APPLE_ID` (the number from Part 2, step 3).
3. **Start new build**, branch `main`, workflow **iOS TestFlight**. The workflow checks the variables, builds, reads the latest TestFlight build number and adds one, lets Codemagic create or fetch the distribution certificate and App Store profile for your Bundle ID, archives, exports the `.ipa`, and uploads it to TestFlight. It never submits for App Review.
4. After Apple finishes processing (minutes to an hour), the build appears in App Store Connect, **TestFlight**. Answer the encryption question if asked (`ITSAppUsesNonExemptEncryption` is already `false`).
5. Add **Internal Testers** (members of your App Store Connect team), then install **TestFlight** on an iPhone and open the build. External testers need a short Beta App Review first.
6. To bump the shown version, change `MARKETING_VERSION` in `ios/App/App.xcodeproj/project.pbxproj` (currently 1.0). The build number is set automatically.

If signing fails, the usual causes are: the Bundle ID in `codemagic.yaml` is not registered in your account, the integration name does not match exactly, or the API key role is below App Manager.

Because there is no Simulator on Windows, collect App Store screenshots from the TestFlight build on a real iPhone (a Pro Max model produces the required 6.9-inch size). See `docs/APP_STORE.md`.

## Checks to do on a real iPhone (from TestFlight)

- Cold launch shows the splash, then Home, with the status bar readable in both themes.
- Tab bar clears the home indicator.
- Keyboard opens over Search, Feedback and the Add Event form without covering the field.
- External links (Official TSA Website, Instagram, YouTube) open in the in-app Safari sheet; `mailto:` opens Mail.
- Calendar: add an event with a reminder, accept the notification prompt, background the app, confirm the reminder arrives.
- "Add to calendar" opens the iOS share sheet with a `.ics` file.
- Airplane mode after one online launch still shows events.
- Feedback and Report submit successfully and produce one email in the owner's inbox.
- Rotate on iPad; both orientations are enabled.

## What was verified on Windows, and what was not

Verified before the first cloud build:

- `codemagic.yaml` parses; both workflows, the signing block, the integration, the group and variable names, and the no-auto-trigger rule are checked by tests.
- The bundle ID agrees across `capacitor.config.json`, the Xcode project and `codemagic.yaml`.
- The Xcode project parses, contains the app target and the privacy manifest, and a **shared scheme** (`App.xcscheme`) is committed so `xcodebuild -scheme App` works on a clean CI checkout.
- `npm ci` resolves from the lockfile; `npm test` (6,300+ tests) and the production web build pass; `node scripts/buildNative.mjs` produces the native bundle and syncs it into `ios/`.
- The build-number command rewrites both build configurations in the project file.
- No signing material is tracked in git, and a scan of every branch's history found no key, certificate, provisioning profile or `.env` file ever committed.

**Not verified until the first Codemagic run** (these need macOS, so they cannot be run on Windows):

- `pod install`, and that every CocoaPods dependency resolves (the lock file `ios/App/Podfile.lock` does not exist yet; after the first green build, copy it from the build artifacts or run it once and commit it for reproducible builds).
- That Xcode (`xcode: latest`) compiles the Swift and Objective-C code against the current iOS SDK, and that the app builds for the Simulator and for devices.
- That the `codemagic.yaml` keys are accepted by Codemagic's own validator. The file follows Codemagic's documented format, but their online validator was unreachable from here, so the first push of it may report a field to adjust.
- Code signing, `xcode-project build-ipa`, the TestFlight upload, and Apple's server-side processing of the build.
- Anything about runtime behavior on an iPhone or iPad (see the checklist above).

## Optional: building on a Mac

If you or a friend have a Mac with Xcode (the version Apple currently requires for uploads) and CocoaPods:

```bash
npm install
cp .env.example .env     # fill VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm run ios:sync         # builds the web app for native, runs `cap sync ios`
npm run ios:open         # opens ios/App/App.xcworkspace (never the .xcodeproj)
```

In Xcode choose your Team under Signing & Capabilities, select a Simulator or device and press Run; use Product, Archive and Distribute App to upload.

## Updating the app icon or splash

Replace `src/assets/img/icon.png` (square, at least 1024 px) and run `npm run native:assets` on any OS. Commit the regenerated files under `resources/` and `ios/`.

## How the native layer works

| Piece | Where |
| --- | --- |
| Native bootstrap (status bar follows theme, splash hide, keyboard scroll-into-view, external links to in-app Safari, deep links) | `src/native/init.js` |
| Platform detection helpers | `src/native/platform.js` |
| Native-only CSS (class `native-app` on `<html>`) | `src/assets/css/native.css` |
| Reminders as OS local notifications | `src/services/notificationService.js` |
| Calendar export via share sheet | `src/services/deviceCalendarService.js` |
| API CORS for the app origin `capacitor://localhost` | `api/_lib/security.js`, `api/submit-feedback.js` |
| Capacitor config | `capacitor.config.json` |
| Privacy manifest | `ios/App/App/PrivacyInfo.xcprivacy` |
| Cloud builds | `codemagic.yaml`, `scripts/buildNative.mjs` |

The native code only loads Capacitor plugins when running inside the app, so the website bundle is unaffected.
