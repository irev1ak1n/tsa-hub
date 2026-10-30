import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext.jsx';
import { Icon } from '../../components/UI.jsx';
import { EVENTS } from '../../data/events.js';
import { BackLink } from './resourcesShared.jsx';
import { Skeleton, LoadingRegion, LoadError } from '../../components/Skeleton.jsx';

function byName(a, b) {
    return a.name.localeCompare(b.name);
}

const SKELETON_WIDTHS = ['72%', '58%', '66%', '80%', '54%', '70%'];

function GuideListSkeleton() {
    return (
        <LoadingRegion label="Loading events">
            {['Middle School', 'High School'].map((label) => (
                <div key={label}>
                    <div className="rs-group-label">{label}</div>
                    <div className="rs-card">
                        <div className="rs-event-grid">
                            {SKELETON_WIDTHS.map((w, i) => (
                                <div className="rs-event-link" key={i}>
                                    <Skeleton w={w} h={16} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ))}
        </LoadingRegion>
    );
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
    const { eventsLoading, eventsError, reloadEvents } = useApp();
    const [query, setQuery] = useState('');

    const q = query.trim().toLowerCase();
    const matches = (e) => !q || e.name.toLowerCase().includes(q);

    const msEvents = EVENTS.filter((e) => e.division === 'MS' && matches(e)).sort(byName);
    const hsEvents = EVENTS.filter((e) => e.division === 'HS' && matches(e)).sort(byName);

    return (
        <>
            <BackLink />

            <div className="section">
                <div className="rs-eyebrow">Events</div>
                <h1 className="rs-h1">Event Guide</h1>
                <p className="rs-sub">
                    See each event&rsquo;s current theme, requirements, submissions, resources, and team details.
                </p>
            </div>

            {/* Filters the Middle School / High School lists below by event name —
                same search bar styling used elsewhere in TSA Hub. */}
            <div className="rs-search">
                <Icon name="search" size={18} />
                <input
                    type="text"
                    className="rs-search-input"
                    placeholder="Search events by name"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    aria-label="Search Event Guide by event name"
                />
                {query && (
                    <button type="button" className="rs-search-clear" onClick={() => setQuery('')} aria-label="Clear search">
                        <Icon name="x" size={16} />
                    </button>
                )}
            </div>

            {eventsLoading && <GuideListSkeleton />}

            {!eventsLoading && eventsError && (
                <LoadError message="We couldn't load events right now." onRetry={reloadEvents} />
            )}

            {!eventsLoading && !eventsError && (
                <>
                    <DivisionGroup label="Middle School" events={msEvents} />
                    <DivisionGroup label="High School" events={hsEvents} />
                </>
            )}

            {!eventsLoading && !eventsError && msEvents.length === 0 && hsEvents.length === 0 && (
                <p className="rs-note">
                    {q ? `No events match "${query}".` : 'Event data isn’t available right now. Try again in a moment.'}
                </p>
            )}
        </>
    );
}
