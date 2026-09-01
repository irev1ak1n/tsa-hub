// TSA Coach repositioning — "the intelligent search, navigation, and help
// layer for TSA Hub". This suite locks in the new capabilities: app
// destination knowledge, structured NAVIGATE action blocks, short-answer +
// action responses for app-usage questions, and the guarantee that every
// action Coach generates points at a route that genuinely exists (cross
// checked against src/App.jsx's real route table) — never a dead link.

import { describe, it, expect } from 'vitest';
import { loadRealData, ask, askChain } from './setup.js';

loadRealData();

// The real static routes from src/App.jsx, plus regexes for the dynamic
// ones — kept here deliberately as a flat, independent list (not imported
// from the router) so this test actually catches a route being renamed or
// removed without this file being updated to match.
const STATIC_ROUTES = new Set([
    '/', '/events', '/events/search', '/recommend',
    '/resources', '/resources/search', '/resources/events/themes',
    '/resources/student-leadership', '/resources/leadership-support',
    '/coach', '/calendar', '/help', '/help/articles',
    '/settings', '/privacy', '/terms',
]);
const DYNAMIC_ROUTE_RES = [
    /^\/events\/[a-z0-9-]+$/,
    /^\/resources\/events\/[a-z0-9-]+$/,
    /^\/help\/article\/[a-z0-9-]+$/,
];

function isRealRoute(route) {
    if (STATIC_ROUTES.has(route)) return true;
    return DYNAMIC_ROUTE_RES.some((re) => re.test(route));
}

function collectActions(res) {
    return res.actions || [];
}

describe('Coach navigation: every generated action points at a real route', () => {
    const probes = [
        'open calendar', 'go to resources', 'show me webmaster', 'take me to privacy',
        'open settings', 'open help', 'go to events', 'open event guide',
        'where is privacy policy', 'where is the help center', 'navigate to calendar',
        'how do i add an event', 'how do i make a reminder', 'how do i edit an event',
        'how do i delete something from calendar', 'how do i export this to my calendar',
        'how do i install the app', 'how do i contact support',
        'how do i report incorrect info', 'how do i change settings',
        'how do i use tsa assistant', 'how do i search events',
        'webmaster', 'calendar', 'privacy', 'terms', 'settings', 'resources',
        'instagram', 'find national officers', 'find my state advisor',
        'when are nationals', "whats coming up", 'rules',
        'how many people can do webmaster', 'what is the theme for webmaster',
        'How do I pick an event?',
    ];

    it.each(probes)('"%s" never generates a dead action', (text) => {
        const res = ask(text);
        for (const action of collectActions(res)) {
            expect(action.type).toBe('NAVIGATE');
            expect(typeof action.route).toBe('string');
            expect(isRealRoute(action.route), `"${text}" generated a dead route: ${action.route}`).toBe(true);
        }
    });
});

describe('Coach navigation: explicit "open/go to/show me/take me to" commands', () => {
    it.each([
        ['open calendar', '/calendar'],
        ['go to resources', '/resources'],
        ['open settings', '/settings'],
        ['open help', '/help'],
        ['go to events', '/events'],
        ['open event guide', '/resources/events/themes'],
        ['take me to privacy', '/privacy'],
        ['where is privacy policy', '/privacy'],
        ['where is the help center', '/help'],
        ['navigate to calendar', '/calendar'],
    ])('"%s" navigates to %s', (text, route) => {
        const res = ask(text);
        expect(res.actions.some((a) => a.route === route)).toBe(true);
    });
});

describe('Coach navigation: bare destination fragments act as search', () => {
    it.each([
        ['calendar', '/calendar'],
        ['privacy', '/privacy'],
        ['terms', '/terms'],
        ['settings', '/settings'],
        ['resources', '/resources'],
        ['instagram', '/resources'],
        ['state instagram', '/resources'],
        ['state facebook', '/resources'],
        ['reminders', '/calendar'],
        ['reminder', '/calendar'],
        ['my reminders', '/calendar'],
        ['set a reminder', '/calendar'],
        ['notifications', '/calendar'],
        ['export', '/calendar'],
        ['today', '/calendar'],
        ['this week', '/calendar'],
        ['dates', '/calendar'],
        ['themes', '/resources/events/themes'],
        ['documents', '/resources/events/themes'],
        ['pdfs', '/resources/events/themes'],
        ['guide', '/resources/events/themes'],
        ['guides', '/resources/events/themes'],
        ['assistant', '/coach'],
        ['state advisor', '/resources/leadership-support'],
        ['national advisor', '/resources/leadership-support'],
        ['state contact', '/resources/leadership-support'],
        ['contacts', '/resources/leadership-support'],
        ['national officers', '/resources/student-leadership'],
    ])('"%s" surfaces the right screen', (text, route) => {
        const res = ask(text);
        expect(res.actions.some((a) => a.route === route)).toBe(true);
        // Short — this is a destination pointer, not an essay.
        expect(res.text.split(/\s+/).length).toBeLessThan(40);
    });
});

describe('Coach navigation: single-word disambiguation offers real choices instead of guessing', () => {
    it.each([
        ['rules', ['/resources/events/themes', '/resources']],
        ['contact', ['/help/article/contacting-support', '/resources/leadership-support']],
        ['leadership', ['/resources/student-leadership', '/resources/leadership-support']],
    ])('"%s" offers the real destinations', (text, routes) => {
        const res = ask(text);
        expect(res.actions.map((a) => a.route).sort()).toEqual([...routes].sort());
    });

    it('bare "requirements"/"submission" with no active event points at the Event Guide, not a random unrelated rule', () => {
        for (const text of ['requirements', 'submission', 'submissions']) {
            const res = ask(text);
            expect(res.actions.some((a) => a.route === '/resources/events/themes')).toBe(true);
        }
    });
});

describe('Coach navigation: event + bare topic word gets a specific pointer, not a fully generic question', () => {
    it.each([
        ['webmaster requirements', 'requirements'],
        ['webmaster submission', 'submission'],
        ['webmaster pdf', 'documents'],
    ])('"%s" names the actual thing asked about', (text, expectedWord) => {
        const res = ask(text);
        expect(res.text.toLowerCase()).toContain(expectedWord);
        expect(res.actions.some((a) => a.route === '/resources/events/webmaster')).toBe(true);
        expect(res.text).not.toBe('Got it — Webmaster. What do you want to know?');
    });
});

describe('Coach navigation: bare "advisor" does not collide with the existing state-advisor clarification', () => {
    it('bare "advisor" alone asks which state', () => {
        const res = ask('advisor');
        expect(res.text.toLowerCase()).toMatch(/which state/);
    });

    it('"whos my advisor" (existing, longer phrasing) still asks which state, unaffected', () => {
        const res = ask('whos my advisor');
        expect(res.text.toLowerCase()).toMatch(/which state|set your state/);
    });
});

describe('Coach navigation: "how do I" app-usage questions get short answers + actions', () => {
    it.each([
        'how do i add an event',
        'how do i put something on my calendar',
        'how do i make a reminder',
        'how do i add something to calendar',
        'how do i edit an event',
        'how do i delete something from calendar',
        'how do i export this to my calendar',
        'can i add tsa date to my calendar',
        'how do i install the app',
        'how do i install this on my phone',
        'how do i report incorrect info',
        'how can i report wrong info',
        'how do i report something wrong',
        'how do i change settings',
        'how do i use tsa assistant',
        'how do i search events',
        'how do i find an event',
        'what data do you save',
        "what's today",
        'how do i get back to my events',
    ])('"%s" is answered with a short instruction and a real action', (text) => {
        const res = ask(text);
        expect(res.kind).not.toBe('unknown');
        expect(res.actions.length).toBeGreaterThan(0);
        expect(res.text.split(/\s+/).length).toBeLessThan(60);
    });
});

describe('Coach navigation: state advisor flow (FLOW C)', () => {
    it('asks which state when none is known', () => {
        const res = ask('where do i find my advisor');
        expect(res.text.toLowerCase()).toMatch(/which state/);
    });

    it('"find my state advisor" also triggers the same flow', () => {
        const res = ask('find my state advisor');
        expect(res.text.toLowerCase()).toMatch(/which state/);
    });

    it('once a state is set, points at Resources with the state named', () => {
        const [, res] = askChain(['my state is texas', 'where do i find my advisor']);
        expect(res.text).toMatch(/texas/i);
        // Deep-links straight to the "Your State" section, not just the bare
        // Resources page — see the state-sync/routing fix.
        expect(res.actions.some((a) => a.route === '/resources#your-state')).toBe(true);
    });
});

describe('Coach navigation: stateConfirmed signal (app-wide state sync)', () => {
    // Coach.jsx reads `res.stateConfirmed` to sync the app-wide selected
    // state (AppContext's setStatePref) — but only when the engine considers
    // the state genuinely explicit, never on an incidental mention.
    it('an explicit declaration ("my state is X") reports stateConfirmed', () => {
        const res = ask('my state is Washington');
        expect(res.stateConfirmed).toBe('Washington');
    });

    it('a direct reply to "which state?" reports stateConfirmed', () => {
        const [, res] = askChain(['who is my state advisor', 'Washington']);
        expect(res.stateConfirmed).toBe('Washington');
    });

    it('a comparison mentioning two states does NOT report stateConfirmed', () => {
        const res = ask('is the Texas state website different from the Ohio state website');
        expect(res.stateConfirmed).toBeFalsy();
    });

    it('a genuine single-state question also reports stateConfirmed (not just declarations)', () => {
        const res = ask('what is the Washington state website');
        expect(res.stateConfirmed).toBe('Washington');
    });
});

describe('Coach navigation: ambiguous/ bare event mentions offer Event Guide actions', () => {
    it('a bare unambiguous event name offers its Event Guide', () => {
        const res = ask('webmaster');
        expect(res.actions.some((a) => a.route === '/resources/events/webmaster')).toBe(true);
    });

    it('an ambiguous HS/MS event name offers both Event Guides', () => {
        const res = ask('robotics');
        expect(res.kind).toBe('ambiguous-event');
        const routes = res.actions.map((a) => a.route);
        expect(routes).toContain('/resources/events/robotics');
        expect(routes.some((r) => r.startsWith('/resources/events/ms-robotics'))).toBe(true);
    });

    it('a real per-event factual answer still includes the Event Guide action (section 56 — do not remove factual answering)', () => {
        const res = ask('how many people can do webmaster');
        expect(res.text.toLowerCase()).toMatch(/\d/); // the actual number is still answered
        expect(res.actions.some((a) => a.route === '/resources/events/webmaster')).toBe(true);
    });
});

describe('Coach navigation: recommendation flow is interactive, not a paragraph (FLOW I)', () => {
    it('"How do I pick an event?" offers real chips and a Get Recommendations action', () => {
        const res = ask('How do I pick an event?');
        expect(res.intent).toBe('clarify.recommend');
        expect(res.actions.some((a) => a.route === '/recommend')).toBe(true);
        expect(res.suggestions.length).toBeGreaterThan(0);
        expect(res.text.split(/\s+/).length).toBeLessThan(20);
    });

    it('every suggested preference chip from clarify.recommend is itself a working message', () => {
        const first = ask('what would you recommend');
        for (const chip of first.suggestions) {
            const chained = askChain(['what would you recommend', chip]);
            const res = chained[1];
            expect(res.kind).not.toBe('unknown');
        }
    });
});

describe('Coach navigation: genuinely ambiguous single words offer real choices, not a guess (FLOW/section 35)', () => {
    it('"rules" offers real destinations instead of one specific unrelated rule', () => {
        const res = ask('rules');
        expect(res.actions.length).toBeGreaterThanOrEqual(2);
    });
});

describe('Coach navigation: bug reports go to Support, not a TSA answer (FLOW G / section 15)', () => {
    // Asserts the actual DRAFTED-PREVIEW flow specifically (category +
    // quoted complaint) — not just any response containing the word
    // "category", which would also pass for the older generic
    // "pick a category" support flow and silently hide a regression if the
    // bug-report detector ever got shadowed by that other flow again.
    it.each([
        ['the calendar is broken', 'Calendar or deadlines'],
        ['coach isnt working', 'TSA Coach'],
        ['something is broken', 'Website/app issue'],
        ['events arent loading', 'Events'],
    ])('"%s" drafts a real bug report with category "%s"', (text, category) => {
        const res = ask(text);
        expect(res.text).toContain(`Category: ${category}`);
        expect(res.text).toContain(text);
    });

    it('does not try to send the user straight to National TSA for an app bug', () => {
        const res = ask('the calendar is broken');
        expect(res.text).not.toMatch(/tsaweb\.org|national tsa/i);
    });
});

describe('Coach navigation: "contact support" still opens the real guided flow, not just a nav pointer', () => {
    it('"how do i contact support" starts the interactive support flow', () => {
        const res = ask('how do i contact support');
        expect(res.kind).not.toBe('unknown');
        expect(res.text.toLowerCase()).toMatch(/category|help with/);
    });
});

describe('Coach navigation: out-of-scope stays out-of-scope (section 39/40, no regression)', () => {
    it.each(['weather', 'sports scores', 'bitcoin price', 'movie recommendations'])('"%s" is declined briefly, no random event match', (text) => {
        const res = ask(text);
        expect(res.kind).not.toBe('unknown-event');
        expect(res.text.split(/\s+/).length).toBeLessThan(40);
    });

    it('personal questions about Coach stay short and on-brand', () => {
        const res = ask('are you ai');
        expect(res.text.split(/\s+/).length).toBeLessThan(40);
    });
});

describe('Coach navigation: deadline/conference answers link to Calendar', () => {
    it.each(['when are nationals', 'whats coming up', 'next deadline'])('"%s" includes a View in Calendar action', (text) => {
        const res = ask(text);
        expect(res.actions.some((a) => a.route === '/calendar')).toBe(true);
    });
});

describe('Coach navigation: existing factual/fallback QA is unaffected', () => {
    it('national tsa contact info still returns the real contact data (not hijacked by nav)', () => {
        const res = ask('national tsa contact');
        expect(res.text).toMatch(/general@tsaweb\.org/);
    });

    it('"whos my advisor" with no state still asks which state (not a leadership-page dump)', () => {
        const res = ask('whos my advisor');
        expect(res.text.toLowerCase()).toMatch(/which state|set your state/);
    });

    it('a genuine capability-limit request is still explained, not swallowed by navigation', () => {
        const res = ask('can you email my advisor for me');
        expect(res.text.toLowerCase()).toMatch(/can't|cannot|can not|not able to/);
    });
});

describe('Coach navigation: an abandoned pending clarification never swallows the next unrelated question', () => {
    it('an unresolved event-ambiguity clarification is dropped once the next message clearly moves on', () => {
        const turns = askChain(['robotics pdf', 'state instagram']);
        expect(turns[0].text.toLowerCase()).toMatch(/high school or middle school/);
        const final = turns[1];
        expect(final.text.toLowerCase()).not.toMatch(/which state/);
        expect(final.actions.some((a) => a.route === '/resources')).toBe(true);
    });

    it('a genuine division reply still resolves the pending event clarification instead of being treated as unrelated', () => {
        const turns = askChain(['robotics pdf', 'middle school']);
        expect(turns[1].text.toLowerCase()).not.toMatch(/which state|what are you looking for/);
    });

    it('a follow-up naming the event directly still resolves the pending clarification', () => {
        const turns = askChain(['robotics pdf', 'the middle school one']);
        expect(turns[1].actions.some((a) => a.route === '/resources/events/ms-robotics')).toBe(true);
    });
});
