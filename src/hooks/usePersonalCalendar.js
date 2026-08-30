import { useCallback, useEffect, useState } from 'react';
import { deletePersonalItem, genId, getAllPersonalItems, putPersonalItem } from '../services/personalCalendarDb.js';
import { cancelEventReminder, rescheduleAll, updateEventReminder } from '../services/notificationService.js';
import { computeReminderFireAt, normalizeReminder } from '../utils/reminders.js';

// PERSONAL ITEM shape (stored in IndexedDB, never sent anywhere):
// {
//   id, type: 'event' | 'reminder', title,
//   startDate, endDate,           // "YYYY-MM-DD"
//   startTime, endTime,           // "HH:mm" or null
//   allDay,                       // boolean (events only; reminders are always point-in-time)
//   location, notes,
//   color,                        // optional swatch key
//   completed,                    // reminders only
//   reminder: { enabled, minutesBefore },
//     // Notification PREFERENCE, stored independently of whatever
//     // technology ends up delivering it — see src/services/
//     // notificationService.js. minutesBefore is one of the values in
//     // src/utils/reminders.js's REMINDER_OPTIONS, or null when disabled.
//     // Never store a browser-specific notification/timer id here; that's
//     // ephemeral scheduling state, not part of the reminder's definition.
//   linkedOfficialEventId,        // set only for a reminder created against
//     // a read-only Official TSA Calendar event (src/data/tsaCalendar.js),
//     // so the UI can show "Reminder set" on that event and let the user
//     // remove it. Official event data itself is never modified.
//   createdAt, updatedAt,         // ISO timestamps
// }

// Schedules/cancels the item's notification to match its current reminder
// preference — called after every create/update/delete so the two never
// drift apart. Safe to call for an item with no reminder set.
function syncReminder(item) {
    const reminder = normalizeReminder(item.reminder);
    if (!reminder.enabled) {
        cancelEventReminder(item.id);
        return;
    }
    const fireAt = computeReminderFireAt(item, reminder.minutesBefore);
    if (!fireAt) {
        cancelEventReminder(item.id);
        return;
    }
    updateEventReminder({ id: item.id, title: item.title, body: 'Coming up on your TSA Hub calendar.', fireAt });
}

export function usePersonalCalendar() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const reload = useCallback(async () => {
        try {
            const rows = await getAllPersonalItems();
            setItems(rows);
            setError(null);
            // Re-arm every still-future reminder for this page life — any
            // timers from before a reload are gone (see notificationService
            // LIMITATIONS). Already-past reminders are left alone, not fired late.
            const armable = rows
                .map((it) => {
                    const reminder = normalizeReminder(it.reminder);
                    if (!reminder.enabled) return null;
                    const fireAt = computeReminderFireAt(it, reminder.minutesBefore);
                    return fireAt ? { id: it.id, title: it.title, body: 'Coming up on your TSA Hub calendar.', fireAt } : null;
                })
                .filter(Boolean);
            rescheduleAll(armable);
        } catch (err) {
            setError(err.message || 'Could not load your local calendar items.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        reload();
    }, [reload]);

    const createItem = useCallback(async (draft) => {
        const now = new Date().toISOString();
        const item = { ...draft, id: genId(), createdAt: now, updatedAt: now };
        try {
            await putPersonalItem(item);
            setItems((prev) => [...prev, item]);
            setError(null);
            syncReminder(item);
            return item;
        } catch (err) {
            setError(err.message || 'Could not save this item — it was not created.');
            throw err;
        }
    }, []);

    const updateItem = useCallback(async (id, patch) => {
        const updated = { ...patch, id, updatedAt: new Date().toISOString() };
        try {
            await putPersonalItem(updated);
            setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...updated } : it)));
            setError(null);
            syncReminder(updated);
            return updated;
        } catch (err) {
            setError(err.message || 'Could not save your changes.');
            throw err;
        }
    }, []);

    const removeItem = useCallback(async (id) => {
        try {
            await deletePersonalItem(id);
            setItems((prev) => prev.filter((it) => it.id !== id));
            setError(null);
            cancelEventReminder(id);
        } catch (err) {
            setError(err.message || 'Could not delete this item.');
            throw err;
        }
    }, []);

    const toggleComplete = useCallback(async (id) => {
        const current = items.find((it) => it.id === id);
        if (!current) return;
        await updateItem(id, { ...current, completed: !current.completed });
    }, [items, updateItem]);

    // Creates (or replaces) a personal reminder for a read-only Official TSA
    // Calendar event, without ever touching the official event's own data.
    const setOfficialReminder = useCallback(async (officialEvent, minutesBefore) => {
        const existing = items.find((it) => it.linkedOfficialEventId === officialEvent.id);
        const base = {
            type: 'reminder',
            title: officialEvent.title,
            startDate: officialEvent.startDate,
            endDate: officialEvent.startDate,
            startTime: '',
            allDay: false,
            location: officialEvent.location || '',
            notes: `Personal reminder for the official TSA event "${officialEvent.title}".`,
            completed: false,
            linkedOfficialEventId: officialEvent.id,
            reminder: { enabled: true, minutesBefore },
        };
        if (existing) return updateItem(existing.id, { ...existing, ...base });
        return createItem(base);
    }, [items, createItem, updateItem]);

    const removeOfficialReminder = useCallback(async (officialEventId) => {
        const existing = items.find((it) => it.linkedOfficialEventId === officialEventId);
        if (existing) await removeItem(existing.id);
    }, [items, removeItem]);

    return {
        items, loading, error,
        createItem, updateItem, removeItem, toggleComplete,
        setOfficialReminder, removeOfficialReminder,
        clearError: () => setError(null),
    };
}
