// Resource-exhaustion regression tests: hostile input must stay cheap.
// Budgets are generous (CI machines vary) but would catch catastrophic
// backtracking, which takes seconds or never returns.

import { describe, it, expect } from 'vitest';
import { loadRealData, ask } from './setup.js';
import { searchHelp } from '../../../data/helpContent.js';
import { buildResourceIndex, searchResources } from '../../../screens/resources/resourceSearch.jsx';

loadRealData();

const N = 50000;
const HOSTILE = {
    repeated: 'a'.repeat(N),
    spaced: 'a '.repeat(N / 2),
    words: 'robotics '.repeat(N / 9),
    punctuation: '!?.,;:-_\'"'.repeat(N / 10),
    combining: '́'.repeat(N),
    emoji: '😀'.repeat(N / 2),
    nearMatch: 'how do i '.repeat(N / 9) + 'x',
    question: 'when is the deadline for the '.repeat(N / 29),
    slashes: '/'.repeat(N),
    nulls: '\u0000'.repeat(N),
};

function timed(fn) {
    const start = performance.now();
    fn();
    return performance.now() - start;
}

describe('Coach engine with hostile input', () => {
    for (const [name, text] of Object.entries(HOSTILE)) {
        it(`${name} (${text.length} chars) is answered quickly`, () => {
            let result;
            const ms = timed(() => { result = ask(text); });
            expect(ms).toBeLessThan(1500);
            expect(typeof result.text).toBe('string');
        });
    }

    it('truncates very long input instead of processing all of it', () => {
        const short = timed(() => ask('x'.repeat(400)));
        const huge = timed(() => ask('x'.repeat(2_000_000)));
        expect(huge).toBeLessThan(short * 20 + 300);
    });
});

describe('Search with hostile input', () => {
    const index = buildResourceIndex(null);

    for (const [name, text] of Object.entries(HOSTILE)) {
        it(`resource search, ${name}`, () => {
            expect(timed(() => searchResources(index, text))).toBeLessThan(1000);
        });
        it(`help search, ${name}`, () => {
            expect(timed(() => searchHelp(text))).toBeLessThan(500);
        });
    }
});
