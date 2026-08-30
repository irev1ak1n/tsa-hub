// ============================================================================
// Portable reminder-preference helpers, shared by the Calendar editor UI and
// the notification-scheduling code. The reminder itself is stored as plain
// data ({ enabled, minutesBefore }) on a calendar item — see the PERSONAL
// ITEM shape docs in src/hooks/usePersonalCalendar.js — independent of
// whatever technology ends up delivering the notification (see
// src/services/notificationService.js for that boundary).
// ============================================================================

import { parseYmd } from './date.js';

// `minutesBefore: null` represents "no reminder" (kept out of the picker
// list itself — the UI renders that as an explicit toggle-off rather than
// one more option in the same dropdown).
export const REMINDER_OPTIONS = [
    { id: 'at-time', label: 'At event time', minutesBefore: 0 },
    { id: 'm5', label: '5 minutes before', minutesBefore: 5 },
    { id: 'm10', label: '10 minutes before', minutesBefore: 10 },
    { id: 'm15', label: '15 minutes before', minutesBefore: 15 },
    { id: 'm30', label: '30 minutes before', minutesBefore: 30 },
    { id: 'h1', label: '1 hour before', minutesBefore: 60 },
    { id: 'd1', label: '1 day before', minutesBefore: 60 * 24 },
    { id: 'w1', label: '1 week before', minutesBefore: 60 * 24 * 7 },
];

export function reminderLabel(minutesBefore) {
    return REMINDER_OPTIONS.find((o) => o.minutesBefore === minutesBefore)?.label || null;
}

export function defaultReminder() {
    return { enabled: false, minutesBefore: null };
}

export function normalizeReminder(reminder) {
    if (!reminder || typeof reminder.minutesBefore !== 'number') return defaultReminder();
    return { enabled: !!reminder.enabled, minutesBefore: reminder.minutesBefore };
}

// Anchor time for an all-day item, since "X minutes before" needs an actual
// clock time to count back from and an all-day item has none. 9:00 AM local
// is a reasonable, documented default — not an official TSA time.
const ALL_DAY_ANCHOR_HOUR = 9;

// Computes the actual local Date a reminder should fire at, for a calendar
// item shaped like { startDate, startTime, allDay } (works for both the
// normalized merged-item shape and a raw personal item). Returns null when
// there isn't enough information to schedule anything real.
export function computeReminderFireAt(item, minutesBefore) {
    if (typeof minutesBefore !== 'number') return null;
    const day = parseYmd(item.startDate);
    if (!day) return null;
    const anchor = new Date(day);
    if (item.allDay || !item.startTime) {
        anchor.setHours(ALL_DAY_ANCHOR_HOUR, 0, 0, 0);
    } else {
        const [h, m] = item.startTime.split(':').map(Number);
        anchor.setHours(h || 0, m || 0, 0, 0);
    }
    return new Date(anchor.getTime() - minutesBefore * 60 * 1000);
}
