import { useParams } from 'react-router-dom';
import { BackLink } from './resourcesShared.jsx';
import { getCompetitionRequirement } from '../../data/competitionRequirements.js';

// Render one paragraph: a plain string, or an array of spans where each span
// is a string, { b: 'bold' }, or { link: 'text', url }.
function renderParagraph(p, key) {
    if (typeof p === 'string') {
        return <p className="rk-intro" key={key}>{p}</p>;
    }
    return (
        <p className="rk-intro" key={key}>
            {p.map((span, i) => {
                if (typeof span === 'string') return <span key={i}>{span}</span>;
                if (span.b) return <strong key={i}>{span.b}</strong>;
                if (span.link) {
                    return (
                        <a key={i} className="aw-link" href={span.url} target="_blank" rel="noreferrer">
                            {span.link}
                        </a>
                    );
                }
                return null;
            })}
        </p>
    );
}

function TextSections({ sections }) {
    return (
        <>
            {sections.map((sec, si) => (
                <div className="rk-group" key={si}>
                    {sec.heading && <h3 className="rk-group-title">{sec.heading}</h3>}
                    {(sec.body || []).map((p, pi) => renderParagraph(p, pi))}
                    {Array.isArray(sec.list) && sec.list.length > 0 && (
                        <ul className="rk-list">
                            {sec.list.map((li, li2) => (
                                <li className="rk-list-item" key={li2}>{li}</li>
                            ))}
                        </ul>
                    )}
                    {(sec.after || []).map((p, ai) => renderParagraph(p, `a${ai}`))}
                    {Array.isArray(sec.links) && sec.links.length > 0 && (
                        <div className="cr-links">
                            {sec.links.map((l, li3) => (
                                <a key={li3} className="aw-link cr-link-row" href={l.url} target="_blank" rel="noreferrer">
                                    {l.text}
                                </a>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </>
    );
}

function Tables({ item }) {
    return (
        <>
            {item.tables.map((tbl, ti) => (
                <div className="cr-table-wrap" key={ti}>
                    <div className="cr-table-heading">{tbl.heading}</div>
                    {tbl.note && <div className="cr-table-note">{tbl.note}</div>}
                    <table className="cr-table">
                        <thead>
                        <tr>
                            {tbl.columns.map((c, ci) => (
                                <th key={ci}>{c}</th>
                            ))}
                        </tr>
                        </thead>
                        <tbody>
                        {tbl.rows.map((row, ri) => (
                            <tr key={ri}>
                                {row.map((cell, ci) => (
                                    <td key={ci}>{cell}</td>
                                ))}
                            </tr>
                        ))}
                        </tbody>
                    </table>
                    {item.footnote && <div className="cr-footnote">{item.footnote}</div>}
                </div>
            ))}

            {Array.isArray(item.notes) && item.notes.length > 0 && (
                <div className="cr-notes">
                    {item.notes.map((n, ni) => (
                        <p className="cr-note" key={ni}>
                            <span className="cr-note-label">{n.label}:</span> {n.text}
                        </p>
                    ))}
                </div>
            )}
        </>
    );
}

export default function CompetitionRequirementPage() {
    const { id } = useParams();
    const item = getCompetitionRequirement(id);

    if (!item) {
        return (
            <>
                <BackLink to="/resources" />
                <div className="section">
                    <h1>Not found</h1>
                </div>
                <p className="muted small" style={{ margin: 0 }}>
                    We couldn&rsquo;t find that page.
                </p>
            </>
        );
    }

    const hasTables = Array.isArray(item.tables) && item.tables.length > 0;
    const hasSections = Array.isArray(item.sections) && item.sections.length > 0;

    return (
        <>
            <BackLink to="/resources" />

            <div className="section">
                <h1>{item.title}</h1>
                {item.subtitle && (
                    <p className="muted small" style={{ margin: 0 }}>{item.subtitle}</p>
                )}
            </div>

            {hasTables && <Tables item={item} />}
            {hasSections && <TextSections sections={item.sections} />}
            {!hasTables && !hasSections && (
                <p className="muted small" style={{ margin: 0 }}>
                    This section is coming soon.
                </p>
            )}
        </>
    );
}