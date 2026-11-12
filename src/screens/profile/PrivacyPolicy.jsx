import { BackLink } from '../resources/resourcesShared.jsx';

// Static privacy page for the website and the iOS app. Keep it in step with
// what the code really does (see docs/PRIVACY_AUDIT.md) and with the App Store
// privacy answers in docs/APP_STORE.md. Written in plain language for students.
export default function PrivacyPolicy() {
    return (
        <div className="doc-page">
            <BackLink to="/settings" label="Back" />

            <div className="section">
                <div className="rs-eyebrow">TSA HUB</div>
                <h1 className="doc-h1">Privacy Policy</h1>
                <p className="doc-updated">Last updated November 2026</p>
            </div>

            <div className="doc-body">
                <p className="doc-lead">
                    TSA Hub is an independent, student-built project. It is not an official
                    Technology Student Association (TSA) product and is not affiliated with or
                    endorsed by TSA. You do not need an account to use it, and we collect as
                    little information as we can. This page explains what that is.
                </p>

                <h2 className="doc-h2">No accounts</h2>
                <p className="doc-p">
                    TSA Hub has no sign-up or login. We never ask for your name, email address,
                    school, phone number, or birthday to use the app. Earlier test versions of
                    TSA Hub briefly had sign-in. Those accounts are no longer used, and you can
                    ask us to delete anything tied to one using the contact below.
                </p>

                <h2 className="doc-h2">What stays on your device</h2>
                <p className="doc-p">
                    TSA Hub saves some things on your device so the app remembers them. These
                    are your saved events, personal calendar items and reminders, your chosen
                    state, your theme, your Quick Actions layout, your recent searches, your
                    calendar view, and a saved copy of the events list so the app can open
                    without internet. This information is not sent to us. Searching and the TSA
                    Coach also run on your device, so what you type there is not sent to us.
                </p>
                <p className="doc-p">
                    If you delete the app or clear your browser data, this information is
                    deleted too, and it does not move to a new device. You can delete it
                    yourself at any time.
                </p>

                <h2 className="doc-h2">What we receive when you use the app</h2>
                <p className="doc-p">
                    TSA Hub loads event information from our database, which is hosted by
                    Supabase, and the website is hosted by Vercel. Like any online service,
                    these providers automatically receive technical details such as your IP
                    address, device and browser type, and the time of the request. They may keep
                    this in security and operations logs under their own policies. We do not use
                    it to identify you, to build profiles, or for advertising. TSA Hub has no
                    analytics or advertising tools.
                </p>

                <h2 className="doc-h2">Anonymous feedback and reports</h2>
                <p className="doc-p">
                    You can choose to send feedback or report incorrect information from
                    Settings or the Help Center. These forms have no name, email, phone, or other
                    contact fields, so what you send is anonymous. We receive the message you
                    type, which type it is, and for a report the category you picked, the time
                    you sent it, and the page you were on. We cannot reply to you. Please do not
                    include personal information about yourself or anyone else in a message.
                </p>
                <p className="doc-p">
                    Messages are saved in our database and sent as an email notification to the
                    project maintainer through an email service called Resend. We keep them only
                    as long as we need them to fix problems and improve the app, and we delete
                    them when they are no longer useful. TSA Hub no longer has a Contact Support
                    option.
                </p>
                <p className="doc-p">
                    To stop spam, our server briefly keeps a scrambled (hashed) form of your
                    network address together with a count of recent submissions. These records
                    are usually removed within a few days.
                </p>

                <h2 className="doc-h2">Notifications and permissions</h2>
                <p className="doc-p">
                    If you set a reminder in the iPhone app, we ask for permission to send
                    notifications. Reminders are scheduled on your device and do not use a
                    server. TSA Hub does not send push notifications. The app does not ask for
                    your location, contacts, photos, camera, or microphone. When you add an
                    event to your calendar, TSA Hub creates a file and your device asks where
                    to save or share it. On the website, reminders use your browser's
                    notification permission and only work while the page is open.
                </p>

                <h2 className="doc-h2">Links to other sites</h2>
                <p className="doc-p">
                    TSA Hub links to official TSA websites, social media, and other resources.
                    They open in your browser or in a browser window inside the app. Those sites
                    have their own privacy policies and may collect information about you.
                </p>

                <h2 className="doc-h2">Who we share information with</h2>
                <p className="doc-p">
                    We do not sell or rent information, and we do not show ads. The only
                    companies that handle information for TSA Hub are Vercel for hosting,
                    Supabase for the database, and Resend for email notifications. They process
                    it only to run the service. We may also share information if the law
                    requires it or to keep someone safe.
                </p>

                <h2 className="doc-h2">Students and users under 13</h2>
                <p className="doc-p">
                    TSA Hub is made for middle and high school students. Because there are no
                    accounts and we do not ask for personal information, you can use almost
                    everything in the app without sharing any. The only place a message could
                    contain personal information is the feedback and report boxes. If you are
                    under 13, please ask a parent, guardian, or teacher before you send
                    anything, and leave out names, contact details, and other personal
                    information. We do not knowingly collect personal information from children
                    under 13. If a message contains some, contact us and we will delete it.
                </p>

                <h2 className="doc-h2">Access and deletion requests</h2>
                <p className="doc-p">
                    Messages have no name or email attached, so we cannot tell who sent which
                    one. To ask us to find or delete something you sent, email us the
                    approximate date and the wording of your message, and we will look for it
                    and delete it. Parents and guardians can make the same request. We will
                    reply as soon as we can. Information saved on your device is yours to
                    delete, as described above.
                </p>

                <h2 className="doc-h2">Security</h2>
                <p className="doc-p">
                    TSA Hub uses encrypted connections, limits who can read the database, and
                    keeps secret keys on the server instead of in the app. No system is
                    perfectly secure, so please keep personal details out of messages.
                </p>

                <h2 className="doc-h2">Changes</h2>
                <p className="doc-p">
                    If TSA Hub starts handling information differently, we will update this
                    page and its date before the change goes live.
                </p>

                <h2 className="doc-h2">Contact</h2>
                <p className="doc-p">
                    Questions or requests about privacy can be sent to the project maintainer at
                    tsastudentshub@gmail.com.
                </p>

                <p className="doc-note">
                    TSA Hub is an independent student-built project and is not affiliated with or
                    endorsed by the Technology Student Association.
                </p>
            </div>
        </div>
    );
}
