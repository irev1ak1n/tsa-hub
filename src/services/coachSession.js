// ============================================================================
// Temporary (5-minute) Coach conversation memory. Not permanent chat
// history and not an account/backend — a plain localStorage blob, same
// convention as src/context/AppContext.jsx and Calendar.jsx's view
// preference: try/catch-wrapped, silently falls back to "nothing saved" on
// any failure (private browsing, quota, corrupt JSON).
//
// The grace period is anchored to the MOST RECENT departure: every save
// stamps a fresh `leftAt`, so leaving Coach again always restarts the
// 5-minute window from that latest moment, with no separate reset logic
// needed.
// ============================================================================

const KEY = 'tsa-hub-coach-session-v1';
const GRACE_MS = 5 * 60 * 1000;

export function saveCoachSession(payload) {
    try {
        localStorage.setItem(KEY, JSON.stringify({ ...payload, leftAt: Date.now() }));
    } catch {
        // localStorage unavailable — nothing to persist, safe to ignore.
    }
}

// Returns the saved session if it exists and hasn't expired, else null. An
// expired session is removed as a side effect so it never lingers.
export function loadCoachSession() {
    try {
        const raw = localStorage.getItem(KEY);
        if (!raw) return null;
        const saved = JSON.parse(raw);
        if (typeof saved.leftAt !== 'number' || Date.now() - saved.leftAt > GRACE_MS) {
            localStorage.removeItem(KEY);
            return null;
        }
        return saved;
    } catch {
        return null;
    }
}

export function clearCoachSession() {
    try {
        localStorage.removeItem(KEY);
    } catch {
        // ignore
    }
}
