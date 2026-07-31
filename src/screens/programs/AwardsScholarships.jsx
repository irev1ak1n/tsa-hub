import { BackLink } from '../resources/resourcesShared.jsx';
import { Icon } from '../../components/UI.jsx';
import { AWARDS_SCHOLARSHIPS as DATA } from '../../data/awardsScholarships.js';

// A clickable resource row. Links out when a url is set; otherwise renders as a
// non-clickable placeholder so links can be added later.
function ResourceRow({ title, url }) {
    const inner = (
        <>
            <span className="rs-ico" style={{ color: 'var(--ig-blue)' }}>
                <Icon name="globe" size={20} />
            </span>
            <span className="rs-text">
                <span className="rs-title">{title}</span>
            </span>
            <Icon name="chevron-right" size={18} />
        </>
    );
    if (url) {
        return <a className="rs-row" href={url} target="_blank" rel="noreferrer">{inner}</a>;
    }
    return <span className="rs-row is-disabled" aria-disabled="true">{inner}</span>;
}

// Dedicated page: Awards and Scholarships (single scrollable page).
export default function AwardsScholarships() {
    const { header, awards, scholarshipsTitle, scholarships } = DATA;

    return (
        <div className="aw-page">
            <BackLink to="/resources" label="Back" />

            <div className="section">
                <h1>{header.title}</h1>
                <p className="aw-sub" style={{ margin: 0 }}>{header.description}</p>
            </div>

            {/* SECTION 1 — Awards and Recognition */}
            <p className="aw-intro">{awards.intro}</p>
            <p className="aw-note" style={{ marginTop: 0, marginBottom: 12 }}>{awards.note}</p>
            <div className="rs-card">
                {awards.items.map((a) => (
                    <ResourceRow key={a.id} title={a.title} url={a.url} />
                ))}
            </div>

            {/* SECTION 2 — Scholarships */}
            {scholarships.map((s) => (
                <div key={s.id} className="rk-scholar">
                    <h3 className="rk-scholar-title">{s.title}</h3>

                    {s.description.map((para, i) => (
                        <p key={i} className="rk-scholar-text">{para}</p>
                    ))}

                    {s.eligibility && s.eligibility.length > 0 && (
                        <div className="rk-scholar-block">
                            <div className="rk-scholar-label">Eligibility</div>
                            <ul className="rk-list">
                                {s.eligibility.map((e, i) => (
                                    <li key={i} className="rk-list-item">{e}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {s.resources && s.resources.length > 0 && (
                        <div className="rk-scholar-block">
                            {s.resourcesTitle && <div className="rk-scholar-label">{s.resourcesTitle}</div>}
                            <div className="rs-card" style={{ borderBottom: 0, paddingBottom: 0 }}>
                                {s.resources.map((r) => (
                                    <ResourceRow key={r.id} title={r.title} url={r.url} />
                                ))}
                            </div>
                        </div>
                    )}

                    {s.applicationNote && (
                        <p className="aw-note" style={{ marginTop: 12 }}>{s.applicationNote}</p>
                    )}
                </div>
            ))}
        </div>
    );
}