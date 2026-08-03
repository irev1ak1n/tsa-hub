import { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { Icon } from '../../components/UI.jsx';
import { getStateTsa } from '../../data/stateTsa.js';
import { BackLink } from './resourcesShared.jsx';
import { buildResourceIndex, matchesResource, SearchResults } from './resourceSearch.jsx';

export default function ResourceSearch() {
    const { prefs } = useApp();
    const stateInfo = getStateTsa(prefs?.state);
    const inputRef = useRef(null);

    const [query, setQuery] = useState('');
    const [recent, setRecent] = useState(() => {
        try { return JSON.parse(localStorage.getItem('rs-recent') || '[]'); } catch { return []; }
    });

    const q = query.trim().toLowerCase();

    // Focus the field as soon as the page opens.
    useEffect(() => { inputRef.current?.focus(); }, []);


    const saveRecent = (list) => {
        setRecent(list);
        try { localStorage.setItem('rs-recent', JSON.stringify(list)); } catch { /* ignore */ }
    };
    const addRecent = (term) => {
        const t = (term || '').trim();
        if (!t) return;
        saveRecent([t, ...recent.filter((r) => r.toLowerCase() !== t.toLowerCase())].slice(0, 5));
    };
    const removeRecent = (term) => saveRecent(recent.filter((r) => r !== term));
    const clearRecent = () => saveRecent([]);

    const tokens = q.split(/\s+/).filter(Boolean);
    const results = q ? buildResourceIndex(stateInfo).filter((it) => matchesResource(it, tokens)) : [];

    return (
        <>
            <BackLink to="/resources" />

            {/* Search bar */}
            <div className="rs-search rs-search-page">
                <Icon name="search" size={18} />
                <input
                    ref={inputRef}
                    type="text"
                    className="rs-search-input"
                    placeholder="Search resources"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') addRecent(query); }}
                    aria-label="Search resources"
                />
                {query && (
                    <button type="button" className="rs-search-clear" onClick={() => setQuery('')} aria-label="Clear search">
                        <Icon name="x" size={16} />
                    </button>
                )}
            </div>

            {q ? (
                <SearchResults results={results} query={query} onPick={() => addRecent(query)} />
            ) : recent.length > 0 ? (
                <div className="rs-recent">
                    <div className="rs-recent-head">
                        <span className="rs-recent-label">Recent searches</span>
                        <button type="button" className="rs-recent-clear" onClick={clearRecent}>Clear</button>
                    </div>
                    <div className="rs-recent-list">
                        {recent.map((term) => (
                            <div key={term} className="rs-recent-item">
                                <button type="button" className="rs-recent-term" onClick={() => setQuery(term)}>
                                    <Icon name="search" size={14} />
                                    <span>{term}</span>
                                </button>
                                <button
                                    type="button"
                                    className="rs-recent-remove"
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
                <p className="rs-search-hint">Search TSA guides, rules, programs, conference info, and more.</p>
            )}
        </>
    );
}