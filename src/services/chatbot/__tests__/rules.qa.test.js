import { describe, it, expect } from 'vitest';
import { loadRealData, ask } from './setup.js';

loadRealData();

describe('AI policy — grounded, never a blanket ban or blanket allow', () => {
    const prompts = [
        'Can we use AI on our project?',
        'are we allowed to use chatgpt for this',
        'if i use chatgpt to help write code is that gonna get us disqualified',
        'someone told me chatgpt is completely banned at tsa',
    ];
    for (const q of prompts) {
        it(`"${q}" does not claim AI is unconditionally banned or unconditionally allowed`, () => {
            const res = ask(q);
            expect(res.text).not.toMatch(/ai (tools )?are (completely |totally )?banned/i);
            expect(res.text).not.toMatch(/yes,? you can use any ai tool with no restrictions/i);
        });
    }
});

describe('dress code — no invented specifics beyond the loaded rule text', () => {
    const prompts = [
        'what do i wear for nationals',
        'do i actually need a blazer for nationals',
        'can i just wear a button up shirt and nice pants or do i need the full tsa uniform',
        'are sneakers allowed at states',
        'do girls have to wear a skirt or can they wear pants',
    ];
    for (const q of prompts) {
        it(`"${q}" does not invent a specific garment requirement not in the loaded rule (blazer/skirt/sneakers/tie)`, () => {
            const res = ask(q);
            // The loaded dress-code rule text (data/rules.js) never mentions
            // any of these specific garments — if the Coach's answer asserts
            // one as required, that is fabricated, not sourced.
            expect(res.text).not.toMatch(/you (must|need to|have to) wear a blazer/i);
            expect(res.text).not.toMatch(/girls must wear a skirt/i);
            expect(res.text).not.toMatch(/sneakers are (not )?allowed\b.{0,10}(official tsa rule|per the rule)/i);
        });
    }
});

describe('source requests — surfaces a real citation, not a fabricated one', () => {
    it('"can u show me where tsa actually says that" after a rule answer does not invent a URL', () => {
        const first = ask('Can we use AI on our project?');
        const res = ask('can u show me where tsa actually says that');
        for (const text of [first.text, res.text]) {
            expect(text).not.toMatch(/https?:\/\/(example\.com|placeholder|source-link)/i);
        }
    });
});
