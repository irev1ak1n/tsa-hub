// Event guidance wording — materials, cost, difficulty, and "best suited
// for" must read as plain, useful assessments, never as TSA Hub talking
// about its own classification system. Swept across every real event so a
// single bad template can't hide behind one or two spot-checked events.

import { describe, it, expect } from 'vitest';
import { loadRealData, events } from './setup.js';
import { materialsText, bestSuitedFor, answerEventIntent } from '../resolvers/events.js';

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
            if (!/^Best for students who enjoy /.test(text)) failures.push(`${event.id}: unexpected shape: "${text}"`);
            if (BROKEN.test(text)) failures.push(`${event.id}: broken interpolation: "${text}"`);
        }
        expect(failures, failures.join('\n')).toEqual([]);
    });
});
