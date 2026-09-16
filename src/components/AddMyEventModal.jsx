import { useState } from 'react';
import { Icon } from './UI.jsx';
import { EVENTS } from '../data/events.js';
import { matchesQuery } from '../data/eventSearch.js';
import { useApp } from '../context/AppContext.jsx';

// Reuses the exact same event catalog (EVENTS) and search logic
// (matchesQuery) as the main Events search page — never a second copy of
// the event dataset. Division is shown per-row (each EVENTS row is already
// one specific division), so "add the same event/division twice" is simply
// "this exact id is already in myEvents", which useApp().addEvent already
// guards against.
export default function AddMyEventModal({ onClose }) {
    const { myEvents, addEvent } = useApp();
    const [query, setQuery] = useState('');

    const q = query.trim();
    const list = (q ? EVENTS.filter((e) => matchesQuery(e, q)) : EVENTS)
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name));

    return (
        <div className="rs-modal-backdrop" onClick={onClose}>
            <div
                className="rs-modal qae-modal myev-add-modal"
                role="dialog"
                aria-modal="true"
                aria-label="Add to My Events"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="rs-modal-head">
                    <h3>Add to My Events</h3>
                    <button type="button" className="rs-modal-close" onClick={onClose} aria-label="Close">×</button>
                </div>

                <div className="rs-modal-body qae-body">
                    <div className="rs-search qae-search">
                        <Icon name="search" size={16} />
                        <input
                            className="rs-search-input"
                            placeholder="Search TSA events"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            autoFocus
                            aria-label="Search TSA events"
                        />
                    </div>

                    <div className="myev-modal-list">
                        {list.map((event) => {
                            const added = myEvents.includes(event.id);
                            return (
                                <button
                                    type="button"
                                    key={event.id}
                                    className={`myev-modal-row${added ? ' is-added' : ''}`}
                                    onClick={() => !added && addEvent(event.id)}
                                    disabled={added}
                                    aria-pressed={added}
                                >
                                    <span className="myev-modal-badge">{event.division}</span>
                                    <span className="myev-modal-row-text">
                                        <span className="myev-modal-row-name">{event.name}</span>
                                        {event.category && <span className="myev-modal-row-meta">{event.category}</span>}
                                    </span>
                                    <Icon name={added ? 'check' : 'plus'} size={16} />
                                </button>
                            );
                        })}
                        {list.length === 0 && <p className="rs-state-empty">No events match your search.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}
