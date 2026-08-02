import { useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { getStateTsa } from '../../data/stateTsa.js';
import {
    Row,
    StateLinkRow,
    ContactModal,
    BackLink,
    NATIONAL_CONTACT,
    STATE_DIRECTORY_URL,
} from './resourcesShared.jsx';
import tsaLeadership from '../../assets/img/tsa-leadership.png';

export default function LeadershipSupport() {
    const { prefs } = useApp();
    const state = prefs?.state;
    const stateInfo = getStateTsa(state);

    const [contactModal, setContactModal] = useState(null); // { title, contact } | null
    const openContact = (title, contact) => setContactModal({ title, contact });

    // Dynamic state advisor (from the user's state data), if available.
    const stateAdvisorLink = (stateInfo?.links || []).find((l) => l.role === 'advisor') || null;

    return (
        <>
            <BackLink />

            <div className="section">
                <h1>TSA Leadership &amp; Support</h1>
                <p className="muted small" style={{ margin: 0 }}>
                    Connect with state advisors, national leaders, and the official contacts who help guide and support TSA members.
                </p>
            </div>

            {/* Advisors & organization leadership */}
            <div className="rs-group-label">Advisors &amp; leadership</div>
            <div className="rs-card">
                {stateAdvisorLink && (
                    <StateLinkRow
                        link={{
                            ...stateAdvisorLink,
                            title: 'State Advisor',
                            desc: 'Contact your state advisor for official guidance.',
                        }}
                        onOpenContact={openContact}
                    />
                )}
                <Row
                    icon="user"
                    title="National TSA Staff"
                    desc="Meet the team behind TSA&rsquo;s national programs and operations."
                    href="https://tsaweb.org/about/national-tsa-staff"
                />
                <Row
                    img={tsaLeadership}
                    title="Board of Directors"
                    desc="Learn about the board that guides TSA&rsquo;s direction."
                    href="https://tsaweb.org/about/tsa-inc.-board-of-directors"
                />
            </div>

            {/* Directories & contact */}
            <div className="rs-group-label">Directories &amp; contact</div>
            <div className="rs-card">
                <Row
                    icon="globe"
                    iconColor="var(--ig-blue)"
                    title="State Delegations"
                    desc="Find official TSA websites and contacts by state."
                    href={STATE_DIRECTORY_URL}
                />
                <Row
                    img={tsaLeadership}
                    title="Contact National TSA"
                    desc="Reach the national office with general questions."
                    onClick={() => openContact('Contact National TSA', NATIONAL_CONTACT)}
                />
            </div>

            {contactModal && (
                <ContactModal
                    title={contactModal.title}
                    contact={contactModal.contact}
                    onClose={() => setContactModal(null)}
                />
            )}
        </>
    );
}