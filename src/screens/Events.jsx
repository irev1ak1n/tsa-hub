import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { EVENTS, CATEGORIES, teamSizeLabel } from '../data/events.js';
import { Icon } from '../components/UI.jsx';

const PER_PAGE = 6;

export default function Events() {
    const { profile, myEvents, addEvent, removeEvent, eventsLoading } = useApp();
    const [query, setQuery] = useState('');
    const [division, setDivision] = useState(profile?.division || 'HS');
    const [category, setCategory] = useState('All');
    const [page, setPage] = useState(1);

    const q = query.trim().toLowerCase();
    const divisionCount = EVENTS.filter((e) => e.division === division).length;

    const list = EVENTS.filter((e) => {
        if (e.division !== division) return false;
        if (category !== 'All' && e.category !== category) return false;
        if (q && !(e.name + ' ' + e.category).toLowerCase().includes(q)) return false;
        return true;
    });

    // Any filter change resets to page 1, so you're never stranded on a
    // page number that no longer exists after the list shrinks.
    useEffect(() => {
        setPage(1);
    }, [query, division, category]);

    const pageCount = Math.max(1, Math.ceil(list.length / PER_PAGE));
    const safePage = Math.min(page, pageCount);
    const pageItems = list.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

    return (
        <>
            <div className="section">
                <div className="eyebrow">Event Explorer</div>
                <h1>Events</h1>
                <p className="muted small">
                    Official TSA competitive events, {division === 'HS' ? 'High School' : 'Middle School'} division.
                </p>
            </div>

            <div className="section card flat" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ flex: '1 1 220px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Icon name="search" size={18} />
                    <input
                        className="input"
                        style={{ border: 0, padding: '6px 2px' }}
                        placeholder="Search events…"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        aria-label="Search events"
                    />
                </div>
                <div className="chip-row">
                    <button className={`chip ${division === 'MS' ? 'on' : ''}`} onClick={() => setDivision('MS')}>
                        MS
                    </button>
                    <button className={`chip ${division === 'HS' ? 'on' : ''}`} onClick={() => setDivision('HS')}>
                        HS
                    </button>
                </div>
            </div>

            <div className="pilltabs" role="tablist" aria-label="Category filter">
                {['All', ...CATEGORIES].map((c) => (
                    <button key={c} className={category === c ? 'on' : ''} onClick={() => setCategory(c)}>
                        {c === 'All' ? `All (${divisionCount})` : c}
                    </button>
                ))}
            </div>

            <div className="section" style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Link to="/recommend" className="btn primary small">
                    <Icon name="spark" size={16} /> Not sure? Get recommendations
                </Link>
            </div>

            {eventsLoading && <p className="muted">Loading events…</p>}

            <div className="event-grid">
                {pageItems.map((e) => {
                    const added = myEvents.includes(e.id);
                    return (
                        <div className="event-card" key={e.id}>
                            <div className="top">
                                <h3>
                                    <Link to={`/events/${e.id}`}>{e.name}</Link>
                                </h3>
                                <span className="tag">{e.category.split(' ')[0]}</span>
                            </div>
                            <div className="meta">
                                <span>{e.category}</span>
                                {teamSizeLabel(e) && (
                                    <>
                                        <span>·</span>
                                        <span>{teamSizeLabel(e)}</span>
                                    </>
                                )}
                            </div>
                            {e.overview && <p className="event-overview">{e.overview}</p>}
                            <div className="foot">
                                <Link to={`/events/${e.id}`} className="btn ghost small">
                                    Details
                                </Link>
                                {added ? (
                                    <button className="btn navy small" onClick={() => removeEvent(e.id)}>
                                        ✓ Added — remove
                                    </button>
                                ) : (
                                    <button className="btn primary small" onClick={() => addEvent(e.id)}>
                                        <Icon name="plus" size={14} /> My events
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {!eventsLoading && list.length === 0 && (
                <div className="card">
                    <p className="muted">No events match that search in this division. Try clearing filters.</p>
                </div>
            )}

            {pageCount > 1 && (
                <nav className="pager" aria-label="Pages">
                    <button
                        className="pager-arrow"
                        onClick={() => setPage(safePage - 1)}
                        disabled={safePage === 1}
                        aria-label="Previous page"
                    >
                        <Icon name="chevron-right" size={16} />
                    </button>
                    {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
                        <button key={n} className={`pager-num ${n === safePage ? 'on' : ''}`} onClick={() => setPage(n)}>
                            {n}
                        </button>
                    ))}
                    <button
                        className="pager-arrow next"
                        onClick={() => setPage(safePage + 1)}
                        disabled={safePage === pageCount}
                        aria-label="Next page"
                    >
                        <Icon name="chevron-right" size={16} />
                    </button>
                </nav>
            )}
        </>
    );
}