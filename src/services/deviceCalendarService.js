// ============================================================================
// DeviceCalendarService — the one place "add this to my calendar" goes
// through. UI code (ItemDetailsModal) never builds calendar file content or
// talks to a platform calendar API directly; it just calls addEvent(item).
//
// CURRENT WEB IMPLEMENTATION
// Generates a standard .ics (iCalendar, RFC 5545) file and hands it to the
// browser's normal download flow. The user's own calendar app (Apple
// Calendar, Google Calendar, Outlook, etc.) opens/imports it from there —
// TSA Hub never talks to those calendars directly, and doesn't need to.
//
// FUTURE NATIVE IMPLEMENTATION
// When TSA Hub becomes a mobile app, replace the body of addEvent (and the
// permission functions) with real platform calendar calls — e.g. Capacitor's
// community calendar plugin, Expo's `expo-calendar`, or direct iOS
// EventKit / Android CalendarContract access for a fully custom native
// shell. Which one applies is a decision for that migration, not this
// module — the point of this boundary is that Calendar screens never need
// to change when that decision is made. A native implementation would let
// the OS handle destination-calendar/account selection (Apple Calendar vs.
// Google vs. a work calendar) instead of producing a file at all.
//
// `item` here is the same normalized shape the Calendar screens already use
// (see src/utils/calendarItems.js): { title, startDate, endDate, allDay,
// startTime, endTime, location, description, sourceUrl }. Works for both
// official TSA events and personal items without any extra mapping.
// ============================================================================

import { parseYmd } from '../utils/date.js';

export function isSupported() {
    return typeof document !== 'undefined';
}

// No real permission model applies to a client-side file download — this
// exists so calling code has one consistent shape to check today and when a
// future native implementation genuinely does need to ask the OS for
// calendar access.
export async function checkPermission() {
    return { granted: isSupported() };
}

export async function requestPermission() {
    return checkPermission();
}

function pad(n) {
    return String(n).padStart(2, '0');
}

// "YYYYMMDD" for an all-day DTSTART/DTEND value.
function icsDate(date) {
    return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
}

// Floating local time, "YYYYMMDDTHHMMSS" — deliberately WITHOUT a trailing
// "Z"/UTC conversion or a VTIMEZONE block. TSA Hub never records which
// timezone an event's time was meant in (a 3:00 PM start just means "3:00 PM
// wherever you are"), so the only honest representation is the same
// floating wall-clock time shown in the app — the importing calendar app
// then displays it in whatever timezone that device is set to, exactly like
// TSA Hub itself does.
function icsDateTime(date, hhmm) {
    const [h, m] = (hhmm || '00:00').split(':').map(Number);
    return `${icsDate(date)}T${pad(h || 0)}${pad(m || 0)}00`;
}

function icsStamp() {
    const d = new Date();
    return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}

// RFC 5545 TEXT escaping — backslash, semicolon, comma, then newlines.
function escapeText(s) {
    return String(s || '')
        .replace(/\\/g, '\\\\')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,')
        .replace(/\r?\n/g, '\\n');
}

// RFC 5545 requires folding lines longer than 75 octets, continued lines
// starting with a single space.
function foldLine(line) {
    if (line.length <= 75) return line;
    const parts = [];
    let rest = line;
    while (rest.length > 75) {
        parts.push(rest.slice(0, 75));
        rest = ' ' + rest.slice(75);
    }
    parts.push(rest);
    return parts.join('\r\n');
}

function buildIcs(item) {
    const start = parseYmd(item.startDate);
    const end = parseYmd(item.endDate || item.startDate);
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//TSA Hub//Calendar//EN', 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT'];
    lines.push(`UID:${item.id || Math.random().toString(36).slice(2)}@tsahub`);
    lines.push(`DTSTAMP:${icsStamp()}`);

    if (item.allDay || !item.startTime) {
        // DTEND for an all-day event is EXCLUSIVE per RFC 5545 — a one-day
        // event must end the day after it starts, or calendar apps show it
        // as zero days long.
        const endExclusive = new Date(end.getFullYear(), end.getMonth(), end.getDate() + 1);
        lines.push(`DTSTART;VALUE=DATE:${icsDate(start)}`);
        lines.push(`DTEND;VALUE=DATE:${icsDate(endExclusive)}`);
    } else {
        lines.push(`DTSTART:${icsDateTime(start, item.startTime)}`);
        lines.push(`DTEND:${icsDateTime(end, item.endTime || item.startTime)}`);
    }

    lines.push(`SUMMARY:${escapeText(item.title)}`);
    if (item.location) lines.push(`LOCATION:${escapeText(item.location)}`);

    const descParts = [];
    if (item.description) descParts.push(item.description);
    if (item.sourceUrl) descParts.push(`Official source: ${item.sourceUrl}`);
    descParts.push('Added from TSA Hub.');
    lines.push(`DESCRIPTION:${escapeText(descParts.join('\n\n'))}`);

    lines.push('END:VEVENT', 'END:VCALENDAR');
    return lines.map(foldLine).join('\r\n');
}

function slugify(title) {
    return (title || 'event').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'event';
}

// Triggers the browser's normal file-download flow for the generated .ics —
// the same UX as any other "export/download" feature, no dialogs of our own.
function downloadIcs(filename, content) {
    const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

// Works for both official TSA events and personal items — see the shape
// note in the module comment above.
export async function addEvent(item) {
    if (!isSupported()) return { ok: false, reason: 'unsupported' };
    try {
        const ics = buildIcs(item);
        downloadIcs(`${slugify(item.title)}.ics`, ics);
        return { ok: true, method: 'ics-download' };
    } catch (err) {
        return { ok: false, reason: err?.message || 'Could not generate a calendar file.' };
    }
}
