import { BackLink } from '../resources/resourcesShared.jsx';
import { Icon } from '../../components/UI.jsx';
import { LEADERSHIP_PROGRAM as DATA } from '../../data/leadershipProgram.js';

// Blue-globe resource link row (same pattern as the Awards page).
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
    if (url) return <a className="rs-row" href={url} target="_blank" rel="noreferrer">{inner}</a>;
    return <span className="rs-row is-disabled" aria-disabled="true">{inner}</span>;
}

// Dedicated page: Leadership Program (single scrollable page).
export default function LeadershipProgram() {
    const { title, description, sections } = DATA;

    return (
        <div className="aw-page">
            <BackLink to="/resources" label="Back" />

            <div className="section">
                <h1>{title}</h1>
            </div>

            {description.map((para, i) => (
                <p key={i} className="aw-intro">{para}</p>
            ))}

            {sections.map((sec) => (
                <div key={sec.id} className="rk-scholar">
                    <h3 className="rk-scholar-title">{sec.heading}</h3>

                    {sec.paragraphs.map((para, i) => (
                        <p key={i} className="rk-scholar-text">{para}</p>
                    ))}

                    {sec.list && sec.list.length > 0 && (
                        <ul className="rk-list" style={{ marginTop: 8 }}>
                            {sec.list.map((item, i) => (
                                <li key={i} className="rk-list-item">{item}</li>
                            ))}
                        </ul>
                    )}

                    {sec.links && sec.links.length > 0 && (
                        <div className="rk-scholar-block">
                            <div className="rs-card" style={{ borderBottom: 0, paddingBottom: 0 }}>
                                {sec.links.map((l) => (
                                    <ResourceRow key={l.id} title={l.title} url={l.url} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}