// Consecutive-genuine-misunderstanding tracking and the human-support offer.
// See engine.js's trackMisunderstanding() for the rules this tests.

import { describe, it, expect } from 'vitest';
import { loadRealData, askChain, ask } from './setup.js';

loadRealData();

// Reliable "the Coach truly has no idea" input: no event name, no domain
// signal word, no off-topic hint — just noise.
const GIBBERISH = 'zzqxx wobblefish glorpnation splee';

describe('support threshold: exactly on the 3rd consecutive genuine misunderstanding', () => {
    it('1st unknown -> clarification, no support offer', () => {
        const [t1] = askChain([GIBBERISH]);
        expect(t1.text).not.toMatch(/contact support|send your question/i);
        expect(t1.suggestions || []).not.toContain('Contact support');
    });

    it('2nd consecutive unknown -> a different, still-non-support clarification', () => {
        const [t1, t2] = askChain([GIBBERISH, GIBBERISH]);
        expect(t2.text).not.toMatch(/contact support|send your question/i);
        expect(t2.text).not.toBe(t1.text); // 2nd attempt is context-aware, not a repeat
    });

    it('3rd consecutive unknown -> support offer with both buttons', () => {
        const [, , t3] = askChain([GIBBERISH, GIBBERISH, GIBBERISH]);
        expect(t3.text).toMatch(/contact support|send your question/i);
        expect(t3.suggestions).toEqual(expect.arrayContaining(['Contact support', 'Keep trying']));
    });

    it('a 4th consecutive unknown after the offer does NOT immediately re-offer (counter resets after offering)', () => {
        const [, , t3, t4] = askChain([GIBBERISH, GIBBERISH, GIBBERISH, GIBBERISH]);
        expect(t3.suggestions).toContain('Contact support');
        expect(t4.text).not.toMatch(/contact support|send your question/i);
    });
});

describe('the counter only counts CONSECUTIVE failures', () => {
    it('fail, fail, understood question, fail -> no support offer (reset by the understood turn)', () => {
        const turns = askChain([GIBBERISH, GIBBERISH, 'What is Animatronics?', GIBBERISH]);
        const last = turns[turns.length - 1];
        expect(last.text).not.toMatch(/contact support|send your question/i);
    });
});

describe('clarifications are NOT misunderstandings and must not advance the counter', () => {
    it('asking which state ("when are states") does not count as a failure', () => {
        const turns = askChain(['when are states', GIBBERISH, GIBBERISH]);
        // If "when are states" had counted as failure #1, the 2nd gibberish
        // here would be failure #3 and trigger the support offer early.
        const last = turns[turns.length - 1];
        expect(last.text).not.toMatch(/contact support|send your question/i);
    });

    it('asking MS or HS ("whats robotics challenge") does not count as a failure', () => {
        const turns = askChain(['whats robotics challenge', GIBBERISH, GIBBERISH]);
        const last = turns[turns.length - 1];
        expect(last.text).not.toMatch(/contact support|send your question/i);
    });

    it('a normal successfully-answered question resets an in-progress count', () => {
        const turns = askChain([GIBBERISH, GIBBERISH, 'When is nationals?', GIBBERISH, GIBBERISH]);
        const last = turns[turns.length - 1];
        // Two fresh fails after the reset is only failure #2, not #3.
        expect(last.text).not.toMatch(/contact support|send your question/i);
    });
});

describe('explicit support request bypasses the counter entirely', () => {
    // Opens the guided TSA Hub Support flow immediately — never dumps
    // National TSA's contact info in response to a support request (that
    // would be the wrong identity; see contacts.js and capability.qa tests).
    it('"contact support" on the very first message opens the support flow immediately', () => {
        const res = ask('contact support');
        expect(res.text).toMatch(/help with/i);
        expect(res.text).not.toMatch(/general@tsaweb\.org|703-860-9000/);
    });

    it('"can i talk to someone" opens the support flow immediately', () => {
        const res = ask('can i talk to someone');
        expect(res.text).toMatch(/help with/i);
    });

    it('"human please" opens the support flow immediately', () => {
        const res = ask('human please');
        expect(res.text).toMatch(/help with/i);
    });

    it('clicking "Keep trying" after an offer continues normally and does not re-loop into another offer', () => {
        const turns = askChain([GIBBERISH, GIBBERISH, GIBBERISH, 'Keep trying']);
        const last = turns[turns.length - 1];
        expect(last.text).not.toMatch(/contact support|send your question/i);
    });

    it('clicking "Contact support" after an offer opens the TSA Hub Support draft (auto-filled from context), NOT National TSA contact info', () => {
        const turns = askChain([GIBBERISH, GIBBERISH, GIBBERISH, 'Contact support']);
        const last = turns[turns.length - 1];
        expect(last.text).toMatch(/tsa coach|prepare/i);
        expect(last.text).not.toMatch(/general@tsaweb\.org|703-860-9000/);
    });

    it('confirming the draft with "send" prepares a real TSA Hub support email — never claims delivery happened', () => {
        const turns = askChain([GIBBERISH, GIBBERISH, GIBBERISH, 'Contact support', 'send']);
        const last = turns[turns.length - 1];
        expect(last.text).toMatch(/tsastudentshub@gmail\.com/);
        expect(last.text).not.toMatch(/\bsent\b\.? tsa hub support received/i);
        expect(last.mailto).toContain('tsastudentshub@gmail.com');
    });

    it('a real question asked while a draft is pending is still answered normally (regression: the exact UI flow this session fixed)', () => {
        const turns = askChain([GIBBERISH, GIBBERISH, GIBBERISH, 'Contact support', 'can you text them']);
        const last = turns[turns.length - 1];
        expect(last.text).not.toMatch(/not totally sure what you mean/i);
        expect(last.text).toMatch(/text message/i);
    });
});

describe('"verified information unavailable" answers are not misunderstandings', () => {
    it('a real event with no team-size data on file does not advance the counter', () => {
        // Even if a resolver ever legitimately returns "missing" data for a
        // real, understood question, that must not count toward support.
        const turns = askChain(['im doing animatronics', GIBBERISH, GIBBERISH]);
        const last = turns[turns.length - 1];
        expect(last.text).not.toMatch(/contact support|send your question/i);
    });
});
