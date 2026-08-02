import { useApp } from '../../context/AppContext.jsx';
import { getStateTsa } from '../../data/stateTsa.js';
import { Row, StateLinkRow, BackLink } from './resourcesShared.jsx';

export default function StudentLeadership() {
    const { prefs } = useApp();
    const state = prefs?.state;
    const stateInfo = getStateTsa(state);

    // Dynamic state officer team (from the user's state data), if available.
    const stateOfficerLink = (stateInfo?.links || []).find((l) => l.role === 'officer-team') || null;

    return (
        <>
            <BackLink />

            <div className="section">
                <h1>Student Leadership</h1>
                <p className="muted small" style={{ margin: 0 }}>
                    Meet the state and national student officers who lead TSA.
                </p>
            </div>

            <div className="rs-group-label">Officer teams</div>
            <div className="rs-card">
                {stateOfficerLink && (
                    <StateLinkRow
                        link={{
                            ...stateOfficerLink,
                            title: 'State Officer Team',
                            desc: 'Meet your state\u2019s elected student officers.',
                        }}
                        onOpenContact={() => {}}
                    />
                )}
                <Row
                    icon="users"
                    title="National Officer Team"
                    desc="Meet TSA&rsquo;s elected national student officers."
                    href="https://tsaweb.org/about/national-tsa-officers"
                />
            </div>
        </>
    );
}