# TSA Hub

TSA Hub is a free, student-built mobile app that makes it easier for Technology Student Association (TSA) members to explore competitions, prepare for events, and access important information in one place.

Instead of searching through multiple websites, event guides, and PDF files, TSA Hub brings competition details, eligibility requirements, deadlines, and official resources together in a mobile-friendly interface.

TSA Hub also helps students discover competitions that match their interests, organize their preparation, track important dates, and find information relevant to their state.

## Short Introduction to Capabilities 

TSA Hub allows students to explore competitive events, view eligibility requirements, themes, and competition details, and receive personalized event recommendations based on their interests and skills. The app also includes search, a calendar for conference dates and personal reminders, saved events for quick access, and resources for state TSA delegations. Students can also send feedback and report incorrect information.

# What It Can Do

## 1) Browse TSA competitive events and access detailed information about each competition.

- Explore High School and Middle School competitive events
- Search events by name and filter available competitions
- View event descriptions and competition categories
- Check team sizes and official eligibility requirements
- Find annual themes and problems
- Review preconference submission and approval requirements
- Learn about expected difficulty, preparation time, materials, and costs
- Discover related careers and skills
- Access official TSA event sources

## 2) Find TSA competitions that match your interests, experience, and preferences.

- Answer questions about your interests and skills
- Select preferred types of projects and activities
- Specify available preparation time and team preferences
- Explore competitions related to career interests
- Receive personalized event recommendations
- View recommended events with explanations of their suitability
- Compare options and explore their requirements
- Save competitions that interest you

## 3) Quickly find TSA-related information without navigating through multiple pages.

- Search across TSA resources and competition information
- Find eligibility rules and competition requirements
- Look up conference information and deadlines
- Get direct answers to supported TSA-related questions
- Access relevant resources and official sources
- Discover related information through keyword searches

## 4) Keep track of important TSA dates and organize your personal schedule.

- View national and state TSA conference dates
- Track important competition and submission deadlines
- Browse events using a monthly calendar
- Create personal events and reminders
- Add notes and details to calendar entries
- View upcoming activities from the homepage
- Export calendar events to compatible device calendars
- Set reminders (local notifications in the iOS app, browser notifications on the web)

## 5) Save your competitive events and organize your preparation.

- Save competitions for quick access
- View saved events directly from the homepage
- Open event details without searching again
- Remove events when they are no longer needed
- Keep saved information locally on your device

## 6) Access important TSA information through an organized resource directory.

- Learn about TSA and its programs
- Explore national competition requirements
- Review eligibility charts and submission procedures
- Find conference information and dress code guidelines
- Access themes and problems for competitive events
- Explore National TSA leadership and officers
- Find state TSA delegations and their resources
- Access official TSA websites and social media accounts
- Open official documents and external resources directly

## 7) Access frequently used tools and information from one place.

- Search TSA information from the homepage
- View upcoming calendar events
- Quickly access saved competitions
- Open the Event Recommender
- Access frequently used resources through Quick Actions
- Customize Quick Actions based on personal preferences
- Switch between Dark and Light Theme
- Explore National TSA leadership and important links

## 8) Help improve TSA Hub by sharing feedback or reporting problems.

- Submit feedback and feature suggestions
- Report incorrect or outdated information
- Contact TSA Hub support

---

# Development

TSA Hub is a Vite + React single-page app with a Supabase backend, one Vercel serverless endpoint (`api/submit-feedback.js`) and a Capacitor iOS shell. The web app and the iOS app share one codebase.

## Run locally

```bash
npm install
cp .env.example .env     # fill VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm run dev              # http://localhost:5173 (also on your LAN for phone testing)
```

The Feedback and Report forms call `/api/submit-feedback`, which only runs on Vercel (or `vercel dev` with the server-side variables from `.env.example`). Everything else works with the dev server alone.

## Test and build the web version

```bash
npm test             # unit and integration tests (Vitest)
npm run build        # production bundle in dist/
npm run preview      # serve dist/ locally
```

The website deploys from `main` to Vercel automatically. There is no ESLint or TypeScript configuration in this project.

## Build the iOS version

Apple only allows iOS builds on macOS. From Windows, use Codemagic (cloud macOS builds) with the committed [`codemagic.yaml`](codemagic.yaml): a no-account **compile check** first, then a signed **TestFlight** build once you have an Apple Developer account. With a Mac you can also run `npm run ios:sync` and `npm run ios:open`.

Step-by-step instructions, which steps need Apple Developer enrollment, and what is still unverified until the first cloud build are in [`docs/IOS_BUILD.md`](docs/IOS_BUILD.md). App Store guideline review, metadata and privacy answers are in [`docs/APP_STORE.md`](docs/APP_STORE.md).

## Release status

[`docs/RELEASE_CHECKLIST.md`](docs/RELEASE_CHECKLIST.md) lists what is done, what was verified, what is blocked and what only the owner can do (Apple Developer account, permission to use the TSA name and content, signing, screenshots, review). Security notes and the operations runbook are in [`SECURITY.md`](SECURITY.md).

## Disclaimer

TSA Hub is an independent, student-built project. It is not made, sponsored, approved or endorsed by the Technology Student Association. Always confirm rules, deadlines and eligibility with the official TSA sources linked in the app.
