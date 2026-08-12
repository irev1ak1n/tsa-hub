import { EVENTS, CATEGORIES } from '../../data/events.js';
import { COMPETITION_REQUIREMENTS } from '../../data/competitionRequirements.js';

// Career keys on the event map to these human labels.
const CAREER_LABELS = {
    software: 'Software & App Development',
    'data-science': 'AI, Data & Analytics',
    cybersecurity: 'Cybersecurity & IT',
    robotics: 'Robotics & Automation',
    aerospace: 'Aerospace & Aviation',
    'mechanical-eng': 'Mechanical & Electrical Engineering',
    'civil-eng': 'Civil Engineering & Architecture',
    manufacturing: 'Manufacturing & Product Design',
    transportation: 'Transportation & Automotive',
    'game-dev': 'Game Development & Interactive Media',
    design: 'Web & Graphic Design',
    'media-film': 'Film, Video & Audio Production',
    fashion: 'Fashion & Apparel Design',
    marketing: 'Marketing & Advertising',
    business: 'Business & Leadership',
    education: 'Education & Communications',
    medicine: 'Medicine & Healthcare',
    biotech: 'Biotechnology & Life Sciences',
    'research-science': 'Science & Research',
    government: 'Government & Public Safety',
    ai: 'AI, Data & Analytics',
    'electrical-eng': 'Mechanical & Electrical Engineering',
    architecture: 'Civil Engineering & Architecture',
    'web-dev': 'Web & Graphic Design',
    'product-design': 'Manufacturing & Product Design',
};

// Clean a team size value, dropping a trailing .0 that Supabase numbers add.
// Ranges like "2-3" stay as they are.
function fmtSize(ts) {
    if (ts == null) return null;
    const n = Number(ts);
    if (Number.isFinite(n) && String(ts).indexOf('-') === -1) return String(Math.round(n));
    return String(ts);
}

// Team size text from the Events eligibility shape (teamSize string, individualOk).
function teamSizeText(el) {
    if (!el) return 'Varies';
    const ts = fmtSize(el.teamSize);
    if (el.individualOk && (ts == null || ts === '1')) {
        return ts && ts !== '1' ? `Solo or up to ${ts}` : 'Individual';
    }
    if (ts && el.individualOk) return `${ts} (or solo)`;
    if (ts === '1') return 'Individual';
    if (ts) return `Team of ${ts}`;
    if (el.individualOk) return 'Team or solo';
    return 'Team event';
}

// Name normaliser for matching the competition tables, star stripped, lower case.
function normName(s) {
    return (s || '').replace(/\*+$/, '').trim().toLowerCase();
}

function preconferenceText(eventName, division) {
    const page = COMPETITION_REQUIREMENTS.find((r) => r.id === 'preconference-submissions');
    if (!page || !page.tables) return 'None';
    const wantHeading = division === 'HS' ? 'High School' : 'Middle School';
    const table = page.tables.find((t) => t.heading === wantHeading);
    if (!table) return 'None';
    const target = normName(eventName);
    const row = table.rows.find((r) => normName(r[0]) === target);
    if (!row) return 'None';
    const pdf = (row[1] || '').trim();
    const pdfCount = (row[2] || '').trim();
    const url = (row[3] || '').trim();
    const urlCount = (row[4] || '').trim();
    const bits = [];
    if (pdf) {
        const label = pdf.replace(/\s+/g, ' ');
        bits.push(pdfCount && Number(pdfCount) > 1 ? `${label} (${pdfCount} PDFs)` : `${label} (PDF)`);
    }
    if (url) {
        const label = url.replace(/\s+/g, ' ');
        bits.push(urlCount && Number(urlCount) > 1 ? `${label} (${urlCount} links)` : `${label} (link)`);
    }
    return bits.length ? bits.join(' + ') : 'None';
}

function needsStateAdvisorApproval(eventName, division) {
    const page = COMPETITION_REQUIREMENTS.find((r) => r.id === 'state-advisor-approval-events');
    if (!page || !page.tables) return false;
    const wantHeading = division === 'HS' ? 'High School' : 'Middle School';
    const table = page.tables.find((t) => t.heading === wantHeading);
    if (!table) return false;
    const target = normName(eventName);
    return table.rows.some((r) => normName(r[0]) === target);
}

// Related events from Events fields, overlap on interests and projectStyle plus
// a category bonus, limited to the same division.
function relatedEvents(source) {
    if (!source) return [];
    const srcInt = Object.keys(source.interests || {});
    const srcStyle = Array.isArray(source.projectStyle) ? source.projectStyle : [];
    const scored = EVENTS
        .filter((e) => e.id !== source.id && e.division === source.division)
        .map((e) => {
            const intOverlap = Object.keys(e.interests || {}).filter((k) => srcInt.includes(k)).length;
            const styleOverlap = (Array.isArray(e.projectStyle) ? e.projectStyle : []).filter((s) => srcStyle.includes(s)).length;
            const catBonus = e.category === source.category ? 1 : 0;
            return { e, score: intOverlap * 2 + styleOverlap + catBonus };
        })
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score);
    return scored.slice(0, 6).map((x) => x.e.name);
}

// Light detail modal for the Events grid. No match percent, analysis, or
// score breakdown, just the practical facts and related items.
export default function EventInfoModal({ event, onClose }) {
    if (!event) return null;

    const el = event.eligibility;
    const overview = event.overview || null;

    const relatedCareers = Object.entries(event.careers || {})
        .sort((a, b) => b[1] - a[1])
        .map(([k]) => CAREER_LABELS[k] || k)
        .filter((v, i, arr) => arr.indexOf(v) === i);

    const related = relatedEvents(event);

    return (
        <div className="rec-modal-backdrop" onClick={onClose}>
            <div className="rec-modal" onClick={(e) => e.stopPropagation()}>
                <div className="rec-modal-head">
                    <h3 className="rec-modal-title">{event.name}</h3>
                    <button className="rec-modal-close" onClick={onClose} aria-label="Close">×</button>
                </div>
                <div className="rec-modal-body">
                    {overview && (
                        <div className="rec-modal-section" style={{ marginTop: 0 }}>
                            <div className="rec-modal-section-title">Description</div>
                            <p className="rec-modal-desc" style={{ margin: 0 }}>{overview}</p>
                        </div>
                    )}

                    <div className="rec-fact">
                        <span className="rec-fact-label">Team Size</span>
                        <span className="rec-fact-value">{teamSizeText(el)}</span>
                    </div>
                    <div className="rec-fact">
                        <span className="rec-fact-label">Preconference Submission</span>
                        <span className="rec-fact-value">{preconferenceText(event.name, event.division)}</span>
                    </div>
                    <div className="rec-fact">
                        <span className="rec-fact-label">State Advisor Approval</span>
                        <span className="rec-fact-value">{needsStateAdvisorApproval(event.name, event.division) ? 'Yes' : 'No'}</span>
                    </div>

                    {relatedCareers.length > 0 && (
                        <div className="rec-modal-section">
                            <div className="rec-modal-section-title">Related Careers</div>
                            <div className="rec-tags">
                                {relatedCareers.map((c) => <span className="rec-tag" key={c}>{c}</span>)}
                            </div>
                        </div>
                    )}

                    {related.length > 0 && (
                        <div className="rec-modal-section">
                            <div className="rec-modal-section-title">Related Events</div>
                            <div className="rec-tags">
                                {related.map((n) => <span className="rec-tag" key={n}>{n}</span>)}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}