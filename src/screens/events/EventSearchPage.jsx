import { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { Icon } from '../../components/UI.jsx';
import { BackLink } from '../resources/resourcesShared.jsx';
import { EVENTS } from '../../data/events.js';
import { matchesQuery } from '../../data/eventSearch.js';
import { EventGrid } from './eventsShared.jsx';
import EventInfoModal from './EventInfoModal.jsx';

const RECENT_KEY = 'ev-recent';

export default function EventSearchPage() {
    const { eventsLoading } = useApp();
    const inputRef = useRef(null);

    const [query, setQuery] = useState('');
    const [openEvent, setOpenEvent] = useState(null);
    const [recent, setRecent] = useState(() => {
        try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch { return []; }
    });

    const q = query.trim();

    useEffect(() => { inputRef.current?.focus(); }, []);

    const saveRecent = (list) => {
        setRecent(list);
        try { localStorage.setItem(RECENT_KEY, JSON.stringify(list)); } catch { /* ignore */ }
    };
    const addRecent = (term) => {
        const t = (term || '').trim();
        if (!t) return;
        saveRecent([t, ...recent.filter((r) => r.toLowerCase() !== t.toLowerCase())].slice(0, 5));
    };
    const removeRecent = (term) => saveRecent(recent.filter((r) => r !== term));
    const clearRecent = () => saveRecent([]);

    // Live search across all events (both divisions).
    const results = q ? EVENTS.filter((e) => matchesQuery(e, q)) : [];

    return (
        <div className="ev-page">
            <BackLink to="/events" />

            {/* Search bar */}
            <div className="ev-searchrow">
                <div className="ev-search">
                    <Icon name="search" size={18} />
                    <input
                        ref={inputRef}
                        className="ev-search-input"
                        placeholder="Search TSA events..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onBlur={() => addRecent(query)}
                        aria-label="Search TSA events"
                    />
                    {query && (
                        <button type="button" className="ev-search-clear" onClick={() => setQuery('')} aria-label="Clear search">
                            <Icon name="x" size={16} />
                        </button>
                    )}
                </div>
            </div>

            {q ? (
                <>
                    {eventsLoading && <p className="muted" style={{ marginTop: 12 }}>Loading events…</p>}
                    <EventGrid events={results} animKey={q} onSelect={setOpenEvent} />
                    {!eventsLoading && results.length === 0 && (
                        <p className="muted" style={{ marginTop: 16 }}>No events match that search.</p>
                    )}
                </>
            ) : recent.length > 0 ? (
                <div className="ev-recent">
                    <div className="ev-recent-head">
                        <span className="ev-recent-label">Recent searches</span>
                        <button type="button" className="ev-recent-clear" onClick={clearRecent}>Clear</button>
                    </div>
                    <div className="ev-recent-list">
                        {recent.map((term) => (
                            <div key={term} className="ev-recent-item">
                                <button type="button" className="ev-recent-term" onClick={() => setQuery(term)}>
                                    <Icon name="search" size={14} />
                                    <span>{term}</span>
                                </button>
                                <button
                                    type="button"
                                    className="ev-recent-remove"
                                    onClick={() => removeRecent(term)}
                                    aria-label={`Remove ${term}`}
                                >
                                    <Icon name="x" size={13} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <p className="ev-search-hint">Search events by name, skill, or keyword.</p>
            )}

            {openEvent && <EventInfoModal event={openEvent} onClose={() => setOpenEvent(null)} />}
        </div>
    );
}