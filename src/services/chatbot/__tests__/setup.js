// Shared harness for the Coach QA suite. Loads the REAL event catalog from
// Supabase once (same data path the app uses — see src/data/events.js), then
// exposes a small helper API every *.qa.test.js file imports.
//
// Why real data instead of a fixture: this suite exists to catch the Coach
// disagreeing with TSA Hub's own data (wrong team size, stale season, wrong
// division), which a hand-written fixture can silently drift away from. The
// tradeoff is that results can shift if the event catalog changes — that's
// intentional; a test that starts failing because a real number changed is
// exactly the signal this suite is for.

import { beforeAll } from 'vitest';
import { fetchEvents } from '../../eventsService.js';
import { setEvents, EVENTS } from '../../../data/events.js';
import { answer, resetConversation } from '../engine.js';

let loaded = false;

export function loadRealData() {
    beforeAll(async () => {
        if (loaded) return;
        const rows = await fetchEvents();
        setEvents(rows);
        loaded = true;
    }, 20000);
}

// Ask a single question against a fresh conversation (no memory from a
// previous test leaks in).
export function ask(text) {
    resetConversation();
    return answer(text);
}

// Ask a sequence of messages against ONE shared conversation, returning every
// response in order. Use for multi-turn / follow-up tests.
export function askChain(messages) {
    resetConversation();
    return messages.map((m) => answer(m));
}

export function events() {
    return EVENTS;
}

export function findEvent(id) {
    return EVENTS.find((e) => e.id === id) || null;
}

export function findEventByName(name, division) {
    const n = name.toLowerCase();
    return EVENTS.find((e) => e.name.toLowerCase() === n && (!division || e.division === division)) || null;
}
