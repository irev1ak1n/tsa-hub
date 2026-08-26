// Sections 16-17: misspellings and abbreviations.

import { describe, it, expect } from 'vitest';
import { search, titleIn } from './setup.js';

const STATE = 'Alabama';

describe('typo tolerance', () => {
    const cases = [
        ['advsior', 'State Advisor'],
        ['advior', 'State Advisor'],
        ['adviser', 'State Advisor'],
        ['instgram', 'Official Alabama TSA Instagram'],
        ['intsagram', 'Official Alabama TSA Instagram'],
        ['facebok', 'Official Alabama TSA Facebook'],
        ['confrence', '2026 National Conference'],
        ['scholrship', 'Awards and Scholarships'],
        ['reqirements', 'Competition Requirements'],
        ['resorces', null], // "resources" itself isn't a resource title; just must not crash
        ['calender', null], // no calendar resource exists — must not crash or fabricate
    ];

    it('reasonable misspellings still find the right resource (or at least do not crash/fabricate)', () => {
        const failures = [];
        for (const [typo, expectedTitle] of cases) {
            const results = search(typo, STATE);
            expect(Array.isArray(results)).toBe(true);
            if (expectedTitle && !titleIn(results, expectedTitle)) {
                failures.push(`"${typo}" did not find "${expectedTitle}" — got: ${results.map((r) => r.title).join(', ') || '(none)'}`);
            }
        }
        expect(failures, failures.join('\n')).toEqual([]);
    });
});

describe('abbreviations', () => {
    it('"ig" finds Instagram, "fb" finds Facebook', () => {
        expect(titleIn(search('ig', STATE), 'Official Alabama TSA Instagram')).toBe(true);
        expect(titleIn(search('fb', STATE), 'Official Alabama TSA Facebook')).toBe(true);
    });

    it('state postal abbreviations resolve to the right state (word-boundary safe)', () => {
        expect(titleIn(search('AL tsa advisor', 'Alabama'), 'State Advisor')).toBe(true);
        expect(titleIn(search('TX tsa website', 'Texas'), 'Official Texas TSA Website')).toBe(true);
    });

    it('a 2-letter state abbreviation does not substring-match unrelated words containing those letters', () => {
        // "al" is a substring of "official" — must not turn every resource
        // with "official" in its title into a false match.
        const results = search('al', STATE);
        for (const r of results) {
            const inTitle = r.title.toLowerCase().split(/[^a-z]+/).includes('al');
            const isAlabama = r.state === 'Alabama';
            expect(inTitle || isAlabama, `"al" matched unrelated resource "${r.title}"`).toBe(true);
        }
    });
});
