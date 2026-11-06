import { Link } from 'react-router-dom';
import { Icon } from '../../components/UI.jsx';

// Static Terms and Policies page for the website and the iOS app. Same
// structure and classes as PrivacyPolicy so it shares the doc styling and
// light-theme fixes. TSA Hub is an independent, student-built project.
export default function Terms() {
    return (
        <div className="doc-page">
            <Link to="/settings" className="rs-back">
                <span className="rs-back-arrow"><Icon name="arrow-left" size={20} /></span>
                Back
            </Link>

            <div className="section">
                <div className="rs-eyebrow">TSA HUB</div>
                <h1 className="doc-h1">Terms and Policies</h1>
                <p className="doc-updated">Last updated November 2026</p>
            </div>

            <div className="doc-body">
                <p className="doc-lead">
                    TSA Hub is a free app that helps students find TSA event information and plan
                    their season. By using it, you agree to these terms. If you do not agree,
                    please do not use the app.
                </p>

                <h2 className="doc-h2">Independent project</h2>
                <p className="doc-p">
                    TSA Hub is developed independently by a student. It is not made, sponsored,
                    approved, or endorsed by the Technology Student Association. TSA names and
                    materials belong to TSA and are used here only to describe TSA events and
                    resources.
                </p>

                <h2 className="doc-h2">Using TSA Hub</h2>
                <p className="doc-p">
                    You may use TSA Hub for your own personal, non-commercial, educational use.
                    Please do not try to break, overload, or get around the app, do not use it
                    to send spam or unlawful or abusive content, and do not copy the app or sell
                    it as your own.
                </p>

                <h2 className="doc-h2">Check official sources</h2>
                <p className="doc-p">
                    Event details, rules, deadlines, eligibility, and conference information
                    come from TSA's published materials and may be incomplete, out of date, or
                    wrong. Always confirm anything important with the official TSA sources linked
                    in the app and with your advisor before you rely on it. If you spot a
                    mistake, please use Report Incorrect Information in Settings.
                </p>

                <h2 className="doc-h2">Recommendations, search, and the TSA Coach</h2>
                <p className="doc-p">
                    Event recommendations are suggestions based on your answers and general event
                    information. They do not measure your skills, predict results, or decide what
                    you are eligible for. Search and the TSA Coach answer from content built into
                    the app, so they can be incomplete. Use them as a starting point.
                </p>

                <h2 className="doc-h2">Information saved on your device</h2>
                <p className="doc-p">
                    Saved events, calendar items, reminders, and preferences are stored only on
                    your device and are not backed up by us. They can be lost if you delete the
                    app, clear your browser data, or change devices. See the Privacy Policy for
                    details.
                </p>

                <h2 className="doc-h2">Feedback and reports</h2>
                <p className="doc-p">
                    Messages you send may be used to improve TSA Hub without payment or any
                    obligation to you. Please keep personal information out of them.
                </p>

                <h2 className="doc-h2">Other websites</h2>
                <p className="doc-p">
                    TSA Hub links to websites and resources run by others. We do not control
                    them and are not responsible for their content or privacy practices.
                </p>

                <h2 className="doc-h2">Ownership</h2>
                <p className="doc-p">
                    TSA logos, documents, and competition materials belong to TSA or their
                    owners. The original TSA Hub software, design, and content belong to its
                    developer unless stated otherwise.
                </p>

                <h2 className="doc-h2">Availability and changes</h2>
                <p className="doc-p">
                    TSA Hub is provided as is and as available. Features and information may
                    change, and the app may be unavailable or stop at any time. We do not promise
                    that it will always work or be error free.
                </p>

                <h2 className="doc-h2">Limits of responsibility</h2>
                <p className="doc-p">
                    To the extent the law allows, the developer is not responsible for losses
                    that come from using or relying on TSA Hub, including missed deadlines,
                    wrong or outdated information, or lost saved data. Some places do not allow
                    these limits, so they may not apply to you.
                </p>

                <h2 className="doc-h2">Younger users</h2>
                <p className="doc-p">
                    If you are under 18, please use TSA Hub with the knowledge of a parent,
                    guardian, or teacher. If you are under 13, ask before you send any message
                    through the app.
                </p>

                <h2 className="doc-h2">Changes to these terms</h2>
                <p className="doc-p">
                    We may update these terms as TSA Hub changes. The date at the top shows when
                    they were last updated, and using the app after that means you accept the
                    new version.
                </p>

                <h2 className="doc-h2">Contact</h2>
                <p className="doc-p">
                    Questions can be sent to the project maintainer at tsastudentshub@gmail.com.
                </p>

                <p className="doc-note">
                    TSA Hub is an independent student-built project and is not affiliated with,
                    sponsored by, or endorsed by the Technology Student Association.
                </p>
            </div>
        </div>
    );
}
