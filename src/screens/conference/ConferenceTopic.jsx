import { useParams, Navigate } from 'react-router-dom';
import { BackLink } from '../resources/resourcesShared.jsx';
import { getConferenceTopic } from '../../data/nationalConference.js';
import { getConferenceContent } from '../../data/conferenceContent.js';

// A labelled sub-block (e.g. Shirt / Pants / Shoes) with optional body text and
// an optional "Not allowed" list.
function AttireItem({ item }) {
    return (
        <div className="cf-item">
            <div className="cf-item-label">{item.label}</div>
            {item.text && <p className="rk-scholar-text">{item.text}</p>}
            {item.notAllowed && item.notAllowed.length > 0 && (
                <>
                    <div className="cf-not-allowed">Not allowed</div>
                    <ul className="rk-list">
                        {item.notAllowed.map((na, i) => (
                            <li key={i} className="rk-list-item">{na}</li>
                        ))}
                    </ul>
                </>
            )}
        </div>
    );
}

// Conference Essentials topic page. Renders real content when available,
// otherwise a short placeholder.
export default function ConferenceTopic() {
    const { topic } = useParams();
    const meta = getConferenceTopic(topic);
    if (!meta) return <Navigate to="/resources" replace />;

    const content = getConferenceContent(topic);

    return (
        <div className="aw-page">
            <BackLink to="/resources" label="Back" />

            <div className="section">
                <h1>{content?.title || meta.title}</h1>
            </div>

            {!content ? (
                <p className="aw-intro">Content for this topic will be added soon.</p>
            ) : (
                <>
                    {(content.intro || []).map((para, i) => (
                        <p key={i} className="aw-intro">{para}</p>
                    ))}

                    {(content.sections || []).map((sec) => (
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

                            {(sec.paragraphsAfter || []).map((para, i) => (
                                <p key={i} className="rk-scholar-text" style={{ marginTop: 8 }}>{para}</p>
                            ))}

                            {(sec.items || []).map((item) => (
                                <AttireItem key={item.label} item={item} />
                            ))}
                        </div>
                    ))}

                    {content.footer && <p className="rk-footer">{content.footer}</p>}
                </>
            )}
        </div>
    );
}