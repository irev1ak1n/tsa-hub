import { useNavigate } from 'react-router-dom';
import { Icon } from '../../components/UI.jsx';

const CONTACT_EMAIL = 'your-email@example.com';

export default function PrivacyPolicy() {
    const navigate = useNavigate();

    return (
        <>
            <div className="set-head">
                <button className="set-back" onClick={() => navigate(-1)} aria-label="Back">
                    <Icon name="arrow-left" size={22} />
                </button>
                <h1 className="set-title">Privacy Policy</h1>
            </div>

            <div className="doc">
                <p className="doc-meta">Demo build · last updated for the 2026–27 season</p>

                <p className="doc-lead">
                    TSA Hub helps you keep track of your TSA season in one place. This page explains, in plain terms, what
                    information the app keeps about you and what it does with it. We wanted this to be easy to read, so we kept it
                    short and skipped the legal jargon.
                </p>

                <h2>What information we keep</h2>
                <p>
                    When you make an account and fill out your profile, the app saves a few basic things about you. It keeps your
                    email address, which is how you sign in. It keeps your first and last name, your username, and where you go to
                    school, along with your city, state, and grade. If you choose to add a profile photo or pick the events you
                    are competing in, it saves those too.
                </p>
                <p>
                    That is everything. The app never asks for your phone number, your home address, or anything to do with
                    payments.
                </p>

                <h2>Where your information is kept</h2>
                <p>
                    Everything you enter is stored in a secure database, and it is set up so that only you can change your own
                    profile. Your account is protected by your password, so please keep it to yourself and do not share it with
                    anyone.
                </p>

                <h2>What the app does with it</h2>
                <p>
                    Your information is only used to make the app work for you. It shows your profile and the events you have
                    chosen, gives you information that fits your state and your division, and lets the AI coach answer your
                    questions about the events you are in. It is not used for anything beyond running the app.
                </p>

                <h2>What we never do</h2>
                <p>
                    We do not sell your information to anyone. There are no ads in the app, and nothing quietly tracks you for
                    advertising. We also do not hand your information to other companies for marketing. Your information stays
                    inside the app, used only to help you.
                </p>

                <h2>If you are under 13</h2>
                <p>
                    Some TSA members are younger than 13, and there is a law in the United States called COPPA that protects
                    children's information online. It can require a parent or a school to give permission before an app collects a
                    younger student's information. A real version of this app would take care of getting that permission first.
                    This version is here for showing the project and trying it out.
                </p>

                <h2>Seeing or removing your information</h2>
                <p>
                    You can look at and change your profile whenever you want from the Profile screen. If you want to ask about
                    your information or have it removed, just email us at the address below. Keep in mind that removing your
                    information also closes your account.
                </p>

                <h2>Getting in touch</h2>
                <p>
                    If you have any questions about this policy, you can reach us at{' '}
                    <a href={`mailto:${CONTACT_EMAIL}`} className="link">
                        {CONTACT_EMAIL}
                    </a>
                    .
                </p>

                <div className="notice" style={{ marginTop: 18 }}>
                    <span aria-hidden="true">ⓘ</span>
                    <span>
            This policy is a template put together for a demo, and it is not legal advice. A real launch that collects
            information from young students should have its privacy policy looked over by someone who knows the rules.
          </span>
                </div>
            </div>
        </>
    );
}