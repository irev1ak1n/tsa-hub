// ============================================================================
// Date utilities — single source of truth for "today" and date-only parsing.
//
// TSA calendar events are stored as plain "YYYY-MM-DD" calendar dates (see
// src/data/tsaCalendar.js), not timestamps. Parsing those with `new
// Date("YYYY-MM-DD")` interprets them as UTC midnight, which renders as the
// previous day in any timezone west of UTC — the classic off-by-one bug.
// Always go through parseYmd()/ymd() here instead of parsing date strings
// directly.
// ============================================================================

// The actual current moment. Accepts an optional override so callers (and
// tests) can pin "today" without touching production code paths, which
// always call this with no argument and get the real local clock.
export function now(override) {
    return override ? new Date(override) : new Date();
}

// "YYYY-MM-DD" (local calendar date, not UTC) for a Date object.
export function ymd(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

// Parse a "YYYY-MM-DD" calendar date into a local Date at local midnight —
// timezone-safe, unlike `new Date(str)`.
export function parseYmd(str) {
    if (!str) return null;
    const [y, m, d] = str.split('-').map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
}

export function sameDay(a, b) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

// Compare two "YYYY-MM-DD" strings as calendar dates (safe to use directly
// since ISO-formatted YYYY-MM-DD strings sort lexicographically).
export function ymdCompare(a, b) {
    return a < b ? -1 : a > b ? 1 : 0;
}

// TODAY | ONGOING | UPCOMING | PAST, derived fresh from the current date —
// never persist this, always compute it at render/use time.
export function eventStatus(startYmd, endYmd, todayYmd = ymd(now())) {
    const end = endYmd || startYmd;
    if (todayYmd < startYmd) return 'UPCOMING';
    if (todayYmd > end) return 'PAST';
    // todayYmd falls within [start, end]
    return startYmd === end ? 'TODAY' : 'ONGOING';
}

export function addDays(date, n) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() + n);
}

export function isSameMonth(a, b) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

// Start of the calendar week containing `date`. firstDay: 0 = Sunday, 1 = Monday.
export function startOfWeek(date, firstDay = 0) {
    const diff = (date.getDay() - firstDay + 7) % 7;
    return addDays(date, -diff);
}

// 42-cell (6-row) month grid, starting on `firstDay` (0 = Sunday, 1 = Monday).
export function monthMatrix(year, month, firstDay = 0) {
    const first = new Date(year, month, 1);
    const start = startOfWeek(first, firstDay);
    const cells = [];
    for (let i = 0; i < 42; i++) cells.push(addDays(start, i));
    return cells;
}

// Seven consecutive dates starting on the calendar week containing `date`.
export function weekDates(date, firstDay = 0) {
    const start = startOfWeek(date, firstDay);
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function weekdayLabels(firstDay = 0, labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']) {
    return Array.from({ length: 7 }, (_, i) => labels[(firstDay + i) % 7]);
}

// "HH:mm" (24h, as stored) -> "3:00 PM" for display. Returns '' for empty input.
export function formatTime(hhmm) {
    if (!hhmm) return '';
    const [h, m] = hhmm.split(':').map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return '';
    const period = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

// Minutes since midnight, for positioning timed items on a day timeline.
export function timeToMinutes(hhmm) {
    if (!hhmm) return null;
    const [h, m] = hhmm.split(':').map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return null;
    return h * 60 + m;
}
