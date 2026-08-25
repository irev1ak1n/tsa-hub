import { useEffect, useMemo, useState } from 'react';
import { Icon } from '../components/UI.jsx';
import { CALENDAR_EVENTS } from '../data/tsaCalendar.js';
import { now, ymd, addDays, isSameMonth } from '../utils/date.js';
import { mergeCalendarItems, indexItemsByDate } from '../utils/calendarItems.js';
import { usePersonalCalendar } from '../hooks/usePersonalCalendar.js';
import { MonthView, YearView, WeekView, ScheduleView, buildScheduleDates } from './calendar/views.jsx';
import { DayPanel, ItemDetailsModal, ItemEditorModal } from './calendar/CalendarPanels.jsx';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const VIEWS = [
    { id: 'year', label: 'Year' },
    { id: 'month', label: 'Month' },
    { id: 'week', label: 'Week' },
    { id: 'schedule', label: 'Schedule' },
];
const VIEW_STORAGE_KEY = 'tsa-hub-calendar-view';

function loadDefaultView() {
    try {
        const saved = localStorage.getItem(VIEW_STORAGE_KEY);
        if (saved && VIEWS.some((v) => v.id === saved)) return saved;
    } catch { /* localStorage unavailable — fall through to default */ }
    return 'month';
}

export default function Calendar() {
    const today = useMemo(() => now(), []);
    const todayKey = ymd(today);

    const [viewMode, setViewMode] = useState(loadDefaultView);
    const [anchor, setAnchor] = useState(today); // current navigation reference date
    const [selectedDate, setSelectedDate] = useState(null); // day panel
    const [openItemId, setOpenItemId] = useState(null); // details modal
    const [editor, setEditor] = useState({ open: false, editingId: null, defaultDate: todayKey, defaultStartTime: '', defaultType: 'event' });

    const { items: personalItems, loading, error, createItem, updateItem, removeItem, toggleComplete, clearError } = usePersonalCalendar();

    useEffect(() => {
        try { localStorage.setItem(VIEW_STORAGE_KEY, viewMode); } catch { /* ignore */ }
    }, [viewMode]);

    const mergedItems = useMemo(() => mergeCalendarItems(CALENDAR_EVENTS, personalItems), [personalItems]);
    const itemsByDate = useMemo(() => indexItemsByDate(mergedItems), [mergedItems]);

    const openItem = openItemId ? mergedItems.find((i) => i.id === openItemId) || null : null;
    const editingRaw = editor.editingId ? personalItems.find((p) => p.id === editor.editingId) || null : null;
    const editingNormalized = editingRaw ? { ...editingRaw } : null;

    function goToday() {
        setAnchor(today);
        setSelectedDate(today);
    }

    function goPrev() {
        setAnchor((a) => {
            if (viewMode === 'year') return new Date(a.getFullYear() - 1, a.getMonth(), 1);
            if (viewMode === 'month') return new Date(a.getFullYear(), a.getMonth() - 1, 1);
            if (viewMode === 'week') return addDays(a, -7);
            return addDays(a, -30); // schedule: shift the visible window back
        });
    }
    function goNext() {
        setAnchor((a) => {
            if (viewMode === 'year') return new Date(a.getFullYear() + 1, a.getMonth(), 1);
            if (viewMode === 'month') return new Date(a.getFullYear(), a.getMonth() + 1, 1);
            if (viewMode === 'week') return addDays(a, 7);
            return addDays(a, 30);
        });
    }

    function openDayPanel(date) {
        setSelectedDate(date);
    }
    function openDetails(item) {
        setOpenItemId(item.id);
    }
    function closeDetails() {
        setOpenItemId(null);
    }

    function openCreate(defaultDate = selectedDate || today, defaultStartTime = '', defaultType = 'event') {
        setEditor({ open: true, editingId: null, defaultDate: ymd(defaultDate), defaultStartTime, defaultType });
    }
    function openEdit(item) {
        if (item.kind === 'official') return; // read-only
        closeDetails();
        setEditor({ open: true, editingId: item.raw.id, defaultDate: item.startDate, defaultStartTime: item.startTime || '', defaultType: item.raw.type });
    }
    function closeEditor() {
        setEditor((e) => ({ ...e, open: false, editingId: null }));
    }

    async function handleSave(draft) {
        if (editor.editingId) {
            await updateItem(editor.editingId, { ...editingRaw, ...draft });
        } else {
            await createItem(draft);
        }
        closeEditor();
    }

    async function handleDelete(item) {
        if (item.kind === 'official') return;
        await removeItem(item.raw.id);
        closeDetails();
    }

    async function handleToggleComplete(item) {
        if (item.kind !== 'personal-reminder') return;
        await toggleComplete(item.raw.id);
    }

    const headerLabel = viewMode === 'year'
        ? String(anchor.getFullYear())
        : viewMode === 'month'
            ? `${MONTHS[anchor.getMonth()]} ${anchor.getFullYear()}`
            : viewMode === 'week'
                ? `${MONTHS[anchor.getMonth()]} ${anchor.getFullYear()}`
                : 'Schedule';

    const scheduleDates = useMemo(() => buildScheduleDates(anchor, 14, 180), [anchor]);
    const selectedDayItems = selectedDate ? (itemsByDate[ymd(selectedDate)] || []) : [];
    const showHelperText = !loading && personalItems.length === 0 && viewMode === 'month';

    return (
        <div className={`cal-page ${viewMode === 'month' ? 'cal-page--fill' : ''} ${showHelperText ? 'cal-page--has-helper' : ''}`}>
            <div className="section">
                <div className="rs-eyebrow">Calendar</div>
                <h1 className="cal-h1">{headerLabel}</h1>
                <p className="muted small" style={{ margin: 0 }}>Official TSA dates and your personal schedule</p>
            </div>

            <div className="cal-view-switcher">
                {VIEWS.map((v) => (
                    <button
                        key={v.id}
                        type="button"
                        className={viewMode === v.id ? 'is-active' : ''}
                        onClick={() => setViewMode(v.id)}
                    >
                        {v.label}
                    </button>
                ))}
            </div>

            {viewMode === 'month' && (
                <div className="cal-nav cal-nav--compact">
                    <button type="button" className="cal-nav-btn" onClick={goPrev} aria-label="Previous month">
                        <span style={{ display: 'inline-flex', transform: 'rotate(180deg)' }}>
                            <Icon name="chevron-right" size={20} />
                        </span>
                    </button>
                    <button type="button" className="cal-nav-btn" onClick={goNext} aria-label="Next month">
                        <Icon name="chevron-right" size={20} />
                    </button>
                    <button type="button" className="cal-today-link" onClick={goToday}>Today</button>
                </div>
            )}
            {(viewMode === 'year' || viewMode === 'week') && (
                <div className="cal-nav">
                    <button type="button" className="cal-nav-btn" onClick={goPrev} aria-label="Previous">
                        <span style={{ display: 'inline-flex', transform: 'rotate(180deg)' }}>
                            <Icon name="chevron-right" size={20} />
                        </span>
                    </button>
                    <button type="button" className="cal-today-btn" onClick={goToday}>Today</button>
                    <button type="button" className="cal-nav-btn" onClick={goNext} aria-label="Next">
                        <Icon name="chevron-right" size={20} />
                    </button>
                </div>
            )}
            {viewMode === 'schedule' && (
                <div className="cal-nav">
                    <button type="button" className="cal-today-btn" onClick={goToday} style={{ flex: 'none', padding: '0 20px' }}>Today</button>
                </div>
            )}

            {error && (
                <div className="notice" style={{ marginBottom: 12 }}>
                    <span aria-hidden="true">⚠</span>
                    <span>{error}</span>
                    <button type="button" className="cal-add-inline" onClick={clearError} aria-label="Dismiss">×</button>
                </div>
            )}

            {viewMode === 'year' && (
                <YearView
                    year={anchor.getFullYear()}
                    today={today}
                    itemsByDate={itemsByDate}
                    onSelectMonth={(m) => { setAnchor(new Date(anchor.getFullYear(), m, 1)); setViewMode('month'); }}
                />
            )}

            {viewMode === 'month' && (
                <div className="cal-month-area">
                    <MonthView
                        year={anchor.getFullYear()}
                        month={anchor.getMonth()}
                        today={today}
                        selected={selectedDate && isSameMonth(selectedDate, anchor) ? selectedDate : null}
                        items={mergedItems}
                        itemsByDate={itemsByDate}
                        firstDay={0}
                        onSelectDay={openDayPanel}
                    />
                </div>
            )}

            {showHelperText && (
                <p className="cal-helper-text muted small">
                    You can add your own events and reminders by tapping any day or the + button. Everything you add stays saved on this device.
                </p>
            )}

            {viewMode === 'week' && (
                <WeekView
                    anchor={anchor}
                    today={today}
                    itemsByDate={itemsByDate}
                    firstDay={0}
                    onSelectDay={openDayPanel}
                    onCreateAt={(date, time) => openCreate(date, time, 'event')}
                    onOpenItem={openDetails}
                />
            )}

            {viewMode === 'schedule' && (
                <ScheduleView
                    dates={scheduleDates}
                    today={today}
                    itemsByDate={itemsByDate}
                    onOpenItem={openDetails}
                    onAddForDay={(d) => openCreate(d)}
                />
            )}

            <div className="cal-fab-anchor">
                <button type="button" className="cal-fab" onClick={() => openCreate()} aria-label="Add event or reminder">
                    <Icon name="plus" size={22} />
                </button>
            </div>

            <DayPanel
                date={selectedDate}
                items={selectedDayItems}
                onClose={() => setSelectedDate(null)}
                onOpenItem={openDetails}
                onAdd={() => openCreate(selectedDate)}
            />

            <ItemDetailsModal
                item={openItem}
                onClose={closeDetails}
                onEdit={openEdit}
                onDelete={handleDelete}
                onToggleComplete={handleToggleComplete}
            />

            <ItemEditorModal
                open={editor.open}
                editing={editingNormalized}
                defaultDate={editor.defaultDate}
                defaultStartTime={editor.defaultStartTime}
                defaultType={editor.defaultType}
                onSave={handleSave}
                onCancel={closeEditor}
            />
        </div>
    );
}
