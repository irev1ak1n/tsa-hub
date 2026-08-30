// Pure-module tests for the 5-minute Coach session memory
// (src/services/coachSession.js). The repo's vitest environment is 'node',
// so there's no real localStorage — a minimal in-memory stub is installed
// before each test, matching the same interface (getItem/setItem/removeItem).

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { saveCoachSession, loadCoachSession, clearCoachSession } from '../coachSession.js';

function makeMemoryStorage() {
    let store = new Map();
    return {
        getItem: (k) => (store.has(k) ? store.get(k) : null),
        setItem: (k, v) => { store.set(k, String(v)); },
        removeItem: (k) => { store.delete(k); },
        clear: () => { store.clear(); },
    };
}

beforeEach(() => {
    globalThis.localStorage = makeMemoryStorage();
});

afterEach(() => {
    vi.useRealTimers();
    delete globalThis.localStorage;
});

describe('coachSession: save/load round trip', () => {
    it('saves then loads the full payload within the grace window', () => {
        saveCoachSession({ messages: [{ role: 'user', text: 'hi' }], guidedFlow: { stepId: 'home', context: {}, history: [] }, shownEventIds: ['webmaster'] });
        const loaded = loadCoachSession();
        expect(loaded).toBeTruthy();
        expect(loaded.messages).toEqual([{ role: 'user', text: 'hi' }]);
        expect(loaded.guidedFlow).toEqual({ stepId: 'home', context: {}, history: [] });
        expect(loaded.shownEventIds).toEqual(['webmaster']);
        expect(typeof loaded.leftAt).toBe('number');
    });

    it('returns null when nothing has been saved', () => {
        expect(loadCoachSession()).toBeNull();
    });

    it('clearCoachSession removes a saved session', () => {
        saveCoachSession({ messages: [] });
        clearCoachSession();
        expect(loadCoachSession()).toBeNull();
    });
});

describe('coachSession: timer reset on each departure', () => {
    it('leave at 2:00, return at 2:03 (within 5 min) -> still valid; leave again at 2:04, return at 2:08 (4 min since the SECOND leave) -> still valid', () => {
        const base = new Date('2026-01-01T14:00:00Z').getTime(); // 2:00
        vi.useFakeTimers();
        vi.setSystemTime(base);
        saveCoachSession({ messages: ['first'] }); // leave at 2:00

        vi.setSystemTime(base + 3 * 60 * 1000); // return at 2:03
        expect(loadCoachSession()).toBeTruthy();

        vi.setSystemTime(base + 4 * 60 * 1000); // leave again at 2:04 — resets the window
        saveCoachSession({ messages: ['second'] });

        vi.setSystemTime(base + 8 * 60 * 1000); // return at 2:08 — 4 min since the 2:04 leave
        const loaded = loadCoachSession();
        expect(loaded).toBeTruthy();
        expect(loaded.messages).toEqual(['second']);
    });
});

describe('coachSession: expiration', () => {
    it('a session not returned to within 5 minutes of the most recent departure is cleared', () => {
        const base = new Date('2026-01-01T14:10:00Z').getTime(); // leave at 2:10
        vi.useFakeTimers();
        vi.setSystemTime(base);
        saveCoachSession({ messages: ['stale'] });

        vi.setSystemTime(base + 6 * 60 * 1000); // return at 2:16 — 6 minutes later
        expect(loadCoachSession()).toBeNull();

        // The expired entry must actually be removed, not just reported null.
        expect(globalThis.localStorage.getItem('tsa-hub-coach-session-v1')).toBeNull();
    });
});
