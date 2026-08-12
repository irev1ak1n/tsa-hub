import { Link } from 'react-router-dom';
import { Icon } from '../../components/UI.jsx';

// Static Terms & Policies page. Same structure/classes as PrivacyPolicy so it
// shares the doc styling and light-theme fixes. TSA Hub is an independent,
// student-built project, not affiliated with TSA.
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
                    TSA Hub is a free, independent, student-built app designed to make
                    participating in TSA easier, more organized, and less confusing for
                    students. By using TSA Hub, you agree to the terms below.
                </p>

                <h2 className="doc-h2">What TSA Hub is</h2>
                <p className="doc-p">
                    TSA has dozens of competitive events, yearly themes, rules, conference
                    information, deadlines, eligibility requirements, and resources spread across
                    different pages and documents. TSA Hub brings that information together and
                    presents it in a simpler, student-focused way.
                </p>
                <p className="doc-p">
                    Students can use TSA Hub to explore Middle School and High School competitive
                    events, search and filter competitions, view event information and current
                    themes, and quickly find useful TSA resources.
                </p>
                <p className="doc-p">
                    TSA Hub also includes tools that go beyond simply displaying information. The
                    event recommender helps students discover competitions that may match their
                    interests, skills, preferred team size, and other preferences. The AI Coach
                    allows students to ask questions about events, rules, preparation, and TSA
                    resources in a more natural way.
                </p>
                <p className="doc-p">
                    Students can also use the calendar to keep track of important dates, create
                    their own events, add notes, and organize their competition season.
                </p>
                <p className="doc-p">
                    The goal of TSA Hub is to make it easier for students to discover competitions
                    that fit them, understand TSA information and rules, find important resources
                    without searching through many different pages and documents, stay organized
                    throughout the competition season, keep track of important dates and personal
                    plans, and get quick guidance when they are unsure where to find information.
                </p>
                <p className="doc-p">
                    TSA Hub is meant to work alongside official TSA resources, not replace them.
                </p>

                <h2 className="doc-h2">TSA Hub is an independent project</h2>
                <p className="doc-p">
                    TSA Hub is not an official product of the Technology Student Association. It
                    is not operated, sponsored, endorsed, or approved by TSA. References to TSA,
                    competitive events, conference information, rules, documents, and other
                    materials are included to help students find and understand relevant
                    information. For important decisions, always confirm details using the
                    official TSA sources linked throughout the app.
                </p>

                <h2 className="doc-h2">Using TSA Hub</h2>
                <p className="doc-p">
                    TSA Hub is intended for students, advisors, alumni, and others interested in
                    TSA. You may use the app for normal personal and educational purposes. Please
                    do not intentionally interfere with the app, attempt to damage or misuse its
                    services, access systems you are not authorized to access, or use TSA Hub for
                    unlawful purposes.
                </p>

                <h2 className="doc-h2">Accuracy of TSA information</h2>
                <p className="doc-p">
                    TSA Hub tries to keep competition information, themes, resources, dates,
                    eligibility information, and other content accurate and based on official TSA
                    materials whenever possible. However, TSA information can change, and TSA Hub
                    may occasionally contain outdated, incomplete, or incorrect information.
                    Official TSA rules, documents, and announcements always take priority over
                    information shown in TSA Hub.
                </p>
                <p className="doc-p">
                    Important details such as competition eligibility, deadlines, submission
                    requirements, event rules, and conference information should always be
                    confirmed using the official sources provided in the app. If you notice
                    something that appears incorrect or outdated, you can use the feedback or
                    reporting tools in TSA Hub to let us know.
                </p>

                <h2 className="doc-h2">AI Coach</h2>
                <p className="doc-p">
                    TSA Hub may include an AI Coach designed to help students understand TSA
                    events, rules, resources, preparation, and other TSA-related information. The
                    AI Coach is intended to make it easier to find and understand information, but
                    AI-generated answers can sometimes be incomplete, outdated, or incorrect. The
                    AI Coach should be treated as a helpful guide, not as an official TSA source.
                    Always confirm important information such as eligibility, deadlines,
                    competition requirements, rules, and conference details using official TSA
                    sources. Do not enter sensitive or private personal information into the AI
                    Coach.
                </p>

                <h2 className="doc-h2">Event recommendations</h2>
                <p className="doc-p">
                    TSA Hub may recommend competitive events based on information and preferences
                    selected by the user. Recommendations are intended to help students explore
                    competitions they may enjoy or be interested in. They are not guarantees that
                    a particular event is the best choice for a student or that the student is
                    eligible to compete in it. Students should review the official event
                    requirements before making competition decisions.
                </p>

                <h2 className="doc-h2">Your saved information</h2>
                <p className="doc-p">
                    Some TSA Hub features may save information directly on your device, such as
                    saved events, personal calendar items, and notes you create. Unless otherwise
                    stated in the app, this information is stored locally in your browser or on
                    your device. Clearing browser data, uninstalling TSA Hub, resetting the app,
                    or switching to another device may cause locally stored information to be
                    lost. You are responsible for anything you choose to save or write inside TSA
                    Hub.
                </p>

                <h2 className="doc-h2">External websites and resources</h2>
                <p className="doc-p">
                    TSA Hub may link to official TSA websites, documents, and other external
                    resources. Those websites and services are operated by their respective
                    owners. TSA Hub does not control their content, availability, security,
                    accuracy, or privacy practices. Opening an external link may take you outside
                    TSA Hub. TSA Hub may also use third-party services for features such as
                    hosting, databases, analytics, feedback, or AI functionality.
                </p>

                <h2 className="doc-h2">Availability and updates</h2>
                <p className="doc-p">
                    TSA Hub is an independently developed project and may continue to change over
                    time. Features may be added, updated, temporarily unavailable, or removed.
                    Competition information and yearly themes may also be updated as new TSA
                    materials become available. We cannot guarantee that TSA Hub will always be
                    available, completely error-free, or fully up to date.
                </p>

                <h2 className="doc-h2">Responsibility when using TSA Hub</h2>
                <p className="doc-p">
                    TSA Hub is designed to make TSA participation easier, but students are still
                    responsible for checking official requirements and making their own
                    competition, scheduling, preparation, and submission decisions. TSA Hub and
                    its project maintainer are not responsible for missed deadlines, competition
                    results, eligibility decisions, incorrect submissions, schedule conflicts, or
                    other outcomes that result from relying only on information shown in the app.
                </p>

                <h2 className="doc-h2">Intellectual property</h2>
                <p className="doc-p">
                    Technology Student Association names, trademarks, logos, documents,
                    competition materials, and other official content belong to TSA or their
                    respective owners. TSA Hub does not claim ownership of official TSA materials.
                    The original TSA Hub application, including its software, original design,
                    features, and original project content, belongs to its creator unless
                    otherwise stated.
                </p>

                <h2 className="doc-h2">Changes to TSA Hub or these terms</h2>
                <p className="doc-p">
                    TSA Hub may continue to evolve as new features and information are added.
                    These terms may be updated when the app, its features, or its policies change.
                    When that happens, the &ldquo;Last updated&rdquo; date at the top of this page
                    will also be updated.
                </p>

                <h2 className="doc-h2">Contact</h2>
                <p className="doc-p">
                    If you have a question, find incorrect information, experience a problem, or
                    have a concern about TSA Hub, you can use the feedback options inside the app
                    or contact the project maintainer using the contact information provided by
                    TSA Hub.
                </p>

                <p className="doc-note">
                    TSA Hub is an independent student-built project and is not affiliated with,
                    sponsored by, approved by, or endorsed by the Technology Student Association.
                    These terms are provided for general transparency and are not legal advice.
                </p>
            </div>
        </div>
    );
}