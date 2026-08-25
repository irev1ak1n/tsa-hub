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
