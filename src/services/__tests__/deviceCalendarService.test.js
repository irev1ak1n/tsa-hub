// Test environment is Node (see vitest.config.js) — no `document`, which
// exercises the "unsupported" path. Full ICS generation and the actual
// browser download flow (Blob/createObjectURL/anchor click) were verified
// manually against the running app, since that needs a real DOM the Node
// test environment intentionally doesn't provide (no jsdom dependency in
// this project — see the module comment in deviceCalendarService.js for the
// native-migration boundary this exists behind).
import { describe, it, expect } from 'vitest';
import { addEvent, checkPermission, isSupported, requestPermission } from '../deviceCalendarService.js';

describe('deviceCalendarService: unsupported environment (no document)', () => {
    it('reports unsupported rather than throwing', () => {
        expect(isSupported()).toBe(false);
    });

    it('checkPermission/requestPermission resolve to not-granted instead of throwing', async () => {
        expect(await checkPermission()).toEqual({ granted: false });
        expect(await requestPermission()).toEqual({ granted: false });
    });

    it('addEvent fails gracefully with a reason instead of throwing', async () => {
        const result = await addEvent({ id: 'x', title: 'Test Event', startDate: '2026-09-01', allDay: true });
        expect(result).toEqual({ ok: false, reason: 'unsupported' });
    });
});
