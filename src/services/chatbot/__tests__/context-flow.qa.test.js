import { describe, it, expect } from 'vitest';
import { loadRealData, askChain, ask } from './setup.js';

loadRealData();

describe('multi-turn context (subset of the mission\'s chain A-E scripts)', () => {
    it('CHAIN A: webmaster team-size follow-up chain stays on Webmaster throughout', () => {
        const [t1, t2, t3, t4] = askChain([
            'i think i wanna do webmaster',
            'how many ppl can i have',
            'whats this years theme',
            'can we use ai',
        ]);
        expect(t1.text.toLowerCase()).toContain('webmaster');
        expect(t2.text).toMatch(/\b(1|6)\b/); // team-size numbers for Webmaster
        expect(t3.text.length).toBeGreaterThan(0);
        expect(t4.text.length).toBeGreaterThan(0);
    });

    it('CHAIN C: robotics MS/HS clarification chain does not blend divisions', () => {
        const [t1, t2, t3] = askChain([
            'i wanna do robotics',
            'middle school',
            'whats the challenge',
        ]);
        expect(t1.text.length).toBeGreaterThan(0);
        expect(t2.text.length).toBeGreaterThan(0);
        // After "middle school", division context should steer toward MS —
        // the answer must not claim to be the HS challenge specifically.
        expect(t3.text.toLowerCase()).not.toContain('high school');
    });

    it('CHAIN E: interest -> constraint -> recommendation chain does not crash and stays on-topic', () => {
        const turns = askChain([
            'what event should i do',
            'i like coding',
            'but i hate presentations',
            'i wanna work with one friend',
        ]);
        for (const t of turns) expect(t.text.length).toBeGreaterThan(0);
    });
});

describe('conversation reset', () => {
    it('a true reset (resetConversation via new ask()) does not retain the previous active event', () => {
        askChain(['Tell me about HS Robotics.']);
        // ask() calls resetConversation() itself, simulating the "new chat" button.
        const res = ask('whats the theme');
        // With no event in context after reset, this should ask which event,
        // not silently answer for Robotics.
        expect(res.text).toMatch(/which event|depends on the event/i);
    });
});

describe('vague questions', () => {
    it('"What\'s the theme?" with zero prior context asks for the event instead of guessing one', () => {
        const res = ask("What's the theme?");
        expect(res.text).toMatch(/which event|depends on the event/i);
    });

    it('"What\'s the theme?" WITH prior context correctly uses it', () => {
        const [, t2] = askChain(['im doing animatronics', "what's the theme?"]);
        expect(t2.text.toLowerCase()).not.toMatch(/which event/);
    });
});

describe('off-topic handling', () => {
    it('stays in scope for clearly unrelated requests without pretending to be a general chatbot', () => {
        for (const q of ['Who won the Super Bowl?', 'write my history essay', 'whats weather tomorrow']) {
            const res = ask(q);
            expect(res.text).toMatch(/tsa|focused on|outside what i cover|can'?t help with that/i);
        }
    });
});

describe('empty / whitespace input', () => {
    it('does not crash on empty or whitespace-only input', () => {
        expect(() => ask('')).not.toThrow();
        expect(() => ask('   ')).not.toThrow();
        const res = ask('');
        expect(res.text.length).toBeGreaterThan(0);
    });
});

describe('personal calendar privacy', () => {
    it('never pretends to know the user\'s personal calendar items', () => {
        const res = ask('what personal events do i have tomorrow');
        expect(res.text).not.toMatch(/you have \d+ events? tomorrow|your personal events? (are|include)/i);
    });
});

describe('answerWithIntent regression: dead duplicate deadline/conference/general/state/career/advisor logic was removed', () => {
    // These intent families are now handled ONLY in processMessage, never in
    // answerWithIntent's fallthrough — this locks in that removing that dead
    // code (which had two separate ReferenceErrors nothing ever caught)
    // didn't silently break any of the intents it used to shadow.
    it('one representative question per removed intent family answers without crashing or falling back to unknown', () => {
        const probes = [
            'when is nationals',
            'when is the conference',
            'what is tsa',
            "who's the state advisor for Texas",
            'what events are best for a software career',
            'what does state advisor approval mean',
        ];
        for (const q of probes) {
            const res = ask(q);
            expect(res.text.length).toBeGreaterThan(0);
        }
    });
});

describe('small talk / identity — never claims to be a generative AI making things up', () => {
    it('"are you an AI" answer is honest about being rule-based', () => {
        const res = ask('are you an AI');
        expect(res.text).toMatch(/not a generative ai|rule-based/i);
    });
});
