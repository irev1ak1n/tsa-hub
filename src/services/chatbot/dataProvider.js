import { EVENTS } from '../../data/events.js';

// Single read point for event data. EVENTS is filled asynchronously from
// Supabase, so we never cache it at module load. Tests can inject a source.
let override = null;

export function setEventsSource(fn) {
    override = fn;
}

export function getEvents() {
    try {
        const list = override ? override() : EVENTS;
        return Array.isArray(list) ? list.filter(Boolean) : [];
    } catch {
        return [];
    }
}
