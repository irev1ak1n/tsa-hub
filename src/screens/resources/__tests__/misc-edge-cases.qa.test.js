// Sections 41-43, 51-52, 67: empty/one-character/numeric input, state
// selector interaction, and dedupe.

import { describe, it, expect } from 'vitest';
import { search, indexFor } from './setup.js';

describe('empty and trivial input', () => {
    it('empty string returns no results (not "everything")', () => {
        expect(search('', 'Alabama')).toEqual([]);
    });

    it('whitespace-only returns no results', () => {
        expect(search('   ', 'Alabama')).toEqual([]);
    });

    it('single-character queries do not trigger absurd fuzzy matching', () => {
        for (const q of ['a', 't', 's']) {
            const results = search(q, 'Alabama');
            // Not asserting zero — a single real short word COULD legitimately
            // exist — but it must not be "most of the index".
            expect(results.length).toBeLessThan(indexFor('Alabama').length / 2);
        }
    });
});

describe('numeric search', () => {
    it('"2026" surfaces the 2026 conference guide', () => {
        const results = search('2026', 'Alabama');
        expect(results.some((r) => r.title.includes('2026'))).toBe(true);
    });

    it('"2027" surfaces the 2027 conference guide', () => {
        const results = search('2027', 'Alabama');
        expect(results.some((r) => r.title.includes('2027'))).toBe(true);
    });

    it('a far-future year with no content does not fabricate a resource', () => {
        const results = search('2031', 'Alabama');
        expect(results.some((r) => r.title.includes('2031'))).toBe(false);
    });
});

describe('state selector interaction', () => {
    it('no state selected: state-specific queries do not crash and do not guess a state', () => {
        const results = search('my state advisor', null);
        expect(Array.isArray(results)).toBe(true);
        // With nothing selected, the index has no state items at all —
        // nothing to wrongly guess.
        expect(results.some((r) => r.state)).toBe(false);
    });

    it('with a state selected, a bare "instagram" query still ranks that state\'s Instagram strongly', () => {
        const results = search('instagram', 'Alabama');
        expect(results[0]?.title).toBe('Official Alabama TSA Instagram');
    });

    it('with a state selected, "national instagram" still reaches the National Instagram, not hidden by the state context', () => {
        const results = search('national instagram', 'Alabama');
        expect(results.some((r) => r.title === 'Official TSA Instagram')).toBe(true);
    });
});

describe('official vs personal/local content', () => {
    it('Resources search never returns anything that looks like a personal calendar item', () => {
        const results = search('my events tomorrow', 'Alabama');
        expect(results.every((r) => !r.href?.includes('localhost'))).toBe(true);
    });
});
