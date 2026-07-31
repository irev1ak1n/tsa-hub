import { BackLink } from '../resources/resourcesShared.jsx';
import { Icon } from '../../components/UI.jsx';
import { ACHIEVEMENT_PROGRAM as DATA } from '../../data/achievementProgram.js';

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

// Dedicated page: TSA Achievement Program (single scrollable page).
export default function AchievementProgram() {
    const { title, description, sections, resourcesTitle, resources } = DATA;

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

                    {sec.intro && <p className="rk-scholar-text">{sec.intro}</p>}

                    {sec.list && sec.list.length > 0 && (
                        <ul className="rk-list" style={{ marginTop: 8 }}>
                            {sec.list.map((item, i) => (
                                <li key={i} className="rk-list-item">{item}</li>
                            ))}
                        </ul>
                    )}

                    {sec.note && <p className="aw-note" style={{ marginTop: 10 }}>{sec.note}</p>}

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

            {/* Learn more */}
            {resources && resources.length > 0 && (
                <>
                    <h3 className="rk-scholar-title" style={{ marginTop: 18 }}>{resourcesTitle}</h3>
                    <div className="rs-card" style={{ borderBottom: 0, paddingBottom: 0 }}>
                        {resources.map((r) => (
                            <ResourceRow key={r.id} title={r.title} url={r.url} />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}