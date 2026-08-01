import { useMemo, useState } from 'react';
import { Icon } from '../components/UI.jsx';

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function ymd(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function sameDay(a, b) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

// Build the 6-row (42-cell) grid for a given month.
function buildGrid(year, month) {
    const first = new Date(year, month, 1);
    const startOffset = first.getDay(); // 0 = Sunday
    const start = new Date(year, month, 1 - startOffset);
    const cells = [];
    for (let i = 0; i < 42; i++) {
        const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
        cells.push(d);
    }
    return cells;
}

export default function Calendar() {
    const today = useMemo(() => new Date(), []);
    const [view, setView] = useState({ year: today.getFullYear(), month: today.getMonth() });
    const [selected, setSelected] = useState(today);

    // Events keyed by "YYYY-MM-DD". Empty for now; wire to Supabase/localStorage later.
    const [events] = useState({});

    const cells = useMemo(() => buildGrid(view.year, view.month), [view]);

    const goMonth = (delta) => {
        const d = new Date(view.year, view.month + delta, 1);
        setView({ year: d.getFullYear(), month: d.getMonth() });
    };
    const goToday = () => {
        setView({ year: today.getFullYear(), month: today.getMonth() });
        setSelected(today);
    };

    const selectedKey = ymd(selected);
    const selectedEvents = events[selectedKey] || [];

    return (
        <div className="cal-page">
            <div className="section">
                <div className="rs-eyebrow">Calendar</div>
                <h1 className="cal-h1">{MONTHS[view.month]} {view.year}</h1>
            </div>

            {/* Month navigation */}
            <div className="cal-nav">
                <button type="button" className="cal-nav-btn" onClick={() => goMonth(-1)} aria-label="Previous month">
                    <span style={{ display: 'inline-flex', transform: 'rotate(180deg)' }}>
                        <Icon name="chevron-right" size={20} />
                    </span>
                </button>
                <button type="button" className="cal-today-btn" onClick={goToday}>Today</button>
                <button type="button" className="cal-nav-btn" onClick={() => goMonth(1)} aria-label="Next month">
                    <Icon name="chevron-right" size={20} />
                </button>
            </div>

            {/* Weekday header */}
            <div className="cal-grid cal-weekdays">
                {WEEKDAYS.map((w) => (
                    <div key={w} className="cal-weekday">{w}</div>
                ))}
            </div>

            {/* Day grid */}
            <div className="cal-grid">
                {cells.map((d) => {
                    const inMonth = d.getMonth() === view.month;
                    const isToday = sameDay(d, today);
                    const isSelected = sameDay(d, selected);
                    const hasEvents = (events[ymd(d)] || []).length > 0;
                    const cls = [
                        'cal-cell',
                        inMonth ? '' : 'is-outside',
                        isToday ? 'is-today' : '',
                        isSelected ? 'is-selected' : '',
                    ].filter(Boolean).join(' ');
                    return (
                        <button key={ymd(d)} type="button" className={cls} onClick={() => setSelected(d)}>
                            <span className="cal-cell-num">{d.getDate()}</span>
                            {hasEvents && <span className="cal-dot" />}
                        </button>
                    );
                })}
            </div>

            {/* Selected day + events */}
            <div className="cal-day-label">
                {WEEKDAYS[selected.getDay()]}, {MONTHS[selected.getMonth()]} {selected.getDate()}
            </div>

            {selectedEvents.length === 0 ? (
                <p className="cal-empty">No events for this day.</p>
            ) : (
                <div className="cal-events">
                    {selectedEvents.map((ev, i) => (
                        <div key={i} className="cal-event">
                            {ev.time && <span className="cal-event-time">{ev.time}</span>}
                            <span className="cal-event-title">{ev.title}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}