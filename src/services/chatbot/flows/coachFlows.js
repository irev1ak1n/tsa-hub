// ============================================================================
// Coach guided navigation tree — a pure, framework-free step registry that
// lets the Coach UI present tap-driven menus (topic → subtopic → event →
// question → answer) instead of requiring free text for everything.
//
// This module knows nothing about React or engine.js. Two kinds of leaf
// action end a branch:
//   - NAVIGATE  → a real app route (Coach.jsx just calls navigate(route)).
//   - FLOW_ASK  → a canonical, unambiguous question handed to the existing
//                 chatbot engine's answer() the same way tapping an FAQ
//                 question already does — this reuses 100% of the existing
//                 NLU/answer logic instead of duplicating it here.
// Everything else (FLOW_STEP / selector picks / Back / Start over) only
// moves the guided-flow cursor around; it never talks to the engine.
// ============================================================================

import { isMissing } from '../guards/dataGuards.js';
import { pickDiverse } from './eventSelection.js';

const HS = 'HS';
const MS = 'MS';

function step(id, prompt, blocks, selector, extra) {
    return { id, prompt, blocks, selector: selector || null, ...extra };
}

function navigate(label, route) {
    return { type: 'NAVIGATE', label, route };
}
function ask(label, question) {
    return { type: 'FLOW_ASK', label, question };
}
function go(label, to, context) {
    return { type: 'FLOW_STEP', label, to, context: context || {} };
}
function block(id, label, action, kind = 'subtopic', extra) {
    return { id, label, kind, action, ...extra };
}

function divisionLabel(d) {
    return d === HS ? 'High School' : 'Middle School';
}

// Per-branch preference used when picking the "Some events to explore"
// sample for a division with too many events to list as blocks — a HARD
// filter (see pickDiverse), not an invented category mapping: every
// predicate here reads a real field already on the event (theme text,
// preconference submission data). 'browse' (and any other/unknown branch)
// gets no preference at all, just a category-balanced mix. Note:
// `eligibility.text` is deliberately NOT used for 'rules' — nearly every
// real event publishes some eligibility wording, so it fails to narrow
// anything and the preview would look identical to Browse; preconference
// submission data is the field that actually distinguishes events with
// substantial, concrete requirements to show.
function branchPreference(branch, data) {
    if (branch === 'themes') return (e) => !isMissing(e.theme);
    if (branch === 'rules') return (e) => data.preconferenceFor(e).known && data.preconferenceFor(e).items?.length > 0;
    return null;
}

function eventTopicBlocks(event, data) {
    const name = event.name;
    const blocks = [
        block('overview', 'Overview', ask('Overview', `What is ${name} about?`)),
    ];
    if (!isMissing(event.theme)) blocks.push(block('theme', 'Current theme', ask('Current theme', `What is the theme for ${name}?`)));
    if (event.eligibility?.text || event.eligibility?.teamSize) {
        blocks.push(block('requirements', 'Requirements', ask('Requirements', `What is the eligibility for ${name}?`)));
    }
    if (data.teamSizeLabel(event)) blocks.push(block('team', 'Team size', ask('Team size', `What is the team size for ${name}?`)));
    const pre = data.preconferenceFor(event);
    if (pre.known) blocks.push(block('submissions', 'Submissions', ask('Submissions', `What do I need to submit for ${name}?`)));
    if (!isMissing(event.materials)) blocks.push(block('materials', 'Materials', ask('Materials', `What materials do I need for ${name}?`)));
    if (event.careers && Object.keys(event.careers).length) blocks.push(block('careers', 'Related careers', ask('Related careers', `What careers does ${name} lead to?`)));
    if (!isMissing(event.costBand)) blocks.push(block('cost', 'Cost', ask('Cost', `How much does ${name} cost?`)));
    if (!isMissing(event.difficulty)) blocks.push(block('difficulty', 'Difficulty', ask('Difficulty', `How hard is ${name}?`)));
    blocks.push(block('guide', 'Open Event Guide', navigate(`Open ${name} Event Guide`, `/resources/events/${event.id}`), 'topic'));
    blocks.push(block('another', 'Choose another event', go('Choose another event', 'events.event.list', { division: event.division }), 'chip'));
    return blocks;
}

export const FLOW_STEPS = {
    home: () => step('home', 'What would you like help with?', [
        block('events', 'Explore events', go('Explore events', 'events'), 'topic'),
        block('calendar', 'Calendar & deadlines', go('Calendar & deadlines', 'calendar'), 'topic'),
        block('state', 'State TSA information', go('State TSA information', 'state'), 'topic'),
        block('resources', 'Resources', go('Resources', 'resources'), 'topic'),
        block('help', 'Help using TSA Hub', go('Help using TSA Hub', 'help'), 'topic'),
        block('other', 'Other', go('Other', 'other'), 'topic'),
    ]),

    events: () => step('events', 'What would you like to explore?', [
        block('find-for-me', 'Find an event for me', go('Find an event for me', 'events.recommend.interest')),
        block('browse', 'Browse events', go('Browse events', 'events.division', { branch: 'browse' })),
        block('themes', 'Themes and problems', go('Themes and problems', 'events.division', { branch: 'themes' })),
        block('rules', 'Rules and requirements', go('Rules and requirements', 'events.division', { branch: 'rules' })),
    ]),

    'events.division': (context) => step('events.division', 'Which division?', [
        block('hs', 'High School', go('High School', 'events.event.list', { division: HS, branch: context.branch }), 'chip'),
        block('ms', 'Middle School', go('Middle School', 'events.event.list', { division: MS, branch: context.branch }), 'chip'),
        block('search', 'Search for an event', go('Search for an event', 'events.event.list', { division: null, showAll: true, branch: context.branch })),
    ]),

    'events.event.list': (context, data) => {
        const division = context.division || null;
        const pool = division ? data.eventsForDivision(division) : data.EVENTS;
        const listLabel = division ? `${divisionLabel(division)} events` : 'all events';

        if (context.showAll || pool.length <= 8) {
            return step('events.event.list', division ? `Here are all ${divisionLabel(division)} events. Pick one.` : 'Pick an event.', [], {
                kind: 'events',
                items: pool.map((e) => ({ id: e.id, label: division ? e.name : `${e.name} (${divisionLabel(e.division)})` })),
                placeholder: 'Search event name...',
            });
        }

        const shown = pickDiverse(pool, 4, { excludeIds: data.shownEventIds, preferPredicate: branchPreference(context.branch, data) });
        return step('events.event.list', 'Some events to explore.', [
            ...shown.map((e) => block(e.id, e.name, go(e.name, 'events.event.topic', { eventId: e.id, division: e.division }))),
            block('view-all', `View all ${listLabel}`, go(`View all ${listLabel}`, 'events.event.list', { division, showAll: true, branch: context.branch }), 'topic'),
        ], null, { previewEventIds: shown.map((e) => e.id) });
    },

    'events.event.topic': (context, data) => {
        const event = data.getEvent(context.eventId);
        if (!event) {
            return step('events.event.topic', "I couldn't find that event anymore — pick another.", [
                block('back-list', 'Browse events', go('Browse events', 'events.event.list', { division: context.division })),
            ]);
        }
        return step('events.event.topic', `What would you like to know about ${event.name}?`, eventTopicBlocks(event, data));
    },

    'events.recommend.interest': () => step('events.recommend.interest', 'What are you most interested in?', [
        block('code', 'Coding', go('Coding', 'events.recommend.team', { interest: 'code' }), 'chip'),
        block('build', 'Building', go('Building', 'events.recommend.team', { interest: 'build' }), 'chip'),
        block('design', 'Design', go('Design', 'events.recommend.team', { interest: 'design' }), 'chip'),
        block('video', 'Media', go('Media', 'events.recommend.team', { interest: 'video' }), 'chip'),
        block('none', 'Not sure', go('Not sure', 'events.recommend.team', { interest: null }), 'chip'),
    ]),

    'events.recommend.team': (context) => step('events.recommend.team', 'Would you rather compete alone or with a team?', [
        block('solo', 'Solo', go('Solo', 'events.recommend.results', { ...context, teamPref: 'solo' }), 'chip'),
        block('team', 'Team', go('Team', 'events.recommend.results', { ...context, teamPref: 'team' }), 'chip'),
        block('either', 'Either', go('Either', 'events.recommend.results', { ...context, teamPref: 'either' }), 'chip'),
    ]),

    'events.recommend.results': (context, data) => {
        let pool = data.EVENTS;
        if (context.interest) {
            const r = data.answerEventFilter('interest', pool, { interest: context.interest });
            if (r?.events?.length) pool = r.events;
        }
        if (context.teamPref === 'solo') {
            const r = data.answerEventFilter('solo', pool, {});
            if (r?.events) pool = pool.filter((e) => r.events.includes(e));
        } else if (context.teamPref === 'team') {
            const r = data.answerEventFilter('team', pool, {});
            if (r?.events) pool = pool.filter((e) => r.events.includes(e));
        }

        if (!pool.length) {
            return step('events.recommend.results', "I couldn't find a close match for that combination — here's the full list instead.", [
                block('browse', 'Browse all events', go('Browse all events', 'events.division')),
            ]);
        }

        const shown = pickDiverse(pool, 4, { excludeIds: data.shownEventIds });
        return step('events.recommend.results', 'Here are a few events that could be a fit.', [
            ...shown.map((e) => block(e.id, e.name, navigate(`View ${e.name}`, `/resources/events/${e.id}`), 'event-result', {
                meta: [e.category, data.teamSizeLabel(e)].filter(Boolean).join(' · '),
            })),
            ...(pool.length > shown.length ? [block('different', 'Show different events', go('Show different events', 'events.recommend.results', context), 'chip')] : []),
            block('another', 'Change my answers', go('Change my answers', 'events.recommend.interest'), 'chip'),
        ], null, { previewEventIds: shown.map((e) => e.id) });
    },

    calendar: () => step('calendar', 'What do you want to do?', [
        block('upcoming', 'See upcoming TSA dates', go('See upcoming TSA dates', 'calendar.upcoming')),
        block('today', "What's happening today?", ask("What's happening today?", 'What is today?'), 'chip'),
        block('open', 'Open Calendar', navigate('Open Calendar', '/calendar'), 'topic'),
    ]),

    'calendar.upcoming': () => step('calendar.upcoming', 'What are you looking for?', [
        block('nationals', 'National Conference', ask('National Conference', 'When is the national conference?')),
        block('state-conf', 'State Conference', ask('State Conference', 'When is the state conference?')),
        block('regionals', 'Regionals', ask('Regionals', 'When are regionals?')),
        block('open', 'Open full Calendar', navigate('Open full Calendar', '/calendar'), 'topic'),
    ]),

    state: () => step('state', 'What do you need?', [
        block('advisor', 'State advisor', go('State advisor', 'state.pick', { stateIntent: 'state.advisor' })),
        block('website', 'State website', go('State website', 'state.pick', { stateIntent: 'state.website' })),
        block('social', 'Instagram / Facebook', go('Instagram / Facebook', 'state.pick', { stateIntent: 'state.social' })),
    ]),

    'state.pick': (context, data) => step('state.pick', 'What state are you looking for?', [], {
        kind: 'states',
        items: data.US_STATES.map((s) => ({ id: s, label: s })),
        placeholder: 'Search states...',
    }),

    'state.done': (context) => step('state.done', `More about ${context.stateName} TSA:`, [
        block('another', 'Choose another state', go('Choose another state', 'state.pick', { stateIntent: context.stateIntent, forcePick: true }), 'chip'),
        block('back', 'Back to State TSA', go('Back to State TSA', 'state'), 'chip'),
    ]),

    resources: () => step('resources', 'What are you looking for?', [
        block('guide', 'Event Guide', navigate('Open Event Guide', '/resources/events/themes')),
        block('state', 'State information', go('State information', 'state')),
        block('officers', 'National officers', navigate('National Officers', '/resources/student-leadership')),
        block('help-articles', 'Help articles', navigate('Help Articles', '/help/articles')),
        block('search', 'Search Resources', navigate('Search Resources', '/resources/search')),
    ]),

    help: () => step('help', 'What do you need help with?', [
        block('assistant', 'Using TSA Assistant', navigate('Using TSA Assistant', '/help/article/using-tsa-assistant')),
        block('calendar', 'Calendar and reminders', navigate('Calendar and Reminders', '/help/article/using-calendar')),
        block('privacy', 'Privacy', navigate('Privacy Policy', '/privacy')),
        block('report', 'Report incorrect information', navigate('Report Incorrect Information', '/help/article/reporting-incorrect-info')),
        block('contact', 'Contact support', navigate('Contact Support', '/help/article/contacting-support')),
        block('center', 'Open Help Center', navigate('Open Help Center', '/help'), 'topic'),
    ]),

    other: () => step('other', 'What are you trying to find or do in TSA Hub? Type it below, or try:', [
        block('search', 'Search TSA Hub', navigate('Search TSA Hub', '/resources/search'), 'chip'),
        block('contact', 'Contact support', navigate('Contact Support', '/help/article/contacting-support'), 'chip'),
    ]),
};

export function renderStep(stepId, context, data) {
    const fn = FLOW_STEPS[stepId] || FLOW_STEPS.home;
    return fn(context || {}, data);
}

export function createGuidedFlow() {
    return { stepId: 'home', context: {}, history: [] };
}

function buildStateQuestion(stateIntent, stateName) {
    if (stateIntent === 'state.website') return `What is the ${stateName} TSA website?`;
    if (stateIntent === 'state.social') return `What is the ${stateName} state Instagram?`;
    return `Who is the state advisor for ${stateName}?`;
}

// Advance the flow by tapping a FLOW_STEP block (FLOW_ASK/NAVIGATE blocks are
// handled directly by Coach.jsx — they don't change which step is showing).
export function applyStep(guidedFlow, tappedBlock, data) {
    const action = tappedBlock.action;
    if (action.type !== 'FLOW_STEP') return guidedFlow;

    // "Which state?" is skipped entirely when Coach already knows the
    // student's state from earlier in the conversation — unless the user
    // explicitly asked to choose a different one ("Choose another state").
    if (action.to === 'state.pick' && data.activeState && !action.context.forcePick) {
        return {
            stepId: 'state.done',
            context: { stateIntent: action.context.stateIntent, stateName: data.activeState },
            history: [...guidedFlow.history, { stepId: guidedFlow.stepId, context: guidedFlow.context }],
            leaf: { type: 'SEND', question: buildStateQuestion(action.context.stateIntent, data.activeState) },
        };
    }

    return {
        stepId: action.to,
        context: { ...guidedFlow.context, ...action.context },
        history: [...guidedFlow.history, { stepId: guidedFlow.stepId, context: guidedFlow.context }],
    };
}

export function applyBack(guidedFlow) {
    if (!guidedFlow.history.length) return guidedFlow;
    const prev = guidedFlow.history[guidedFlow.history.length - 1];
    return { stepId: prev.stepId, context: prev.context, history: guidedFlow.history.slice(0, -1) };
}

export function applyReset() {
    return createGuidedFlow();
}

// A tap on a selector item (event or state picker) either advances the flow
// (event → its topic menu) or resolves directly to an answer (state → the
// pending state question), same leaf shape as applyStep's shortcut above.
export function applySelect(guidedFlow, selectorKind, itemId, data) {
    if (selectorKind === 'events') {
        const event = data.getEvent(itemId);
        return {
            stepId: 'events.event.topic',
            context: { eventId: itemId, division: event?.division || guidedFlow.context.division },
            history: [...guidedFlow.history, { stepId: guidedFlow.stepId, context: guidedFlow.context }],
        };
    }
    if (selectorKind === 'states') {
        const stateIntent = guidedFlow.context.stateIntent;
        return {
            stepId: 'state.done',
            context: { stateIntent, stateName: itemId },
            history: [...guidedFlow.history, { stepId: guidedFlow.stepId, context: guidedFlow.context }],
            leaf: { type: 'SEND', question: buildStateQuestion(stateIntent, itemId) },
        };
    }
    return guidedFlow;
}

// Loose match of typed free text against the CURRENT step's visible option
// labels/synonyms — deliberately simple, not a new NLU layer. Returns the
// matched block, or null if this doesn't look like an attempt to answer the
// pending guided step at all (the caller should then abandon the flow and
// let the normal engine answer the message instead).
const SYNONYMS = {
    hs: /\bhigh school\b|\bhs\b/,
    ms: /\bmiddle school\b|\bms\b/,
    solo: /\bsolo\b|\bindividual\b|\balone\b|\bmyself\b/,
    team: /\bteam\b|\bgroup\b/,
    either: /\beither\b|\bno preference\b|\bboth\b/,
    code: /\bcod(e|ing)\b|\bprogramming\b/,
    build: /\bbuild(ing)?\b/,
    design: /\bdesign(ing)?\b/,
    video: /\bmedia\b|\bvideo\b/,
};

export function matchFreeText(stepResult, text) {
    const t = (text || '').trim().toLowerCase();
    if (!t || !stepResult?.blocks?.length) return null;
    const tWords = t.split(/\s+/).length;
    for (const b of stepResult.blocks) {
        const label = b.label.toLowerCase();
        const labelWords = label.split(/\s+/).length;
        // t.includes(label) is only safe when the typed text is close in
        // length to the label — a short reply like "the regionals" should
        // still match the "Regionals" button, but a full, more specific
        // question that merely happens to contain that word ("when are
        // regionals for north carolina") must NOT be swallowed into the
        // button's generic canned question, discarding the extra detail
        // (the state name) the user actually asked about.
        if (t === label || (t.includes(label) && tWords <= labelWords + 2) || label.includes(t)) return b;
        const syn = SYNONYMS[b.id];
        if (syn && syn.test(t)) return b;
    }
    return null;
}
