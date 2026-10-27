// Event guidance wording — materials, cost, difficulty, and "best suited
// for" must read as plain, useful assessments, never as TSA Hub talking
// about its own classification system. Swept across every real event so a
// single bad template can't hide behind one or two spot-checked events.

import { describe, it, expect } from 'vitest';
import { loadRealData, events } from './setup.js';
import { materialsText, bestSuitedFor, answerEventIntent, guidanceFor } from '../resolvers/events.js';
import { EVENT_GUIDANCE } from '../../../data/eventGuidance.js';

loadRealData();

const SELF_REFERENTIAL = /TSA Hub (classifies|flags|doesn'?t flag|'s (own )?(classification|assessment|estimate|read))|official TSA (rating|number|figure)|not an official TSA/i;
const BROKEN = /undefined|\[object Object\]/;

describe('materialsText never uses self-referential "TSA Hub classifies/flags" wording, across every event', () => {
    it('every event gets a real, non-boilerplate materials answer', () => {
        const failures = [];
        for (const event of events()) {
            const text = materialsText(event);
            if (typeof text !== 'string' || text.length <= 20) failures.push(`${event.id}: too short/missing: "${text}"`);
            if (SELF_REFERENTIAL.test(text)) failures.push(`${event.id}: self-referential wording: "${text}"`);
            if (BROKEN.test(text)) failures.push(`${event.id}: broken interpolation: "${text}"`);
        }
        expect(failures, failures.join('\n')).toEqual([]);
    });
});

describe('cost/difficulty/time answers never use self-referential disclaimer wording, across every event with data', () => {
    it('every event with cost/difficulty/time data gets wording free of the old disclaimers', () => {
        const failures = [];
        for (const event of events()) {
            for (const intent of ['cost.general', 'difficulty.general', 'time.general']) {
                const res = answerEventIntent(event, intent);
                if (!res || res.missing) continue;
                if (SELF_REFERENTIAL.test(res.text)) failures.push(`${event.id} ${intent}: self-referential wording: "${res.text}"`);
                if (BROKEN.test(res.text)) failures.push(`${event.id} ${intent}: broken interpolation: "${res.text}"`);
            }
        }
        expect(failures, failures.join('\n')).toEqual([]);
    });
});

describe('bestSuitedFor is grounded in real interest/skill data and never throws', () => {
    it('every event either has a well-formed best-suited-for sentence or none at all', () => {
        const failures = [];
        for (const event of events()) {
            const text = bestSuitedFor(event);
            if (text == null) continue; // fine — no interest data on file for this event
            if (!/^Best for students\b/.test(text)) failures.push(`${event.id}: unexpected shape: "${text}"`);
            if (BROKEN.test(text)) failures.push(`${event.id}: broken interpolation: "${text}"`);
        }
        expect(failures, failures.join('\n')).toEqual([]);
    });
});

const TOPICS = ['materials', 'difficulty', 'time', 'cost', 'bestFor'];
const sentenceCount = (text) => text.split(/(?<=[.!?])\s+(?=[A-Z])/).length;

describe('written event guidance covers every current event', () => {
    it('every non-archived event has all five sections', () => {
        const failures = [];
        for (const event of events().filter((e) => !e.archived)) {
            const entry = EVENT_GUIDANCE[event.id];
            if (!entry) { failures.push(`${event.id}: no guidance entry`); continue; }
            for (const topic of TOPICS) {
                if (typeof entry[topic] !== 'string' || !entry[topic].trim()) failures.push(`${event.id}.${topic}: missing`);
            }
        }
        expect(failures, failures.join('\n')).toEqual([]);
    });

    it('every entry belongs to a real event', () => {
        const ids = new Set(events().map((e) => e.id));
        expect(Object.keys(EVENT_GUIDANCE).filter((id) => !ids.has(id))).toEqual([]);
    });
});

describe('written event guidance follows the house style and stays specific', () => {
    it('has no dashes, colons, brand self-reference, broken text, or one-line answers', () => {
        const failures = [];
        for (const [id, entry] of Object.entries(EVENT_GUIDANCE)) {
            for (const topic of TOPICS) {
                const text = entry[topic];
                if (/[–—]/.test(text)) failures.push(`${id}.${topic}: dash`);
                if (/:/.test(text)) failures.push(`${id}.${topic}: colon`);
                if (SELF_REFERENTIAL.test(text) || /TSA Hub/i.test(text)) failures.push(`${id}.${topic}: self-referential`);
                if (BROKEN.test(text)) failures.push(`${id}.${topic}: broken text`);
                if (sentenceCount(text) < 2) failures.push(`${id}.${topic}: fewer than two sentences`);
            }
        }
        expect(failures, failures.join('\n')).toEqual([]);
    });

    it('does not reuse the same paragraph across events', () => {
        for (const topic of ['materials', 'difficulty', 'time', 'bestFor']) {
            const texts = Object.values(EVENT_GUIDANCE).map((entry) => entry[topic]);
            expect(new Set(texts).size, topic).toBe(texts.length);
        }
    });
});

describe('Coach and the event page read the same written guidance', () => {
    it('returns the written text for time, difficulty, cost, materials, and best suited for', () => {
        const event = events().find((e) => e.id === 'architectural-design');
        expect(answerEventIntent(event, 'time.general').text).toBe(guidanceFor(event, 'time'));
        expect(answerEventIntent(event, 'difficulty.general').text).toBe(guidanceFor(event, 'difficulty'));
        expect(answerEventIntent(event, 'cost.general').text).toBe(guidanceFor(event, 'cost'));
        expect(materialsText(event)).toBe(guidanceFor(event, 'materials'));
        expect(bestSuitedFor(event)).toBe(guidanceFor(event, 'bestFor'));
    });

    it('adds the cost category only when the note does not already say how expensive the event is', () => {
        const pricey = events().find((e) => e.id === 'animatronics');
        expect(guidanceFor(pricey, 'cost')).toMatch(/^Higher cost\. /);
        const cheap = events().find((e) => e.id === 'cad-architecture');
        expect(guidanceFor(cheap, 'cost')).toBe(EVENT_GUIDANCE['cad-architecture'].cost);
    });
});
