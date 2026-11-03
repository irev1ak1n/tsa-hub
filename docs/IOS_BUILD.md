# Building TSA Hub for iOS

TSA Hub is one codebase: the React web app is bundled into a [Capacitor](https://capacitorjs.com) iOS project in `ios/`. Nothing here replaces the website; the web build and deploy are unchanged.

You need a Mac with Xcode to build the iOS app. Everything up to `npm run build:native` also works on Windows and Linux, but the generated project can only be compiled, signed and run on macOS.

## One-time setup (on a Mac)

1. Install **Xcode** from the Mac App Store (use the version App Store Connect currently requires for uploads; check the "Upcoming requirements" note in App Store Connect), open it once and accept the license.
2. Install **CocoaPods**: `sudo gem install cocoapods` (or `brew install cocoapods`).
3. Install Node 20+ and run `npm install` in the repo root.
4. Copy `.env.example` to `.env` and fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (same values as the website; the anon key is public by design).

## Build and open

```bash
npm run ios:sync    # builds the web app for native, then runs `cap sync ios` (installs pods)
npm run ios:open    # opens ios/App/App.xcworkspace in Xcode
```

`ios:sync` sets `VITE_API_BASE_URL` to `https://tsa-hub.vercel.app` unless you export your own. That matters: inside the app a relative `/api/...` URL would point at the app itself, so feedback and Get Involved forms would fail. Re-run `ios:sync` after any web change; the `ios/App/App/public` folder is generated and git-ignored.

Always open the **`.xcworkspace`**, never the `.xcodeproj`.

## Signing in Xcode

1. Select the **App** project, then the **App** target, then **Signing & Capabilities**.
2. Tick **Automatically manage signing** and choose your **Team** (needs a paid Apple Developer Program membership to run on a device beyond 7 days or to ship).
3. Change the **Bundle Identifier** if you do not own `com.tsahub.app`. The identifier must be unique on the App Store and must match the App ID you register in the Apple Developer portal and the app record in App Store Connect. If you change it, also change `appId` in `capacitor.config.json` and run `npx cap sync ios`.
4. Set **Version** (`MARKETING_VERSION`, e.g. 1.0.0) and **Build** (`CURRENT_PROJECT_VERSION`, increase for every upload).
5. Minimum iOS is 14.0. iPhone and iPad are both enabled.

No capabilities are required. Local notifications need no entitlement, and there are no push, sign-in or in-app purchase features.

## Run on a simulator or iPhone

Pick a simulator or a connected iPhone in the Xcode toolbar and press Run. On a physical device, enable Developer Mode (Settings, Privacy & Security) and trust your developer certificate.

Things to check by hand on every release (none can be automated from Windows):

- Cold launch shows the splash, then Home, with the status bar readable in both themes.
- Tab bar clears the home indicator on iPhones with and without a home button.
- Keyboard opens over Search, Feedback and the Add Event form without covering the field.
- External links (Official TSA Website, Instagram, YouTube) open in the in-app Safari sheet; `mailto:` opens Mail.
- Calendar: add an event with a reminder, accept the notification prompt, background the app, confirm the reminder arrives.
- "Add to calendar" opens the iOS share sheet with a `.ics` file.
- Airplane mode after one online launch still shows events.
- Feedback and Get Involved submit successfully and show one email at the owner's inbox.
- Rotate on iPad; both orientations are enabled.

## Updating the app icon or splash

Replace `src/assets/img/icon.png` (square, at least 1024px, no transparency needed) and run:

```bash
npm run native:assets
```

This regenerates `resources/icon.png`, `resources/splash.png` and every asset catalog image under `ios/`.

## TestFlight

1. In [App Store Connect](https://appstoreconnect.apple.com), My Apps, **+** New App: platform iOS, name, primary language, the Bundle ID from above, and a SKU.
2. In Xcode choose **Any iOS Device (arm64)** as the run destination, then **Product, Archive**.
3. In the Organizer select the archive, **Distribute App, App Store Connect, Upload**. Let Xcode manage signing.
4. After processing (a few minutes to an hour), the build appears under **TestFlight**. Answer the export-compliance question: the app uses only standard HTTPS, and `ITSAppUsesNonExemptEncryption` is already set to `false` in `Info.plist`, which normally skips the prompt.
5. Add **Internal Testers** (up to 100 people on your App Store Connect team) for immediate testing. For **External Testers**, add a group and submit the build for Beta App Review (first build needs a short review) and fill in the Test Information.

## Submit to the App Store

1. Complete everything in [`docs/APP_STORE.md`](./APP_STORE.md): metadata, screenshots, privacy policy URL, App Privacy answers, age rating, review notes.
2. Open the app record in App Store Connect, add the version, attach the processed build, and fill every required field.
3. Click **Add for Review**, then **Submit to App Review**. Reviews usually take a day or two.

See [`docs/RELEASE_CHECKLIST.md`](./RELEASE_CHECKLIST.md) for what is done, what is blocked, and what only you can do.

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

The native code only loads Capacitor plugins when running inside the app, so the website bundle is unaffected.
