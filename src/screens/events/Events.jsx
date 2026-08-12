import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext.jsx';
import { EVENTS, CATEGORIES } from '../../data/events.js';
import { Icon, SlidersIcon } from '../../components/UI.jsx';
import { EventGrid } from './eventsShared.jsx';
import SupportButton from '../../components/SupportButton.jsx';

// Sort options. Default keeps the source order, the rest read existing metadata.
const SORTS = [
    { id: 'default', label: 'Default' },
    { id: 'az', label: 'A to Z' },
    { id: 'za', label: 'Z to A' },
    { id: 'time-asc', label: 'Time: Low to High' },
    { id: 'time-desc', label: 'Time: High to Low' },
    { id: 'cost-asc', label: 'Cost: Low to High' },
    { id: 'cost-desc', label: 'Cost: High to Low' },
    { id: 'diff-asc', label: 'Difficulty: Easy to Hard' },
    { id: 'diff-desc', label: 'Difficulty: Hard to Easy' },
];

// Ordering keys for the metadata-driven sorts.
const TIME_ORDER = { light: 0, medium: 1, heavy: 2, project: 3 };
const COST_ORDER = { '0-25': 0, '25-75': 1, '75-150': 2, '150-300': 3, '300+': 4 };
const DIFF_ORDER = { beginner: 0, challenging: 1, competitive: 2 };

// Grouping of raw bands into the three buckets shown in the panel.
const TIME_BUCKET = { light: 'light', medium: 'medium', heavy: 'high', project: 'high' };
const COST_BUCKET = { '0-25': 'low', '25-75': 'low', '75-150': 'medium', '150-300': 'high', '300+': 'high' };

// Filter groups. Every predicate reads a real field on the event object.
const FILTER_GROUPS = [
    {
        key: 'participation',
        title: 'Participation',
        options: [
            { id: 'individual', label: 'Can Compete Individually', test: (e) => !!e.eligibility?.individualOk },
            { id: 'team', label: 'Team Required', test: (e) => teamRequired(e) },
        ],
    },
    {
        key: 'style',
        title: 'Project Style',
        options: [
            { id: 'digital', label: 'Digital', test: (e) => hasStyle(e, 'digital') },
            { id: 'hands-on', label: 'Hands-on', test: (e) => hasStyle(e, 'hands-on') },
            { id: 'creative', label: 'Creative', test: (e) => hasStyle(e, 'creative') },
            { id: 'research', label: 'Research & Analysis', test: (e) => hasStyle(e, 'research') },
        ],
    },
    {
        key: 'difficulty',
        title: 'Difficulty',
        options: [
            { id: 'beginner', label: 'Beginner Friendly', test: (e) => e.difficulty === 'beginner' },
            { id: 'challenging', label: 'Challenging', test: (e) => e.difficulty === 'challenging' },
            { id: 'competitive', label: 'Highly Competitive', test: (e) => e.difficulty === 'competitive' },
        ],
    },
    {
        key: 'time',
        title: 'Time Commitment',
        options: [
            { id: 'light', label: 'Light', test: (e) => TIME_BUCKET[e.timeBand] === 'light' },
            { id: 'medium', label: 'Medium', test: (e) => TIME_BUCKET[e.timeBand] === 'medium' },
            { id: 'high', label: 'High', test: (e) => TIME_BUCKET[e.timeBand] === 'high' },
        ],
    },
    {
        key: 'cost',
        title: 'Cost',
        options: [
            { id: 'low', label: 'Low', test: (e) => COST_BUCKET[e.costBand] === 'low' },
            { id: 'medium', label: 'Medium', test: (e) => COST_BUCKET[e.costBand] === 'medium' },
            { id: 'high', label: 'High', test: (e) => COST_BUCKET[e.costBand] === 'high' },
        ],
    },
];

// An event needs a team when solo is not allowed, or the team size is above one.
function teamRequired(e) {
    const el = e.eligibility || {};
    if (el.individualOk) return false;
    const ts = el.teamSize;
    if (ts == null) return false;
    if (ts === '1') return false;
    return true;
}

// projectStyle is an array of style tags on the event.
function hasStyle(e, tag) {
    return Array.isArray(e.projectStyle) && e.projectStyle.includes(tag);
}

// Build a flat lookup from option id to its group key and test function.
const OPTION_INDEX = {};
FILTER_GROUPS.forEach((g) => g.options.forEach((o) => { OPTION_INDEX[o.id] = { group: g.key, test: o.test }; }));

export default function Events() {
    const { eventsLoading } = useApp();
    const [division, setDivision] = useState('all'); // all | MS | HS
    const [category, setCategory] = useState('All');

    // Advanced panel state.
    const [panelOpen, setPanelOpen] = useState(false);
    const [sort, setSort] = useState('default');
    const [active, setActive] = useState({}); // { optionId: true }

    // Show both divisions by default; MS/HS chips narrow it down.
    const byDivision = EVENTS.filter((e) => division === 'all' || e.division === division);
    const divisionCount = byDivision.length;

    const toggleDivision = (d) => setDivision((cur) => (cur === d ? 'all' : d));

    // Group the selected advanced options by their filter group for OR/AND logic.
    function groupSelected(sel) {
        const byGroup = {};
        Object.keys(sel).forEach((id) => {
            if (!sel[id]) return;
            const meta = OPTION_INDEX[id];
            if (!meta) return;
            (byGroup[meta.group] = byGroup[meta.group] || []).push(meta.test);
        });
        return byGroup;
    }

    // Apply category, then advanced filters (OR within a group, AND across groups).
    function applyFilters(list, sel) {
        const byGroup = groupSelected(sel);
        return list.filter((e) => {
            if (category !== 'All' && e.category !== category) return false;
            for (const tests of Object.values(byGroup)) {
                if (!tests.some((t) => t(e))) return false;
            }
            return true;
        });
    }

    function applySort(list, sortId) {
        const arr = [...list];
        switch (sortId) {
            case 'az': arr.sort((a, b) => a.name.localeCompare(b.name)); break;
            case 'za': arr.sort((a, b) => b.name.localeCompare(a.name)); break;
            case 'time-asc': arr.sort((a, b) => (TIME_ORDER[a.timeBand] ?? 99) - (TIME_ORDER[b.timeBand] ?? 99)); break;
            case 'time-desc': arr.sort((a, b) => (TIME_ORDER[b.timeBand] ?? -1) - (TIME_ORDER[a.timeBand] ?? -1)); break;
            case 'cost-asc': arr.sort((a, b) => (COST_ORDER[a.costBand] ?? 99) - (COST_ORDER[b.costBand] ?? 99)); break;
            case 'cost-desc': arr.sort((a, b) => (COST_ORDER[b.costBand] ?? -1) - (COST_ORDER[a.costBand] ?? -1)); break;
            case 'diff-asc': arr.sort((a, b) => (DIFF_ORDER[a.difficulty] ?? 99) - (DIFF_ORDER[b.difficulty] ?? 99)); break;
            case 'diff-desc': arr.sort((a, b) => (DIFF_ORDER[b.difficulty] ?? -1) - (DIFF_ORDER[a.difficulty] ?? -1)); break;
            default: break;
        }
        return arr;
    }

    // The visible list uses the committed sort and active filters.
    const list = useMemo(
        () => applySort(applyFilters(byDivision, active), sort),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [byDivision, active, sort, category]
    );

    const activeCount = Object.values(active).filter(Boolean).length;

    // Live count inside the open panel reflects the working selection.
    const [draftSort, setDraftSort] = useState(sort);
    const [draftActive, setDraftActive] = useState(active);

    function openPanel() {
        setDraftSort(sort);
        setDraftActive(active);
        setPanelOpen(true);
    }
    function closePanel() { setPanelOpen(false); }
    function toggleDraft(id) {
        setDraftActive((cur) => {
            const next = { ...cur };
            if (next[id]) delete next[id]; else next[id] = true;
            return next;
        });
    }
    function resetDraft() {
        setDraftActive({});
        setDraftSort('default');
        // Apply the cleared state right away so no Show tap is needed.
        setActive({});
        setSort('default');
    }
    function applyPanel() {
        setSort(draftSort);
        setActive(draftActive);
        setPanelOpen(false);
    }

    const draftCount = useMemo(
        () => applySort(applyFilters(byDivision, draftActive), draftSort).length,
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [byDivision, draftActive, draftSort, category]
    );

    return (
        <div className="ev-page">
            {/* Search row, the bar opens the dedicated search page */}
            <div className="ev-searchrow">
                <Link to="/events/search" className="ev-search ev-search-trigger" aria-label="Search TSA events">
                    <Icon name="search" size={18} />
                    <span className="ev-search-placeholder">Search TSA events...</span>
                </Link>
                <button type="button" className="ev-filter-btn" aria-label="Filter and sort" onClick={openPanel}>
                    <SlidersIcon size={26} />
                    {activeCount > 0 && <span className="ev-filter-badge">{activeCount}</span>}
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

            <EventGrid events={list} animKey={`${division}|${category}|${sort}|${activeCount}`} />

            {!eventsLoading && list.length === 0 && (
                <p className="muted" style={{ marginTop: 16 }}>No events match that filter.</p>
            )}

            {/* Filter and sort bottom sheet */}
            {panelOpen && (
                <div className="ev-sheet-backdrop" onClick={closePanel}>
                    <div className="ev-sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Filter and sort">
                        <div className="ev-sheet-head">
                            <h3 className="ev-sheet-title">Filter & Sort</h3>
                            <button className="ev-sheet-close" onClick={closePanel} aria-label="Close">×</button>
                        </div>

                        <div className="ev-sheet-body">
                            <div className="ev-sheet-section">
                                <div className="ev-sheet-section-title">Sort By</div>
                                <div className="ev-sort-list">
                                    {SORTS.map((s) => (
                                        <button
                                            key={s.id}
                                            className={`ev-sort-opt ${draftSort === s.id ? 'on' : ''}`}
                                            onClick={() => setDraftSort(s.id)}
                                        >
                                            <span className="ev-radio" aria-hidden="true" />
                                            <span>{s.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {FILTER_GROUPS.map((g) => (
                                <div className="ev-sheet-section" key={g.key}>
                                    <div className="ev-sheet-section-title">{g.title}</div>
                                    <div className="ev-pillwrap">
                                        {g.options.map((o) => (
                                            <button
                                                key={o.id}
                                                className={`ev-pill ${draftActive[o.id] ? 'on' : ''}`}
                                                onClick={() => toggleDraft(o.id)}
                                            >
                                                {o.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="ev-sheet-foot">
                            <button className="ev-sheet-reset" onClick={resetDraft}>Reset</button>
                            <button className="ev-sheet-apply" onClick={applyPanel}>Show {draftCount} Events</button>
                        </div>
                    </div>
                </div>
            )}

            <SupportButton preset="recommender" />
        </div>
    );
}