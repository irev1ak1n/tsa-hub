import { useParams, Navigate } from 'react-router-dom';
import { Icon } from '../../components/UI.jsx';
import { BackLink } from '../resources/resourcesShared.jsx';
import { getAboutPage } from '../../data/aboutTsa.js';

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

function LinkCard({ links }) {
    if (!links || links.length === 0) return null;
    return (
        <div className="rk-scholar-block">
            <div className="rs-card" style={{ borderBottom: 0, paddingBottom: 0 }}>
                {links.map((l) => (
                    <ResourceRow key={l.id} title={l.title} url={l.url} />
                ))}
            </div>
        </div>
    );
}

// One component renders any About TSA page (selected by :id).
export default function AboutTsaPage() {
    const { id } = useParams();
    const page = getAboutPage(id);

    if (!page) return <Navigate to="/resources" replace />;

    return (
        <div className="aw-page">
            <BackLink to="/resources" label="Back" />

            <div className="section">
                <h1>{page.title}</h1>
            </div>

            {/* Top-level paragraphs */}
            {(page.paragraphs || []).map((para, i) => (
                <p key={i} className="aw-intro">{para}</p>
            ))}

            {/* Top-level links (e.g. History -> TSA Website) */}
            <LinkCard links={page.links} />

            {/* Named subsections */}
            {(page.sections || []).map((sec) => (
                <div key={sec.heading} className="rk-scholar">
                    <h3 className="rk-scholar-title">{sec.heading}</h3>

                    {(sec.paragraphs || []).map((para, i) => (
                        <p key={i} className="rk-scholar-text">{para}</p>
                    ))}

                    {sec.list && sec.list.length > 0 && (
                        <ul className="rk-list" style={{ marginTop: 8 }}>
                            {sec.list.map((item, i) => (
                                <li key={i} className="rk-list-item">{item}</li>
                            ))}
                        </ul>
                    )}

                    <LinkCard links={sec.links} />
                </div>
            ))}
        </div>
    );
}