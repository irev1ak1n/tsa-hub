import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { BackLink } from '../resources/resourcesShared.jsx';
import { getHelpArticle } from '../../data/helpContent.js';

export default function HelpArticle() {
    const { id } = useParams();
    const navigate = useNavigate();
    const article = getHelpArticle(id);

    if (!article) return <Navigate to="/help" replace />;

    return (
        <>
            <BackLink to="/help" label="Back" />

            <div className="section">
                <div className="rs-eyebrow">Support</div>
                <h1 className="rs-h1">{article.title}</h1>
                {article.intro && <p className="rs-sub">{article.intro}</p>}
            </div>

            {(article.sections || []).map((sec) => (
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
                </div>
            ))}

            {article.action && (
                <button type="button" className="btn primary" onClick={() => navigate(article.action.to)}>
                    {article.action.label}
                </button>
            )}
        </>
    );
}
