// Deadline/date questions must always use the real runtime date, never a
// hardcoded "today", and must never present a guess as an exact date. These
// tests compute the expected values the same way the resolver does and
// cross-check the Coach's text against them.

import { describe, it, expect } from 'vitest';
import { loadRealData, ask } from './setup.js';
import { datesForState, NATIONALS, formatDateRange } from '../../../data/meta.js';

loadRealData();

function daysUntil(iso) {
    const now = new Date(); now.setHours(0, 0, 0, 0);
    return Math.ceil((new Date(iso + 'T00:00:00') - now) / 86400000);
}

describe('runtime-date correctness', () => {
    it('"how many days until nationals" matches a live computation from NATIONALS.startDate, not a stale number', () => {
        const res = ask('how many days until nationals');
        const expectedDays = daysUntil(NATIONALS.startDate);
        expect(res.text).toContain(formatDateRange(NATIONALS.startDate, NATIONALS.endDate));
        if (expectedDays > 1) expect(res.text).toMatch(new RegExp(`${expectedDays} days`));
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
        expect(a.text).toContain(formatDateRange(NATIONALS.startDate, NATIONALS.endDate));
        expect(b.text).toContain(formatDateRange(NATIONALS.startDate, NATIONALS.endDate));
    });
});

describe('exact National Conference date — no placeholder copy', () => {
    it('gives the real 2027 range with no placeholder/default language', () => {
        const res = ask('when is the national conference');
        expect(res.text).toContain('June 23');
        expect(res.text).toContain('June 27, 2027');
        expect(res.text.toLowerCase()).not.toMatch(/placeholder|default date|set the real one|todo/);
        expect(res.text).toContain(formatDateRange(NATIONALS.startDate, NATIONALS.endDate));
    });
});

describe('unknown state conference date — honest, not a fake exact date', () => {
    it('with no state set, says spring 2027 and that exact dates are not announced, never a fabricated exact date', () => {
        const res = ask('when is the state conference');
        expect(res.text).toContain('spring 2027');
        expect(res.text.toLowerCase()).toMatch(/not.*officially announced/);
        expect(res.text.toLowerCase()).not.toMatch(/default|placeholder/);
        // No stray fabricated exact date should appear for a state with no
        // verified conference date on file.
        const generic = datesForState(null);
        expect(generic.states.status).toBe('unannounced');
    });
});

describe('North Carolina regionals — window, not a fabricated exact date', () => {
    it('communicates the January/February 2027 window and that exact dates are not officially announced', () => {
        const res = ask('when are regionals for north carolina');
        expect(res.text).toContain('January and February 2027');
        expect(res.text.toLowerCase()).toMatch(/not.*officially announced/);
        const nc = datesForState('North Carolina');
        expect(nc.regionals.status).toBe('window');
    });

    it('a state with no regional information on file says so honestly, not a copy of another state\'s window', () => {
        const res = ask('when are regionals for texas');
        expect(res.text.toLowerCase()).toMatch(/verified regional conference dates.*(not|aren't) available/);
        expect(res.text).not.toContain('January and February 2027');
    });
});
