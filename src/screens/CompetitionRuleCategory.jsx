import { Link, useParams, Navigate } from 'react-router-dom';
import { Icon } from '../components/UI.jsx';
import { BackLink } from './resources/resourcesShared.jsx';
import { getRuleCategory } from '../data/competitionRules.js';

// Level 2: one category -> list of its topic rows.
export default function CompetitionRuleCategory() {
    const { cat: catId } = useParams();
    const cat = getRuleCategory(catId);

    if (!cat) return <Navigate to="/resources" replace />;

    return (
        <>
            <BackLink to="/resources" label="Back" />

            <div className="section">
                <h1>{cat.title}</h1>
                <p className="muted small" style={{ margin: 0 }}>{cat.description}</p>
            </div>

            <div className="rs-group-label">Topics</div>
            <div className="rs-card">
                {cat.topics.map((topic) => (
                    <Link
                        key={topic.id}
                        to={`/resources/competition-rules/${cat.id}/${topic.id}`}
                        className="rs-row"
                    >
                        <span className="rs-ico"><Icon name="file-text" size={20} /></span>
                        <span className="rs-text">
                            <span className="rs-title">{topic.title}</span>
                            <span className="rs-desc">{topic.description}</span>
                        </span>
                        <Icon name="chevron-right" size={18} />
                    </Link>
                ))}
            </div>
        </>
    );
}