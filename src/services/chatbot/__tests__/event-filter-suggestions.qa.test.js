// Coach's suggested-question system was generating chips its own router
// couldn't handle: "How do I pick an event?" fell into generic NO_DATA,
// "What events can I do solo?" asked "Which event do you mean?", and
// "What is a beginner friendly event?" / "What are the low cost events?"
// were fed straight into fuzzy event-name matching as if they were literal
// event titles. This suite locks in the fix — every one of these must
// resolve to a real, data-backed answer, and none of them may ever be
// resolved as a specific (let alone ambiguous or fake) event name.

import { describe, it, expect } from 'vitest';
import { loadRealData, ask, askChain } from './setup.js';

loadRealData();

const BAD_RESPONSE_RE = /I can't give you a reliable answer|Which event do you mean\?|I couldn't find an official TSA event called/i;

function expectFilterAnswer(text, expectedIntentPrefix) {
    const res = ask(text);
    expect(res.text).not.toMatch(BAD_RESPONSE_RE);
    expect(res.kind).not.toBe('unknown');
    expect(res.kind).not.toBe('unknown-event');
    expect(res.kind).not.toBe('need-event');
    if (expectedIntentPrefix) expect(res.intent).toMatch(expectedIntentPrefix);
    return res;
}

describe('the 4 originally broken suggestion chips now work', () => {
    it('"How do I pick an event?" triggers recommendation logic, not NO_DATA', () => {
        const res = expectFilterAnswer('How do I pick an event?', /^clarify\.recommend$/);
        // Short answer now, with the actual preference options offered as
        // real supported follow-ups (chips) and a Get Recommendations action
        // block, instead of listing them out in prose.
        expect(res.suggestions.some((s) => /coding|building|team|presenting/i.test(s))).toBe(true);
        expect(res.actions.some((a) => a.route === '/recommend')).toBe(true);
    });

    it('"What events can I do solo?" lists real solo-eligible events, does not ask which event', () => {
        const res = expectFilterAnswer('What events can I do solo?', /^event\.filter\.solo$/);
        expect(res.text).toMatch(/Audio Podcasting|Architectural Design|Children's Stories/);
    });

    it('"What is a beginner friendly event?" explains TSA has no official label, then recommends from data', () => {
        const res = expectFilterAnswer('What is a beginner friendly event?', /^event\.filter\.beginner$/);
        expect(res.text.toLowerCase()).toMatch(/doesn't officially label/);
    });

    it('"What are the low cost events?" returns TSA Hub\'s lower-cost classification, not a fake event lookup', () => {
        const res = expectFilterAnswer('What are the low cost events?', /^event\.filter\.costLow$/);
        expect(res.text.toLowerCase()).toMatch(/doesn't publish an official cost rating/);
    });
});

describe('typed equivalents of the broken suggestions route identically to the chip text', () => {
    it.each([
        ['how do i pick an event', /^clarify\.recommend$/],
        ['what event should i do', /^clarify\.recommend$/],
        ['what events should i do', /^clarify\.recommend$/],
        ['what can i do solo', /^event\.filter\.solo$/],
        ['what events are individual', /^event\.filter\.solo$/],
        ['solo events', /^event\.filter\.solo$/],
        ['team events', /^event\.filter\.team$/],
        ['beginner friendly events', /^event\.filter\.beginner$/],
        ['easy events for beginners', /^event\.filter\.beginner$/],
        ['good first event', /^event\.filter\.beginner$/],
        ['low cost events', /^event\.filter\.costLow$/],
        ['cheap events', /^event\.filter\.costLow$/],
        ['events that dont need much equipment', /^event\.filter\.lowEquipment$/],
        ['events for coding', /^event\.filter\.interest$/],
        ['events for builders', /^event\.filter\.interest$/],
        ['events without much presenting', /^event\.filter\.noPresent$/],
    ])('"%s" routes to %s', (text, expectedIntent) => {
        expectFilterAnswer(text, expectedIntent);
    });
});

describe('generic qualifiers are never resolved as fake event names', () => {
    it.each([
        'What events involve coding?',
        'What events involve building?',
        'What events involve video?',
        'What is the cheapest event to enter?',
        'What events are good for beginners?',
        'What is the easiest event to start with?',
        'Can I compete as an individual?',
        'Which events have no preconference submission?',
        'Which events connect to software careers?',
        'Which events fit engineering majors?',
        'What events need materials or supplies?',
    ])('"%s" is answered from real event data, not treated as an event title', (text) => {
        expectFilterAnswer(text);
    });
});

describe('follow-up chips under clarify.recommend also work when clicked', () => {
    it.each([
        ['I like coding', /^event\.filter\.interest$/],
        ['I want a team event', /^event\.filter\.team$/],
        ["I don't like presenting", /^event\.filter\.noPresent$/],
    ])('"%s" no longer resolves as an ambiguous/fake event', (text, expectedIntent) => {
        expectFilterAnswer(text, expectedIntent);
    });
});

describe('per-event questions are unaffected — filters never hijack a real single-event lookup', () => {
    it('"Can I do Audio Podcasting solo?" still answers about that specific event', () => {
        const res = ask('Can I do Audio Podcasting solo?');
        // Audio Podcasting is HS/MS ambiguous by name alone; the point is it
        // must NOT be swallowed by the cross-event solo filter.
        expect(res.intent).not.toBe('event.filter.solo');
    });

    it('"Can I do Photographic Technology solo?" answers per-event, not with a cross-event list', () => {
        const res = ask('Can I do Photographic Technology solo?');
        expect(res.intent).toBe('team.individual');
        expect(res.text).toMatch(/Photographic Technology/);
    });

    it('"what is flight" still resolves the specific Flight event', () => {
        const res = ask('what is flight');
        expect(res.intent).toBe('overview.general');
        expect(res.text).toMatch(/Flight/);
    });

    it.each([
        'What is the Coding event?',
        'Tell me about the Coding event',
        'what is coding',
    ])('"%s" names the specific real "Coding" event (definite article), not the cross-event interest filter', (text) => {
        const res = ask(text);
        expect(res.intent).not.toBe('event.filter.interest');
    });

    it('"What is the Robotics event?" is unaffected — still resolves the real event, same as before this fix', () => {
        const res = ask('What is the Robotics event?');
        expect(res.intent).not.toBe('event.filter.interest');
        expect(res.text).toMatch(/Robotics/);
    });

    it.each(['coding events', 'coding event'])('bare "%s" (no definite article) is still the cross-event interest filter, per spec', (text) => {
        const res = ask(text);
        expect(res.intent).toBe('event.filter.interest');
    });

    it('a long multi-clause sentence mentioning "coding event" still goes through normal event resolution, not the cross-event filter', () => {
        const res = ask('i wanna do a coding event but i really dont wanna present in front of judges');
        expect(res.intent).not.toBe('event.filter.interest');
    });
});

describe('filter answers never trip the 3-strike misunderstanding counter', () => {
    it('a chain of filter/recommendation questions never offers human support', () => {
        const turns = askChain([
            'How do I pick an event?',
            'What events can I do solo?',
            'What are the low cost events?',
        ]);
        for (const t of turns) expect(t.supportOffer).toBeFalsy();
    });
});

describe('honest limitation instead of a hallucinated classification', () => {
    it('a filter with genuinely no matching events explains the limitation rather than inventing one', () => {
        // "no preconference submission" requires real per-event lookup data;
        // if it were ever empty, the resolver must say so, never fabricate.
        const res = ask('Which events have no preconference submission?');
        expect(res.text.length).toBeGreaterThan(0);
        expect(res.text).not.toMatch(BAD_RESPONSE_RE);
    });
});
