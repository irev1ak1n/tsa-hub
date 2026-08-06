import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext.jsx';
import { EVENTS, CATEGORIES } from '../../data/events.js';
import { Icon, SlidersIcon } from '../../components/UI.jsx';
import { EventGrid } from './eventsShared.jsx';
import SupportButton from '../../components/SupportButton.jsx';

export default function Events() {
    const { eventsLoading } = useApp();
    const [division, setDivision] = useState('all'); // 'all' | 'MS' | 'HS'
    const [category, setCategory] = useState('All');

    // Show both divisions by default; MS/HS chips narrow it down.
    const byDivision = EVENTS.filter((e) => division === 'all' || e.division === division);
    const divisionCount = byDivision.length;

    const list = byDivision.filter((e) => category === 'All' || e.category === category);

    // Click active division again to clear it (back to "all").
    const toggleDivision = (d) => setDivision((cur) => (cur === d ? 'all' : d));

    return (
        <div className="ev-page">
            {/* Search row — the bar opens the dedicated search page */}
            <div className="ev-searchrow">
                <Link to="/events/search" className="ev-search ev-search-trigger" aria-label="Search TSA events">
                    <Icon name="search" size={18} />
                    <span className="ev-search-placeholder">Search TSA events...</span>
                </Link>
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
            <EventGrid events={list} animKey={`${division}|${category}`} />

            {!eventsLoading && list.length === 0 && (
                <p className="muted" style={{ marginTop: 16 }}>No events match that filter.</p>
            )}


            <SupportButton preset="recommender" />
        </div>

    );
}