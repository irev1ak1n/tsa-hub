import { useCallback, useEffect, useState } from 'react';
import { deletePersonalItem, genId, getAllPersonalItems, putPersonalItem } from '../services/personalCalendarDb.js';

// PERSONAL ITEM shape (stored in IndexedDB, never sent anywhere):
// {
//   id, type: 'event' | 'reminder', title,
//   startDate, endDate,           // "YYYY-MM-DD"
//   startTime, endTime,           // "HH:mm" or null
//   allDay,                       // boolean (events only; reminders are always point-in-time)
//   location, notes,
//   color,                        // optional swatch key
//   completed,                    // reminders only
//   createdAt, updatedAt,         // ISO timestamps
// }

export function usePersonalCalendar() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const reload = useCallback(async () => {
        try {
            const rows = await getAllPersonalItems();
            setItems(rows);
            setError(null);
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

    return { items, loading, error, createItem, updateItem, removeItem, toggleComplete, clearError: () => setError(null) };
}
