import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext.jsx';
import { getEvent, teamSizeLabel } from '../../data/events.js';
import { Icon } from '../../components/UI.jsx';

export default function EventDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { myEvents, addEvent, removeEvent, eventsLoading } = useApp();
    const event = getEvent(id);

    if (eventsLoading) {
        return <p className="muted">Loading…</p>;
    }

    if (!event) {
        return (
            <div className="card">
                <h2>Event not found</h2>
                <p className="muted">That event isn't in the catalog.</p>
                <Link to="/events" className="btn navy">
                    Back to Events
                </Link>
            </div>
        );
    }

    const added = myEvents.includes(event.id);

    return (
        <>
            <div className="section">
                <div className="eyebrow">{event.category}</div>
                <h1>{event.name}</h1>
                <p className="muted small">
                    {event.division === 'HS' ? 'High School' : 'Middle School'} division · official TSA competitive event
                </p>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {added ? (
                        <button className="btn navy" onClick={() => removeEvent(event.id)}>
                            ✓ In my events — remove
                        </button>
                    ) : (
                        <button className="btn primary" onClick={() => addEvent(event.id)}>
                            <Icon name="plus" size={16} /> Add to my events
                        </button>
                    )}
                    <button
                        className="btn ghost"
                        onClick={() => navigate('/coach', { state: { q: `What are the rules for ${event.name}?` } })}
                    >
                        <Icon name="chat" size={16} /> Ask the coach
                    </button>
                </div>
            </div>

            {event.eligibility ? (
                <div className="section card">
                    <h3>Eligibility</h3>
                    <div className="kv" style={{ marginBottom: 12 }}>
                        <div className="cell">
                            <div className="k">Team size</div>
                            <div className="v">{teamSizeLabel(event) || 'Not stated'}</div>
                        </div>
                        <div className="cell">
                            <div className="k">Entries per</div>
                            <div className="v" style={{ textTransform: 'capitalize' }}>{event.eligibility.per}</div>
                        </div>
                        <div className="cell">
                            <div className="k">Individual entry</div>
                            <div className="v">{event.eligibility.individualOk ? 'Permitted' : 'Not permitted'}</div>
                        </div>
                    </div>
                    <div className="coach-quote">
                        <div className="small" style={{ marginBottom: 4, fontWeight: 700 }}>Official chart wording</div>
                        <span className="mono small">{event.eligibility.text}</span>
                    </div>
                    <p className="small muted" style={{ margin: '10px 0 0' }}>
                        From the TSA competitive events eligibility chart. Each participant or team may submit only one entry.
                        Your state association can set tighter limits — check with your advisor.
                    </p>
                </div>
            ) : (
                <div className="notice">
                    <span aria-hidden="true">⚠</span>
                    <span>
            This event has no row in the eligibility chart loaded into the app, so its team size and entry limit
            aren't shown. Check the official current-year chart or ask your advisor.
          </span>
                </div>
            )}

            <div className="notice">
                <span aria-hidden="true">⚠</span>
                <span>
          Rules, deliverables, rubrics and deadlines are published in the official TSA Competition Guide for the
          current year. They are not in this app yet — check the guide or ask your advisor.
        </span>
            </div>

            <div className="section card">
                <h3>Track this event</h3>
                <p className="small muted" style={{ marginBottom: 0 }}>
                    Add it to your events, then build your own checklist and tasks in the Team workspace from the official
                    requirements. Your progress shows up on the dashboard.
                </p>
            </div>
        </>
    );
}