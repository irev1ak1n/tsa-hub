import { useMemo, useState } from 'react';
import { Icon } from '../components/UI.jsx';
import { CALENDAR_EVENTS, CALENDAR_SYNC } from '../data/tsaCalendar.js';
import { now, ymd, parseYmd, sameDay, eventStatus } from '../utils/date.js';

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const CATEGORY_LABEL = {
    'constant-contact': 'Constant Contact',
    'important-date': 'Important Date',
    conference: 'National TSA Conference',
    event: 'Event',
};

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

// Group events by "YYYY-MM-DD" — a multi-day event appears under every date
// in its span so the grid and day list both find it.
function indexEventsByDate(events) {
    const map = {};
    for (const ev of events) {
        const start = parseYmd(ev.startDate);
        const end = parseYmd(ev.endDate || ev.startDate);
        if (!start || !end) continue;
        let cursor = start;
        // Guard against a corrupt/inverted range instead of looping forever.
        let guard = 0;
        while (cursor <= end && guard < 400) {
            const key = ymd(cursor);
            (map[key] ||= []).push(ev);
            cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 1);
            guard++;
        }
    }
    return map;
}

function formatDateRange(ev) {
    const start = parseYmd(ev.startDate);
    const end = parseYmd(ev.endDate || ev.startDate);
    if (!start) return '';
    const startLabel = `${MONTHS[start.getMonth()]} ${start.getDate()}, ${start.getFullYear()}`;
    if (!end || sameDay(start, end)) return startLabel;
    const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
    const endLabel = sameMonth
        ? `${end.getDate()}, ${end.getFullYear()}`
        : `${MONTHS[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`;
    return `${startLabel} – ${endLabel}`;
}

function StatusBadge({ status }) {
    if (status === 'PAST') return null;
    const cls = status === 'TODAY' ? 'cal-badge is-today' : status === 'ONGOING' ? 'cal-badge is-ongoing' : 'cal-badge is-upcoming';
    const label = status === 'TODAY' ? 'Today' : status === 'ONGOING' ? 'Ongoing' : 'Upcoming';
    return <span className={cls}>{label}</span>;
}

function EventDetailModal({ event, onClose }) {
    if (!event) return null;
    const status = eventStatus(event.startDate, event.endDate || event.startDate);
    return (
        <div className="rec-modal-backdrop" onClick={onClose}>
            <div className="rec-modal" onClick={(e) => e.stopPropagation()}>
                <div className="rec-modal-head">
                    <h3 className="rec-modal-title">{event.title}</h3>
                    <button className="rec-modal-close" onClick={onClose} aria-label="Close">×</button>
                </div>
                <div className="rec-modal-body">
                    <div className="rec-modal-section" style={{ marginTop: 0 }}>
                        <div className="rec-fact">
                            <span className="rec-fact-label">Date</span>
                            <span className="rec-fact-value">{formatDateRange(event)}</span>
                        </div>
                        <div className="rec-fact">
                            <span className="rec-fact-label">Category</span>
                            <span className="rec-fact-value">{CATEGORY_LABEL[event.category] || event.category}</span>
                        </div>
                        {event.location && (
                            <div className="rec-fact">
                                <span className="rec-fact-label">Location</span>
                                <span className="rec-fact-value">{event.location}</span>
                            </div>
                        )}
                        <div className="rec-fact">
                            <span className="rec-fact-label">Status</span>
                            <span className="rec-fact-value"><StatusBadge status={status} /> {status === 'PAST' ? 'Past' : ''}</span>
                        </div>
                    </div>

                    {event.description && (
                        <div className="rec-modal-section">
                            <div className="rec-modal-section-title">Description</div>
                            <p className="rec-modal-desc" style={{ margin: 0 }}>{event.description}</p>
                        </div>
                    )}

                    {event.source?.url && (
                        <div className="rec-modal-section">
                            <div className="rec-modal-section-title">Official Resources</div>
                            <a
                                href={event.source.url}
                                target="_blank"
                                rel="noreferrer"
                                className="eth-resource-row"
                            >
                                <span className="eth-resource-ico"><Icon name="external-link" size={14} /></span>
                                <span className="eth-resource-text">
                                    <span className="eth-resource-title">View on National TSA</span>
                                    <span className="eth-resource-label">{event.source.provider}</span>
                                </span>
                                <Icon name="external-link" size={14} />
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function Calendar() {
    const today = useMemo(() => now(), []);
    const [view, setView] = useState({ year: today.getFullYear(), month: today.getMonth() });
    const [selected, setSelected] = useState(today);
    const [openEvent, setOpenEvent] = useState(null);

    const eventsByDate = useMemo(() => indexEventsByDate(CALENDAR_EVENTS), []);
    const todayKey = ymd(today);

    const cells = useMemo(() => buildGrid(view.year, view.month), [view]);

    const goMonth = (delta) => {
        setView((v) => {
            const d = new Date(v.year, v.month + delta, 1);
            return { year: d.getFullYear(), month: d.getMonth() };
        });
    };
    const goToday = () => {
        setView({ year: today.getFullYear(), month: today.getMonth() });
        setSelected(today);
    };

    const selectedKey = ymd(selected);
    const selectedEvents = (eventsByDate[selectedKey] || [])
        .slice()
        .sort((a, b) => (a.startDate < b.startDate ? -1 : a.startDate > b.startDate ? 1 : a.id < b.id ? -1 : 1));

    return (
        <div className="cal-page">
            <div className="section">
                <div className="rs-eyebrow">Calendar</div>
                <h1 className="cal-h1">{MONTHS[view.month]} {view.year}</h1>
                <p className="muted small" style={{ margin: 0 }}>
                    Synced from the official National TSA calendar
                    {CALENDAR_SYNC?.lastSyncAt ? ` · last synced ${new Date(CALENDAR_SYNC.lastSyncAt).toLocaleDateString()}` : ''}
                </p>
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
                    const key = ymd(d);
                    const inMonth = d.getMonth() === view.month;
                    const isToday = key === todayKey;
                    const isSelected = sameDay(d, selected);
                    const hasEvents = (eventsByDate[key] || []).length > 0;
                    const cls = [
                        'cal-cell',
                        inMonth ? '' : 'is-outside',
                        isToday ? 'is-today' : '',
                        isSelected ? 'is-selected' : '',
                    ].filter(Boolean).join(' ');
                    return (
                        <button key={key} type="button" className={cls} onClick={() => setSelected(d)}>
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
                <p className="cal-empty">No official TSA events for this day.</p>
            ) : (
                <div className="cal-events">
                    {selectedEvents.map((ev) => {
                        // Status is always relative to *today*, not the selected day.
                        const status = eventStatus(ev.startDate, ev.endDate || ev.startDate, todayKey);
                        return (
                            <button
                                key={ev.id}
                                type="button"
                                className="cal-event"
                                onClick={() => setOpenEvent(ev)}
                                style={{ width: '100%', textAlign: 'left', cursor: 'pointer' }}
                            >
                                <span className="cal-event-title" style={{ flex: 1 }}>{ev.title}</span>
                                <StatusBadge status={status} />
                            </button>
                        );
                    })}
                </div>
            )}

            <EventDetailModal event={openEvent} onClose={() => setOpenEvent(null)} />
        </div>
    );
}
