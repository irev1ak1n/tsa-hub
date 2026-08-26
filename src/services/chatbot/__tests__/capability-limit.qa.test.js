// CAPABILITY_LIMIT intent: "can you text them" is UNDERSTOOD, not unknown.
// It must never increment misunderstandingCount, never claim SMS/call/DM/
// email was actually sent, and must never confuse TSA Hub Support with
// National TSA's real contact info.

import { describe, it, expect } from 'vitest';
import { loadRealData, ask, askChain } from './setup.js';
import { NATIONAL_TSA, TSA_HUB_SUPPORT_EMAIL } from '../../../data/contacts.js';

loadRealData();

function neverClaims(text) {
    expect(text).not.toMatch(/i (texted|called|phoned|messaged|emailed|dm'?d) (them|him|her|it)/i);
    expect(text).not.toMatch(/^(done|sent)[,.!]? i (texted|called|emailed)/i);
}

describe('capability-limit intent recognition (must never be UNKNOWN)', () => {
    const prompts = [
        'can you text them',
        'can u text them',
        'text tsa for me',
        'text national tsa for me',
        'can you call them',
        'can you call general tsa',
        'phone them for me',
        'can you phone them',
        'can you dm them',
        'dm alabama tsa',
        'send them a facebook message',
        'send them an instagram dm',
        'message tsa',
        'contact them for me',
        'can u reach out to them',
        'can you talk to them',
        'can you contact my advisor',
        'email them for me',
        'email my advisor',
        'email national tsa',
        'email tsa hub',
        'can you open gmail and email them',
        'can you send it automatically',
        'contact somebody for me',
        'make the phone call',
    ];

    it('every capability-limit prompt is understood, not classified as unknown', () => {
        const failures = [];
        for (const q of prompts) {
            const res = ask(q);
            const isUnknownText = /not totally sure what you mean|missing part of what you're asking|didn'?t catch that|i understand you'?re asking about tsa, but/i.test(res.text);
            if (isUnknownText) failures.push(`"${q}" was treated as unknown — got: ${res.text}`);
        }
        expect(failures, failures.join('\n')).toEqual([]);
    });

    it('every capability-limit response says what the Coach can\'t do, in natural (non-repetitive) language', () => {
        const failures = [];
        const seen = new Set();
        for (const q of prompts) {
            const res = ask(q);
            if (!/not able to|can'?t|not something i can/i.test(res.text)) {
                failures.push(`"${q}" doesn't explain the capability limit — got: ${res.text}`);
            }
            seen.add(res.text);
        }
        expect(failures, failures.join('\n')).toEqual([]);
        // Not literally identical wording every single time.
        expect(seen.size).toBeGreaterThan(1);
    });

    it('none of these ever claim the action was actually performed', () => {
        for (const q of prompts) neverClaims(ask(q).text);
    });
});

describe('capability-limit requests do NOT increment misunderstandingCount', () => {
    it('three capability requests in a row never trigger the support offer', () => {
        const turns = askChain(['can you text them', 'can you call them', 'can you email them']);
        for (const t of turns) expect(t.text).not.toMatch(/contact support|send your question/i);
    });

    it('a capability request between two genuine unknowns resets the counter (no premature escalation)', () => {
        const turns = askChain(['zzqxx wobblefish', 'can you text them', 'zzqxx wobblefish']);
        const last = turns[turns.length - 1];
        expect(last.text).not.toMatch(/contact support|send your question/i);
    });
});

describe('UNKNOWN vs CAPABILITY_LIMIT vs FACTUAL — explicit regression cases from the mission spec', () => {
    it('"can you text tsa for me" -> capability limit, not unknown', () => {
        const res = ask('can you text tsa for me');
        expect(res.text).not.toMatch(/not totally sure what you mean/i);
        expect(res.text).toMatch(/text message/i);
    });

    it('"can you call national tsa" -> capability limit, not unknown', () => {
        const res = ask('can you call national tsa');
        expect(res.text).not.toMatch(/not totally sure what you mean/i);
        expect(res.text).toMatch(/phone call|call/i);
    });

    it('"what is national tsa phone number" -> factual answer, NOT a capability-limit response', () => {
        const res = ask('what is national tsa phone number');
        expect(res.text).toContain(NATIONAL_TSA.phone);
        expect(res.text).not.toMatch(/not able to|can'?t (make|place) (phone )?calls/i);
    });

    it('"asdfghjkl" -> genuinely unknown', () => {
        const res = ask('asdfghjkl');
        expect(res.text).toMatch(/not totally sure what you mean/i);
    });
});

describe('SMS-specific honesty (section 15)', () => {
    it('"can you text them" never claims National TSA supports texting at their number', () => {
        const res = ask('can you text them');
        expect(res.text).not.toMatch(/yes,? (you can |)text (them|that number)/i);
        expect(res.text).toMatch(/phone contact|not a text/i);
    });
});

describe('contact identity separation — TSA Hub Support vs National TSA', () => {
    it('National TSA factual info uses the real, verified contact data, never mislabeled as TSA Hub Support', () => {
        const res = ask('national tsa contact');
        expect(res.text).toContain(NATIONAL_TSA.email);
        expect(res.text).toContain(NATIONAL_TSA.phone);
        expect(res.text).toContain(NATIONAL_TSA.tollFree);
        expect(res.text).not.toMatch(/tsa hub support/i);
    });

    it('TSA Hub Support never uses general@tsaweb.org (that is National TSA\'s address)', () => {
        const res = ask('contact support');
        expect(res.text).not.toContain('general@tsaweb.org');
    });

    it('capability-limit responses offer both destinations as distinct choices', () => {
        const res = ask('can you email them');
        expect(res.suggestions).toEqual(expect.arrayContaining(['Contact TSA Hub Support', 'National TSA Contact']));
    });
});

describe('TSA Hub Support submission requires explicit confirmation (never auto-sends)', () => {
    it('starting the flow does not send anything by itself', () => {
        const res = ask('contact support');
        expect(res.mailto).toBeUndefined();
    });

    it('a drafted message is not sent until the user types "send"', () => {
        const turns = askChain(['contact support', 'the calendar page is broken']);
        const last = turns[turns.length - 1];
        expect(last.mailto).toBeUndefined();
        expect(last.text).toMatch(/type "send" to confirm/i);
    });

    it('typing "send" produces a real mailto: draft addressed to TSA Hub support, and the response is honest that nothing is confirmed sent yet', () => {
        const turns = askChain(['contact support', 'the calendar page is broken', 'send']);
        const last = turns[turns.length - 1];
        expect(last.mailto).toContain(`mailto:${TSA_HUB_SUPPORT_EMAIL}`);
        expect(last.text).not.toMatch(/tsa hub support received your message/i);
    });

    it('typing "cancel" aborts the draft without sending', () => {
        const turns = askChain(['contact support', 'the calendar page is broken', 'cancel']);
        const last = turns[turns.length - 1];
        expect(last.mailto).toBeUndefined();
        expect(last.text).not.toMatch(/prepared an email/i);
    });
});

describe('confirm-step fall-through does not swallow a real question that merely starts with "yes"', () => {
    it('"yes but also when are nationals" is NOT treated as a bare confirm — it falls through and answers the real question, leaving the draft pending', () => {
        const turns = askChain(['contact support', 'the calendar page is broken', 'yes but also when are nationals']);
        const last = turns[turns.length - 1];
        expect(last.mailto).toBeUndefined(); // draft not sent by this turn
        expect(last.text).toMatch(/\d{4}/); // answered the real nationals question
    });

    it('a bare "yes" alone still confirms and sends the draft', () => {
        const turns = askChain(['contact support', 'the calendar page is broken', 'yes']);
        const last = turns[turns.length - 1];
        expect(last.mailto).toContain('tsastudentshub@gmail.com');
    });
});

describe('product-support vs National TSA routing (section 29)', () => {
    it('an app bug report routes to the TSA Hub support flow, not National TSA', () => {
        const res = ask('the search page crashes');
        // Either it opens the support flow directly, or at minimum does not
        // hand over National TSA's contact info for an app bug.
        expect(res.text).not.toContain(NATIONAL_TSA.email);
    });

    it('"i need to contact national tsa" surfaces National TSA\'s real info, not TSA Hub\'s', () => {
        const res = ask('i need to contact national tsa');
        expect(res.text).toContain(NATIONAL_TSA.email);
    });
});
