import { useState } from 'react';
import { Link } from 'react-router-dom';
import { RowIcon, ContactModal, NATIONAL_CONTACT, STATE_DIRECTORY_URL } from '../screens/resources/resourcesShared.jsx';
import tsaLeadership from '../assets/img/tsa-leadership.png';

// One compact square card — same visual language as Home's Quick Actions
// tiles (.quick3-tile), just a touch smaller/denser (see .leadership-tile),
// not the horizontal pill row used by National TSA Links. Exactly one of
// `to` (internal route), `href` (external link), or `onClick` (e.g. open a
// contact modal) is set per item, mirroring how Row/StateLinkRow on the
// real Leadership & Support page decide their own behavior — only the
// layout changed here, not any routing/action logic.
function LeadershipCard({ icon, img, mono, iconColor, title, to, href, onClick }) {
    const inner = (
        <>
            <RowIcon icon={icon} img={img} mono={mono} color={iconColor} />
            <span className="leadership-label">{title}</span>
        </>
    );
    if (to) return <Link to={to} className="leadership-tile">{inner}</Link>;
    if (href) return <a href={href} target="_blank" rel="noreferrer" className="leadership-tile">{inner}</a>;
    return <button type="button" className="leadership-tile" onClick={onClick}>{inner}</button>;
}

// TSA Leadership & Support — 5 of the resources also on the dedicated
// src/screens/resources/LeadershipSupport.jsx page (national staff/board
// links, state directory, national contact modal) and the National TSA
// Officers page, as a compact Home grid (3 cards / 2 cards, no State
// Advisor — that one is state-specific and lives on the full page instead).
// Reuses their exact hrefs/contact data/routes — nothing here is a second
// copy of that content.
export default function HomeLeadershipLinks() {
    const [contactModal, setContactModal] = useState(null); // { title, contact } | null

    return (
        <div className="section">
            <div className="section-head">
                <h2>TSA Leadership &amp; Support</h2>
            </div>
            <div className="leadership-grid">
                <LeadershipCard
                    icon="user"
                    title="National TSA Staff"
                    href="https://tsaweb.org/about/national-tsa-staff"
                />
                <LeadershipCard
                    img={tsaLeadership}
                    mono
                    title="Contact National TSA"
                    onClick={() => setContactModal({ title: 'Contact National TSA', contact: NATIONAL_CONTACT })}
                />
                <LeadershipCard
                    icon="users"
                    title="National Officer Team"
                    to="/resources/national-officers"
                />
                <LeadershipCard
                    img={tsaLeadership}
                    mono
                    title="Board of Directors"
                    href="https://tsaweb.org/about/tsa-inc.-board-of-directors"
                />
                <LeadershipCard
                    icon="globe"
                    iconColor="var(--ig-blue)"
                    title="State Delegations"
                    href={STATE_DIRECTORY_URL}
                />
            </div>

            {contactModal && (
                <ContactModal
                    title={contactModal.title}
                    contact={contactModal.contact}
                    onClose={() => setContactModal(null)}
                />
            )}
        </div>
    );
}
