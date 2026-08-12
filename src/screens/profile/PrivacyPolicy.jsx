import { Link } from 'react-router-dom';
import { Icon } from '../../components/UI.jsx';

// Static privacy page. TSA Hub is an independent, student-built project, not
// affiliated with TSA. No accounts, minimal data. Written in plain language,
// and deliberately avoids absolute promises that AI Coach / feedback / Supabase
// could later make untrue.
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
                    TSA Hub is an independent, student-built project created to make TSA
                    information easier to find and use. TSA Hub is not an official Technology
                    Student Association (TSA) product and is not affiliated with or endorsed by
                    TSA. We try to keep the app simple and collect as little information as
                    possible.
                </p>

                <h2 className="doc-h2">Using TSA Hub</h2>
                <p className="doc-p">
                    You do not need to create an account or sign in to use TSA Hub. We do not
                    require your name, email address, school, phone number, or other personal
                    information just to use the app.
                </p>

                <h2 className="doc-h2">Information saved on your device</h2>
                <p className="doc-p">
                    Some features may save information directly on your device, such as saved events, personal calendar items, and notes you create. This information is stored in your browser or on your device and is not automatically shared with us.

                    If you clear your browser data, uninstall TSA Hub, or switch to another device, this locally saved information may be lost.
                </p>

                <h2 className="doc-h2">Information loaded from the internet</h2>
                <p className="doc-p">
                    TSA Hub may connect to online services such as Supabase to load app content
                    or provide certain features. Like most websites and apps, these services may
                    automatically receive basic technical information needed to process a
                    request, such as your IP address, browser type, or device information. TSA
                    Hub does not use this information to personally identify you or create
                    advertising profiles.
                </p>

                <h2 className="doc-h2">Feedback and reports</h2>
                <p className="doc-p">
                    If you choose to send feedback or report incorrect information through TSA
                    Hub, the message you submit may be stored so that it can be reviewed. Please
                    do not include sensitive personal information in feedback messages.
                </p>

                <h2 className="doc-h2">AI Coach</h2>
                <p className="doc-p">
                    TSA Hub may include an AI Coach that helps answer questions about TSA
                    competitions, rules, resources, and related information. Questions you send
                    to the AI Coach may need to be processed by the services that power the
                    feature. You should avoid entering private or sensitive personal information
                    into the AI Coach. AI responses may sometimes be incomplete or incorrect, so
                    important competition rules, deadlines, eligibility requirements, and other
                    official information should always be confirmed using the official TSA
                    sources provided in the app.
                </p>

                <h2 className="doc-h2">Advertising and selling data</h2>
                <p className="doc-p">
                    TSA Hub does not sell your personal information. We do not use the app to
                    create advertising profiles about users.
                </p>

                <h2 className="doc-h2">Students and younger users</h2>
                <p className="doc-p">
                    TSA Hub is designed for students, including middle and high school students.
                    Because no account is required, students can use most of the app without
                    providing personal information. Users should avoid entering private or
                    sensitive information into feedback forms, notes intended for sharing, or AI
                    features.
                </p>

                <h2 className="doc-h2">Official TSA information</h2>
                <p className="doc-p">
                    TSA Hub organizes and links to information from the Technology Student
                    Association and other relevant sources to make it easier for students to
                    use. However, TSA Hub is an independent project. It is not operated,
                    sponsored, approved, or endorsed by the Technology Student Association. For
                    competition rules, deadlines, eligibility requirements, conference
                    information, and other important decisions, always check the official TSA
                    source linked in the app.
                </p>

                <h2 className="doc-h2">Changes to this policy</h2>
                <p className="doc-p">
                    TSA Hub may change as new features are added. If the way the app handles
                    information changes, this Privacy Policy will be updated to explain those
                    changes.
                </p>

                <h2 className="doc-h2">Contact</h2>
                <p className="doc-p">
                    If you have questions about TSA Hub or this Privacy Policy, you can contact
                    the project maintainer using the contact information provided in the app.
                </p>

                <p className="doc-note">
                    TSA Hub is an independent student-built project and is not affiliated with or
                    endorsed by the Technology Student Association.
                </p>
            </div>
        </div>
    );
}