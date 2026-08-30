// ============================================================================
// Merges the two calendar data sources — official National TSA events
// (src/data/tsaCalendar.js, read-only) and the user's local personal
// events/reminders (IndexedDB, via usePersonalCalendar) — into one common
// shape for rendering. The two sources are never combined in storage, only
// at presentation time here.
// ============================================================================

import { parseYmd, ymd, timeToMinutes } from './date.js';

// Normalized item:
// { id, kind: 'official' | 'personal-event' | 'personal-reminder',
//   title, startDate, endDate, allDay, startTime, endTime,
//   location, description, category, completed, sourceUrl, reminder, raw }

export function fromOfficial(ev) {
    return {
        id: `official:${ev.id}`,
        kind: 'official',
        title: ev.title,
        startDate: ev.startDate,
        endDate: ev.endDate || ev.startDate,
        allDay: ev.allDay !== false,
        startTime: null,
        endTime: null,
        location: ev.location || '',
        description: ev.description || '',
        category: ev.category,
        completed: false,
        sourceUrl: ev.source?.url || null,
        reminder: null,
        raw: ev,
    };
}

export function fromPersonal(item) {
    return {
        id: `personal:${item.id}`,
        kind: item.type === 'reminder' ? 'personal-reminder' : 'personal-event',
        title: item.title,
        startDate: item.startDate,
        endDate: item.endDate || item.startDate,
        allDay: item.type === 'reminder' ? !item.startTime : !!item.allDay,
        startTime: item.startTime || null,
        endTime: item.endTime || null,
        location: item.location || '',
        description: item.notes || '',
        category: null,
        completed: !!item.completed,
        sourceUrl: null,
        reminder: item.reminder || null,
        raw: item,
    };
}

export function mergeCalendarItems(officialEvents, personalItems) {
    return [...officialEvents.map(fromOfficial), ...personalItems.map(fromPersonal)];
}

// Stable, deterministic ordering for items within the same day: all-day /
// multi-day items first, then timed items chronologically, ties broken by id.
export function sortDayItems(items) {
    return [...items].sort((a, b) => {
        const aMin = a.allDay ? -1 : (timeToMinutes(a.startTime) ?? 0);
        const bMin = b.allDay ? -1 : (timeToMinutes(b.startTime) ?? 0);
        if (aMin !== bMin) return aMin - bMin;
        return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
    });
}

// Groups items by every "YYYY-MM-DD" they occupy — a multi-day item appears
// under each date in its span.
export function indexItemsByDate(items) {
    const map = {};
    for (const item of items) {
        const start = parseYmd(item.startDate);
        const end = parseYmd(item.endDate || item.startDate);
        if (!start || !end) continue;
        let cursor = start;
        let guard = 0;
        while (cursor <= end && guard < 400) {
            const key = ymd(cursor);
            (map[key] ||= []).push(item);
            cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 1);
            guard++;
        }
    }
    for (const key of Object.keys(map)) map[key] = sortDayItems(map[key]);
    return map;
}

export const KIND_LABEL = {
    official: 'Official TSA',
    'personal-event': 'Personal',
    'personal-reminder': 'Reminder',
};
