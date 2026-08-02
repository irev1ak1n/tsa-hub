import { useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { EVENTS, CATEGORIES } from '../../data/events.js';
import { Icon } from '../../components/UI.jsx';
import { imageForEvent } from '../../data/eventImages.js';

// Combined division badge, MS before HS (e.g. "MS/HS").
function divisionLabel(divs) {
    return ['MS', 'HS'].filter((d) => divs.includes(d)).join('/');
}

// Collapse events that share a display name across divisions into one tile,
// so identical images/text don't appear twice. The tile keeps a combined
// division label. (Counts elsewhere still use the un-merged event list.)
function mergeByName(events) {
    const groups = new Map();
    for (const e of events) {
        const key = (e.name || '').trim().toLowerCase();
        const g = groups.get(key);
        if (g) {
            if (!g.divisions.includes(e.division)) g.divisions.push(e.division);
        } else {
            groups.set(key, { rep: e, divisions: [e.division] });
        }
    }
    return [...groups.values()].map((g) => ({ ...g.rep, _divisions: g.divisions }));
}

export default function Events() {
    const { eventsLoading } = useApp();
    const [query, setQuery] = useState('');
    const [division, setDivision] = useState('all'); // 'all' | 'MS' | 'HS'
    const [category, setCategory] = useState('All');

    const q = query.trim().toLowerCase();

    // Show both divisions by default; MS/HS chips narrow it down.
    const byDivision = EVENTS.filter((e) => division === 'all' || e.division === division);
    const divisionCount = byDivision.length;

    const list = byDivision.filter((e) => {
        if (category !== 'All' && e.category !== category) return false;
        if (q && !(e.name + ' ' + e.category).toLowerCase().includes(q)) return false;
        return true;
    });

    // Click active division again to clear it (back to "all").
    const toggleDivision = (d) => setDivision((cur) => (cur === d ? 'all' : d));

    return (
        <div className="ev-page">
            {/* Instagram-style search row */}
            <div className="ev-searchrow">
                <div className="ev-search">
                    <Icon name="search" size={18} />
                    <input
                        className="ev-search-input"
                        placeholder="Search TSA events..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        aria-label="Search TSA events"
                    />
                </div>
                <button type="button" className="ev-filter-btn" aria-label="Filters">
                    <Icon name="funnel" size={20} />
                </button>
            </div>

            {/* Horizontal filter chips */}
            <div className="ev-chips" role="tablist" aria-label="Filters">
                <button
                    type="button"
                    className={`ev-chip ${division === 'MS' ? 'on' : ''}`}
                    onClick={() => toggleDivision('MS')}
                >
                    MS
                </button>
                <button
                    type="button"
                    className={`ev-chip ${division === 'HS' ? 'on' : ''}`}
                    onClick={() => toggleDivision('HS')}
                >
                    HS
                </button>

                <span className="ev-chip-sep" aria-hidden="true" />

                {['All', ...CATEGORIES].map((c) => (
                    <button
                        key={c}
                        type="button"
                        className={`ev-chip ${category === c ? 'on' : ''}`}
                        onClick={() => setCategory(c)}
                    >
                        {c === 'All' ? `All (${divisionCount})` : c}
                    </button>
                ))}

                {/* Opens extra filters later (team size, cost, difficulty, ...) */}
                <button type="button" className="ev-chip ev-chip-add" aria-label="More filters">
                    <Icon name="plus" size={16} />
                </button>
            </div>

            {eventsLoading && <p className="muted" style={{ marginTop: 12 }}>Loading events…</p>}

            {/* Explore-style image gallery (MS/HS duplicates merged) */}
            <div className="ev-grid">
                {mergeByName(list).map((e) => {
                    const img = imageForEvent(e);
                    const badge = divisionLabel(e._divisions);
                    return (
                        <figure key={e.id} className="ev-tile">
                            {badge && <span className="ev-tile-badge">{badge}</span>}
                            {img ? (
                                <img className="ev-tile-img" src={img} alt="" loading="lazy" />
                            ) : (
                                <div className="ev-tile-img ev-tile-fallback" aria-hidden="true" />
                            )}
                            <figcaption className="ev-tile-name">{e.name}</figcaption>
                        </figure>
                    );
                })}
            </div>

            {!eventsLoading && list.length === 0 && (
                <p className="muted" style={{ marginTop: 16 }}>No events match that search.</p>
            )}
        </div>
    );
}