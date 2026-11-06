// Consecutive-genuine-misunderstanding tracking and the Help Center offer.
// See engine.js's trackMisunderstanding() for the rules this tests.

import { describe, it, expect } from 'vitest';
import { loadRealData, askChain, ask } from './setup.js';

loadRealData();

// Reliable "the Coach truly has no idea" input: no event name, no domain
// signal word, no off-topic hint — just noise.
const GIBBERISH = 'zzqxx wobblefish glorpnation splee';

describe('help offer: exactly on the 3rd consecutive genuine misunderstanding', () => {
    it('1st unknown -> clarification, no help offer', () => {
        const [t1] = askChain([GIBBERISH]);
        expect(t1.helpOffer).toBeFalsy();
    });

    it('2nd consecutive unknown -> a different clarification', () => {
        const [t1, t2] = askChain([GIBBERISH, GIBBERISH]);
        expect(t2.helpOffer).toBeFalsy();
        expect(t2.text).not.toBe(t1.text); // 2nd attempt is context-aware, not a repeat
    });

    it('3rd consecutive unknown -> points to the Help Center, never to a support inbox', () => {
        const [, , t3] = askChain([GIBBERISH, GIBBERISH, GIBBERISH]);
        expect(t3.helpOffer).toBe(true);
        expect(t3.text).toMatch(/help center/i);
        expect(t3.text).not.toMatch(/support team|send your question/i);
        expect(t3.actions).toEqual([{ type: 'NAVIGATE', label: 'Open Help Center', route: '/help' }]);
        expect(t3.suggestions).toEqual(['Keep trying']);
    });

    it('a 4th consecutive unknown after the offer does NOT immediately re-offer (counter resets after offering)', () => {
        const [, , t3, t4] = askChain([GIBBERISH, GIBBERISH, GIBBERISH, GIBBERISH]);
        expect(t3.helpOffer).toBe(true);
        expect(t4.helpOffer).toBeFalsy();
    });
});

describe('the counter only counts CONSECUTIVE failures', () => {
    it('fail, fail, understood question, fail -> no support offer (reset by the understood turn)', () => {
        const turns = askChain([GIBBERISH, GIBBERISH, 'What is Animatronics?', GIBBERISH]);
        const last = turns[turns.length - 1];
        expect(last.helpOffer).toBeFalsy();
    });
});

describe('clarifications are NOT misunderstandings and must not advance the counter', () => {
    it('asking which state ("when are states") does not count as a failure', () => {
        const turns = askChain(['when are states', GIBBERISH, GIBBERISH]);
        // If "when are states" had counted as failure #1, the 2nd gibberish
        // here would be failure #3 and trigger the support offer early.
        const last = turns[turns.length - 1];
        expect(last.helpOffer).toBeFalsy();
    });

    it('asking MS or HS ("whats robotics challenge") does not count as a failure', () => {
        const turns = askChain(['whats robotics challenge', GIBBERISH, GIBBERISH]);
        const last = turns[turns.length - 1];
        expect(last.helpOffer).toBeFalsy();
    });

    it('a normal successfully-answered question resets an in-progress count', () => {
        const turns = askChain([GIBBERISH, GIBBERISH, 'When is nationals?', GIBBERISH, GIBBERISH]);
        const last = turns[turns.length - 1];
        // Two fresh fails after the reset is only failure #2, not #3.
        expect(last.helpOffer).toBeFalsy();
    });
});

describe('support requests no longer open a message flow', () => {
    for (const phrase of ['contact support', 'can i talk to someone', 'human please']) {
        it(`"${phrase}" explains there is no in-app support and points to real destinations`, () => {
            const res = ask(phrase);
            expect(res.text).toMatch(/can't pass messages along/i);
            expect(res.mailto).toBeUndefined();
            expect(res.text).not.toMatch(/tsastudentshub/);
            expect(res.actions.map((a) => a.route)).toEqual(['/help', '/resources/leadership-support']);
        });
    }

    it('clicking "Keep trying" after an offer continues normally and does not re-loop into another offer', () => {
        const turns = askChain([GIBBERISH, GIBBERISH, GIBBERISH, 'Keep trying']);
        const last = turns[turns.length - 1];
        expect(last.helpOffer).toBeFalsy();
    });
});

describe('"verified information unavailable" answers are not misunderstandings', () => {
    it('a real event with no team-size data on file does not advance the counter', () => {
        // Even if a resolver ever legitimately returns "missing" data for a
        // real, understood question, that must not count toward the offer.
        const turns = askChain(['im doing animatronics', GIBBERISH, GIBBERISH]);
        const last = turns[turns.length - 1];
        expect(last.helpOffer).toBeFalsy();
    });
});
