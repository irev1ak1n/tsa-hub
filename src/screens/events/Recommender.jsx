import { useState, useRef } from 'react';
import { flushSync } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext.jsx';
import {
    recommend,
    STEP1_INTERESTS,
    STEP2_WORK_OPTIONS,
    TIME_CHOICES,
    TEAM_AVAILABILITY_CHOICES,
    CAREER_LABELS,
} from '../../services/recommender.js';
import { EVENT_REC_BY_ID, EVENT_REC_DATA } from '../../data/eventRecommendationData.js';
import { Icon } from '../../components/UI.jsx';

// Emoji for the step 2 work tiles, keyed by option id.
const WORK_EMOJI = {
    website: '🌐', 'app-software': '💻', robot: '🤖', drone: '🚁', vehicle: '🏎️',
    'structure-model': '🏛️', game: '🎮', cad: '📐', 'graphic-design': '🎨',
    video: '🎬', podcast: '🎙️', creative: '👗', research: '🔬', presentation: '🎤',
    'knowledge-challenge': '🧠', 'product-prototype': '🔧',
};

const CAREERS = [
    ['software', 'Software & App Development'],
    ['data-science', 'AI, Data & Analytics'],
    ['cybersecurity', 'Cybersecurity & IT'],
    ['robotics', 'Robotics & Automation'],
    ['aerospace', 'Aerospace & Aviation'],
    ['mechanical-eng', 'Mechanical & Electrical Engineering'],
    ['civil-eng', 'Civil Engineering & Architecture'],
    ['manufacturing', 'Manufacturing & Product Design'],
    ['transportation', 'Transportation & Automotive'],
    ['game-dev', 'Game Development & Interactive Media'],
    ['design', 'Web & Graphic Design'],
    ['media-film', 'Film, Video & Audio Production'],
    ['fashion', 'Fashion & Apparel Design'],
    ['marketing', 'Marketing & Advertising'],
    ['business', 'Business & Leadership'],
    ['education', 'Education & Communications'],
    ['medicine', 'Medicine & Healthcare'],
    ['biotech', 'Biotechnology & Life Sciences'],
    ['research-science', 'Science & Research'],
    ['government', 'Government & Public Safety'],
];

// Prefer and avoid catalog for the last step. Every id is understood by the engine.
const PREF_CATALOG = [
    {
        group: 'Competition Format',
        items: [
            { id: 'prepared-project', label: 'Prepare a project in advance', emoji: '📋' },
            { id: 'live-challenge', label: 'Live / onsite challenge', emoji: '⚡' },
            { id: 'presentation', label: 'Present to judges', emoji: '🎤' },
            { id: 'interview', label: 'Judge interview / Q&A', emoji: '💬' },
            { id: 'written-test', label: 'Written test', emoji: '📝' },
            { id: 'performance', label: 'Performance-based', emoji: '🏁' },
        ],
    },
    {
        group: 'Project Style',
        items: [
            { id: 'digital', label: 'Digital / on-screen work', emoji: '💻' },
            { id: 'hands-on', label: 'Hands-on building', emoji: '🔧' },
            { id: 'creative', label: 'Creative / artistic', emoji: '🎨' },
            { id: 'research', label: 'Research & analysis', emoji: '🔬' },
        ],
    },
    {
        group: 'Challenge',
        items: [
            { id: 'beginner', label: 'Beginner-friendly', emoji: '🌱' },
            { id: 'challenging', label: 'Challenging', emoji: '💪' },
            { id: 'competitive', label: 'Highly competitive', emoji: '🔥' },
        ],
    },
    {
        group: 'Budget',
        items: [
            { id: 'budget-free', label: 'Free / no-cost', emoji: '🆓' },
            { id: 'budget-low', label: 'Low-cost', emoji: '💵' },
            { id: 'budget-high', label: 'High-cost', emoji: '💸' },
        ],
    },
];
const PREF_BY_ID = Object.fromEntries(
    PREF_CATALOG.flatMap((g) => g.items.map((it) => [it.id, { ...it, group: g.group }]))
);

// Step 0 is the intro with the division picker. Steps 1 to 6 are the survey.
const STEP_TITLES = [
    'Find your best-fit events',
    'What interests you most?',
    'What would you love to work on?',
    'Where could you see yourself?',
    'How much time do you want to put in?',
    'How do you prefer to work?',
    'Set your preferences',
];
const STEP_COUNT = STEP_TITLES.length;

const DRAG_THRESHOLD = 6;

// Human label for an event team requirement, read straight from eligibility.
function teamSizeText(el) {
    if (!el) return 'Varies';
    if (el.individualAllowed && (el.minTeamSize == null || el.minTeamSize <= 1)) {
        return el.maxTeamSize && el.maxTeamSize > 1 ? `Solo or up to ${el.maxTeamSize}` : 'Individual';
    }
    if (el.minTeamSize && el.maxTeamSize && el.minTeamSize === el.maxTeamSize) return `Team of ${el.minTeamSize}`;
    if (el.minTeamSize && el.maxTeamSize) return `${el.minTeamSize}–${el.maxTeamSize} members`;
    if (el.minTeamSize) return `${el.minTeamSize}+ members`;
    return 'Team event';
}

// Related events are computed by similarity, limited to the same division.
// Overlap counts shared workTypes and interests, plus a small category bonus.
function relatedEvents(sourceId) {
    const src = EVENT_REC_BY_ID[sourceId];
    if (!src) return [];
    const srcWork = Object.keys(src.workTypes || {});
    const srcInt = Object.keys(src.interests || {});
    const scored = EVENT_REC_DATA
        .filter((e) => e.id !== src.id && e.division === src.division)
        .map((e) => {
            const workOverlap = Object.keys(e.workTypes || {}).filter((k) => srcWork.includes(k)).length;
            const intOverlap = Object.keys(e.interests || {}).filter((k) => srcInt.includes(k)).length;
            const catBonus = e.category === src.category ? 1 : 0;
            return { e, score: workOverlap * 2 + intOverlap + catBonus };
        })
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score);
    return scored.slice(0, 6).map((x) => x.e.name);
}

// Build the score breakdown rows from the engine parts, largest first.
function breakdownRows(parts) {
    if (!parts) return [];
    const labels = {
        workPts: 'Work type',
        interestPts: 'Interests',
        careerPts: 'Career fit',
        stylePts: 'Style',
        formatPts: 'Format',
        difficultyPts: 'Difficulty',
        budgetPts: 'Budget',
    };
    const rows = Object.entries(parts)
        .map(([k, v]) => ({ name: labels[k] || k, value: Math.max(0, v) }))
        .filter((r) => r.value > 0.5);
    const max = rows.reduce((m, r) => Math.max(m, r.value), 0) || 1;
    rows.sort((a, b) => b.value - a.value);
    return rows.map((r) => ({ ...r, bar: Math.round((r.value / max) * 100), pct: Math.round(r.value) }));
}

export default function Recommender() {
    const { profile } = useApp();

    const navigate = useNavigate();

    const [step, setStep] = useState(0);
    const [division, setDivision] = useState(profile?.division || '');
    const [results, setResults] = useState(null);
    const [openEvent, setOpenEvent] = useState(null); // result object shown in the detail modal

    const [intOrder, setIntOrder] = useState(STEP1_INTERESTS.map((i) => i.key));
    const [workRank, setWorkRank] = useState([]);
    const [careers, setCareers] = useState([]);
    const [time, setTime] = useState('');
    const [teamAvail, setTeamAvail] = useState('');
    const [placement, setPlacement] = useState({});
    const [prefModal, setPrefModal] = useState(null);

    const intLabel = Object.fromEntries(STEP1_INTERESTS.map((i) => [i.key, i.label]));

    // Pointer drag for step 1 ranking.
    const listRef = useRef(null);
    const pressRef = useRef(null);
    const [draggingId, setDraggingId] = useState(null);
    const [dragOffset, setDragOffset] = useState(0);
    const [targetIndex, setTargetIndex] = useState(null);
    const [dragFrom, setDragFrom] = useState(null);
    const [settling, setSettling] = useState(false);
    const [committing, setCommitting] = useState(false);
    const settleTimer = useRef(null);

    const GAP = 8;

    function rowMetrics() {
        const list = listRef.current;
        if (!list) return null;
        const first = list.querySelector('[data-drag-id]');
        if (!first) return null;
        const h = first.getBoundingClientRect().height;
        return { step: h + GAP };
    }

    function onPointerDown(e, id, index) {
        if (e.button != null && e.button !== 0) return;
        pressRef.current = { id, index, startY: e.clientY, dragging: false };
        try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    }

    function onPointerMove(e) {
        const press = pressRef.current;
        if (!press) return;
        if (!press.dragging) {
            if (Math.abs(e.clientY - press.startY) < DRAG_THRESHOLD) return;
            press.dragging = true;
            setDraggingId(press.id);
            setDragFrom(press.index);
            setTargetIndex(press.index);
        }
        e.preventDefault();

        const m = rowMetrics();
        const rawDy = e.clientY - press.startY;
        let dy = rawDy;
        if (m) {
            const minDy = -press.index * m.step;
            const maxDy = (intOrder.length - 1 - press.index) * m.step;
            dy = Math.max(minDy, Math.min(maxDy, rawDy));
        }
        setDragOffset(dy);

        if (!m) return;
        const moved = Math.round(dy / m.step);
        let idx = press.index + moved;
        idx = Math.max(0, Math.min(intOrder.length - 1, idx));
        setTargetIndex(idx);
    }

    function endPress(e) {
        const press = pressRef.current;
        if (press && e && e.pointerId != null) {
            try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* ignore */ }
        }
        if (!press || !press.dragging) {
            pressRef.current = null;
            setDraggingId(null);
            setDragOffset(0);
            setTargetIndex(null);
            setDragFrom(null);
            return;
        }

        const from = press.index;
        const to = targetIndex != null ? targetIndex : press.index;
        const m = rowMetrics();

        pressRef.current = null;
        if (m) {
            const targetOffset = (to - from) * m.step;
            setSettling(true);
            setDragOffset(targetOffset);
            if (settleTimer.current) clearTimeout(settleTimer.current);
            settleTimer.current = setTimeout(() => {
                setCommitting(true);
                requestAnimationFrame(() => {
                    flushSync(() => {
                        if (to !== from) {
                            setIntOrder((cur) => {
                                const copy = [...cur];
                                copy.splice(to, 0, copy.splice(from, 1)[0]);
                                return copy;
                            });
                        }
                        setDraggingId(null);
                        setDragOffset(0);
                        setTargetIndex(null);
                        setDragFrom(null);
                        setSettling(false);
                    });
                    requestAnimationFrame(() => setCommitting(false));
                });
            }, 170);
        } else {
            if (to !== from) {
                const copy = [...intOrder];
                copy.splice(to, 0, copy.splice(from, 1)[0]);
                setIntOrder(copy);
            }
            setDraggingId(null);
            setDragOffset(0);
            setTargetIndex(null);
            setDragFrom(null);
        }
    }

    function shiftFor(index) {
        if (!draggingId || dragFrom == null || targetIndex == null) return 0;
        const from = dragFrom;
        const to = targetIndex;
        if (index === from) return 0;
        const m = rowMetrics();
        if (!m) return 0;
        if (to > from && index > from && index <= to) return -m.step;
        if (to < from && index >= to && index < from) return m.step;
        return 0;
    }

    function toggleWork(id) {
        if (workRank.includes(id)) setWorkRank(workRank.filter((x) => x !== id));
        else if (workRank.length < 5) setWorkRank([...workRank, id]);
    }

    function toggleCareer(id) {
        if (careers.includes(id)) setCareers(careers.filter((x) => x !== id));
        else if (careers.length < 3) setCareers([...careers, id]);
    }

    function addPref(id, col) {
        setPlacement((p) => ({ ...p, [id]: col }));
        setPrefModal(null);
    }
    function removePref(id) {
        setPlacement((p) => {
            const next = { ...p };
            delete next[id];
            return next;
        });
    }

    function compute() {
        const prefer = Object.entries(placement).filter(([, c]) => c === 'prefer').map(([id]) => id);
        const avoid = Object.entries(placement).filter(([, c]) => c === 'avoid').map(([id]) => id);
        const raw = recommend({
            division: division || 'HS',
            interestRanking: intOrder,
            workRanking: workRank,
            careers,
            prefer,
            avoid,
            time: (time && time !== 'any') ? time : null,
            teamAvailability: teamAvail || null,
        }, { topN: 10 });

        let prev = Infinity;
        const deduped = raw.map((r) => {
            let shown = Math.min(r.pct, prev - 1);
            shown = Math.max(0, shown);
            prev = shown;
            return { ...r, pct: shown };
        });

        setResults(deduped);
    }

    function next() {
        if (step < STEP_COUNT - 1) setStep(step + 1);
        else compute();
    }
    function back() {
        if (results) { setResults(null); return; }
        if (step > 0) setStep(step - 1);
    }
    function restart() {
        setIntOrder(STEP1_INTERESTS.map((i) => i.key));
        setWorkRank([]); setCareers([]); setTime(''); setTeamAvail(''); setPlacement({});
        setDivision(profile?.division || '');
        setStep(0); setResults(null); setOpenEvent(null);
    }

    const canNext =
        step === 0 ? !!division :
            step === 1 ? true :
                step === 2 ? workRank.length > 0 :
                    step === 3 ? true :
                        step === 4 ? !!time :
                            step === 5 ? !!teamAvail :
                                true;

    // ------------------------------------------------------------------ RESULTS
    if (results) {
        return (
            <>
                <div className="section rec-results-head">
                    <div className="rec-results-head-text">
                        <div className="eyebrow">{division === 'HS' ? 'High School' : 'Middle School'} · your matches</div>
                        <h1>Your top event matches</h1>
                        <p className="muted small">Explore the events that best match your interests and see what each one requires.</p>
                    </div>
                    {results.length > 0 && (
                        <div className="rec-results-actions">
                            <button className="icon-btn" onClick={restart} data-tip="Restart quiz" aria-label="Restart quiz">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
                                    <path d="M3 3v5h5" />
                                </svg>
                            </button>
                            <Link to="/events" className="icon-btn" data-tip="See all events" aria-label="See all events">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M3 10.5 12 3l9 7.5" />
                                    <path d="M5 9.5V21h14V9.5" />
                                </svg>
                            </Link>
                        </div>
                    )}
                </div>

                {results.length === 0 ? (
                    <div className="card">
                        <p className="muted">No matches to show. Try widening a few choices.</p>
                        <button className="btn primary small" onClick={restart} style={{ marginTop: 10 }}>Start over</button>
                    </div>
                ) : (
                    <div className="rec-list">
                        {results.map((r, i) => (
                            <div className="rec-card" key={r.id} onClick={() => setOpenEvent(r)}>
                                <div className="rec-rank">{i + 1}</div>
                                <div className="rec-body">
                                    <div className="rec-top">
                                        <h3>{r.name}</h3>
                                        <span className={`rec-pct ${pctClass(r.pct)}`}>{r.pct}%</span>
                                    </div>
                                    {r.explanation && <p className="rec-why rec-why-clamp">{r.explanation}</p>}
                                    <button
                                        className="rec-seemore"
                                        onClick={(e) => { e.stopPropagation(); setOpenEvent(r); }}
                                    >
                                        See more
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="m9 18 6-6-6-6" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {openEvent && <EventModal result={openEvent} onClose={() => setOpenEvent(null)} />}
            </>
        );
    }

    // ----------------------------------------------------------- QUESTIONNAIRE
    return (
        <>
            <div className="section">
                <div className="rec-progress">
                    {STEP_TITLES.map((_, i) => <span key={i} className={`rec-dot ${i <= step ? 'on' : ''}`} />)}
                </div>
                <div className="eyebrow">Step {step + 1} of {STEP_COUNT}</div>
                <h1>{STEP_TITLES[step]}</h1>
            </div>

            {/* STEP 0 — intro and division picker */}
            {step === 0 && (
                <>
                    <p className="rec-intro-lead">
                        Take a short quiz and we’ll match you with the TSA events that fit your interests best. First, pick your division.
                    </p>
                    <div className="rec-division">
                        {[
                            { id: 'HS', title: 'High School', sub: 'Grades 9–12' },
                            { id: 'MS', title: 'Middle School', sub: 'Grades 6–8' },
                        ].map((d) => (
                            <button
                                key={d.id}
                                className={`rec-division-opt ${division === d.id ? 'on' : ''}`}
                                onClick={() => setDivision(d.id)}
                            >
                                <span className="rec-division-title">{d.title}</span>
                                <span className="rec-division-sub">{d.sub}</span>
                            </button>
                        ))}
                    </div>
                </>
            )}

            {/* STEP 1 — drag to rank interests */}
            {step === 1 && (
                <>
                    <p className="muted small rec-stepsub">
                        Put what interests you most at the top, and we’ll use your choices to find the best matches for you.
                    </p>
                    <div
                        className={`drag-list ${draggingId ? 'is-dragging' : ''} ${committing ? 'is-committing' : ''}`}
                        ref={listRef}
                    >
                        {intOrder.map((id, i) => {
                            const isDragged = draggingId === id;
                            const translate = isDragged ? dragOffset : shiftFor(i);
                            const shownNum = i + 1;
                            return (
                                <div
                                    key={id}
                                    data-drag-id={id}
                                    className={`drag-item ${isDragged ? 'grabbed' : ''}`}
                                    onPointerDown={(e) => onPointerDown(e, id, i)}
                                    onPointerMove={onPointerMove}
                                    onPointerUp={endPress}
                                    onPointerCancel={endPress}
                                    style={{
                                        touchAction: 'none',
                                        transform: translate ? `translateY(${translate}px)` : undefined,
                                        transition: committing
                                            ? 'none'
                                            : isDragged
                                                ? (settling ? 'transform .17s cubic-bezier(.2,.7,.2,1)' : 'none')
                                                : undefined,
                                        zIndex: isDragged ? 5 : undefined,
                                        position: isDragged ? 'relative' : undefined,
                                    }}
                                >
                                    <span className="drag-num">{shownNum}</span>
                                    <span className="drag-grip" aria-hidden="true">⠿</span>
                                    <span className="drag-label">{intLabel[id]}</span>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

            {/* STEP 2 — work tiles */}
            {step === 2 && (
                <>
                    <p className="muted small rec-stepsub">
                        Choose up to five types of projects you’d enjoy working on, starting with your favorite. Your choices will help shape your matches.
                    </p>
                    <div className="tile-grid">
                        {STEP2_WORK_OPTIONS.map(({ id, label }) => {
                            const idx = workRank.indexOf(id);
                            const on = idx !== -1;
                            const disabled = !on && workRank.length >= 5;
                            return (
                                <button
                                    key={id}
                                    className={`tile ${on ? 'on' : ''}`}
                                    disabled={disabled}
                                    onClick={() => toggleWork(id)}
                                >
                                    {on && <span className="tile-badge">{idx + 1}</span>}
                                    <span className="tile-emoji">{WORK_EMOJI[id] || '•'}</span>
                                    <span className="tile-label">{label}</span>
                                </button>
                            );
                        })}
                    </div>
                </>
            )}

            {/* STEP 3 — careers */}
            {step === 3 && (
                <>
                    <p className="muted small rec-stepsub">Choose up to 3 career paths you’re most interested in. We’ll use them to show how each event connects to your future goals.</p>
                    <div className="rec-options">
                        {CAREERS.map(([id, label]) => {
                            const on = careers.includes(id);
                            const disabled = !on && careers.length >= 3;
                            return (
                                <button key={id} className={`rec-opt ${on ? 'on' : ''}`} disabled={disabled} onClick={() => toggleCareer(id)}>
                                    <span className="rec-opt-main"><span className="rec-opt-label">{label}</span></span>
                                    {on && <Icon name="check" size={16} />}
                                </button>
                            );
                        })}
                    </div>
                </>
            )}

            {/* STEP 4 — time */}
            {step === 4 && (
                <>
                    <p className="muted small rec-stepsub">How much time would you feel comfortable putting in each week? We’ll keep your schedule in mind when finding matches.</p>
                    <div className="rec-options">
                        {TIME_CHOICES.map(({ id, label }) => {
                            const on = time === id;
                            return (
                                <button key={id} className={`rec-opt ${on ? 'on' : ''}`} onClick={() => setTime(id)}>
                                    <span className="rec-opt-main"><span className="rec-opt-label">{label}</span></span>
                                    {on && <Icon name="check" size={16} />}
                                </button>
                            );
                        })}
                    </div>
                </>
            )}

            {/* STEP 5 — team availability */}
            {step === 5 && (
                <>
                    <p className="muted small rec-stepsub">Tell us whether you prefer working independently or with a team. This will helps us highlight suitable events and team-size requirements.</p>
                    <div className="rec-options">
                        {TEAM_AVAILABILITY_CHOICES.map(({ id, label, desc }) => {
                            const on = teamAvail === id;
                            return (
                                <button key={id} className={`rec-opt rec-opt-rich ${on ? 'on' : ''}`} onClick={() => setTeamAvail(id)}>
                                    <span className="rec-opt-main">
                                        <span className="rec-opt-label">{label}</span>
                                        {desc && <span className="rec-opt-desc">{desc}</span>}
                                    </span>
                                    {on && <Icon name="check" size={16} />}
                                </button>
                            );
                        })}
                    </div>
                </>
            )}

            {/* STEP 6 — preferences */}
            {step === 6 && (
                <>
                    <p className="muted small rec-stepsub">Add anything you’d especially enjoy or rather avoid. This step is optional and only helps us fine-tune your results.</p>

                    <div className="pref-cols">
                        {[
                            { col: 'prefer', title: 'Sounds Good to Me', addLabel: '+ Add something I’d enjoy' },
                            { col: 'avoid', title: 'I’d Rather Avoid', addLabel: '+ Add something to avoid' },
                        ].map(({ col, title, addLabel }) => {
                            const ids = Object.entries(placement).filter(([, c]) => c === col).map(([id]) => id);
                            return (
                                <div key={col} className={`pref-col ${col}`}>
                                    <div className="pref-col-title">{title}</div>
                                    <div className="pref-col-body">
                                        {ids.length === 0 && <div className="pref-col-empty">Nothing yet</div>}
                                        {ids.map((id) => {
                                            const it = PREF_BY_ID[id];
                                            if (!it) return null;
                                            return (
                                                <div key={id} className={`pref-chip ${col}`}>
                                                    <span className="pref-chip-emoji">{it.emoji}</span>
                                                    <span className="pref-chip-label">{it.label}</span>
                                                    <button className="pref-chip-x" onClick={() => removePref(id)} aria-label="Remove">×</button>
                                                </div>
                                            );
                                        })}
                                        <button className="pref-add" onClick={() => setPrefModal(col)}>{addLabel}</button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {prefModal && (
                        <div className="pref-modal-backdrop" onClick={() => setPrefModal(null)}>
                            <div className="pref-modal" onClick={(e) => e.stopPropagation()}>
                                <div className="pref-modal-head">
                                    <h3>{prefModal === 'prefer' ? 'What would you enjoy?' : 'What would you rather avoid?'}</h3>
                                    <button className="pref-modal-close" onClick={() => setPrefModal(null)} aria-label="Close">×</button>
                                </div>
                                <div className="pref-modal-body">
                                    {PREF_CATALOG.map((g) => (
                                        <div key={g.group} className="pref-modal-group">
                                            <div className="pref-modal-group-title">{g.group}</div>
                                            <div className="pref-modal-items">
                                                {g.items.map((it) => {
                                                    const current = placement[it.id];
                                                    const inThis = current === prefModal;
                                                    const inOther = current && current !== prefModal;
                                                    return (
                                                        <button
                                                            key={it.id}
                                                            className={`pref-modal-item ${inThis ? 'chosen' : ''}`}
                                                            onClick={() => (inThis ? removePref(it.id) : addPref(it.id, prefModal))}
                                                        >
                                                            <span className="pref-chip-emoji">{it.emoji}</span>
                                                            <span className="pref-chip-label">{it.label}</span>
                                                            {inThis && <span className="pref-modal-tick">✓</span>}
                                                            {inOther && <span className="pref-modal-moved">move here</span>}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}

            <div className="rec-nav">
                {step === 0 ? (
                    <button className="btn ghost rec-back" onClick={() => navigate(-1)}>Cancel</button>
                ) : (
                    <button className="btn ghost rec-back" onClick={back}>Back</button>
                )}
                <button className="btn primary" onClick={next} disabled={!canNext}>
                    {step === 0 ? 'Continue' : step === STEP_COUNT - 1 ? 'See my matches' : 'Next'}
                </button>
            </div>
        </>
    );
}

// Detail modal for one recommended event. Reads eligibility and careers from
// the event dataset, computes related events, and shows the score breakdown.
function EventModal({ result, onClose }) {
    const ev = EVENT_REC_BY_ID[result.id];
    const el = ev?.eligibility;
    const isStateQualifier = el?.entryScope === 'state';

    const relatedCareers = Object.entries(ev?.careers || {})
        .sort((a, b) => b[1] - a[1])
        .map(([k]) => CAREER_LABELS[k] || k)
        .filter((v, i, arr) => arr.indexOf(v) === i);

    const related = relatedEvents(result.id);
    const rows = breakdownRows(result._parts);

    return (
        <div className="rec-modal-backdrop" onClick={onClose}>
            <div className="rec-modal" onClick={(e) => e.stopPropagation()}>
                <div className="rec-modal-head">
                    <h3 className="rec-modal-title">{result.name}</h3>
                    <button className="rec-modal-close" onClick={onClose} aria-label="Close">×</button>
                </div>
                <div className="rec-modal-body">
                    <div className="rec-modal-scoreline">
                        <span className={`rec-modal-score ${pctClass(result.pct)}`}>{result.pct}%</span>
                        <span className="rec-modal-score-label">match with your profile</span>
                    </div>

                    {result.explanation && <p className="rec-modal-desc">{result.explanation}</p>}

                    <div className="rec-fact">
                        <span className="rec-fact-label">Team Size</span>
                        <span className="rec-fact-value">{teamSizeText(el)}</span>
                    </div>
                    <div className="rec-fact">
                        <span className="rec-fact-label">State Qualifier Event</span>
                        <span className="rec-fact-value">{isStateQualifier ? 'Yes' : 'No'}</span>
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

                    {rows.length > 0 && (
                        <div className="rec-breakdown">
                            <div className="rec-modal-section-title">Score Breakdown</div>
                            <p className="rec-breakdown-sub">How we calculate it. Each factor adds to your overall match based on your answers.</p>
                            {rows.map((r) => (
                                <div className="rec-breakdown-row" key={r.name}>
                                    <span className="rec-breakdown-name">{r.name}</span>
                                    <span className="rec-breakdown-bar">
                                        <span className="rec-breakdown-fill" style={{ width: `${r.bar}%` }} />
                                    </span>
                                    <span className="rec-breakdown-pct">{r.pct}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Colour band for a match percentage, green high, yellow mid, red low.
function pctClass(pct) {
    if (pct >= 80) return 'pct-high';
    if (pct >= 50) return 'pct-mid';
    return 'pct-low';
}