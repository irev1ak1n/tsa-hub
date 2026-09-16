import { useMemo, useState } from 'react';
import { Icon } from './UI.jsx';
import { CALENDAR_EVENTS } from '../data/tsaCalendar.js';
import { now, ymd, monthMatrix, weekdayLabels, sameDay, isSameMonth, formatTime } from '../utils/date.js';
import { mergeCalendarItems, indexItemsByDate } from '../utils/calendarItems.js';
import { resolveItemColor } from '../utils/color.js';
import { usePersonalCalendar } from '../hooks/usePersonalCalendar.js';
import { ItemDetailsModal, ItemEditorModal } from '../screens/calendar/CalendarPanels.jsx';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTHS_SHORT = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

// One row of one item on the right-hand day list — icon marks event vs
// reminder, dot carries the same color the full Calendar page uses for it.
function DayItemRow({ item, onClick }) {
    const { bg } = resolveItemColor(item);
    const timeLabel = item.allDay ? 'All day' : item.startTime ? formatTime(item.startTime) : '';
    return (
        <button type="button" className="home-cal-item" onClick={onClick}>
            <span className="home-cal-item-icon" style={{ color: bg }}>
                <Icon name={item.kind === 'personal-reminder' ? 'bell' : 'cal'} size={14} />
            </span>
            <span className="home-cal-item-text">
                <span className="home-cal-item-title">{item.title}</span>
                {timeLabel && <span className="home-cal-item-time">{timeLabel}</span>}
            </span>
        </button>
    );
}

// Compact "what do you want to add" action sheet — the one place that
// decides which type ItemEditorModal opens with, so the actual add/edit
// form itself is never duplicated.
function AddChoiceSheet({ open, onClose, onChoose }) {
    if (!open) return null;
    return (
        <div className="rec-modal-backdrop" onClick={onClose}>
            <div className="rec-modal home-cal-choice-modal" onClick={(e) => e.stopPropagation()}>
                <div className="rec-modal-head">
                    <h3 className="rec-modal-title">Add to calendar</h3>
                    <button className="rec-modal-close" onClick={onClose} aria-label="Close">×</button>
                </div>
                <div className="rec-modal-body">
                    <button type="button" className="home-cal-choice-btn" onClick={() => onChoose('event')}>
                        <Icon name="cal" size={18} />
                        <span>Add Event</span>
                    </button>
                    <button type="button" className="home-cal-choice-btn" onClick={() => onChoose('reminder')}>
                        <Icon name="bell" size={18} />
                        <span>Add Reminder</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function HomeCalendarWidget() {
    const today = useMemo(() => now(), []);
    const [selectedDate, setSelectedDate] = useState(today);
    const [openItemId, setOpenItemId] = useState(null);
    const [addChoiceOpen, setAddChoiceOpen] = useState(false);
    const [editor, setEditor] = useState({ open: false, editingId: null, defaultType: 'event' });

    // Same shared IndexedDB-backed store the full Calendar page reads and
    // writes through — never a Home-only copy of this data. Each mount
    // reloads from that one source, so a change made here shows up on
    // Calendar (and vice versa) the moment either page is (re)opened.
    const { items: personalItems, createItem, updateItem, removeItem, toggleComplete, setOfficialReminder, removeOfficialReminder } = usePersonalCalendar();

    const mergedItems = useMemo(() => mergeCalendarItems(CALENDAR_EVENTS, personalItems), [personalItems]);
    const itemsByDate = useMemo(() => indexItemsByDate(mergedItems), [mergedItems]);

    const todayKey = ymd(today);
    const selectedKey = ymd(selectedDate);
    const grid = useMemo(() => monthMatrix(today.getFullYear(), today.getMonth(), 0), [today]);
    const weekday = weekdayLabels(0, ['S', 'M', 'T', 'W', 'T', 'F', 'S']);
    const selectedItems = itemsByDate[selectedKey] || [];

    const openItem = openItemId ? mergedItems.find((i) => i.id === openItemId) || null : null;
    const openItemOfficialReminder = openItem?.kind === 'official'
        ? personalItems.find((p) => p.linkedOfficialEventId === openItem.raw.id) || null
        : null;
    const editingRaw = editor.editingId ? personalItems.find((p) => p.id === editor.editingId) || null : null;

    function openCreate(type) {
        setAddChoiceOpen(false);
        setEditor({ open: true, editingId: null, defaultType: type });
    }
    function openEdit(item) {
        if (item.kind === 'official') return;
        setOpenItemId(null);
        setEditor({ open: true, editingId: item.raw.id, defaultType: item.raw.type });
    }
    function closeEditor() {
        setEditor((e) => ({ ...e, open: false, editingId: null }));
    }

    async function handleSave(draft) {
        if (editor.editingId) await updateItem(editor.editingId, { ...editingRaw, ...draft });
        else await createItem(draft);
        closeEditor();
    }
    async function handleDelete(item) {
        if (item.kind === 'official') return;
        await removeItem(item.raw.id);
        setOpenItemId(null);
    }
    async function handleToggleComplete(item) {
        if (item.kind !== 'personal-reminder') return;
        await toggleComplete(item.raw.id);
    }

    return (
        <div className="home-cal-widget">
            <div className="home-cal-body">
                <div className="home-cal-left">
                    <div className="home-cal-month-label">{MONTHS[today.getMonth()]} {today.getFullYear()}</div>
                    <div className="home-cal-weekdays">
                        {weekday.map((w, i) => <span key={`${w}-${i}`}>{w}</span>)}
                    </div>
                    <div className="home-cal-grid">
                        {grid.map((d) => {
                            const key = ymd(d);
                            const inMonth = isSameMonth(d, today);
                            const isToday = key === todayKey;
                            const isSelected = key === selectedKey;
                            const hasItems = (itemsByDate[key] || []).length > 0;
                            return (
                                <button
                                    key={key}
                                    type="button"
                                    className={[
                                        'home-cal-day',
                                        inMonth ? '' : 'is-outside',
                                        isToday ? 'is-today' : '',
                                        isSelected ? 'is-selected' : '',
                                    ].filter(Boolean).join(' ')}
                                    onClick={() => setSelectedDate(d)}
                                >
                                    {d.getDate()}
                                    {hasItems && <span className="home-cal-dot" />}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="home-cal-right">
                    <div className="home-cal-right-head">
                        <span className="home-cal-selected-date">
                            {MONTHS_SHORT[selectedDate.getMonth()]} {selectedDate.getDate()}
                        </span>
                        <button type="button" className="home-cal-add-btn" onClick={() => setAddChoiceOpen(true)} aria-label="Add event or reminder">
                            <Icon name="plus" size={16} />
                        </button>
                    </div>
                    <div className="home-cal-items-list">
                        {selectedItems.length === 0 ? (
                            <p className="home-cal-empty">No events or reminders for this day.</p>
                        ) : (
                            selectedItems.map((item) => (
                                <DayItemRow key={item.id} item={item} onClick={() => setOpenItemId(item.id)} />
                            ))
                        )}
                    </div>
                </div>
            </div>

            <AddChoiceSheet open={addChoiceOpen} onClose={() => setAddChoiceOpen(false)} onChoose={openCreate} />

            <ItemDetailsModal
                item={openItem}
                onClose={() => setOpenItemId(null)}
                onEdit={openEdit}
                onDelete={handleDelete}
                onToggleComplete={handleToggleComplete}
                officialReminder={openItemOfficialReminder}
                onSetOfficialReminder={setOfficialReminder}
                onRemoveOfficialReminder={removeOfficialReminder}
            />

            <ItemEditorModal
                open={editor.open}
                editing={editingRaw}
                defaultDate={selectedKey}
                defaultStartTime=""
                defaultType={editor.defaultType}
                onSave={handleSave}
                onCancel={closeEditor}
            />
        </div>
    );
}
