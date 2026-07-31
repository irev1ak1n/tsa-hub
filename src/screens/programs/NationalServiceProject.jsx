import { BackLink } from '../resources/resourcesShared.jsx';
import { Icon } from '../../components/UI.jsx';
import { NATIONAL_SERVICE_PROJECT as DATA } from '../../data/nationalServiceProject.js';

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

// Dedicated page: National Service Project (single scrollable page).
export default function NationalServiceProject() {
    const {
        title, description, note,
        resourcesTitle, resources,
        getInvolvedTitle, getInvolved,
        closing, contact,
    } = DATA;

    return (
        <div className="aw-page">
            <BackLink to="/resources" label="Back" />

            <div className="section">
                <h1>{title}</h1>
            </div>

            {description.map((para, i) => (
                <p key={i} className="aw-intro">{para}</p>
            ))}

            {note && <p className="aw-note">{note}</p>}

            {/* Red Cross resources */}
            <h3 className="rk-scholar-title" style={{ marginTop: 18 }}>{resourcesTitle}</h3>
            <div className="rs-card" style={{ borderBottom: 0, paddingBottom: 0 }}>
                {resources.map((r) => (
                    <ResourceRow key={r.id} title={r.title} url={r.url} />
                ))}
            </div>

            {/* Get involved */}
            <h3 className="rk-scholar-title" style={{ marginTop: 18 }}>{getInvolvedTitle}</h3>
            <div className="rs-card" style={{ borderBottom: 0, paddingBottom: 0 }}>
                {getInvolved.map((r) => (
                    <ResourceRow key={r.id} title={r.title} url={r.url} />
                ))}
            </div>

            {closing && <p className="aw-intro" style={{ marginTop: 18 }}>{closing}</p>}

            {contact && (
                <p className="aw-note">
                    {contact.text}{' '}
                    <a href={`mailto:${contact.email}`} className="aw-link">{contact.email}</a>
                </p>
            )}
        </div>
    );
}