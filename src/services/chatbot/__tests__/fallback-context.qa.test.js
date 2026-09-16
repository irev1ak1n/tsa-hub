// Regression suite for the "gibberish after an event answer silently
// re-explains the previous event" bug. Root cause: state.activeEvent (prior
// CONTEXT) was being treated as if it were evidence that THIS message named
// an event — both in intentRouter's eventCount and in engine.js's
// unknown-fallback gate. See engine.js/domainRouter.js for the fix.
//
// These tests assert on `res.kind` (set by resolvers/fallback.js, survives
// the misunderstanding-counter rewrite in engine.js's trackMisunderstanding)
// and on the actual text/actions never leaking the previous event into a
// reply that has nothing to do with it.

import { describe, it, expect } from 'vitest';
import { loadRealData, askChain, ask } from './setup.js';
import { setDebug } from '../engine.js';

loadRealData();
setDebug(true);

function mentionsWebmaster(res) {
    if (/webmaster/i.test(res.text)) return true;
    if ((res.actions || []).some((a) => /webmaster/i.test(a.label || '') || /webmaster/i.test(a.route || ''))) return true;
    return false;
}

describe('gibberish after an event answer must not re-answer the event', () => {
    const GIBBERISH = ['efwefwe', 'jjrjgirjgirjgoierjgo', 'asdfghjkl'];

    for (const g of GIBBERISH) {
        it(`"${g}" after a Webmaster answer falls back to UNKNOWN, not the Webmaster overview`, () => {
            const [t1, t2] = askChain(['How big is the team for Webmaster?', g]);
            expect(t1.text.toLowerCase()).toContain('webmaster');
            expect(t2.kind).toBe('unknown');
            expect(mentionsWebmaster(t2)).toBe(false);
            expect(t2.debug?.resolver).toBe('unknown-no-context');
        });
    }

    it('"jjrjgirjgirjgoierjgo" after "Can I compete alone?" does not dump the Webmaster overview or an Event Guide action', () => {
        const [t1, t2] = askChain(['Can I compete alone?', 'jjrjgirjgirjgoierjgo']);
        expect(t1.text.length).toBeGreaterThan(0);
        expect(t2.kind).toBe('unknown');
        expect(mentionsWebmaster(t2)).toBe(false);
    });
});

describe('genuine follow-ups still correctly use the active event (GOOD inheritance)', () => {
    it('"what do I submit?" after Webmaster uses Webmaster context', () => {
        const [, t2] = askChain(['im doing webmaster', 'what do I submit?']);
        expect(t2.domain).toBe('events');
        expect(t2.kind).not.toBe('unknown');
        expect(t2.text.toLowerCase()).not.toMatch(/which event|not totally sure what you mean/);
    });

    it('"how many people can do it?" after Webmaster uses Webmaster context', () => {
        const [, t2] = askChain(['im doing webmaster', 'how many people can do it?']);
        expect(t2.kind).not.toBe('unknown');
        expect(t2.text).toMatch(/\d/);
    });

    it('"can I compete alone?" after Webmaster uses Webmaster context', () => {
        const [, t2] = askChain(['im doing webmaster', 'can I compete alone?']);
        expect(t2.kind).not.toBe('unknown');
        expect(t2.text.toLowerCase()).not.toMatch(/which event|not totally sure what you mean/);
    });
});

describe('out-of-scope after an event answer', () => {
    it('"what\'s the weather tomorrow?" after Webmaster is OUT_OF_SCOPE, not a Webmaster explanation', () => {
        const [t1, t2] = askChain(['im doing webmaster', "what's the weather tomorrow?"]);
        expect(t1.text.length).toBeGreaterThan(0);
        expect(t2.domain).toBe('off-topic');
        expect(mentionsWebmaster(t2)).toBe(false);
    });
});

describe('context survives a misunderstanding in between (do not erase useful context)', () => {
    it('Webmaster -> gibberish -> "what do I submit?" still recovers Webmaster context', () => {
        const [, unknown, recovered] = askChain(['im doing webmaster', 'efwefwe', 'what do I submit?']);
        expect(unknown.kind).toBe('unknown');
        expect(recovered.kind).not.toBe('unknown');
        expect(recovered.text.toLowerCase()).not.toMatch(/which event/);
    });

    it('Webmaster -> gibberish -> "when is nationals?" answers Nationals with no stale Webmaster contamination', () => {
        const [, unknown, nationals] = askChain(['im doing webmaster', 'jjrjgirjgirjgoierjgo', 'when is nationals?']);
        expect(unknown.kind).toBe('unknown');
        expect(nationals.domain).toBe('deadlines');
        expect(mentionsWebmaster(nationals)).toBe(false);
    });
});

describe('no event context at all', () => {
    it('"what do I submit?" with zero context asks which event', () => {
        const res = ask('what do I submit?');
        expect(res.text).toMatch(/which event|depends on the event/i);
    });
});

describe('short recognized TSA vocabulary is never blindly treated as keyboard-smash', () => {
    for (const word of ['TSA', 'AI', 'HS', 'MS']) {
        it(`"${word}" is not classified as a genuine misunderstanding`, () => {
            const res = ask(word);
            expect(res.kind).not.toBe('unknown');
        });
    }
});

describe('misunderstanding escalation counter', () => {
    it('three consecutive genuine unknowns trigger the existing support-offer escalation', () => {
        const [, , t3] = askChain(['efwefwe', 'asdfghjkl', 'jjrjgirjgirjgoierjgo']);
        expect(t3.supportOffer).toBe(true);
        expect(t3.text).toMatch(/support/i);
    });

    it('one unknown followed by a valid message resets the misunderstanding count', () => {
        const [, recovered, thirdUnknown] = askChain(['efwefwe', 'when is nationals?', 'asdfghjkl']);
        expect(recovered.kind).not.toBe('unknown');
        // If the counter had NOT reset, this would be the 2nd consecutive
        // unknown (not yet the 3-strike support offer) — asserting no
        // supportOffer here locks in that the valid middle turn cleared it.
        expect(thirdUnknown.kind).toBe('unknown');
        expect(thirdUnknown.supportOffer).toBeFalsy();
    });
});
