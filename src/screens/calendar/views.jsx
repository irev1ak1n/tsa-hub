import { useMemo, useRef, useEffect } from 'react';
import { addDays, formatTime, monthMatrix, sameDay, timeToMinutes, weekDates, weekdayLabels, ymd } from '../../utils/date.js';
import { ItemChip } from './CalendarPanels.jsx';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MAX_CHIPS_PER_DAY = 3;

// ============================================================================
// MONTH
// ============================================================================
export function MonthView({ year, month, today, selected, itemsByDate, firstDay, onSelectDay, onOpenItem }) {
    const cells = useMemo(() => monthMatrix(year, month, firstDay), [year, month, firstDay]);
    const todayKey = ymd(today);
    const weekdays = weekdayLabels(firstDay);

    return (
        <div>
            <div className="cal-grid cal-weekdays">
                {weekdays.map((w) => <div key={w} className="cal-weekday">{w}</div>)}
            </div>
            <div className="cal-month-grid">
                {cells.map((d) => {
                    const key = ymd(d);
                    const inMonth = d.getMonth() === month;
                    const isToday = key === todayKey;
                    const isSelected = selected && sameDay(d, selected);
                    const dayItems = itemsByDate[key] || [];
                    const shown = dayItems.slice(0, MAX_CHIPS_PER_DAY);
                    const overflow = dayItems.length - shown.length;
                    const cls = ['cal-month-cell', inMonth ? '' : 'is-outside', isToday ? 'is-today' : '', isSelected ? 'is-selected' : ''].filter(Boolean).join(' ');
                    return (
                        <div
                            key={key}
                            role="button"
                            tabIndex={0}
                            className={cls}
                            onClick={() => onSelectDay(d)}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelectDay(d); } }}
                        >
                            <span className="cal-month-cell-num">{d.getDate()}</span>
                            <span className="cal-month-cell-items">
                                {shown.map((it) => (
                                    <ItemChip key={it.id} item={it} onClick={onOpenItem} compact />
                                ))}
                                {overflow > 0 && <span className="cal-more">+{overflow}</span>}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ============================================================================
// YEAR
// ============================================================================
export function YearView({ year, today, itemsByDate, onSelectMonth }) {
    const todayKey = ymd(today);
    return (
        <div className="cal-year-grid">
            {MONTHS.map((name, m) => {
                const cells = monthMatrix(year, m, 0);
                return (
                    <button key={name} type="button" className="cal-year-month" onClick={() => onSelectMonth(m)}>
                        <div className="cal-year-month-title">{MONTHS_SHORT[m]}</div>
                        <div className="cal-year-mini-grid">
                            {cells.map((d) => {
                                const key = ymd(d);
                                const inMonth = d.getMonth() === m;
                                const isToday = key === todayKey;
                                const hasItems = (itemsByDate[key] || []).length > 0;
                                return (
                                    <span
                                        key={key}
                                        className={[
                                            'cal-year-mini-cell',
                                            inMonth ? '' : 'is-outside',
                                            isToday ? 'is-today' : '',
                                        ].filter(Boolean).join(' ')}
                                    >
                                        {inMonth ? d.getDate() : ''}
                                        {inMonth && hasItems && <span className="cal-year-mini-dot" />}
                                    </span>
                                );
                            })}
                        </div>
                    </button>
                );
            })}
        </div>
    );
}

// ============================================================================
// WEEK
// ============================================================================
const HOUR_HEIGHT = 48; // px per hour on the timeline

export function WeekView({ anchor, today, itemsByDate, firstDay, onSelectDay, onCreateAt, onOpenItem }) {
    const days = useMemo(() => weekDates(anchor, firstDay), [anchor, firstDay]);
    const todayKey = ymd(today);
    const scrollRef = useRef(null);

    useEffect(() => {
        // Center the timeline roughly around the working day on mount/week change.
        if (scrollRef.current) scrollRef.current.scrollTop = 7 * HOUR_HEIGHT;
    }, [anchor]);

    const dayData = days.map((d) => {
        const key = ymd(d);
        const items = itemsByDate[key] || [];
        return {
            date: d,
            key,
            allDay: items.filter((i) => i.allDay),
            timed: items.filter((i) => !i.allDay && i.startTime),
        };
    });

    return (
        <div className="cal-week">
            <div className="cal-week-header">
                <div className="cal-week-gutter" />
                {dayData.map(({ date, key }) => (
                    <button
                        key={key}
                        type="button"
                        className={`cal-week-day-head ${key === todayKey ? 'is-today' : ''}`}
                        onClick={() => onSelectDay(date)}
                    >
                        <span className="cal-week-day-name">{date.toLocaleDateString(undefined, { weekday: 'short' })}</span>
                        <span className="cal-week-day-num">{date.getDate()}</span>
                    </button>
                ))}
            </div>

            <div className="cal-week-allday">
                <div className="cal-week-gutter cal-week-gutter-label">All day</div>
                {dayData.map(({ key, allDay }) => (
                    <div key={key} className="cal-week-allday-cell">
                        {allDay.slice(0, 2).map((it) => <ItemChip key={it.id} item={it} onClick={onOpenItem} compact />)}
                        {allDay.length > 2 && <span className="cal-more">+{allDay.length - 2}</span>}
                    </div>
                ))}
            </div>

            <div className="cal-week-timeline" ref={scrollRef}>
                <div className="cal-week-hours">
                    {Array.from({ length: 24 }, (_, h) => (
                        <div key={h} className="cal-week-hour" style={{ height: HOUR_HEIGHT }}>
                            <span>{h === 0 ? '' : formatTime(`${String(h).padStart(2, '0')}:00`)}</span>
                        </div>
                    ))}
                </div>
                {dayData.map(({ date, key, timed }) => (
                    <div
                        key={key}
                        className="cal-week-day-col"
                        style={{ height: HOUR_HEIGHT * 24 }}
                        onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const offsetMin = ((e.clientY - rect.top) / HOUR_HEIGHT) * 60;
                            const snapped = Math.max(0, Math.round(offsetMin / 30) * 30);
                            onCreateAt(date, `${String(Math.floor(snapped / 60)).padStart(2, '0')}:${String(snapped % 60).padStart(2, '0')}`);
                        }}
                    >
                        {Array.from({ length: 24 }, (_, h) => (
                            <div key={h} className="cal-week-hour-line" style={{ top: h * HOUR_HEIGHT }} />
                        ))}
                        {timed.map((it) => {
                            const startMin = timeToMinutes(it.startTime) ?? 0;
                            const endMin = it.endTime ? timeToMinutes(it.endTime) : startMin + 60;
                            const top = (startMin / 60) * HOUR_HEIGHT;
                            const height = Math.max(20, ((endMin - startMin) / 60) * HOUR_HEIGHT);
                            const kindClass = it.kind === 'official' ? 'is-official' : it.kind === 'personal-event' ? 'is-personal' : 'is-reminder';
                            return (
                                <button
                                    key={it.id}
                                    type="button"
                                    className={`cal-week-item ${kindClass}`}
                                    style={{ top, height }}
                                    onClick={(e) => { e.stopPropagation(); onOpenItem(it); }}
                                >
                                    <span className="cal-week-item-title">{it.title}</span>
                                </button>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
}

// ============================================================================
// SCHEDULE
// ============================================================================
export function ScheduleView({ dates, today, itemsByDate, onOpenItem, onAddForDay }) {
    const todayKey = ymd(today);
    const todayRef = useRef(null);

    useEffect(() => {
        todayRef.current?.scrollIntoView({ block: 'start' });
    }, [dates]);

    const withItems = dates.filter((d) => (itemsByDate[ymd(d)] || []).length > 0);

    if (withItems.length === 0) {
        return <p className="cal-empty">Nothing scheduled in this range yet.</p>;
    }

    return (
        <div className="cal-schedule">
            {withItems.map((d) => {
                const key = ymd(d);
                const items = itemsByDate[key] || [];
                const isToday = key === todayKey;
                return (
                    <div key={key} className="cal-schedule-day" ref={isToday ? todayRef : null}>
                        <div className={`cal-schedule-day-head ${isToday ? 'is-today' : ''}`}>
                            <span>{isToday ? 'Today · ' : ''}{d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                            <button type="button" className="cal-add-inline" onClick={() => onAddForDay(d)} aria-label="Add for this day">+</button>
                        </div>
                        <div className="cal-schedule-items">
                            {items.map((it) => {
                                const kindClass = it.kind === 'official' ? 'is-official' : it.kind === 'personal-event' ? 'is-personal' : 'is-reminder';
                                const timeLabel = it.allDay ? 'All day' : it.startTime ? `${formatTime(it.startTime)}${it.endTime ? ` – ${formatTime(it.endTime)}` : ''}` : '';
                                return (
                                    <button key={it.id} type="button" className={`cal-schedule-item ${kindClass} ${it.completed ? 'is-completed' : ''}`} onClick={() => onOpenItem(it)}>
                                        <span className="cal-item-row-dot" />
                                        <span className="cal-item-row-text">
                                            <span className="cal-item-row-title">{it.title}</span>
                                            {timeLabel && <span className="cal-item-row-time">{timeLabel}</span>}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export function buildScheduleDates(centerDate, daysBack, daysForward) {
    const dates = [];
    for (let i = -daysBack; i <= daysForward; i++) dates.push(addDays(centerDate, i));
    return dates;
}
