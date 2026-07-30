import { useParams, Navigate } from 'react-router-dom';
import { Icon } from '../components/UI.jsx';
import { BackLink } from './resources/resourcesShared.jsx';
import { getRuleTopic } from '../data/competitionRules.js';

const letter = (i) => String.fromCharCode(97 + i); // 0->a, 1->b, ...

// Level 3: a single topic page — numbered rule points (with a./b. subpoints)
// and optional named subsection groups.
export default function CompetitionRuleTopic() {
    const { cat: catId, topic: topicId } = useParams();
    const found = getRuleTopic(catId, topicId);

    if (!found) return <Navigate to="/resources" replace />;

    const { category, topic } = found;
    const backTo = `/resources/competition-rules/${category.id}`;
    const points = topic.points || [];
    const groups = topic.groups || [];

    return (
        <>
            <BackLink to={backTo} label="Back" />

            <div className="section">
                <h1>{topic.title}</h1>
                <p className="muted small" style={{ margin: 0 }}>{topic.description}</p>
            </div>

            {/* Lead-in line before a plain list */}
            {topic.intro && <p className="rk-intro">{topic.intro}</p>}

            {/* Plain bullet list (unnumbered) */}
            {topic.list && topic.list.length > 0 && (
                <ul className="rk-list">
                    {topic.list.map((item, i) => (
                        <li key={i} className="rk-list-item">{item}</li>
                    ))}
                </ul>
            )}

            {/* Numbered rule points (a point may carry a. b. subpoints) */}
            {points.length > 0 && (
                <ol className="rk-points">
                    {points.map((p, i) => {
                        const text = typeof p === 'string' ? p : p.text;
                        const sub = typeof p === 'string' ? null : p.sub;
                        return (
                            <li key={i} className="rk-point">
                                <span className="rk-point-num">{i + 1}.</span>
                                <span className="rk-point-body">
                                    <span className="rk-point-text">{text}</span>
                                    {sub && sub.length > 0 && (
                                        <ol className="rk-sub">
                                            {sub.map((s, j) => (
                                                <li key={j} className="rk-subpoint">
                                                    <span className="rk-sub-num">{letter(j)}.</span>
                                                    <span className="rk-point-text">{s}</span>
                                                </li>
                                            ))}
                                        </ol>
                                    )}
                                </span>
                            </li>
                        );
                    })}
                </ol>
            )}

            {/* Named subsection groups (e.g. HS/MS exceptions, Display size) */}
            {groups.map((g) => (
                <div key={g.heading} className="rk-group">
                    <h3 className="rk-group-title">{g.heading}</h3>
                    {g.intro && <p className="rk-group-intro">{g.intro}</p>}
                    <ul className="rk-group-list">
                        {g.items.map((item, k) => (
                            <li key={k} className="rk-group-item">{item}</li>
                        ))}
                    </ul>
                </div>
            ))}

            {/* Optional note */}
            {topic.note && (
                <div className="rk-callout">
                    <span className="rk-callout-ico"><Icon name="info" size={18} /></span>
                    <span className="rk-callout-text"><strong>Important:</strong> {topic.note}</span>
                </div>
            )}

            {/* Closing footer text */}
            {topic.footer && <p className="rk-footer">{topic.footer}</p>}
        </>
    );
}