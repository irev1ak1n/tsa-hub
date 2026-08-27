import { useState } from 'react';
import { Icon } from '../../components/UI.jsx';
import { BackLink } from '../resources/resourcesShared.jsx';
import { ContactSupportModal } from './HelpModals.jsx';

// No real uptime-monitoring backend exists for TSA Hub. This intentionally
// does NOT show fake percentages or a green "Operational" badge backed by
// nothing — just an honest statement and a way to reach support.
const SYSTEMS = [
    { id: 'app', title: 'TSA Hub application', desc: 'Events, Resources, Calendar, and Settings' },
    { id: 'coach', title: 'TSA Assistant', desc: 'The in-app assistant (Coach)' },
    { id: 'support', title: 'Support submission', desc: 'Sending a support message or report' },
];

export default function HelpStatus() {
    const [showSupport, setShowSupport] = useState(false);

    return (
        <>
            <BackLink to="/help" label="Back" />

            <div className="section">
                <div className="rs-eyebrow">Support</div>
                <h1 className="rs-h1">System Status</h1>
                <p className="rs-sub">Check TSA Hub service information.</p>
            </div>

            <div className="rs-card">
                {SYSTEMS.map((s) => (
                    <div key={s.id} className="rs-row is-disabled" aria-disabled="true">
                        <span className="rs-ico"><Icon name="activity" size={20} /></span>
                        <span className="rs-text">
                            <span className="rs-title">{s.title}</span>
                            <span className="rs-desc">{s.desc}</span>
                        </span>
                        <span className="small muted">No known issue reported</span>
                    </div>
                ))}
            </div>

            <p className="rs-sub" style={{ marginTop: 4 }}>
                TSA Hub doesn’t currently run automated uptime monitoring, so this page can’t show live status —
                if something isn’t working for you, contact TSA Hub Support and we’ll look into it.
            </p>

            <button type="button" className="btn primary" onClick={() => setShowSupport(true)}>
                Contact TSA Hub Support
            </button>

            {showSupport && <ContactSupportModal onClose={() => setShowSupport(false)} />}
        </>
    );
}
