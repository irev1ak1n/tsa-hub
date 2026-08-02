import { useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { EVENTS, CATEGORIES } from '../../data/events.js';
import { Icon, SlidersIcon } from '../../components/UI.jsx';
import { imageForEvent } from '../../data/eventImages.js';
import { matchesQuery } from '../../data/eventSearch.js';

// Some events are the same across divisions but have slightly different names
// (e.g. "Dragster" vs "Dragster Design"). Map those variants to one canonical
// group so they merge into a single MS/HS tile. `name` is what the tile shows.
const MERGE_GROUPS = [
    { key: 'structural', name: 'Structural Engineering', variants: ['structural engineering', 'structural design and engineering'] },
    { key: 'dragster', name: 'Dragster', variants: ['dragster', 'dragster design'] },
    { key: 'tech-bowl', name: 'Technology Bowl', variants: ['tech bowl', 'technology bowl'] },
    { key: 'biotechnology', name: 'Biotechnology', variants: ['biotechnology', 'biotechnology design'] },
];

const _variantToGroup = {};
for (const g of MERGE_GROUPS) {
    for (const v of g.variants) _variantToGroup[v] = g;
}

function canonicalName(name) {
    const n = (name || '').trim().toLowerCase();
    return _variantToGroup[n] ? _variantToGroup[n].key : n;
}
function displayName(rep) {
    const n = (rep.name || '').trim().toLowerCase();
    return _variantToGroup[n] ? _variantToGroup[n].name : rep.name;
}

// Combined division badge, MS before HS (e.g. "MS/HS").
function divisionLabel(divs) {
    return ['MS', 'HS'].filter((d) => divs.includes(d)).join('/');
}

// Collapse events that are the same across divisions into one tile, so
// identical images/text don't appear twice. Groups by canonical name (which
// also covers known name variants). The tile keeps a combined division label.
// (Counts elsewhere still use the un-merged event list.)
function mergeByName(events) {
    const groups = new Map();
    for (const e of events) {
        const key = canonicalName(e.name);
        const g = groups.get(key);
        if (g) {
            if (!g.divisions.includes(e.division)) g.divisions.push(e.division);
        } else {
            groups.set(key, { rep: e, divisions: [e.division] });
        }
    }
    return [...groups.values()].map((g) => ({
        ...g.rep,
        name: displayName(g.rep),
        _divisions: g.divisions,
    }));
}

export default function Events() {
    const { eventsLoading } = useApp();
    const [query, setQuery] = useState('');        // what's typed in the box
    const [submitted, setSubmitted] = useState(''); // the active search (on submit)
    const [division, setDivision] = useState('all'); // 'all' | 'MS' | 'HS'
    const [category, setCategory] = useState('All');

    // Run the search only when the user presses the button or Enter.
    const runSearch = () => setSubmitted(query.trim());

    // Show both divisions by default; MS/HS chips narrow it down.
    const byDivision = EVENTS.filter((e) => division === 'all' || e.division === division);
    const divisionCount = byDivision.length;

    const inCategory = (e) => category === 'All' || e.category === category;

    // Build the result list.
    // If the submitted text exactly matches an event name (or a merged variant),
    // show ONLY that event — not the whole category. Otherwise fall back to the
    // broad keyword/category search.
    let list;
    const submittedKey = canonicalName(submitted);
    if (submitted && byDivision.some((e) => canonicalName(e.name) === submittedKey)) {
        list = byDivision.filter((e) => inCategory(e) && canonicalName(e.name) === submittedKey);
    } else {
        list = byDivision.filter((e) => inCategory(e) && matchesQuery(e, submitted));
    }

    // Click active division again to clear it (back to "all").
    const toggleDivision = (d) => setDivision((cur) => (cur === d ? 'all' : d));

    return (
        <div className="ev-page">
            {/* Instagram-style search row */}
            <div className="ev-searchrow">
                <div className="ev-search">
                    <button type="button" className="ev-search-btn" onClick={runSearch} aria-label="Search">
                        <Icon name="search" size={18} />
                    </button>
                    <input
                        className="ev-search-input"
                        placeholder="Search TSA events..."
                        value={query}
                        onChange={(e) => {
                            const v = e.target.value;
                            setQuery(v);
                            // clearing the field shows all events again (no submit needed)
                            if (v.trim() === '') setSubmitted('');
                        }}
                        onKeyDown={(e) => { if (e.key === 'Enter') runSearch(); }}
                        aria-label="Search TSA events"
                    />
                </div>
                <button type="button" className="ev-filter-btn" aria-label="Filters">
                    <SlidersIcon size={26} />
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

                <button
                    type="button"
                    className={`ev-chip ev-chip-all ${category === 'All' ? 'on' : ''}`}
                    onClick={() => setCategory('All')}
                >
                    All ({divisionCount})
                </button>

                {/* Opens extra filters later (team size, cost, difficulty, ...) */}
                <button type="button" className="ev-chip-add" aria-label="More filters">
                    <Icon name="plus" size={16} />
                </button>

                {CATEGORIES.map((c) => (
                    <button
                        key={c}
                        type="button"
                        className={`ev-chip ${category === c ? 'on' : ''}`}
                        onClick={() => setCategory(c)}
                    >
                        {c}
                    </button>
                ))}
            </div>

            {eventsLoading && <p className="muted" style={{ marginTop: 12 }}>Loading events…</p>}

            {/* Explore-style image gallery (MS/HS duplicates merged) */}
            <div className="ev-grid" key={`${division}|${category}|${submitted}`}>
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