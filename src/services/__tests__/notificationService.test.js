// Test environment is Node (see vitest.config.js) — no `window`/`Notification`
// global, which exercises exactly the "unsupported" path a browser without
// Notification support (or the eventual native app, which won't use this
// web module at all) would hit. See notificationService.js's own
// LIMITATIONS comment for what these functions do and don't promise.
import { describe, it, expect } from 'vitest';
import {
    cancelEventReminder, getPermissionStatus, isScheduled, isSupported,
    rescheduleAll, requestPermission, scheduleEventReminder, updateEventReminder,
} from '../notificationService.js';

describe('notificationService: unsupported environment (no Notification API)', () => {
    it('reports unsupported rather than throwing', () => {
        expect(isSupported()).toBe(false);
        expect(getPermissionStatus()).toBe('unsupported');
    });

    it('requestPermission resolves to "unsupported" instead of throwing', async () => {
        expect(await requestPermission()).toBe('unsupported');
    });

    it('scheduleEventReminder is a safe no-op and reports it did not schedule anything', () => {
        const scheduled = scheduleEventReminder({ id: 'x', title: 'Test', body: '', fireAt: new Date(Date.now() + 60000) });
        expect(scheduled).toBe(false);
        expect(isScheduled('x')).toBe(false);
    });

    it('cancelEventReminder on an id that was never scheduled does not throw', () => {
        expect(() => cancelEventReminder('never-scheduled')).not.toThrow();
    });

    it('updateEventReminder is also a safe no-op', () => {
        expect(updateEventReminder({ id: 'y', title: 'Test', fireAt: new Date(Date.now() + 60000) })).toBe(false);
    });

    it('rescheduleAll does not throw over a batch of entries', () => {
        const entries = [
            { id: 'a', title: 'A', fireAt: new Date(Date.now() + 60000) },
            { id: 'b', title: 'B', fireAt: new Date(Date.now() - 60000) }, // already past
        ];
        expect(() => rescheduleAll(entries)).not.toThrow();
    });
});
