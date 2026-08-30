import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext.jsx';
import { Icon } from '../../components/UI.jsx';
import { EVENTS } from '../../data/events.js';
import { BackLink } from './resourcesShared.jsx';

function byName(a, b) {
    return a.name.localeCompare(b.name);
}

function DivisionGroup({ label, events }) {
    if (!events.length) return null;
    return (
        <>
            <div className="rs-group-label">{label}</div>
            <div className="rs-card">
                <div className="rs-event-grid">
                    {events.map((ev) => (
                        <Link key={ev.id} to={`/resources/events/${ev.id}`} className="rs-event-link">
                            <span>{ev.name}</span>
                            <Icon name="chevron-right" size={16} />
                        </Link>
                    ))}
                </div>
            </div>
        </>
    );
}

export default function ResourcesEventThemes() {
    const { eventsLoading } = useApp();
    const msEvents = EVENTS.filter((e) => e.division === 'MS').sort(byName);
    const hsEvents = EVENTS.filter((e) => e.division === 'HS').sort(byName);

    return (
        <>
            <BackLink />

            <div className="section">
                <div className="rs-eyebrow">Events</div>
                <h1 className="rs-h1">Event Guide</h1>
                <p className="rs-sub">
                    Explore each competitive event&rsquo;s current theme, requirements, submissions, resources,
                    team details, and other important information.
                </p>
            </div>

            {eventsLoading && <p className="muted small">Loading events…</p>}

            {!eventsLoading && (
                <>
                    <DivisionGroup label="Middle School" events={msEvents} />
                    <DivisionGroup label="High School" events={hsEvents} />
                </>
            )}

            {!eventsLoading && msEvents.length === 0 && hsEvents.length === 0 && (
                <p className="rs-note">Event data isn&rsquo;t available right now — try again in a moment.</p>
            )}
        </>
    );
}
