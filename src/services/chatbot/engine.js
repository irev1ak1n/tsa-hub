import { normalize } from './language/normalize.js';
import { resolveEvents, findDivision } from './entities/events.js';
import { detectDomain } from './router/domainRouter.js';
import { detectIntent, REQUIRES_EVENT, REQUIRES_TWO_EVENTS } from './router/intentRouter.js';
import { answerEventIntent } from './resolvers/events.js';
import { answerCompare } from './resolvers/compare.js';
import { detectSmallTalk, offTopicReply } from './resolvers/smalltalk.js';
import { fallback } from './resolvers/fallback.js';
import { answerDeadline } from './resolvers/deadlines.js';
import { answerRule } from './resolvers/rules.js';
import { answerConference } from './resolvers/conference.js';
import { followupsFor } from './suggestions/followups.js';
import { seasonInQuestion, freshnessWarning } from './guards/dataGuards.js';
import { createState, resetState } from './conversation/state.js';

// Confidence thresholds. Above ANSWER we respond, between CLARIFY and ANSWER we
// ask one short question, below CLARIFY we fall back.
const ANSWER = 0.62;
const CLARIFY = 0.4;

// Domains that have no resolver yet. We say so instead of inventing answers.
// Small talk that should never be swallowed by conversation context. A short
// "thanks" after an event answer is still small talk, not a follow up question.
const ALWAYS_SMALLTALK = new Set([
    'greeting', 'thanks', 'bye', 'howareyou', 'areyouai', 'whobuilt', 'identity',
    'capabilities', 'limitations', 'source', 'notsure', 'confusion', 'help',
]);

const UNBUILT_DOMAINS = new Set(['state', 'getting-started']);

let DEBUG = false;
export function setDebug(on) { DEBUG = !!on; }

function reply(text, extra = {}) {
    return { text, suggestions: [], ...extra };
}

/**
 * Process one message against a conversation state.
 * Returns { response, state } where response = { text, domain, intent,
 * confidence, sourceType, suggestions, debug }.
 */
export function processMessage(input, prevState) {
    let state = prevState ? { ...prevState } : createState();
    state.turn = (state.turn || 0) + 1;

    const text = String(input || '').trim();
    if (!text) return { response: reply('Ask me anything about TSA events, rules, or deadlines.'), state };

    const norm = normalize(text);
    const debug = { input: text, normalized: norm.joined };

    // Control intents run first, they change state rather than answer facts.
    const small = detectSmallTalk(norm, state);
    if (small?.control) {
        const handled = handleControl(small.intent, norm, state);
        if (handled) {
            debug.resolver = `control:${small.intent}`;
            return finish(handled.response, handled.state, debug);
        }
    }

    // Entities before small talk, so "can you help me with Webmaster" stays TSA.
    const division = findDivision(text);
    if (division) state.activeDivision = division;
    const resolved = resolveEvents(text, { activeDivision: state.activeDivision });
    debug.entities = resolved.events.map((e) => e.id);

    // Small talk is checked before domain routing so short messages such as
    // "thanks" are not inherited into the previous TSA domain.
    if (small && !small.control && !resolved.events.length && ALWAYS_SMALLTALK.has(small.intent)) {
        state.lastAnswerType = 'smalltalk';
        debug.resolver = `smalltalk:${small.intent}`;
        return finish(reply(small.text, { domain: 'smalltalk', intent: small.intent, confidence: 0.9 }), state, debug);
    }

    const domain = detectDomain(norm, state, { eventCount: resolved.events.length });
    debug.domain = domain.domain;
    debug.domainConfidence = domain.confidence;

    // A pending clarification consumes the next message.
    if (state.pendingClarification) {
        const pending = state.pendingClarification;
        if (resolved.events.length) {
            state = applyEvents(state, resolved.events);
            state.pendingClarification = null;
            const intent = pending.intent || state.lastIntent || 'overview.general';
            debug.resolver = 'clarification-resolved';
            return finish(answerWithIntent(intent, state, norm, text), state, debug);
        }
        if (resolved.ambiguous) {
            debug.resolver = 'clarification-still-ambiguous';
            return finish(fallback('ambiguous-event', { candidates: resolved.candidates }), state, debug);
        }
    }

    if (domain.domain === 'off-topic') {
        state.lastAnswerType = 'off-topic';
        debug.resolver = 'off-topic';
        return finish(reply(offTopicReply(text), { domain: 'off-topic', confidence: domain.confidence }), state, debug);
    }

    // Ambiguous event name, never guess.
    if (resolved.ambiguous) {
        state.pendingClarification = { need: 'event', intent: null, candidates: resolved.candidates };
        debug.resolver = 'ambiguous-event';
        return finish(fallback('ambiguous-event', { candidates: resolved.candidates }), state, debug);
    }

    if (resolved.events.length) state = applyEvents(state, resolved.events);

    const intentResult = detectIntent(norm, {
        eventCount: resolved.events.length || (state.activeEvent ? 1 : 0),
        state,
    });
    debug.intent = intentResult.intent;
    debug.intentConfidence = intentResult.confidence;

    // Inherit the previous intent for follow ups like "what about X?".
    let intent = intentResult.intent;
    let confidence = intentResult.confidence;

    // "What about Software Development?" carries an event but no topic of its
    // own, so it inherits whatever the user last asked.
    const eventOnly = intentResult.eventOnly && resolved.events.length > 0;
    if (eventOnly && state.lastIntent && state.lastIntent !== 'overview.general') {
        intent = state.lastIntent;
        confidence = 0.75;
        debug.inheritedContext = `intent:${intent}`;
    } else if ((!intent || confidence < CLARIFY) && resolved.events.length && state.lastIntent) {
        intent = state.lastIntent;
        confidence = 0.7;
        debug.inheritedContext = `intent:${intent}`;
    }

    // Nothing TSA about the message and no context to lean on.
    if (domain.domain === 'unknown' && !resolved.events.length && !state.activeEvent) {
        debug.resolver = 'unknown-no-context';
        return finish(fallback('unknown'), state, debug);
    }

    if (!intent) {
        // Domain detected but no specific intent. Try domain resolvers directly.
        if (domain.domain === 'deadlines') {
            const res = answerDeadline('deadline.all', { state: state.activeState });
            if (res) { state.activeDomain = 'deadlines'; debug.resolver = 'deadlines-fallback'; return finish(reply(res.text, { domain: 'deadlines', sourceType: res.sourceType }), state, debug); }
        }
        if (domain.domain === 'conference') {
            const res = answerConference('conference.search', norm.tokens);
            if (res) { state.activeDomain = 'conference'; debug.resolver = 'conference-fallback'; return finish(reply(res.text, { domain: 'conference', sourceType: res.sourceType }), state, debug); }
        }
        if (domain.domain === 'rules') {
            const eventId = state.activeEvent?.id || null;
            const res = answerRule(norm.tokens, { eventId, seed: text });
            if (res) { state.activeDomain = 'rules'; debug.resolver = 'rules-fallback'; return finish(reply(res.text, { domain: 'rules', sourceType: res.sourceType, source: res.source }), state, debug); }
        }
        if (UNBUILT_DOMAINS.has(domain.domain) && domain.confidence >= 0.6) {
            debug.resolver = 'unsupported-domain';
            return finish(fallback('unsupported-domain', { domain: domain.domain }), state, debug);
        }
        debug.resolver = 'fallback-unknown';
        return finish(fallback(domain.domain === 'unknown' ? 'unknown' : 'tsa-unsupported', { seed: text }), state, debug);
    }

    if (confidence < CLARIFY) {
        debug.resolver = 'low-confidence';
        return finish(fallback('tsa-unsupported', { seed: text }), state, debug);
    }

    // Slot filling.
    // Deadline intents.
    if (intent && intent.startsWith('deadline.')) {
        const res = answerDeadline(intent, { state: state.activeState });
        if (res) {
            state.activeDomain = 'deadlines';
            state.lastIntent = intent;
            state.lastAnswerType = 'fact';
            debug.resolver = 'deadlines'; return finish(reply(res.text, { domain: 'deadlines', intent, confidence, sourceType: res.sourceType, suggestions: ['When is nationals?', 'When are regionals?'] }), state, debug);
        }
    }

    // Conference intents.
    if (intent && intent.startsWith('conference.')) {
        const res = answerConference(intent, norm.tokens);
        if (res) {
            state.activeDomain = 'conference';
            state.lastIntent = intent;
            state.lastAnswerType = 'fact';
            debug.resolver = 'conference'; return finish(reply(res.text, { domain: 'conference', intent, confidence, sourceType: res.sourceType, suggestions: ['When is the conference?', 'Where is it?', 'What is the theme?'] }), state, debug);
        }
    }

    // Rule intents.
    if (intent && intent.startsWith('rule.')) {
        const eventId = state.activeEvent?.id || null;
        const res = answerRule(norm.tokens, { eventId, seed: text });
        if (res) {
            state.activeDomain = 'rules';
            state.lastIntent = intent;
            state.lastAnswerType = 'fact';
            debug.resolver = 'rules'; return finish(reply(res.text, { domain: 'rules', intent, confidence, sourceType: res.sourceType, source: res.source, suggestions: ['Can we use AI?', 'What is the dress code?', 'What about citations?'] }), state, debug);
        }
        debug.resolver = 'rules-miss'; return finish(fallback('tsa-unsupported', { seed: text }), state, debug);
    }

    if (REQUIRES_TWO_EVENTS.has(intent)) {
        const pair = state.activeEvents.length >= 2 ? state.activeEvents.slice(0, 2) : null;
        if (!pair) {
            state.pendingClarification = { need: 'events', intent };
            debug.resolver = 'need-second-event';
            return finish(fallback('need-second-event'), state, debug);
        }
    } else if (REQUIRES_EVENT.has(intent) && !state.activeEvent) {
        state.pendingClarification = { need: 'event', intent };
        debug.resolver = 'need-event';
        return finish(fallback('need-event'), state, debug);
    }

    if (confidence < ANSWER && REQUIRES_EVENT.has(intent) && !resolved.events.length && !state.activeEvent) {
        state.pendingClarification = { need: 'event', intent };
        debug.resolver = 'medium-confidence-clarify';
        return finish(fallback('need-event'), state, debug);
    }

    debug.resolver = REQUIRES_TWO_EVENTS.has(intent) ? 'compare' : 'events';
    return finish(answerWithIntent(intent, state, norm, text, confidence), state, debug);
}

function applyEvents(state, events) {
    const next = { ...state };
    if (events.length >= 2) {
        next.activeEvents = events.slice(0, 2);
        next.activeEvent = events[0];
    } else if (events.length === 1) {
        const e = events[0];
        // Keep a rolling pair so "compare them" works after two separate mentions.
        const prior = next.activeEvent;
        next.activeEvent = e;
        if (prior && prior.id !== e.id) next.activeEvents = [prior, e];
        else if (!next.activeEvents.some((x) => x.id === e.id)) next.activeEvents = [e];
    }
    next.activeDomain = 'events';
    return next;
}

function answerWithIntent(intent, state, norm, rawText, confidence = 0.8) {
    const asked = seasonInQuestion(rawText);

    // Deadline intents.
    if (intent && intent.startsWith('deadline.')) {
        const res = answerDeadline(intent, { state: state.activeState });
        if (res) {
            state.activeDomain = 'deadlines';
            state.lastIntent = intent;
            state.lastAnswerType = 'fact';
            debug.resolver = 'deadlines'; return finish(reply(res.text, { domain: 'deadlines', intent, confidence, sourceType: res.sourceType, suggestions: ['When is nationals?', 'When are regionals?'] }), state, debug);
        }
    }

    // Conference intents.
    if (intent && intent.startsWith('conference.')) {
        const res = answerConference(intent, norm.tokens);
        if (res) {
            state.activeDomain = 'conference';
            state.lastIntent = intent;
            state.lastAnswerType = 'fact';
            debug.resolver = 'conference'; return finish(reply(res.text, { domain: 'conference', intent, confidence, sourceType: res.sourceType, suggestions: ['When is the conference?', 'Where is it?', 'What is the theme?'] }), state, debug);
        }
    }

    // Rule intents.
    if (intent && intent.startsWith('rule.')) {
        const eventId = state.activeEvent?.id || null;
        const res = answerRule(norm.tokens, { eventId, seed: rawText });
        if (res) {
            state.activeDomain = 'rules';
            state.lastIntent = intent;
            state.lastAnswerType = 'fact';
            debug.resolver = 'rules'; return finish(reply(res.text, { domain: 'rules', intent, confidence, sourceType: res.sourceType, source: res.source, suggestions: ['Can we use AI?', 'What is the dress code?', 'What about citations?'] }), state, debug);
        }
        return fallback('tsa-unsupported', { seed: rawText });
    }

    if (REQUIRES_TWO_EVENTS.has(intent)) {
        const res = answerCompare(state.activeEvents.slice(0, 2), intent);
        if (!res) return fallback('need-second-event');
        state.lastIntent = intent;
        state.lastResolvedIntent = intent;
        state.lastAnswerType = 'compare';
        return reply(res.text, {
            domain: 'events', intent, confidence,
            sourceType: res.sourceType,
            suggestions: followupsFor(intent),
        });
    }

    const event = state.activeEvent;
    const res = answerEventIntent(event, intent, { style: state.answerStyle, seed: event?.id || '' });
    if (!res) return fallback('tsa-unsupported', { seed: rawText });

    let text = res.text;
    const warn = freshnessWarning(asked, event?.season);
    if (warn) text = `${warn} Here is what I have: ${text}`;

    state.lastIntent = intent;
    state.lastResolvedIntent = intent;
    state.lastAnswerType = res.missing ? 'missing' : 'fact';

    return reply(text, {
        domain: 'events',
        intent,
        confidence,
        sourceType: res.sourceType,
        source: event ? { title: event.name, season: event.season, section: intent.split('.')[0] } : null,
        suggestions: res.missing ? [] : followupsFor(intent, { event }),
    });
}

function handleControl(intent, norm, state) {
    switch (intent) {
        case 'restart':
            return { response: reply('Starting fresh. What would you like to know about TSA?'), state: resetState(state) };
        case 'style.simple':
        case 'style.short': {
            const next = { ...state, answerStyle: 'short' };
            if (next.lastIntent && next.activeEvent) {
                return { response: answerWithIntent(next.lastIntent, next, norm, ''), state: next };
            }
            return { response: reply("Sure, I'll keep it short. What would you like to know?"), state: next };
        }
        case 'style.detail': {
            const next = { ...state, answerStyle: 'detailed' };
            if (next.lastIntent && next.activeEvent) {
                return { response: answerWithIntent(next.lastIntent, next, norm, ''), state: next };
            }
            return { response: reply('Happy to go deeper. Which event or requirement?'), state: next };
        }
        case 'repeat': {
            if (state.lastIntent && state.activeEvent) {
                return { response: answerWithIntent(state.lastIntent, { ...state }, norm, ''), state };
            }
            return { response: reply("I haven't answered anything yet. What would you like to know?"), state };
        }
        case 'correction': {
            const resolved = resolveEvents(norm.original, { activeDivision: state.activeDivision });
            const div = findDivision(norm.original);
            let next = { ...state };
            if (div) next.activeDivision = div;
            if (resolved.ambiguous) {
                next.pendingClarification = { need: 'event', intent: state.lastIntent };
                return { response: fallback('ambiguous-event', { candidates: resolved.candidates }), state: next };
            }
            if (resolved.events.length) {
                next = applyEvents(next, resolved.events);
                const intent = state.lastIntent || 'overview.general';
                return { response: answerWithIntent(intent, next, norm, norm.original), state: next };
            }
            if (div && state.lastIntent && next.activeEvent) {
                return { response: answerWithIntent(state.lastIntent, next, norm, norm.original), state: next };
            }
            return { response: reply('Got it. Which event did you mean?'), state: next };
        }
        case 'affirm': {
            if (state.pendingClarification?.candidates?.length === 1) {
                const next = applyEvents({ ...state, pendingClarification: null }, state.pendingClarification.candidates);
                const intent = state.pendingClarification.intent || 'overview.general';
                return { response: answerWithIntent(intent, next, norm, ''), state: next };
            }
            return null;
        }
        case 'deny':
            return { response: reply('No problem. What did you mean?'), state: { ...state, pendingClarification: null } };
        default:
            return null;
    }
}

function finish(response, state, debug) {
    const out = { ...response };
    if (DEBUG) {
        out.debug = { ...debug, result: out.text?.slice(0, 60) };
        // eslint-disable-next-line no-console
        console.log('[coach]', out.debug);
    }
    return { response: out, state };
}

// Module level state keeps the existing one argument API working unchanged.
let sharedState = createState();

export function answer(userText) {
    const { response, state } = processMessage(userText, sharedState);
    sharedState = state;
    return response;
}

export function resetConversation() {
    sharedState = createState();
}

export function getConversationState() {
    return sharedState;
}
