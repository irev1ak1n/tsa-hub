// Pure unit tests against the guided-flow registry (src/services/chatbot/flows/coachFlows.js).
// No React involved — this module is framework-free by design, so it's
// tested the same way the engine's resolvers are: drive the exported
// functions directly with fixture data and assert on the resulting shape.

import { describe, it, expect } from 'vitest';
import {
    renderStep,
    createGuidedFlow,
    applyStep,
    applyBack,
    applyReset,
    applySelect,
    matchFreeText,
} from '../flows/coachFlows.js';
import { teamSizeLabel } from '../../../data/events.js';
import { answerEventFilter } from '../resolvers/eventFilters.js';

const WEBMASTER = {
    id: 'webmaster', division: 'HS', name: 'Webmaster', category: 'Digital Media',
    eligibility: { text: 'Team of two to four (2-4)', teamSize: '2-4', individualOk: false },
    theme: 'A fictional theme for testing', costBand: '75-150', difficulty: 'challenging',
    materials: 'yes', careers: { 'web-dev': 3 }, projectType: ['code', 'design'],
};
const CODING = {
    id: 'coding', division: 'HS', name: 'Coding', category: 'Computing & Coding',
    eligibility: { teamSize: '1', individualOk: true }, theme: null, costBand: '0-25', difficulty: 'beginner',
    materials: 'no', careers: { software: 3 }, projectType: ['code'],
};
const BARE_EVENT = {
    id: 'bare-event', division: 'HS', name: 'Bare Event', category: 'Other',
    eligibility: null, theme: null, costBand: null, difficulty: null, materials: null, careers: {}, projectType: [],
};
const FILLERS = Array.from({ length: 6 }, (_, i) => ({
    id: `filler-${i}`, division: 'HS', name: `Filler ${i}`, category: 'Other',
    eligibility: { teamSize: '2', individualOk: false }, theme: null, costBand: null, difficulty: null, materials: null, careers: {}, projectType: [],
}));
const MS_ROBOTICS = {
    id: 'ms-robotics', division: 'MS', name: 'Robotics', category: 'Engineering & Design',
    eligibility: { teamSize: '2-6', individualOk: false }, theme: 'MS theme', costBand: '150-300', difficulty: 'competitive',
    materials: 'yes', careers: { robotics: 3 }, projectType: ['build'],
};

const ALL_EVENTS = [WEBMASTER, CODING, BARE_EVENT, ...FILLERS, MS_ROBOTICS];

function preconferenceFor(event) {
    return event.id === 'webmaster' ? { known: true, items: ['Sample submission (PDF)'] } : { known: false };
}

function makeData(overrides = {}) {
    return {
        EVENTS: ALL_EVENTS,
        getEvent: (id) => ALL_EVENTS.find((e) => e.id === id) || null,
        eventsForDivision: (division) => ALL_EVENTS.filter((e) => e.division === division),
        teamSizeLabel,
        preconferenceFor,
        answerEventFilter,
        US_STATES: ['Alabama', 'Wyoming'],
        activeState: null,
        ...overrides,
    };
}

function tap(gf, res, blockId, data) {
    const b = res.blocks.find((x) => x.id === blockId);
    if (!b) throw new Error(`No block "${blockId}" among: ${res.blocks.map((x) => x.id).join(', ')}`);
    return applyStep(gf, b, data);
}

describe('Coach guided flow: required end-to-end sequences', () => {
    it('Home -> Events -> Themes -> HS -> Webmaster -> Theme', () => {
        const data = makeData();
        let gf = createGuidedFlow();
        let res = renderStep(gf.stepId, gf.context, data);
        gf = tap(gf, res, 'events', data);
        res = renderStep(gf.stepId, gf.context, data);
        gf = tap(gf, res, 'themes', data);
        res = renderStep(gf.stepId, gf.context, data);
        gf = tap(gf, res, 'hs', data);
        res = renderStep(gf.stepId, gf.context, data);
        // 9 HS fixture events > 8, so a curated example set (including Webmaster) shows first.
        expect(res.blocks.some((b) => b.id === 'webmaster')).toBe(true);
        gf = tap(gf, res, 'webmaster', data);
        res = renderStep(gf.stepId, gf.context, data);
        const theme = res.blocks.find((b) => b.id === 'theme');
        expect(theme).toBeTruthy();
        expect(theme.action.type).toBe('FLOW_ASK');
        expect(theme.action.question).toMatch(/theme for Webmaster/i);
    });

    it('Home -> Events -> Recommendation -> Coding -> Solo -> results include Coding', () => {
        const data = makeData();
        let gf = createGuidedFlow();
        let res = renderStep(gf.stepId, gf.context, data);
        gf = tap(gf, res, 'events', data);
        res = renderStep(gf.stepId, gf.context, data);
        gf = tap(gf, res, 'find-for-me', data);
        res = renderStep(gf.stepId, gf.context, data);
        gf = tap(gf, res, 'code', data);
        res = renderStep(gf.stepId, gf.context, data);
        gf = tap(gf, res, 'solo', data);
        res = renderStep(gf.stepId, gf.context, data);
        expect(res.blocks.some((b) => b.id === 'coding')).toBe(true);
        // Webmaster is tagged 'code' but not individualOk, so it must NOT show.
        expect(res.blocks.some((b) => b.id === 'webmaster')).toBe(false);
    });

    it('Home -> Calendar -> Upcoming dates -> Nationals', () => {
        const data = makeData();
        let gf = createGuidedFlow();
        let res = renderStep(gf.stepId, gf.context, data);
        gf = tap(gf, res, 'calendar', data);
        res = renderStep(gf.stepId, gf.context, data);
        gf = tap(gf, res, 'upcoming', data);
        res = renderStep(gf.stepId, gf.context, data);
        const nationals = res.blocks.find((b) => b.id === 'nationals');
        expect(nationals.action.type).toBe('FLOW_ASK');
        expect(nationals.action.question).toMatch(/national conference/i);
    });

    it('Home -> State TSA -> Advisor -> state selector -> result', () => {
        const data = makeData();
        let gf = createGuidedFlow();
        let res = renderStep(gf.stepId, gf.context, data);
        gf = tap(gf, res, 'state', data);
        res = renderStep(gf.stepId, gf.context, data);
        gf = tap(gf, res, 'advisor', data);
        expect(gf.stepId).toBe('state.pick');
        res = renderStep(gf.stepId, gf.context, data);
        expect(res.selector.kind).toBe('states');
        const alabama = res.selector.items.find((i) => i.label === 'Alabama');
        gf = applySelect(gf, res.selector.kind, alabama.id, data);
        expect(gf.leaf.type).toBe('SEND');
        expect(gf.leaf.question).toMatch(/state advisor for Alabama/i);
        res = renderStep(gf.stepId, gf.context, data);
        const view = res.blocks.find((b) => b.id === 'view');
        expect(view.action).toEqual({ type: 'NAVIGATE', label: 'View Alabama TSA Information', route: '/resources#your-state' });
    });

    it('Home -> Resources -> Event Guide', () => {
        const data = makeData();
        let gf = createGuidedFlow();
        let res = renderStep(gf.stepId, gf.context, data);
        gf = tap(gf, res, 'resources', data);
        res = renderStep(gf.stepId, gf.context, data);
        const guide = res.blocks.find((b) => b.id === 'guide');
        expect(guide.action).toEqual({ type: 'NAVIGATE', label: 'Open Event Guide', route: '/resources/events/themes' });
    });

    it('Home -> Help -> Contact Support', () => {
        const data = makeData();
        let gf = createGuidedFlow();
        let res = renderStep(gf.stepId, gf.context, data);
        gf = tap(gf, res, 'help', data);
        res = renderStep(gf.stepId, gf.context, data);
        const contact = res.blocks.find((b) => b.id === 'contact');
        expect(contact.action.route).toBe('/help/article/contacting-support');
    });
});

describe('Coach guided flow: Back, Start over, Other, View all', () => {
    it('Back returns to the exact previous step and context', () => {
        const data = makeData();
        let gf = createGuidedFlow();
        let res = renderStep(gf.stepId, gf.context, data);
        gf = tap(gf, res, 'events', data);
        const afterEvents = gf;
        res = renderStep(gf.stepId, gf.context, data);
        gf = tap(gf, res, 'themes', data);
        gf = applyBack(gf);
        expect(gf.stepId).toBe(afterEvents.stepId);
        expect(gf.context).toEqual(afterEvents.context);
    });

    it('Back at the very first step is a no-op', () => {
        const gf = createGuidedFlow();
        expect(applyBack(gf)).toEqual(gf);
    });

    it('Start over returns to home with empty history', () => {
        const data = makeData();
        let gf = createGuidedFlow();
        const res = renderStep(gf.stepId, gf.context, data);
        gf = tap(gf, res, 'events', data);
        gf = applyReset();
        expect(gf.stepId).toBe('home');
        expect(gf.history).toEqual([]);
    });

    it('"Other" at home leads to a real prompt with usable chips, not a dead end', () => {
        const data = makeData();
        let gf = createGuidedFlow();
        const res = renderStep(gf.stepId, gf.context, data);
        gf = tap(gf, res, 'other', data);
        const other = renderStep(gf.stepId, gf.context, data);
        expect(other.prompt.toLowerCase()).toMatch(/what are you trying to find/);
        expect(other.blocks.length).toBeGreaterThan(0);
    });

    it('"View all" surfaces the full division list as a searchable selector', () => {
        const data = makeData();
        let gf = createGuidedFlow();
        let res = renderStep(gf.stepId, gf.context, data);
        gf = tap(gf, res, 'events', data);
        res = renderStep(gf.stepId, gf.context, data);
        gf = tap(gf, res, 'themes', data);
        res = renderStep(gf.stepId, gf.context, data);
        gf = tap(gf, res, 'hs', data);
        res = renderStep(gf.stepId, gf.context, data);
        expect(res.blocks.some((b) => b.id === 'view-all')).toBe(true);
        gf = tap(gf, res, 'view-all', data);
        res = renderStep(gf.stepId, gf.context, data);
        expect(res.selector).toBeTruthy();
        expect(res.selector.items.length).toBe(data.eventsForDivision('HS').length);
    });

    it('picking a state a second time via "Choose another state" reopens the picker even when a state is already active', () => {
        const data = makeData({ activeState: 'Wyoming' });
        let gf = createGuidedFlow();
        let res = renderStep(gf.stepId, gf.context, data);
        gf = tap(gf, res, 'state', data);
        res = renderStep(gf.stepId, gf.context, data);
        gf = tap(gf, res, 'advisor', data);
        // Known active state short-circuits straight to an answer.
        expect(gf.stepId).toBe('state.done');
        expect(gf.leaf.question).toMatch(/Wyoming/);
        res = renderStep(gf.stepId, gf.context, data);
        gf = tap(gf, res, 'another', data);
        expect(gf.stepId).toBe('state.pick');
    });
});

describe('Coach guided flow: data-aware event topic menu', () => {
    it('omits blocks whose backing data is missing', () => {
        const data = makeData();
        const res = renderStep('events.event.topic', { eventId: 'bare-event' }, data);
        const ids = res.blocks.map((b) => b.id);
        expect(ids).not.toContain('theme');
        expect(ids).not.toContain('materials');
        expect(ids).not.toContain('submissions');
        expect(ids).not.toContain('careers');
        expect(ids).not.toContain('cost');
        expect(ids).not.toContain('difficulty');
        expect(ids).not.toContain('requirements');
        expect(ids).toContain('overview');
        expect(ids).toContain('guide');
    });

    it('includes every real block for a fully-populated event', () => {
        const data = makeData();
        const res = renderStep('events.event.topic', { eventId: 'webmaster' }, data);
        const ids = res.blocks.map((b) => b.id);
        expect(ids).toEqual(expect.arrayContaining([
            'overview', 'theme', 'requirements', 'team', 'submissions', 'materials', 'careers', 'cost', 'difficulty', 'guide', 'another',
        ]));
    });
});

// A dedicated pool for recommendation-diversity tests: 6 solo-eligible,
// "code"-tagged events spread across 3 DIFFERENT real categories, proving
// the interest filter (projectType-based, not category-restricted) already
// surfaces coding-related events beyond "Computing & Coding" when the
// canonical metadata supports it — no invented category association added.
const CODE_POOL = [
    { id: 'code-a', division: 'HS', name: 'Code A', category: 'Computing & Coding', eligibility: { teamSize: '1', individualOk: true }, theme: null, costBand: '0-25', difficulty: 'beginner', materials: 'no', careers: {}, projectType: ['code'] },
    { id: 'code-b', division: 'HS', name: 'Code B', category: 'Computing & Coding', eligibility: { teamSize: '1', individualOk: true }, theme: null, costBand: '0-25', difficulty: 'beginner', materials: 'no', careers: {}, projectType: ['code'] },
    { id: 'code-c', division: 'HS', name: 'Code C', category: 'Engineering & Design', eligibility: { teamSize: '1', individualOk: true }, theme: null, costBand: '0-25', difficulty: 'beginner', materials: 'no', careers: {}, projectType: ['code', 'build'] },
    { id: 'code-d', division: 'HS', name: 'Code D', category: 'Engineering & Design', eligibility: { teamSize: '1', individualOk: true }, theme: null, costBand: '0-25', difficulty: 'beginner', materials: 'no', careers: {}, projectType: ['code', 'build'] },
    { id: 'code-e', division: 'HS', name: 'Code E', category: 'Communication & Leadership', eligibility: { teamSize: '1', individualOk: true }, theme: null, costBand: '0-25', difficulty: 'beginner', materials: 'no', careers: {}, projectType: ['code'] },
    { id: 'code-f', division: 'HS', name: 'Code F', category: 'Communication & Leadership', eligibility: { teamSize: '1', individualOk: true }, theme: null, costBand: '0-25', difficulty: 'beginner', materials: 'no', careers: {}, projectType: ['code'] },
];

function codePoolData(overrides = {}) {
    return makeData({ EVENTS: CODE_POOL, eventsForDivision: (d) => CODE_POOL.filter((e) => e.division === d), ...overrides });
}

describe('Coach guided flow: recommendation diversity', () => {
    it('Coding interest surfaces genuinely coding-related events from more than one category', () => {
        const data = codePoolData();
        const res = renderStep('events.recommend.results', { interest: 'code', teamPref: 'solo' }, data);
        const shownIds = res.blocks.filter((b) => b.kind === 'event-result').map((b) => b.id);
        const categories = new Set(shownIds.map((id) => CODE_POOL.find((e) => e.id === id).category));
        expect(categories.size).toBeGreaterThan(1);
    });

    it('same preferences produce a first result set, and "Show different events" produces a different valid set', () => {
        const ctx = { interest: 'code', teamPref: 'solo' };
        const first = renderStep('events.recommend.results', ctx, codePoolData());
        const firstIds = first.blocks.filter((b) => b.kind === 'event-result').map((b) => b.id);
        expect(firstIds.length).toBe(4);
        expect(first.blocks.some((b) => b.id === 'different')).toBe(true);

        const second = renderStep('events.recommend.results', ctx, codePoolData({ shownEventIds: firstIds }));
        const secondIds = second.blocks.filter((b) => b.kind === 'event-result').map((b) => b.id);
        expect(secondIds).not.toEqual(firstIds);

        // Every regenerated event must still genuinely satisfy the selected
        // preferences (solo + code) — diversity never introduces an invalid match.
        for (const id of secondIds) {
            const e = CODE_POOL.find((ev) => ev.id === id);
            expect(e.projectType).toContain('code');
            expect(e.eligibility.individualOk).toBe(true);
        }
    });

    it('once every valid match has been shown, results recycle instead of going empty', () => {
        const ctx = { interest: 'code', teamPref: 'solo' };
        const allIds = CODE_POOL.map((e) => e.id);
        const res = renderStep('events.recommend.results', ctx, codePoolData({ shownEventIds: allIds }));
        const shownIds = res.blocks.filter((b) => b.kind === 'event-result').map((b) => b.id);
        expect(shownIds.length).toBe(4);
        for (const id of shownIds) expect(allIds).toContain(id);
    });
});

describe('Coach guided flow: branch-preview diversity', () => {
    // A pool where only some HS events have real theme/requirement data,
    // spread across categories shared with plain filler events (not each in
    // its own unique category) so category-balanced round-robin doesn't
    // accidentally favor the "special" events for the no-preference browse
    // branch just because they'd otherwise sit alone in a category. More
    // than 8 total so the curated-preview (not the full selector) path runs.
    const DIVERSE_POOL = [
        { id: 'aardvark', division: 'HS', name: 'Aardvark Event', category: 'Computing & Coding', eligibility: { teamSize: '2', individualOk: false }, theme: null, costBand: null, difficulty: null, materials: null, careers: {}, projectType: [] },
        { id: 'bravo', division: 'HS', name: 'Bravo Event', category: 'Engineering & Design', eligibility: { teamSize: '2', individualOk: false }, theme: null, costBand: null, difficulty: null, materials: null, careers: {}, projectType: [] },
        { id: 'charlie', division: 'HS', name: 'Charlie Event', category: 'Business & Marketing', eligibility: { teamSize: '2', individualOk: false }, theme: null, costBand: null, difficulty: null, materials: null, careers: {}, projectType: [] },
        { id: 'delta', division: 'HS', name: 'Delta Event', category: 'Science & Health', eligibility: { teamSize: '2', individualOk: false }, theme: null, costBand: null, difficulty: null, materials: null, careers: {}, projectType: [] },
        { id: 'echo', division: 'HS', name: 'Echo Event', category: 'Other', eligibility: { teamSize: '2', individualOk: false }, theme: null, costBand: null, difficulty: null, materials: null, careers: {}, projectType: [] },
        { id: 'foxtrot', division: 'HS', name: 'Foxtrot Event', category: 'Other', eligibility: { teamSize: '2', individualOk: false }, theme: null, costBand: null, difficulty: null, materials: null, careers: {}, projectType: [] },
        { id: 'has-theme-1', division: 'HS', name: 'Has Theme 1', category: 'Computing & Coding', eligibility: { teamSize: '2', individualOk: false }, theme: 'A real theme', costBand: null, difficulty: null, materials: null, careers: {}, projectType: [] },
        { id: 'has-theme-2', division: 'HS', name: 'Has Theme 2', category: 'Engineering & Design', eligibility: { teamSize: '2', individualOk: false }, theme: 'Another real theme', costBand: null, difficulty: null, materials: null, careers: {}, projectType: [] },
        { id: 'has-reqs-1', division: 'HS', name: 'Has Requirements 1', category: 'Business & Marketing', eligibility: { text: 'Team of 2-4', teamSize: '2-4', individualOk: false }, theme: null, costBand: null, difficulty: null, materials: null, careers: {}, projectType: [] },
        { id: 'has-reqs-2', division: 'HS', name: 'Has Requirements 2', category: 'Science & Health', eligibility: { text: 'Team of 2-4', teamSize: '2-4', individualOk: false }, theme: null, costBand: null, difficulty: null, materials: null, careers: {}, projectType: [] },
    ];

    function diverseData() {
        return makeData({
            EVENTS: DIVERSE_POOL,
            eventsForDivision: (d) => DIVERSE_POOL.filter((e) => e.division === d),
            preconferenceFor: (e) => (e.id === 'has-reqs-1' || e.id === 'has-reqs-2' ? { known: true, items: ['Sample submission (PDF)'] } : { known: false }),
        });
    }

    it('Themes and problems prefers events with real theme data', () => {
        const res = renderStep('events.event.list', { division: 'HS', branch: 'themes' }, diverseData());
        const ids = res.blocks.filter((b) => b.id !== 'view-all').map((b) => b.id);
        expect(ids).toEqual(expect.arrayContaining(['has-theme-1', 'has-theme-2']));
    });

    it('Rules and requirements prefers events with real requirements data', () => {
        const res = renderStep('events.event.list', { division: 'HS', branch: 'rules' }, diverseData());
        const ids = res.blocks.filter((b) => b.id !== 'view-all').map((b) => b.id);
        expect(ids).toEqual(expect.arrayContaining(['has-reqs-1', 'has-reqs-2']));
    });

    it('Browse / Themes / Rules previews are not all identical when alternatives exist', () => {
        const data = diverseData();
        const browse = renderStep('events.event.list', { division: 'HS', branch: 'browse' }, data).blocks.filter((b) => b.id !== 'view-all').map((b) => b.id).sort();
        const themes = renderStep('events.event.list', { division: 'HS', branch: 'themes' }, data).blocks.filter((b) => b.id !== 'view-all').map((b) => b.id).sort();
        const rules = renderStep('events.event.list', { division: 'HS', branch: 'rules' }, data).blocks.filter((b) => b.id !== 'view-all').map((b) => b.id).sort();
        expect(themes).not.toEqual(browse);
        expect(rules).not.toEqual(browse);
        expect(themes).not.toEqual(rules);
    });
});

describe('Coach guided flow: team size formatting', () => {
    it('never renders a decimal team size like "2.0"', () => {
        const numericTeam = { eligibility: { teamSize: 2, individualOk: false } };
        const decimalStringTeam = { eligibility: { teamSize: '2.0', individualOk: false } };
        expect(teamSizeLabel(numericTeam)).toBe('Team of 2');
        expect(teamSizeLabel(decimalStringTeam)).toBe('Team of 2');
    });
});

describe('Coach guided flow: free-text interruption matching', () => {
    it('matches an in-flow reply, including a synonym', () => {
        const data = makeData();
        const res = renderStep('events.division', {}, data);
        expect(matchFreeText(res, 'high school')?.id).toBe('hs');
        expect(matchFreeText(res, 'HS')?.id).toBe('hs');
        expect(matchFreeText(res, 'middle school')?.id).toBe('ms');
    });

    it('returns null for an unrelated question, so the caller can abandon the flow', () => {
        const data = makeData();
        const res = renderStep('events.division', {}, data);
        expect(matchFreeText(res, "where's privacy")).toBeNull();
        expect(matchFreeText(res, 'open calendar')).toBeNull();
    });

    it('does not swallow a longer, more specific question into a short button label it merely contains', () => {
        // "when are regionals for north carolina" contains the word
        // "regionals" (the button's label), but it's a much more specific
        // question that must reach the real engine (which can extract
        // "north carolina") instead of being treated as a tap on the bare
        // "Regionals" button and losing the state name entirely.
        const data = makeData();
        const res = renderStep('calendar.upcoming', {}, data);
        expect(matchFreeText(res, 'when are regionals for north carolina')).toBeNull();
        // A short, label-like reply should still match.
        expect(matchFreeText(res, 'the regionals')?.id).toBe('regionals');
    });
});
