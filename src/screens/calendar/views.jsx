import { useMemo, useRef, useEffect } from 'react';
import { addDays, formatTime, monthMatrix, sameDay, timeToMinutes, weekDates, weekdayLabels, ymd } from '../../utils/date.js';
import { resolveItemColor } from '../../utils/color.js';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// ============================================================================
// MONTH — events render as continuous bars spanning their date range, split
// only at week-row boundaries (never repeated as one pill per day).
// ============================================================================
const MAX_LANES = 3;
const HEADER_H = 22;
const LANE_H = 18;
const LANE_GAP = 2;
const OVERFLOW_H = 14;

// Lays out one calendar week (7 consecutive dates) worth of bar segments:
// intersects every item's [start,end] with the row's [start,end], assigns
// non-overlapping lanes (longest spans first, so multi-day events claim a
// lane before single-day items), and reports any items bumped to overflow.
function layoutWeekRow(rowDates, items) {
    const rowStart = ymd(rowDates[0]);
    const rowEnd = ymd(rowDates[6]);
    const rowKeys = rowDates.map(ymd);

    const candidates = items
        .filter((it) => it.startDate <= rowEnd && (it.endDate || it.startDate) >= rowStart)
        .map((it) => {
            const itemEnd = it.endDate || it.startDate;
            const segStart = it.startDate < rowStart ? rowStart : it.startDate;
            const segEnd = itemEnd > rowEnd ? rowEnd : itemEnd;
            return {
                item: it,
                colStart: rowKeys.indexOf(segStart),
                colEnd: rowKeys.indexOf(segEnd),
                continuesLeft: it.startDate < rowStart,
                continuesRight: itemEnd > rowEnd,
            };
        })
        .sort((a, b) => (b.colEnd - b.colStart) - (a.colEnd - a.colStart) || a.colStart - b.colStart || (a.item.id < b.item.id ? -1 : 1));

    const lanes = []; // each lane: [{colStart,colEnd}]
    const segments = [];
    const overflowByCol = Array(7).fill(0);

    for (const seg of candidates) {
        let laneIdx = lanes.findIndex((lane) => lane.every((o) => seg.colStart > o.colEnd || seg.colEnd < o.colStart));
        if (laneIdx === -1) {
            if (lanes.length >= MAX_LANES) {
                for (let c = seg.colStart; c <= seg.colEnd; c++) overflowByCol[c]++;
                continue;
            }
            laneIdx = lanes.length;
            lanes.push([]);
        }
        lanes[laneIdx].push({ colStart: seg.colStart, colEnd: seg.colEnd });
        segments.push({ ...seg, lane: laneIdx });
    }

    return { segments, laneCount: lanes.length, overflowByCol };
}

export function MonthView({ year, month, today, selected, items, itemsByDate, firstDay, onSelectDay, onOpenItem }) {
    const grid = useMemo(() => monthMatrix(year, month, firstDay), [year, month, firstDay]);
    const weeks = useMemo(() => Array.from({ length: 6 }, (_, i) => grid.slice(i * 7, i * 7 + 7)), [grid]);
    const todayKey = ymd(today);
    const weekdays = weekdayLabels(firstDay);

    const visibleItems = useMemo(() => {
        const gridStart = ymd(grid[0]);
        const gridEnd = ymd(grid[41]);
        return items.filter((it) => it.startDate <= gridEnd && (it.endDate || it.startDate) >= gridStart);
    }, [items, grid]);

    return (
        <div>
            <div className="cal-grid cal-weekdays">
                {weekdays.map((w) => <div key={w} className="cal-weekday">{w}</div>)}
            </div>
            <div className="cal-month">
                {weeks.map((rowDates, wi) => {
                    const { segments, laneCount, overflowByCol } = layoutWeekRow(rowDates, visibleItems);
                    const hasOverflow = overflowByCol.some((n) => n > 0);
                    const rowHeight = HEADER_H + (laneCount ? laneCount * (LANE_H + LANE_GAP) : 0) + (hasOverflow ? OVERFLOW_H : 0) + 6;

                    return (
                        <div key={wi} className="cal-week-row" style={{ minHeight: rowHeight }}>
                            <div className="cal-week-row-cells">
                                {rowDates.map((d) => {
                                    const key = ymd(d);
                                    const inMonth = d.getMonth() === month;
                                    const isToday = key === todayKey;
                                    const isSelected = selected && sameDay(d, selected);
                                    const cls = ['cal-day-cell', inMonth ? '' : 'is-outside', isToday ? 'is-today' : '', isSelected ? 'is-selected' : ''].filter(Boolean).join(' ');
                                    return (
                                        <div
                                            key={key}
                                            role="button"
                                            tabIndex={0}
                                            className={cls}
                                            onClick={() => onSelectDay(d)}
                                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelectDay(d); } }}
                                        >
                                            <span className="cal-day-num">{d.getDate()}</span>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="cal-week-row-bars" style={{ top: HEADER_H, gridTemplateRows: `repeat(${Math.max(laneCount, 1)}, ${LANE_H}px)`, gridAutoRows: `${LANE_H}px`, gap: LANE_GAP }}>
                                {segments.map((seg) => {
                                    const { bg, fg } = resolveItemColor(seg.item);
                                    const roundCls = [
                                        !seg.continuesLeft ? 'is-start' : '',
                                        !seg.continuesRight ? 'is-end' : '',
                                    ].filter(Boolean).join(' ');
                                    return (
                                        <button
                                            key={`${seg.item.id}-${wi}`}
                                            type="button"
                                            className={`cal-bar ${roundCls} ${seg.item.completed ? 'is-completed' : ''}`}
                                            style={{ gridColumn: `${seg.colStart + 1} / ${seg.colEnd + 2}`, gridRow: seg.lane + 1, background: bg, color: fg }}
                                            onClick={(e) => { e.stopPropagation(); onOpenItem(seg.item); }}
                                            title={seg.item.title}
                                        >
                                            {!seg.item.allDay && seg.item.startTime && <span className="cal-bar-time">{formatTime(seg.item.startTime)}</span>}
                                            <span className="cal-bar-title">{seg.item.title}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            {hasOverflow && (
                                <div className="cal-week-row-overflow">
                                    {rowDates.map((d, i) => (
                                        <span key={i} className="cal-overflow-cell">
                                            {overflowByCol[i] > 0 && <button type="button" className="cal-more" onClick={() => onSelectDay(d)}>+{overflowByCol[i]}</button>}
                                        </span>
                                    ))}
                                </div>
                            )}
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
                        {allDay.slice(0, 2).map((it) => {
                            const { bg, fg } = resolveItemColor(it);
                            return (
                                <button key={it.id} type="button" className="cal-bar is-start is-end" style={{ background: bg, color: fg }} onClick={() => onOpenItem(it)}>
                                    <span className="cal-bar-title">{it.title}</span>
                                </button>
                            );
                        })}
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
                            const { bg, fg } = resolveItemColor(it);
                            return (
                                <button
                                    key={it.id}
                                    type="button"
                                    className="cal-week-item"
                                    style={{ top, height, background: bg, color: fg }}
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
                                const { bg } = resolveItemColor(it);
                                const timeLabel = it.allDay ? 'All day' : it.startTime ? `${formatTime(it.startTime)}${it.endTime ? ` – ${formatTime(it.endTime)}` : ''}` : '';
                                return (
                                    <button key={it.id} type="button" className={`cal-schedule-item ${it.completed ? 'is-completed' : ''}`} onClick={() => onOpenItem(it)}>
                                        <span className="cal-item-row-dot" style={{ background: bg }} />
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
