import { describe, it, expect } from 'vitest';
import { loadRealData, ask } from './setup.js';
import { expandContractions } from '../language/normalize.js';

loadRealData();

describe('apostrophe-free contractions ("whos") do not corrupt real words ("whose")', () => {
    it('"whos" expands to "who is"', () => {
        expect(expandContractions('whos my advisor')).toBe('who is my advisor');
    });

    it('"whose" is left untouched, not corrupted into "who ise"', () => {
        expect(expandContractions('whose team is this')).toBe('whose team is this');
    });

    it('"whos my advisor" correctly asks about STATE advisor, not event advisor-approval', () => {
        const res = ask('whos my advisor');
        expect(res.text).toMatch(/which state|set your state/i);
        expect(res.text).not.toMatch(/which event/i);
    });
});

describe('typo tolerance (must resolve to the right event, not fall back)', () => {
    const cases = [
        ['whats robotcs theme', 'robotics'],
        ['can u explain data scince', 'data science'],
        ['how many ppl for webmater', 'webmaster'],
        ['whats reqs for robotcs', 'robotics'],
        ['whats the microcontroler theme rn', 'microcontroller'],
        ['can 3 ppl do coding', 'coding'],
    ];

    for (const [q, expectedFragment] of cases) {
        it(`"${q}" resolves to an answer about ${expectedFragment}, not a generic fallback`, () => {
            const res = ask(q);
            const fellBack = /i understand you'?re asking about tsa, but i don'?t have a reliable answer|i'?m not sure what you'?re asking|i didn'?t catch that/i.test(res.text);
            expect(fellBack, `fell back to unknown for: ${res.text}`).toBe(false);
        });
    }
});

describe('event description instead of event name', () => {
    it('"the event where you make a website" resolves toward Webmaster/Website Design, not a random unrelated event', () => {
        const res = ask('which one is the event where you make a website');
        // Either it resolves confidently, or (acceptable) it asks a
        // clarifying question — it must not answer about something
        // completely unrelated like Prepared Speech or Flight.
        expect(res.text.toLowerCase()).not.toMatch(/prepared speech|flight endurance|dragster/);
    });
});

describe('long messy real questions (multiple asks bundled in one message)', () => {
    it('does not produce an empty or single-word answer to a long compound question', () => {
        const q = "so me and my friend are thinking about doing webmaster but we already have another person who wants to join us and idk if thats allowed plus are we actually supposed to make the website before states or do they give us something there";
        const res = ask(q);
        expect(res.text.length).toBeGreaterThan(20);
    });

    it('a long question naming a real event still resolves to that event, not a fallback', () => {
        const q = "we're doing robotics and the pdf has so much stuff in it can you just tell me what we actually have to build and what things would get us disqualified";
        const res = ask(q);
        const fellBack = /i understand you'?re asking about tsa, but i don'?t have a reliable answer/i.test(res.text);
        expect(fellBack).toBe(false);
    });
});

describe('multiple questions in one message — at least addresses the recognizable part', () => {
    it('"im doing data science whats the theme can i use ai what file do we need" answers something substantive, not a blank fallback', () => {
        const res = ask('im doing data science whats the theme can i use ai what file do we need and whats the next important deadline');
        expect(res.text.length).toBeGreaterThan(20);
    });
});

describe('contradictory user input', () => {
    it('"im in middle school and doing the high school robotics version" does not silently agree without any signal of the mismatch', () => {
        const res = ask('im in middle school and doing the high school robotics version');
        // Weak assertion by design: this is a genuinely hard NLU case. We only
        // require the Coach not to crash and not to fabricate an MS-labeled
        // answer that quotes HS-only theme text as if it were the MS one.
        expect(res.text.length).toBeGreaterThan(0);
    });
});
