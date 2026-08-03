import { Link } from 'react-router-dom';
import { BackLink } from '../resources/resourcesShared.jsx';
import { Icon } from '../../components/UI.jsx';
import { CONFERENCE_2026_HEADER as H, CONFERENCE_2026_TOPICS as TOPICS } from '../../data/conference2026.js';

// 2026 landing page: header + eight topic rows (Competition-Eligibility style).
export default function Conference2026Landing() {
    return (
        <div className="aw-page">
            <BackLink to="/resources" label="Back" />

            <div className="section">
                <div className="rs-eyebrow">{H.eyebrow}</div>
                <h1>{H.title}</h1>
                <p className="cf26-meta">
                    {H.dateLabel}<br />
                    {H.venue}<br />
                    {H.location}
                </p>
            </div>

            <div className="rs-card">
                {TOPICS.map((t) => (
                    <Link key={t.id} to={`/resources/national-conference/2026/${t.id}`} className="rs-row">
                        <span className="rs-ico"><Icon name={t.icon} size={20} /></span>
                        <span className="rs-text">
                            <span className="rs-title">{t.title}</span>
                            <span className="rs-desc">{t.desc}</span>
                        </span>
                        <Icon name="chevron-right" size={18} />
                    </Link>
                ))}
            </div>
        </div>
    );
}