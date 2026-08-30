import { Link, Navigate, useParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext.jsx';
import { Icon } from '../../components/UI.jsx';
import { BackLink } from './resourcesShared.jsx';
import { EVENTS, getEvent, teamSizeLabel } from '../../data/events.js';
import { getEventTheme } from '../../data/eventThemes.js';
import { getRelatedEvents } from '../../data/eventDetailAdapter.js';
import { preconferenceFor, advisorApprovalFor, answerEventIntent, CAREER_LABELS } from '../../services/chatbot/resolvers/events.js';

// Same resource-type icon/label convention as the old EventThemePage, reused
// here so PDFs/CSVs/templates/links keep looking the same across the app.
function ResourceIcon({ type }) {
    if (type === 'pdf') return <Icon name="file-text" size={16} />;
    if (type === 'csv') return <Icon name="table" size={16} />;
    if (type === 'pptx') return <Icon name="layout" size={16} />;
    return <Icon name="external-link" size={16} />;
}
function ResourceLabel({ type }) {
    if (type === 'pdf') return 'PDF Document';
    if (type === 'csv') return 'Data File (CSV)';
    if (type === 'pptx') return 'Template (PPTX)';
    return 'External Link';
}
function ResourceRow({ url, title, type }) {
    return (
        <a href={url} target="_blank" rel="noreferrer" className="eth-resource-row">
            <span className="eth-resource-ico"><ResourceIcon type={type} /></span>
            <span className="eth-resource-text">
                <span className="eth-resource-title">{title}</span>
                <span className="eth-resource-label"><ResourceLabel type={type} /></span>
            </span>
            <Icon name="external-link" size={14} />
        </a>
    );
}

// A major section, separated from the one before it by a thin divider —
// never a boxed card. Renders nothing at all when there's no body content,
// so the divider itself never appears floating above an empty section.
function Section({ title, children, first }) {
    return (
        <div className={`evd-section${first ? ' evd-section-first' : ''}`}>
            {title && <div className="rec-modal-section-title">{title}</div>}
            {children}
        </div>
    );
}

export default function EventFullPage() {
    const { id } = useParams();
    const { eventsLoading } = useApp();
    const event = getEvent(id);
    const theme = getEventTheme(id);

    if (eventsLoading) return <p className="muted" style={{ margin: '20px 4px' }}>Loading…</p>;
    if (!event) return <Navigate to="/resources/events/themes" replace />;

    const divisionLabel = event.division === 'HS' ? 'High School' : 'Middle School';
    const seasonLabel = event.season || theme?.season || null;

    // Theme & problem — a real "verified none" status is shown truthfully;
    // no theme entry at all is missing data, not a claim there isn't one.
    const verifiedNoTheme = theme?.status === 'no-theme';
    const themeBody = theme && !verifiedNoTheme
        ? (theme.description || theme.topic || theme.problemStatement || theme.challenge || null)
        : null;
    const hasThemeSection = verifiedNoTheme || !!(theme && (theme.theme || themeBody || theme.list?.length || theme.requirements?.length || theme.sections?.length));

    const pre = preconferenceFor(event);
    const advisor = advisorApprovalFor(event);
    const materials = String(event.materials || '').trim().toLowerCase();

    const difficulty = answerEventIntent(event, 'difficulty.general');
    const time = answerEventIntent(event, 'time.general');
    const cost = answerEventIntent(event, 'cost.general', { style: 'short' });

    const careers = Object.entries(event.careers || {})
        .sort((a, b) => b[1] - a[1])
        .map(([k]) => CAREER_LABELS[k] || k)
        .filter((v, i, arr) => arr.indexOf(v) === i);

    const related = getRelatedEvents(event, EVENTS);

    // Every top-level resource this event has, from every place TSA Hub
    // stores one — theme PDFs, per-section resources, and the Supabase
    // themeLinks field (real stored data that had no UI to appear in before).
    const resources = [
        ...(theme?.resources || []),
        ...(theme?.sections || []).flatMap((s) => s.resources || []),
        ...(event.themeLinks || []).map((l) => ({ title: l.label, url: l.url, type: 'external' })),
    ];

    return (
        <>
            <BackLink to="/resources/events/themes" label="Back" />

            <div className="section">
                <div className="rs-eyebrow">{event.category || 'TSA Event'}</div>
                <h1 className="rs-h1">{event.name}</h1>
                <p className="rs-sub">{divisionLabel}{seasonLabel ? ` · ${seasonLabel}` : ''}</p>
            </div>

            {event.overview && (
                <Section title="Description" first>
                    <p className="rec-modal-desc" style={{ margin: 0 }}>{event.overview}</p>
                </Section>
            )}

            {hasThemeSection && (
                <Section title="Theme & Problem" first={!event.overview}>
                    {verifiedNoTheme ? (
                        <p className="eth-theme-no-theme" style={{ margin: 0 }}>
                            No theme or problem has been published by National TSA for the {theme.season || 'current'} season.
                        </p>
                    ) : (
                        <>
                            {theme.theme && <div className="eth-theme-badge">{theme.theme}</div>}
                            {themeBody && <p className="eth-desc">{themeBody}</p>}
                            {theme.list?.length > 0 && (
                                <ul className="eth-list">
                                    {theme.list.map((item, i) => <li key={i} className="eth-list-item">{item}</li>)}
                                </ul>
                            )}
                            {theme.requirements?.length > 0 && (
                                <div className="eth-section">
                                    <div className="eth-section-title">Requirements</div>
                                    <ul className="eth-list">
                                        {theme.requirements.map((r, i) => <li key={i} className="eth-list-item">{r}</li>)}
                                    </ul>
                                </div>
                            )}
                            {theme.sections?.map((s, i) => (
                                <div key={i} className="eth-section">
                                    <div className="eth-section-title">{s.heading}</div>
                                    {s.content && <p className="eth-section-body">{s.content}</p>}
                                    {s.list?.length > 0 && (
                                        <ul className="eth-list">
                                            {s.list.map((item, j) => <li key={j} className="eth-list-item">{item}</li>)}
                                        </ul>
                                    )}
                                </div>
                            ))}
                        </>
                    )}
                </Section>
            )}

            {(teamSizeLabel(event) || event.eligibility?.text || pre.known || advisor.known) && (
                <Section title="Team & Submission Requirements" first={!event.overview && !hasThemeSection}>
                    {(teamSizeLabel(event) || event.eligibility) && (
                        <div className="rec-fact">
                            <span className="rec-fact-label">Team Size</span>
                            <span className="rec-fact-value">{teamSizeLabel(event) || (event.eligibility?.individualOk ? 'Individual or team' : 'Team event')}</span>
                        </div>
                    )}
                    {event.eligibility?.text && (
                        <div className="rec-fact">
                            <span className="rec-fact-label">Official Eligibility</span>
                            <span className="rec-fact-value">{event.eligibility.text}</span>
                        </div>
                    )}
                    {pre.known && (
                        <div className="rec-fact">
                            <span className="rec-fact-label">Preconference Submission</span>
                            <span className="rec-fact-value">{pre.items.length ? pre.items.join(' + ') : 'None required'}</span>
                        </div>
                    )}
                    {advisor.known && (
                        <div className="rec-fact">
                            <span className="rec-fact-label">State Advisor Approval</span>
                            <span className="rec-fact-value">{advisor.required ? 'Required' : 'Not required'}</span>
                        </div>
                    )}
                </Section>
            )}

            {(materials === 'yes' || materials === 'no') && (
                <Section title="Materials / Equipment">
                    <p className="rec-modal-desc" style={{ margin: 0 }}>
                        {materials === 'yes'
                            ? "TSA Hub flags this event as needing materials or equipment beyond the basics, though it doesn't have the specific list — check the current official rules for exactly what's required."
                            : "TSA Hub doesn't flag this event as needing materials or equipment beyond what the challenge itself calls for."}
                    </p>
                </Section>
            )}

            {difficulty && !difficulty.missing && (
                <Section title="Difficulty">
                    <p className="rec-modal-desc" style={{ margin: 0 }}>{difficulty.text}</p>
                </Section>
            )}

            {time && !time.missing && (
                <Section title="Time Commitment">
                    <p className="rec-modal-desc" style={{ margin: 0 }}>{time.text}</p>
                </Section>
            )}

            {cost && !cost.missing && (
                <Section title="Cost">
                    <p className="rec-modal-desc" style={{ margin: 0 }}>{cost.text}</p>
                </Section>
            )}

            {careers.length > 0 && (
                <Section title="Related Careers">
                    <div className="rec-tags">
                        {careers.map((c) => <span className="rec-tag" key={c}>{c}</span>)}
                    </div>
                </Section>
            )}

            {related.length > 0 && (
                <Section title="Related Events">
                    <div className="rec-tags">
                        {related.map((r) => (
                            <Link to={`/resources/events/${r.id}`} className="rec-tag rec-tag-link" key={r.id}>{r.name}</Link>
                        ))}
                    </div>
                </Section>
            )}

            {resources.length > 0 && (
                <Section title="Official Resources">
                    <div className="eth-resources">
                        {resources.map((r, i) => <ResourceRow key={i} url={r.url} title={r.title} type={r.type} />)}
                    </div>
                </Section>
            )}
        </>
    );
}
