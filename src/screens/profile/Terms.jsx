import { Link } from 'react-router-dom';
import { Icon } from '../../components/UI.jsx';

// Static informational page: plain-language terms of use for a free, no-account
// student project that surfaces official TSA information.
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
                <p className="doc-updated">Last updated: August 2026</p>
            </div>

            <div className="doc-body">
                <p className="doc-lead">
                    These terms explain the basics of using TSA Hub. By using the app, you agree
                    to them. If you do not agree, please do not use the app.
                </p>

                <h2 className="doc-h2">What TSA Hub is</h2>
                <p className="doc-p">
                    TSA Hub is a free, student-built companion app for Technology Student
                    Association participants. It helps you explore competitive events, find
                    resources, and understand official rules. It is not an official product of
                    TSA and is not affiliated with, endorsed by, or sponsored by the Technology
                    Student Association.
                </p>

                <h2 className="doc-h2">Use of the app</h2>
                <p className="doc-p">
                    You may use TSA Hub for your own personal, non-commercial use. Please do not
                    misuse the app, attempt to disrupt it, or use it in a way that breaks the
                    law or the rules of your school or TSA chapter.
                </p>

                <h2 className="doc-h2">Accuracy of information</h2>
                <p className="doc-p">
                    We work to keep rules, events, and resources accurate and to base them on
                    official TSA materials. Even so, information can change or contain mistakes.
                    TSA Hub is provided for convenience only. Always confirm important details —
                    especially rules, deadlines, and eligibility — against the official TSA
                    sources linked in the app before you rely on them.
                </p>

                <h2 className="doc-h2">External links</h2>
                <p className="doc-p">
                    TSA Hub links to official TSA websites and other outside pages. We do not
                    control those sites and are not responsible for their content, availability,
                    or their own policies. Opening an external link takes you outside TSA Hub.
                </p>

                <h2 className="doc-h2">No warranty</h2>
                <p className="doc-p">
                    TSA Hub is provided &ldquo;as is,&rdquo; without warranties of any kind. We
                    do not guarantee that the app will always be available, error-free, or up to
                    date. Use of the app is at your own discretion and risk.
                </p>

                <h2 className="doc-h2">Limitation of liability</h2>
                <p className="doc-p">
                    To the extent allowed by law, the maker of TSA Hub is not liable for any loss
                    or damage that results from using, or being unable to use, the app or the
                    information in it, including decisions made based on that information.
                </p>

                <h2 className="doc-h2">Changes to these terms</h2>
                <p className="doc-p">
                    These terms may be updated as the app changes. When they are, the date at
                    the top of this page will change. Continuing to use the app after an update
                    means you accept the updated terms.
                </p>

                <h2 className="doc-h2">Contact</h2>
                <p className="doc-p">
                    Questions about these terms can be directed to the project maintainer through
                    the app&rsquo;s repository or the contact method listed there.
                </p>

                <p className="doc-note">
                    This page is provided for transparency and is not legal advice.
                </p>
            </div>
        </div>
    );
}