import { BackLink } from '../resources/resourcesShared.jsx';
import { FORWARD_TO_FIFTY as DATA } from '../../data/forwardToFifty.js';

// Dedicated page: Forward to Fifty (single scrollable page).
export default function ForwardToFifty() {
    const { title, description, requirementsTitle, requirementsIntro, requirements, benefitsTitle, benefits } = DATA;

    return (
        <div className="aw-page">
            <BackLink to="/resources" label="Back" />

            <div className="section">
                <h1>{title}</h1>
            </div>

            {description.map((para, i) => (
                <p key={i} className="aw-intro">{para}</p>
            ))}

            {/* Requirements */}
            <h3 className="rk-scholar-title" style={{ marginTop: 18 }}>{requirementsTitle}</h3>
            <p className="aw-note" style={{ marginTop: 0, marginBottom: 8 }}>{requirementsIntro}</p>
            <ul className="rk-list">
                {requirements.map((r, i) => (
                    <li key={i} className="rk-list-item">{r}</li>
                ))}
            </ul>

            {/* Benefits (numbered) */}
            <h3 className="rk-scholar-title" style={{ marginTop: 18 }}>{benefitsTitle}</h3>
            <ol className="rk-points">
                {benefits.map((b, i) => (
                    <li key={i} className="rk-point">
                        <span className="rk-point-num">{i + 1}.</span>
                        <span className="rk-point-body">
                            <span className="rk-point-text">{b}</span>
                        </span>
                    </li>
                ))}
            </ol>
        </div>
    );
}