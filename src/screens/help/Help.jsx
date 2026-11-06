import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../../components/UI.jsx';
import { POPULAR_TOPICS, listedArticles, searchHelp } from '../../data/helpContent.js';
import { BackLink } from '../resources/resourcesShared.jsx';

function HelpRow({ icon, title, subtitle, onClick }) {
    return (
        <button type="button" className="rs-row help-row" onClick={onClick}>
            <span className="rs-ico"><Icon name={icon} size={20} /></span>
            <span className="rs-text">
                <span className="rs-title">{title}</span>
                {subtitle && <span className="rs-desc">{subtitle}</span>}
            </span>
            <Icon name="chevron-right" size={18} />
        </button>
    );
}

export default function Help() {
    const navigate = useNavigate();
    const [query, setQuery] = useState('');

    // A single dispatcher used by both the normal sections and search
    // results, so a topic behaves identically whichever way it was found.
    function openItem(item) {
        if (item.article) navigate(`/help/article/${item.article}`);
        else if (item.to) navigate(item.to);
    }

    const q = query.trim();
    const results = q ? searchHelp(q) : [];
    const articles = listedArticles();

    return (
        <>
            <BackLink to="/settings" label="Back" />

            <div className="section">
                <div className="rs-eyebrow">Support</div>
                <h1 className="rs-h1">Help Center</h1>
                <p className="rs-sub">Find answers and learn how to use TSA Hub.</p>
            </div>

            <div className="rs-search">
                <Icon name="search" size={18} />
                <input
                    className="rs-search-input"
                    placeholder="Search help topics"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    aria-label="Search help topics"
                />
                {q && (
                    <button type="button" className="rs-search-clear" onClick={() => setQuery('')} aria-label="Clear search">
                        <Icon name="x" size={16} />
                    </button>
                )}
            </div>

            {q ? (
                <>
                    <div className="rs-group-label">Search Results</div>
                    {results.length > 0 ? (
                        <div className="rs-card">
                            {results.map((r) => (
                                <HelpRow key={r.id} icon={r.icon} title={r.title} subtitle={r.subtitle} onClick={() => openItem(r)} />
                            ))}
                        </div>
                    ) : (
                        <div className="help-search-empty">
                            <p>No help topics found.</p>
                            <div className="help-search-empty-actions">
                                <button type="button" className="btn ghost small" onClick={() => setQuery('')}>
                                    Try a different search
                                </button>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <>
                    <div className="rs-group-label">Popular Topics</div>
                    <div className="rs-card">
                        {POPULAR_TOPICS.map((item) => (
                            <HelpRow key={item.id} icon={item.icon} title={item.title} subtitle={item.subtitle} onClick={() => openItem(item)} />
                        ))}
                    </div>

                    <div className="rs-group-label">Help Articles</div>
                    <div className="rs-card">
                        {articles.map((a) => (
                            <HelpRow
                                key={a.id}
                                icon="help"
                                title={a.title}
                                subtitle={a.subtitle}
                                onClick={() => navigate(`/help/article/${a.id}`)}
                            />
                        ))}
                    </div>
                </>
            )}
        </>
    );
}
