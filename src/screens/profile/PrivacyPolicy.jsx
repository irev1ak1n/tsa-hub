import { Link } from 'react-router-dom';
import { Icon } from '../../components/UI.jsx';

// Static informational page. TSA Hub has no accounts and collects no personal
// data; everything the user enters (name, state, grade) is stored locally in
// their browser. This page states that plainly.
export default function PrivacyPolicy() {
    return (
        <div className="doc-page">
            <Link to="/settings" className="rs-back">
                <span className="rs-back-arrow"><Icon name="arrow-left" size={20} /></span>
                Back
            </Link>

            <div className="section">
                <div className="rs-eyebrow">TSA HUB</div>
                <h1 className="doc-h1">Privacy Policy</h1>
                <p className="doc-updated">Last updated: August 2026</p>
            </div>

            <div className="doc-body">
                <p className="doc-lead">
                    TSA Hub is built to be simple and private. There are no accounts, no
                    sign-in, and we do not collect personal information about you.
                </p>

                <h2 className="doc-h2">The short version</h2>
                <p className="doc-p">
                    You can open TSA Hub and use it right away. We do not ask for your name,
                    email, school, or any other personal details in order to use the app.
                </p>

                <h2 className="doc-h2">Information stored on your device</h2>
                <p className="doc-p">
                    Anything you set inside the app — such as your name, your division, or the
                    state you pick in Resources — is saved only in your own browser on your
                    device. It stays on your device, is not sent to us, and is not shared with
                    anyone. If you clear your browser data or use a different device, that
                    information is gone.
                </p>

                <h2 className="doc-h2">Information we do not collect</h2>
                <p className="doc-p">
                    We do not collect names, email addresses, phone numbers, location data,
                    contacts, or any other personal information. We do not use advertising
                    trackers, and we do not sell or share any data, because we do not have any
                    to sell or share.
                </p>

                <h2 className="doc-h2">Loading event information</h2>
                <p className="doc-p">
                    TSA Hub loads its list of competitive events from a hosted database
                    (Supabase) without logging you in. Like any request to any website, the
                    server that answers these requests can see standard technical details such
                    as your device&rsquo;s IP address. This is a normal part of how the internet
                    works and is not used to identify you or build a profile. Images in the app
                    are stored inside the app itself and are not loaded from outside services.
                </p>

                <h2 className="doc-h2">Children&rsquo;s privacy</h2>
                <p className="doc-p">
                    TSA Hub is intended for students, including those under 18. Because the app
                    has no accounts and collects no personal information, there is nothing for a
                    parent or guardian to request, correct, or delete on our side. Anything a
                    student enters stays on their own device.
                </p>

                <h2 className="doc-h2">Official TSA information</h2>
                <p className="doc-p">
                    Rules, resources, and links in TSA Hub point to official Technology Student
                    Association materials. TSA Hub is a student-built project and is not an
                    official product of TSA. Always confirm important details against the
                    official sources linked in the app.
                </p>

                <h2 className="doc-h2">Changes to this policy</h2>
                <p className="doc-p">
                    If the app ever starts collecting information, this policy will be updated
                    first to explain what and why. Until then, this page reflects how the app
                    works today.
                </p>

                <h2 className="doc-h2">Contact</h2>
                <p className="doc-p">
                    Questions about this policy can be directed to the project maintainer
                    through the app&rsquo;s repository or the contact method listed there.
                </p>

                <p className="doc-note">
                    This page is provided for transparency and is not legal advice.
                </p>
            </div>
        </div>
    );
}