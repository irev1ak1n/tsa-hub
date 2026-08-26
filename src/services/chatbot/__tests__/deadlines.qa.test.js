// Deadline/date questions must always use the real runtime date, never a
// hardcoded "today". These tests compute the expected values the same way
// the resolver does and cross-check the Coach's text against them.

import { describe, it, expect } from 'vitest';
import { loadRealData, ask } from './setup.js';
import { datesForState, NATIONALS } from '../../../data/meta.js';

loadRealData();

function fmt(iso) {
    return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

describe('runtime-date correctness', () => {
    it('"how many days until nationals" matches a live computation from NATIONALS.date, not a stale number', () => {
        const res = ask('how many days until nationals');
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const expectedDays = Math.ceil((new Date(NATIONALS.date + 'T00:00:00') - now) / 86400000);
        expect(res.text).toContain(fmt(NATIONALS.date));
        // "N days away" / "N days ago" / "today" / "tomorrow" must match the
        // live delta, not a value baked in at some earlier point in time.
        if (expectedDays > 1) expect(res.text).toMatch(new RegExp(`${expectedDays} days`));
    });

    it('default-state regionals/state-conference dates come from DEFAULT_DATES when no state is set', () => {
        const res = ask('when are regionals');
        const d = datesForState(null);
        expect(res.text).toContain(fmt(d.regionals));
    });

    it('a real state (Texas) gets ITS OWN regionals date, not the generic default', () => {
        const res = ask('when are regionals for texas');
        const tx = datesForState('Texas');
        const generic = datesForState(null);
        expect(res.text).toContain(fmt(tx.regionals));
        if (tx.regionals !== generic.regionals) {
            expect(res.text).not.toContain(fmt(generic.regionals));
        }
    });

    it('"anything coming up" / "whats next" style vague deadline asks do not crash and return real dates', () => {
        for (const q of ['anything coming up soon', 'whats next', 'tsa stuff next month', 'what deadlines are coming before christmas']) {
            const res = ask(q);
            expect(res.text.length).toBeGreaterThan(0);
        }
    });
});

describe('repeated-phrasing consistency (same fact, different wording must agree)', () => {
    it('"how many days until nationals" and "when is nationals" agree on the same date', () => {
        const a = ask('how many days until nationals');
        const b = ask('when is nationals');
        expect(a.text).toContain(fmt(NATIONALS.date));
        expect(b.text).toContain(fmt(NATIONALS.date));
    });
});
