import { useEffect, useState } from 'react';
import { Icon } from '../../components/UI.jsx';
import { formatTime, parseYmd, ymd } from '../../utils/date.js';
import { KIND_LABEL } from '../../utils/calendarItems.js';
import { DEFAULT_PERSONAL_COLOR, PRESET_EVENT_COLORS, resolveItemColor } from '../../utils/color.js';
import { REMINDER_OPTIONS, defaultReminder, normalizeReminder, reminderLabel } from '../../utils/reminders.js';
import { getPermissionStatus, isSupported as notificationsSupported, requestPermission } from '../../services/notificationService.js';
import { addEvent as addToDeviceCalendar } from '../../services/deviceCalendarService.js';

const WEEKDAYS_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function formatDateRange(item) {
    const start = parseYmd(item.startDate);
    const end = parseYmd(item.endDate || item.startDate);
    if (!start) return '';
    const startLabel = `${MONTHS[start.getMonth()]} ${start.getDate()}, ${start.getFullYear()}`;
    let label = startLabel;
    if (end && ymd(end) !== ymd(start)) {
        const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
        label += ` – ${sameMonth ? `${end.getDate()}, ${end.getFullYear()}` : `${MONTHS[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`}`;
    }
    if (!item.allDay && item.startTime) {
        label += ` · ${formatTime(item.startTime)}`;
        if (item.endTime) label += ` – ${formatTime(item.endTime)}`;
    } else if (item.allDay) {
        label += ' · All day';
    }
    return label;
}

// ── Day detail panel — same modal shell as the rest of the app ──────────
export function DayPanel({ date, items, onClose, onOpenItem, onAdd }) {
    if (!date) return null;
    const official = items.filter((i) => i.kind === 'official');
    const personal = items.filter((i) => i.kind === 'personal-event');
    const reminders = items.filter((i) => i.kind === 'personal-reminder');

    return (
        <div className="rec-modal-backdrop" onClick={onClose}>
            <div className="rec-modal" onClick={(e) => e.stopPropagation()}>
                <div className="rec-modal-head">
                    <div>
                        <div className="cal-panel-weekday">{WEEKDAYS_FULL[date.getDay()]}</div>
                        <h3 className="rec-modal-title">{MONTHS[date.getMonth()]} {date.getDate()}, {date.getFullYear()}</h3>
                    </div>
                    <button className="rec-modal-close" onClick={onClose} aria-label="Close">×</button>
                </div>

                <div className="rec-modal-body">
                    <button type="button" className="cal-add-btn" onClick={onAdd}>
                        <Icon name="plus" size={14} /> Add for this day
                    </button>

                    {items.length === 0 && (
                        <p className="cal-empty" style={{ marginTop: 14 }}>Nothing scheduled for this day.</p>
                    )}

                    {official.length > 0 && (
                        <div className="cal-panel-group">
                            <div className="cal-panel-group-title">Official TSA</div>
                            {official.map((it) => (
                                <ItemRow key={it.id} item={it} onClick={() => onOpenItem(it)} />
                            ))}
                        </div>
                    )}
                    {personal.length > 0 && (
                        <div className="cal-panel-group">
                            <div className="cal-panel-group-title">Personal</div>
                            {personal.map((it) => (
                                <ItemRow key={it.id} item={it} onClick={() => onOpenItem(it)} />
                            ))}
                        </div>
                    )}
                    {reminders.length > 0 && (
                        <div className="cal-panel-group">
                            <div className="cal-panel-group-title">Reminders</div>
                            {reminders.map((it) => (
                                <ItemRow key={it.id} item={it} onClick={() => onOpenItem(it)} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function ItemRow({ item, onClick }) {
    const { bg } = resolveItemColor(item);
    const timeLabel = item.allDay ? 'All day' : item.startTime ? `${formatTime(item.startTime)}${item.endTime ? ` – ${formatTime(item.endTime)}` : ''}` : '';
    return (
        <button type="button" className={`cal-item-row ${item.completed ? 'is-completed' : ''}`} onClick={onClick}>
            <span className="cal-item-row-dot" style={{ background: bg }} />
            <span className="cal-item-row-text">
                <span className="cal-item-row-title">{item.title}</span>
                {timeLabel && <span className="cal-item-row-time">{timeLabel}</span>}
            </span>
            {item.kind === 'personal-reminder' && item.completed && <Icon name="check" size={14} />}
        </button>
    );
}

// ── Item details (official read-only, or personal edit/delete/complete) ──
export function ItemDetailsModal({ item, onClose, onEdit, onDelete, onToggleComplete, officialReminder, onSetOfficialReminder, onRemoveOfficialReminder }) {
    const [confirmingDelete, setConfirmingDelete] = useState(false);
    const [addingToCalendar, setAddingToCalendar] = useState(false);
    const [calendarNote, setCalendarNote] = useState('');
    useEffect(() => { setConfirmingDelete(false); setCalendarNote(''); }, [item]);
    if (!item) return null;

    const editable = item.kind !== 'official';
    const { bg } = resolveItemColor(item);

    async function handleAddToDeviceCalendar() {
        setAddingToCalendar(true);
        const result = await addToDeviceCalendar(item);
        setAddingToCalendar(false);
        setCalendarNote(result.ok ? 'Calendar file downloaded — open it to add this to your calendar app.' : "Couldn't create a calendar file for this item.");
    }

    return (
        <div className="rec-modal-backdrop" onClick={onClose}>
            <div className="rec-modal" onClick={(e) => e.stopPropagation()}>
                <div className="rec-modal-head">
                    <h3 className="rec-modal-title">
                        <span className="cal-title-dot" style={{ background: bg }} />
                        {item.title}
                    </h3>
                    <button className="rec-modal-close" onClick={onClose} aria-label="Close">×</button>
                </div>
                <div className="rec-modal-body">
                    <div className="rec-modal-section" style={{ marginTop: 0 }}>
                        <div className="rec-fact">
                            <span className="rec-fact-label">Date</span>
                            <span className="rec-fact-value">{formatDateRange(item)}</span>
                        </div>
                        <div className="rec-fact">
                            <span className="rec-fact-label">Type</span>
                            <span className="rec-fact-value">{KIND_LABEL[item.kind]}{item.category ? ` · ${item.category}` : ''}</span>
                        </div>
                        {item.location && (
                            <div className="rec-fact">
                                <span className="rec-fact-label">Location</span>
                                <span className="rec-fact-value">{item.location}</span>
                            </div>
                        )}
                        {item.kind === 'personal-reminder' && (
                            <div className="rec-fact">
                                <span className="rec-fact-label">Status</span>
                                <span className="rec-fact-value">{item.completed ? 'Completed' : 'Not completed'}</span>
                            </div>
                        )}
                        {item.kind !== 'official' && item.reminder?.enabled && (
                            <div className="rec-fact">
                                <span className="rec-fact-label">Reminder</span>
                                <span className="rec-fact-value">{reminderLabel(item.reminder.minutesBefore) || 'On'}</span>
                            </div>
                        )}
                    </div>

                    {item.description && (
                        <div className="rec-modal-section">
                            <div className="rec-modal-section-title">{item.kind === 'official' ? 'Description' : 'Notes'}</div>
                            <p className="rec-modal-desc" style={{ margin: 0 }}>{item.description}</p>
                        </div>
                    )}

                    {item.kind === 'official' && item.sourceUrl && (
                        <div className="rec-modal-section">
                            <div className="rec-modal-section-title">Official Resources</div>
                            <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="eth-resource-row">
                                <span className="eth-resource-ico"><Icon name="external-link" size={14} /></span>
                                <span className="eth-resource-text">
                                    <span className="eth-resource-title">View on National TSA</span>
                                    <span className="eth-resource-label">National TSA</span>
                                </span>
                                <Icon name="external-link" size={14} />
                            </a>
                        </div>
                    )}

                    {item.kind === 'official' && (
                        <OfficialReminderControl
                            existing={officialReminder}
                            onSet={(minutesBefore) => onSetOfficialReminder(item.raw, minutesBefore)}
                            onRemove={() => onRemoveOfficialReminder(item.raw.id)}
                        />
                    )}

                    <div className="rec-modal-section">
                        <button type="button" className="btn ghost" onClick={handleAddToDeviceCalendar} disabled={addingToCalendar}>
                            <Icon name="download" size={15} /> Add to device calendar
                        </button>
                        {calendarNote && <p className="cal-inline-note">{calendarNote}</p>}
                    </div>

                    {editable && (
                        <div className="cal-modal-actions">
                            {item.kind === 'personal-reminder' && (
                                <button type="button" className="btn ghost" onClick={() => onToggleComplete(item)}>
                                    <Icon name="check" size={15} /> {item.completed ? 'Mark incomplete' : 'Mark complete'}
                                </button>
                            )}
                            <button type="button" className="btn ghost" onClick={() => onEdit(item)}>
                                <Icon name="edit" size={15} /> Edit
                            </button>
                            {!confirmingDelete ? (
                                <button type="button" className="btn ghost cal-danger" onClick={() => setConfirmingDelete(true)}>
                                    <Icon name="trash" size={15} /> Delete
                                </button>
                            ) : (
                                <span className="cal-confirm-delete">
                                    Delete this {item.kind === 'personal-reminder' ? 'reminder' : 'event'}?
                                    <button type="button" className="btn ghost" onClick={() => setConfirmingDelete(false)}>Cancel</button>
                                    <button type="button" className="btn ghost cal-danger" onClick={() => onDelete(item)}>Delete</button>
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// A personal reminder attached to a read-only Official TSA Calendar event.
// The official event itself is never modified — this only ever creates,
// updates, or removes the user's own linked personal-reminder item.
const OFFICIAL_REMINDER_OPTIONS = REMINDER_OPTIONS.filter((o) => ['m30', 'h1', 'd1', 'w1'].includes(o.id));

function OfficialReminderControl({ existing, onSet, onRemove }) {
    const [minutesBefore, setMinutesBefore] = useState(existing?.reminder?.minutesBefore ?? OFFICIAL_REMINDER_OPTIONS[0].minutesBefore);
    const [status, setStatus] = useState(getPermissionStatus());

    async function handleSet() {
        if (notificationsSupported() && status !== 'granted') {
            const result = await requestPermission();
            setStatus(result);
        }
        onSet(minutesBefore);
    }

    return (
        <div className="rec-modal-section">
            <div className="rec-modal-section-title">Personal reminder</div>
            {existing ? (
                <div className="cal-official-reminder">
                    <span>Reminder set — {reminderLabel(existing.reminder.minutesBefore) || 'on'}.</span>
                    <button type="button" className="btn ghost" onClick={onRemove}>Remove</button>
                </div>
            ) : (
                <div className="cal-official-reminder">
                    <select value={minutesBefore} onChange={(e) => setMinutesBefore(Number(e.target.value))} aria-label="Remind me">
                        {OFFICIAL_REMINDER_OPTIONS.map((o) => <option key={o.id} value={o.minutesBefore}>{o.label}</option>)}
                    </select>
                    <button type="button" className="btn ghost" onClick={handleSet}>Remind me</button>
                </div>
            )}
            {status === 'denied' && <p className="cal-inline-note">Notifications are blocked for this site, so this reminder is saved but won't be able to alert you here. Allow notifications in your browser's site settings to change that.</p>}
        </div>
    );
}

// ── Create / edit form ────────────────────────────────────────────────────
function addHour(hhmm) {
    const [h, m] = hhmm.split(':').map(Number);
    const total = (h * 60 + m + 60) % (24 * 60);
    return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

function blankDraft(type, defaultDate, defaultStartTime) {
    const hasStartTime = type === 'event' && !!defaultStartTime;
    return {
        type,
        title: '',
        allDay: type === 'reminder' ? false : !hasStartTime,
        startDate: defaultDate,
        endDate: defaultDate,
        startTime: defaultStartTime || '',
        endTime: hasStartTime ? addHour(defaultStartTime) : '',
        location: '',
        notes: '',
        completed: false,
        color: DEFAULT_PERSONAL_COLOR,
        reminder: defaultReminder(),
    };
}

function draftFromItem(raw) {
    return {
        type: raw.type,
        title: raw.title,
        allDay: raw.type === 'reminder' ? false : !!raw.allDay,
        startDate: raw.startDate,
        endDate: raw.endDate || raw.startDate,
        startTime: raw.startTime || '',
        reminder: normalizeReminder(raw.reminder),
        endTime: raw.endTime || '',
        location: raw.location || '',
        notes: raw.notes || '',
        completed: !!raw.completed,
        color: raw.color || DEFAULT_PERSONAL_COLOR,
    };
}

function ColorPicker({ value, onChange }) {
    return (
        <div className="cal-field">
            <span>Event color</span>
            <div className="cal-color-row">
                {PRESET_EVENT_COLORS.map((c) => (
                    <button
                        key={c.value}
                        type="button"
                        className={`cal-swatch ${value.toLowerCase() === c.value.toLowerCase() ? 'is-active' : ''}`}
                        style={{ background: c.value }}
                        onClick={() => onChange(c.value)}
                        aria-label={c.label}
                        title={c.label}
                    />
                ))}
                <label className="cal-swatch cal-swatch-custom" style={{ background: value }} title="Custom color">
                    <input type="color" value={value} onChange={(e) => onChange(e.target.value)} aria-label="Custom color" />
                </label>
            </div>
        </div>
    );
}

// Notification permission is requested only here — the moment the user
// actually turns a reminder on — never on app load or on opening this form.
function ReminderField({ reminder, onChange }) {
    const [status, setStatus] = useState(getPermissionStatus());
    const selectValue = reminder.enabled ? reminder.minutesBefore : 'none';

    async function handleChange(value) {
        if (value === 'none') {
            onChange({ enabled: false, minutesBefore: null });
            return;
        }
        const minutesBefore = Number(value);
        if (notificationsSupported() && status !== 'granted') {
            const result = await requestPermission();
            setStatus(result);
        }
        onChange({ enabled: true, minutesBefore });
    }

    return (
        <div className="cal-field">
            <label className="cal-field">
                <span>Reminder</span>
                <select value={selectValue} onChange={(e) => handleChange(e.target.value)}>
                    <option value="none">No reminder</option>
                    {REMINDER_OPTIONS.map((o) => <option key={o.id} value={o.minutesBefore}>{o.label}</option>)}
                </select>
            </label>
            {reminder.enabled && status === 'default' && notificationsSupported() && (
                <p className="cal-inline-note">Allow notifications so TSA Hub can remind you before your events.</p>
            )}
            {reminder.enabled && status === 'denied' && (
                <p className="cal-inline-note">Notifications are blocked for this site, so this reminder is saved but won't be able to alert you here. Allow notifications in your browser's site settings to change that.</p>
            )}
            {reminder.enabled && !notificationsSupported() && (
                <p className="cal-inline-note">This browser doesn't support notifications, so this reminder is saved but won't alert you here.</p>
            )}
            {reminder.enabled && status === 'granted' && (
                <p className="cal-inline-note">While TSA Hub is open in this tab, you'll get a notification at that time. This will work more reliably once TSA Hub is a mobile app.</p>
            )}
        </div>
    );
}

export function ItemEditorModal({ open, editing, defaultDate, defaultStartTime, defaultType, onSave, onCancel }) {
    const [draft, setDraft] = useState(() => (editing ? draftFromItem(editing) : blankDraft(defaultType || 'event', defaultDate, defaultStartTime)));
    const [err, setErr] = useState('');

    useEffect(() => {
        if (!open) return;
        setDraft(editing ? draftFromItem(editing) : blankDraft(defaultType || 'event', defaultDate, defaultStartTime));
        setErr('');
    }, [open, editing, defaultDate, defaultStartTime, defaultType]);

    if (!open) return null;

    function set(patch) {
        setDraft((d) => ({ ...d, ...patch }));
    }

    function validate() {
        if (!draft.title.trim()) return 'Give it a title.';
        if (!draft.startDate) return 'Pick a start date.';
        const end = draft.endDate || draft.startDate;
        if (end < draft.startDate) return 'End date can\'t be before the start date.';
        if (draft.type === 'event' && !draft.allDay) {
            if (!draft.startTime || !draft.endTime) return 'Set a start and end time, or switch to all day.';
            if (end === draft.startDate && draft.endTime <= draft.startTime) return 'End time must be after start time.';
        }
        return '';
    }

    function handleSave() {
        const problem = validate();
        if (problem) { setErr(problem); return; }
        const clean = { ...draft, title: draft.title.trim(), endDate: draft.endDate || draft.startDate };
        if (clean.type === 'reminder') {
            clean.allDay = !clean.startTime;
            clean.endDate = clean.startDate;
            clean.endTime = '';
            delete clean.color;
        }
        onSave(clean);
    }

    return (
        <div className="rec-modal-backdrop" onClick={onCancel}>
            <div className="rec-modal" onClick={(e) => e.stopPropagation()}>
                <div className="rec-modal-head">
                    <h3 className="rec-modal-title">{editing ? 'Edit' : 'New'} {draft.type === 'reminder' ? 'reminder' : 'event'}</h3>
                    <button className="rec-modal-close" onClick={onCancel} aria-label="Close">×</button>
                </div>
                <div className="rec-modal-body">
                    {!editing && (
                        <div className="cal-segmented">
                            <button type="button" className={draft.type === 'event' ? 'is-active' : ''} onClick={() => set({ type: 'event', allDay: true })}>Event</button>
                            <button type="button" className={draft.type === 'reminder' ? 'is-active' : ''} onClick={() => set({ type: 'reminder', allDay: false })}>Reminder</button>
                        </div>
                    )}

                    <label className="cal-field">
                        <span>Title</span>
                        <input
                            type="text"
                            value={draft.title}
                            onChange={(e) => set({ title: e.target.value })}
                            placeholder={draft.type === 'reminder' ? 'e.g. Finish presentation' : 'e.g. Team meeting'}
                            autoFocus
                        />
                    </label>

                    {draft.type === 'event' && (
                        <label className="cal-field cal-field-row">
                            <span>All day</span>
                            <input type="checkbox" checked={draft.allDay} onChange={(e) => set({ allDay: e.target.checked })} />
                        </label>
                    )}

                    <div className="cal-field-grid">
                        <label className="cal-field">
                            <span>Start date</span>
                            <input type="date" value={draft.startDate} onChange={(e) => set({ startDate: e.target.value, endDate: draft.endDate < e.target.value ? e.target.value : draft.endDate })} />
                        </label>
                        {draft.type === 'event' && (
                            <label className="cal-field">
                                <span>End date</span>
                                <input type="date" value={draft.endDate} min={draft.startDate} onChange={(e) => set({ endDate: e.target.value })} />
                            </label>
                        )}
                    </div>

                    {draft.type === 'event' && !draft.allDay && (
                        <div className="cal-field-grid">
                            <label className="cal-field">
                                <span>Start time</span>
                                <input type="time" value={draft.startTime} onChange={(e) => set({ startTime: e.target.value })} />
                            </label>
                            <label className="cal-field">
                                <span>End time</span>
                                <input type="time" value={draft.endTime} onChange={(e) => set({ endTime: e.target.value })} />
                            </label>
                        </div>
                    )}

                    {draft.type === 'reminder' && (
                        <label className="cal-field">
                            <span>Time (optional)</span>
                            <input type="time" value={draft.startTime} onChange={(e) => set({ startTime: e.target.value })} />
                        </label>
                    )}

                    <ReminderField
                        reminder={draft.reminder}
                        onChange={(reminder) => set({ reminder })}
                    />

                    {draft.type === 'event' && (
                        <label className="cal-field">
                            <span>Location (optional)</span>
                            <input type="text" value={draft.location} onChange={(e) => set({ location: e.target.value })} placeholder="e.g. Room 204" />
                        </label>
                    )}

                    <label className="cal-field">
                        <span>Notes (optional)</span>
                        <textarea rows={3} value={draft.notes} onChange={(e) => set({ notes: e.target.value })} />
                    </label>

                    {draft.type === 'event' && (
                        <ColorPicker value={draft.color} onChange={(color) => set({ color })} />
                    )}

                    {editing && draft.type === 'reminder' && (
                        <label className="cal-field cal-field-row">
                            <span>Completed</span>
                            <input type="checkbox" checked={draft.completed} onChange={(e) => set({ completed: e.target.checked })} />
                        </label>
                    )}

                    {err && <p className="cal-form-error">{err}</p>}

                    <div className="cal-modal-actions" style={{ marginTop: 6 }}>
                        <button type="button" className="btn ghost" onClick={onCancel}>Cancel</button>
                        <button type="button" className="btn primary" onClick={handleSave}>Save</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
