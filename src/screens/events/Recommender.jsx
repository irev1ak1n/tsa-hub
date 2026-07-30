import { useState, useRef } from 'react';
import { flushSync } from 'react-dom';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext.jsx';
import {
    recommend,
    STEP1_INTERESTS,
    STEP2_WORK_OPTIONS,
    STYLE_CHOICES,
    FORMAT_CHOICES,
    DIFFICULTY_CHOICES,
    TIME_CHOICES,
    TEAM_AVAILABILITY_CHOICES,
} from '../../services/recommender.js';
import { Icon } from '../../components/UI.jsx';

// ---------------------------------------------------------------------------
// Step 2 tiles keep their emoji; ids now match the engine's workType option ids.
// ---------------------------------------------------------------------------
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

// Preference catalog for the two-column builder. Every id here is understood by
// the engine (style, format, or difficulty) so nothing is "dead". Grouped by
// theme for the picker modal; emoji used on the chips.
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
// flat lookup: id -> { label, emoji, group }
const PREF_BY_ID = Object.fromEntries(
    PREF_CATALOG.flatMap((g) => g.items.map((it) => [it.id, { ...it, group: g.group }]))
);

const STEP_TITLES = [
    'What interests you most?',
    'What would you love to work on?',
    'Where could you see yourself?',
    'How much time do you want to put in?',
    'How do you prefer to work?',
    'Set your preferences',
];
const STEP_COUNT = STEP_TITLES.length;

// How far the pointer must move before a press becomes a drag (px). Below this
// threshold the gesture is treated as a tap / page scroll, so the list doesn't
// grab on every touch.
const DRAG_THRESHOLD = 6;

export default function Recommender() {
    const { profile, myEvents, addEvent, removeEvent } = useApp();
    const division = profile?.division || 'HS';

    const [step, setStep] = useState(0);
    const [results, setResults] = useState(null);

    // Step 1 starts as the full list in default order (draggable to rank).
    const [intOrder, setIntOrder] = useState(STEP1_INTERESTS.map((i) => i.key));
    const [workRank, setWorkRank] = useState([]);      // ordered picks, max 5
    const [careers, setCareers] = useState([]);
    const [time, setTime] = useState('');
    const [teamAvail, setTeamAvail] = useState('');
    const [placement, setPlacement] = useState({});    // id -> 'prefer' | 'avoid'
    const [prefModal, setPrefModal] = useState(null);  // 'prefer' | 'avoid' | null (which column is being added to)

    const intLabel = Object.fromEntries(STEP1_INTERESTS.map((i) => [i.key, i.label]));

    // ---- pointer drag for step 1 — displacement reorder (mouse + touch) -----
    // Robust approach (dnd-kit style): the DOM order NEVER changes during a drag.
    // The dragged row translates by the raw pointer delta (so it can't escape the
    // list). Every other row shifts by exactly one row-height when it needs to make
    // room, via CSS transition (smooth slide). We commit the new order to state
    // only on drop. No baseTop math, no mid-drag re-renders, no jumps.
    const listRef = useRef(null);
    const pressRef = useRef(null);
    const [draggingId, setDraggingId] = useState(null);
    const [dragOffset, setDragOffset] = useState(0);   // px the dragged row moved
    const [targetIndex, setTargetIndex] = useState(null); // where it would drop
    const [dragFrom, setDragFrom] = useState(null);    // origin index (kept during settle)
    const [settling, setSettling] = useState(false);   // true during the release glide
    const [committing, setCommitting] = useState(false); // true for the 1 frame we swap DOM order
    const settleTimer = useRef(null);

    const GAP = 8; // must match .drag-list gap in CSS

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
        pressRef.current = {
            id,
            index,               // original index in intOrder
            startY: e.clientY,
            dragging: false,
        };
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

        // clamp the visual offset so the dragged row can't leave the list: it may
        // travel at most from its own slot up to the first slot / down to the last.
        const m = rowMetrics();
        const rawDy = e.clientY - press.startY;
        let dy = rawDy;
        if (m) {
            const minDy = -press.index * m.step;                          // up to slot 0
            const maxDy = (intOrder.length - 1 - press.index) * m.step;   // down to last
            dy = Math.max(minDy, Math.min(maxDy, rawDy));
        }
        setDragOffset(dy);

        // how many slots the dragged row has moved past, based on row height
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

        // Glide the dragged card from wherever the finger left it to the EXACT
        // offset of its destination slot, then commit the reorder once the glide
        // finishes. Animating to the exact slot offset (moved * step) is what kills
        // the little jump: at commit the card is already sitting precisely where
        // its new DOM slot will be, so nothing teleports. Neighbors are already in
        // their final visual spots, so the commit is invisible.
        pressRef.current = null;
        if (m) {
            const targetOffset = (to - from) * m.step;
            setSettling(true);
            setDragOffset(targetOffset); // CSS transition animates card to the slot
            if (settleTimer.current) clearTimeout(settleTimer.current);
            settleTimer.current = setTimeout(() => {
                // The card has now glided to its destination slot visually. Commit
                // the real DOM order in a dedicated "committing" frame where ALL
                // transitions are off, so the instant we swap DOM order and drop the
                // transform, nothing animates — the visual position is unchanged.
                // (Without this, clearing draggingId re-enables the CSS .18s
                // transition and the leftover transform animates to 0 at the same
                // moment the layout moves the row → the bounce you saw.)
                setCommitting(true);
                requestAnimationFrame(() => {
                    // flushSync makes the order change + state reset one synchronous,
                    // visually atomic paint (React alone doesn't guarantee that).
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
                    // re-enable transitions on the next frame, after the swap painted
                    requestAnimationFrame(() => setCommitting(false));
                });
            }, 170); // must match the settle transition duration below
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

    // For a given row index, how far should it visually shift to make room for the
    // dragged row? Returns px translateY (0 for the dragged row — it uses offset).
    // Uses dragFrom state (not pressRef) so it keeps working during the release
    // settle, when pressRef has already been cleared.
    function shiftFor(index) {
        if (!draggingId || dragFrom == null || targetIndex == null) return 0;
        const from = dragFrom;
        const to = targetIndex;
        if (index === from) return 0; // dragged row handled separately
        const m = rowMetrics();
        if (!m) return 0;
        // dragged moving DOWN: rows between (from, to] shift up by one step
        if (to > from && index > from && index <= to) return -m.step;
        // dragged moving UP: rows between [to, from) shift down by one step
        if (to < from && index >= to && index < from) return m.step;
        return 0;
    }

    // ---- step 2 tiles ----
    function toggleWork(id) {
        if (workRank.includes(id)) setWorkRank(workRank.filter((x) => x !== id));
        else if (workRank.length < 5) setWorkRank([...workRank, id]);
    }

    function toggleCareer(id) {
        if (careers.includes(id)) setCareers(careers.filter((x) => x !== id));
        else if (careers.length < 3) setCareers([...careers, id]);
    }

    // add an item to a column from the modal; if it's already in the other column,
    // just switch it (an item can't be in both Prefer and Avoid at once).
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
            division,
            interestRanking: intOrder,          // all 8, ranked
            workRanking: workRank,              // up to 5, ranked
            careers,
            prefer,
            avoid,
            time: (time && time !== 'any') ? time : null,
            teamAvailability: teamAvail || null,
        }, { topN: 10 });

        // De-duplicate displayed percentages. Ranking already reflects true score;
        // this only adjusts the shown number so ties don't read as "30, 30, 30".
        // Each time a % would repeat (or exceed) the one above it, drop it by 1 so
        // the column always descends. Underlying order is untouched.
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
        setStep(0); setResults(null);
    }

    const canNext =
        step === 0 ? true :
            step === 1 ? workRank.length > 0 :
                step === 2 ? true :
                    step === 3 ? !!time :
                        step === 4 ? !!teamAvail :
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
                        {results.map((r, i) => {
                            return (
                                <div className="rec-card" key={r.id}>
                                    <div className="rec-rank">{i + 1}</div>
                                    <div className="rec-body">
                                        <div className="rec-top">
                                            <h3>{r.name}</h3>
                                            <span className={`rec-pct ${pctClass(r.pct)}`}>{r.pct}%</span>
                                        </div>

                                        {/* WHY it matches — interest fit only */}
                                        {r.explanation && <p className="rec-why">{r.explanation}</p>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
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

            {/* STEP 1 — drag to rank all 8 interests (pointer-based: mouse + touch) */}
            {step === 0 && (
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
                            // dragged row follows the finger; others shift to make room
                            const translate = isDragged ? dragOffset : shiftFor(i);
                            // number stays as the row's current position; it only changes
                            // once the reorder is committed (after release), not mid-drag.
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
                                        // While actively dragging, the dragged row tracks the finger
                                        // 1:1 (no transition). On release (settling) it glides to its
                                        // exact slot. During the commit frame ALL rows have transitions
                                        // off, so swapping DOM order + dropping the transform doesn't
                                        // animate → no bounce. Neighbors otherwise slide via the CSS
                                        // rule on .drag-item.
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

            {/* STEP 2 — emoji tiles, ranked up to 5 */}
            {step === 1 && (
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
            {step === 2 && (
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
            {step === 3 && (
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

            {/* STEP 5 — team availability (eligibility only) */}
            {step === 4 && (
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

            {/* STEP 6 — preferences: two-column builder (Prefer / Avoid) + budget */}
            {step === 5 && (
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

                    {/* picker modal */}
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
                {step > 0 ? <button className="btn ghost" onClick={back}>Back</button> : <span />}
                <button className="btn primary" onClick={next} disabled={!canNext}>
                    {step === STEP_COUNT - 1 ? 'See my matches' : 'Continue'}
                </button>
            </div>
        </>
    );
}

// Colour band for a match percentage: green >=80, yellow 50-79, red <50.
function pctClass(pct) {
    if (pct >= 80) return 'pct-high';
    if (pct >= 50) return 'pct-mid';
    return 'pct-low';
}