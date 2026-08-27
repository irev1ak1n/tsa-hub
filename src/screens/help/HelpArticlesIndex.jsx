import { useNavigate } from 'react-router-dom';
import { Icon } from '../../components/UI.jsx';
import { BackLink } from '../resources/resourcesShared.jsx';
import { HELP_ARTICLES } from '../../data/helpContent.js';

export default function HelpArticlesIndex() {
    const navigate = useNavigate();

    return (
        <>
            <BackLink to="/help" label="Back" />

            <div className="section">
                <div className="rs-eyebrow">Support</div>
                <h1 className="rs-h1">Help Articles</h1>
                <p className="rs-sub">Find detailed answers to common questions.</p>
            </div>

            <div className="rs-card">
                {HELP_ARTICLES.map((a) => (
                    <button
                        key={a.id}
                        type="button"
                        className="rs-row"
                        onClick={() => navigate(`/help/article/${a.id}`)}
                    >
                        <span className="rs-ico"><Icon name="help" size={20} /></span>
                        <span className="rs-text">
                            <span className="rs-title">{a.title}</span>
                            <span className="rs-desc">{a.intro}</span>
                        </span>
                        <Icon name="chevron-right" size={18} />
                    </button>
                ))}
            </div>
        </>
    );
}
