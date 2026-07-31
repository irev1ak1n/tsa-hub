import { BackLink } from '../resources/resourcesShared.jsx';
import { Icon } from '../../components/UI.jsx';
import { CONFERENCE_GUIDES } from '../../data/nationalConference.js';

// Conference Guides page — one row per conference year.
export default function ConferenceGuides() {
    return (
        <div className="aw-page">
            <BackLink to="/resources" label="Back" />

            <div className="section">
                <h1>Conference Guides</h1>
            </div>

            <div className="rs-card">
                {CONFERENCE_GUIDES.map((g) => {
                    const inner = (
                        <>
                            <span className="rs-ico" style={{ color: 'var(--ig-blue)' }}>
                                <Icon name="cal" size={20} />
                            </span>
                            <span className="rs-text">
                                <span className="rs-title">{g.title}</span>
                                {g.detail && <span className="rs-desc">{g.detail}</span>}
                            </span>
                            <Icon name="chevron-right" size={18} />
                        </>
                    );
                    return g.url ? (
                        <a key={g.id} className="rs-row" href={g.url} target="_blank" rel="noreferrer">{inner}</a>
                    ) : (
                        <span key={g.id} className="rs-row is-disabled" aria-disabled="true">{inner}</span>
                    );
                })}
            </div>
        </div>
    );
}