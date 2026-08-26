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
import { answerState } from './resolvers/state.js';
import { answerGeneral } from './resolvers/general.js';
import { answerCapabilityLimit, answerNationalContactInfo } from './resolvers/capability.js';
import { TSA_HUB_SUPPORT_EMAIL, SUPPORT_CATEGORIES } from '../../data/contacts.js';
import { STATE_TSA, US_STATES } from '../../data/stateTsa.js';
import { followupsFor } from './suggestions/followups.js';
import { seasonInQuestion, freshnessWarning } from './guards/dataGuards.js';
import { createState, resetState } from './conversation/state.js';

// Confidence thresholds. Above ANSWER we respond, between CLARIFY and ANSWER we
// ask one short question, below CLARIFY we fall back.

// Detect a US state name in a message. Returns the canonical name or null.
// Checks every real US state name (not just the ones with STATE_TSA data),
// so "what's the website for Wyoming" gets an honest "not on file" answer
// from answerState() instead of a generic "which state?" that ignores the
// state the user clearly already named.
function detectStateName(text) {
    const t = (text || '').toLowerCase();
    for (const name of US_STATES) {
        if (t.includes(name.toLowerCase())) return name;
    }
    return null;
}

const ANSWER = 0.62;
const CLARIFY = 0.4;

// Domains that have no resolver yet. We say so instead of inventing answers.
// Small talk that should never be swallowed by conversation context. A short
// "thanks" after an event answer is still small talk, not a follow up question.
const ALWAYS_SMALLTALK = new Set([
    'greeting', 'thanks', 'bye', 'howareyou', 'areyouai', 'whobuilt', 'identity',
    'capabilities', 'limitations', 'source', 'notsure', 'confusion', 'help',
]);

const UNBUILT_DOMAINS = new Set([]);

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

    // A guided TSA Hub support draft in progress only consumes messages it
    // genuinely needs (the drafted text itself, or an explicit send/cancel)
    // — "cancel" always works, and a real question typed while a draft
    // sits waiting on "send" still gets answered normally rather than
    // being swallowed as a replacement message (the draft just stays
    // pending, untouched, until the user actually confirms or cancels it).
    if (state.supportFlow) {
        const flow = state.supportFlow;
        const lower = text.toLowerCase().trim();
        const isCancel = /\b(cancel|never ?mind|nvm|forget it|stop)\b/.test(lower);
        // Anchored to the WHOLE message (not just a leading word) — "yes but
        // also when are nationals" must fall through and answer the real
        // question, not get swallowed as a bare confirm of the pending draft.
        const isConfirm = /^(send|yes|confirm|go ahead|do it)[!.\s]*$/.test(lower);
        const awaitingText = flow.step === 'awaiting_message' || flow.step === 'awaiting_message_after_category';
        if (isCancel || awaitingText || (flow.step === 'confirm' && isConfirm)) {
            debug.resolver = `support-flow:${flow.step}`;
            return finish(handleSupportFlow(text, state), state, debug);
        }
        // Otherwise: fall through to normal processing below, draft untouched.
    }

    // What the user typed the turn before this one — used to auto-draft a
    // TSA Hub support message from context instead of asking them to
    // retype a problem they just described (e.g. right after a capability
    // limit like "can you text them").
    const prevUserText = state.lastUserText || null;
    state.lastUserText = text;

    // Control intents run first, they change state rather than answer facts.
    const small = detectSmallTalk(norm, state);
    if (small?.control) {
        const handled = handleControl(small.intent, norm, state, prevUserText);
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

    // State name detection — if the message mentions a US state by name and
    // matches a state intent, answer immediately without needing domain signals.
    const mentionedState = detectStateName(text);
    if (mentionedState) state.activeState = mentionedState;
    const stateIntent = detectIntent(norm, { eventCount: 0, state }).intent;
    if (stateIntent && stateIntent.startsWith('state.') && (mentionedState || state.activeState)) {
        const sres = answerState(stateIntent, { stateName: state.activeState });
        if (sres && !sres.needState) {
            state.activeDomain = 'state';
            state.lastIntent = stateIntent;
            state.lastAnswerType = sres.missing ? 'missing' : 'fact';
            debug.resolver = 'state-early';
            return finish(reply(sres.text, { domain: 'state', intent: stateIntent, confidence: 0.9, sourceType: sres.sourceType, suggestions: ['Who is my state advisor?', 'What is my state website?', 'State officer team'] }), state, debug);
        }
    }


    // Small talk is checked before domain routing so short messages such as
    // "thanks" are not inherited into the previous TSA domain.
    if (small && !small.control && !resolved.events.length && ALWAYS_SMALLTALK.has(small.intent)) {
        state.lastAnswerType = 'smalltalk';
        debug.resolver = `smalltalk:${small.intent}`;
        return finish(reply(small.text, { domain: 'smalltalk', intent: small.intent, confidence: 0.9 }), state, debug);
    }

    // A purely fuzzy event match (edit-distance guess, e.g. "weather" ~
    // "teacher") is too weak on its own to suppress off-topic detection —
    // otherwise "whats weather tomorrow" answers with an unrelated TSA event
    // instead of recognizing it isn't a TSA question at all. Confident
    // matches (exact name/alias/compact/word-overlap) still count normally.
    const confidentEventCount = resolved.fuzzy ? 0 : resolved.events.length;
    const domain = detectDomain(norm, state, { eventCount: confidentEventCount });
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
        // A bare division reply ("middle school") to a division-ambiguity
        // clarification names no event on its own, so resolveEvents finds
        // nothing above — pick the candidate matching the stated division.
        if (division && pending.candidates?.length) {
            const match = pending.candidates.find((c) => c.division === division);
            if (match) {
                state = applyEvents(state, [match]);
                state.pendingClarification = null;
                const intent = pending.intent || state.lastIntent || 'overview.general';
                debug.resolver = 'clarification-resolved-by-division';
                return finish(answerWithIntent(intent, state, norm, text), state, debug);
            }
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

    // If the user is in a state conversation and a state intent is in alternatives, prefer it.
    if (state.activeDomain === 'state' && state.activeState && intentResult.alternatives) {
        const stateAlt = intentResult.alternatives.find((a) => a.startsWith('state.'));
        if (stateAlt) {
            intent = stateAlt;
            confidence = 0.85;
            debug.inheritedContext = 'state-domain-preference';
        }
    }

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

    // Nothing TSA about the message and no context to lean on. Gated on
    // `!intent` too — the coarser keyword-based domain classifier not
    // recognizing a message (e.g. capability requests like "can you text
    // them" use none of DOMAIN_SIGNALS' words) must never discard an
    // intent the more specific PHRASES/TOKEN_INTENTS router already found
    // with real confidence.
    if (domain.domain === 'unknown' && !intent && !resolved.events.length && !state.activeEvent) {
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
        if (domain.domain === 'state') {
            const mentioned = detectStateName(text);
            if (mentioned) state.activeState = mentioned;
            const res = answerState('state.general', { stateName: state.activeState });
            if (res) { state.activeDomain = 'state'; debug.resolver = 'state-fallback'; return finish(reply(res.text, { domain: 'state', sourceType: res.sourceType }), state, debug); }
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

    // Capability-limit: the request was understood perfectly, the Coach
    // just can't perform an outbound action itself. Not a misunderstanding —
    // response carries no `kind`, so it never touches misunderstandingCount.
    if (intent === 'capability.outboundContact') {
        const res = answerCapabilityLimit(text);
        state.activeDomain = 'capability';
        state.lastIntent = intent;
        state.lastAnswerType = 'fact';
        debug.resolver = 'capability';
        return finish(reply(res.text, { domain: 'capability', intent, confidence, sourceType: 'official', suggestions: res.suggestions }), state, debug);
    }

    // Factual National TSA contact info — real, sourced data, not a limit.
    if (intent === 'contact.nationalInfo') {
        const res = answerNationalContactInfo();
        state.activeDomain = 'capability';
        state.lastIntent = intent;
        state.lastAnswerType = 'fact';
        debug.resolver = 'contact-national';
        return finish(reply(res.text, { domain: 'capability', intent, confidence, sourceType: 'official', suggestions: res.suggestions, mailto: res.mailto }), state, debug);
    }

    // General/getting-started intents.
    if (intent && intent.startsWith('general.')) {
        const res = answerGeneral(intent, norm.tokens, text);
        if (res) {
            state.activeDomain = 'general';
            state.lastIntent = intent;
            state.lastAnswerType = 'fact';
            debug.resolver = 'general';
            return finish(reply(res.text, { domain: 'general', intent, confidence, sourceType: res.sourceType, suggestions: ['What is TSA?', 'How do competitions work?', 'How do I get started?'] }), state, debug);
        }
    }

    // State intents.
    if (intent && intent.startsWith('state.')) {
        // Try to detect a state name in the message, fall back to conversation state.
        const mentioned = detectStateName(text);
        if (mentioned) state.activeState = mentioned;
        const res = answerState(intent, { stateName: state.activeState });
        if (res) {
            state.activeDomain = 'state';
            state.lastIntent = intent;
            state.lastAnswerType = res.missing ? 'missing' : 'fact';
            if (res.needState) {
                state.pendingClarification = { need: 'state', intent };
            }
            debug.resolver = 'state';
            return finish(reply(res.text, { domain: 'state', intent, confidence, sourceType: res.sourceType, suggestions: ['Who is my state advisor?', 'What is my state website?', 'State officer team'] }), state, debug);
        }
    }

    // "what events are best for software developer major" — search by career tag
    if (intent === 'career.byMajor') {
        const text_lower = text.toLowerCase();
        const CAREER_MAP = {
            'software': 'software', 'software dev': 'software', 'software developer': 'software',
            'app dev': 'software', 'web dev': 'web-dev', 'web developer': 'web-dev',
            'data science': 'data-science', 'data scientist': 'data-science', 'data analyst': 'data-science',
            'ai': 'ai', 'machine learning': 'ai', 'artificial intelligence': 'ai',
            'cybersecurity': 'cybersecurity', 'cyber': 'cybersecurity',
            'robotics': 'robotics', 'engineering': 'mechanical-eng',
            'aerospace': 'aerospace', 'aviation': 'aerospace',
            'architecture': 'architecture', 'civil': 'civil-eng',
            'manufacturing': 'manufacturing', 'design': 'design', 'graphic': 'design',
            'marketing': 'marketing', 'business': 'business',
            'film': 'media-film', 'video': 'media-film', 'media': 'media-film', 'music': 'media-film',
            'medicine': 'medicine', 'medical': 'medicine', 'health': 'medicine',
            'education': 'education', 'teaching': 'education', 'fashion': 'fashion',
            'research': 'research-science', 'science': 'research-science', 'biology': 'biotech',
        };
        let careerKey = null;
        for (const [word, key] of Object.entries(CAREER_MAP)) {
            if (text_lower.includes(word)) { careerKey = key; break; }
        }
        const careerLabel = careerKey ? careerKey.replace(/-/g, ' ') : 'that field';
        const CAREER_EVENTS = {
            'software': 'Software Development, Webmaster, Coding, Data Science and Analytics, and Cybersecurity (HS). In Middle School: Coding, Data Science, Cybersecurity, and Microcontroller Design.',
            'web-dev': 'Webmaster and Software Development (HS), or Website Design (MS).',
            'data-science': 'Data Science and Analytics (HS and MS), Coding, and Software Development.',
            'ai': 'Artificial Intelligence (AI) and Data Science and Analytics (HS).',
            'cybersecurity': 'Cybersecurity (HS and MS) and Coding.',
            'mechanical-eng': 'Engineering Design, Animatronics, Robotics, Manufacturing Prototype, and Drone Challenge (HS).',
            'aerospace': 'Drone Challenge, Flight Endurance, Transportation Modeling, and Robotics.',
            'civil-eng': 'Architectural Design, Structural Design and Engineering, and CAD events.',
            'architecture': 'Architectural Design, Interior Design, and CAD Architecture.',
            'design': 'Webmaster, Promotional Design, and CAD events.',
            'marketing': 'Promotional Design and Fashion Design and Technology.',
            'business': 'Fashion Design and Technology, Chapter Team, and Promotional Design.',
            'media-film': 'Digital Video Production, Vlogging, On Demand Video, Audio Podcasting, and Music Production.',
            'medicine': 'Biotechnology Design and Forensic Science (HS), Medical Technology and Forensic Technology (MS).',
            'research-science': 'Data Science and Analytics, Biotechnology Design, and Forensic Science.',
            'game-dev': 'Video Game Design (HS and MS) and Virtual Reality Simulation.',
            'robotics': 'Robotics, Animatronics, Drone Challenge, and System Control Technology.',
            'fashion': 'Fashion Design and Technology.',
        };
        const eventsText = CAREER_EVENTS[careerKey] || 'Check events in the Engineering, Computing, or Design categories that relate to your field.';
        const msg = careerKey
            ? ('For a ' + careerLabel + ' career path, strong TSA events include ' + eventsText)
            : 'It depends on the career area. Ask me something like "what events connect to software careers" or "what events are good for engineering?"';
        debug.resolver = 'career.byMajor';
        return finish(reply(msg, { domain: 'careers', intent, confidence, sourceType: 'derived',
            suggestions: ['What careers does Software Development lead to?', 'Which events connect to engineering?'] }), state, debug);
    }

    // advisor.meaning — general explanation, no event needed
    if (intent === 'advisor.meaning') {
        debug.resolver = 'advisor.meaning';
        return finish(reply(
            'State advisor approval means your state TSA advisor must approve your entry before you can register for that event at the national conference. Events marked with an asterisk (*) require this. Contact your chapter advisor first, and they will work with the state advisor to get approval.',
            { domain: 'rules', intent, confidence, sourceType: 'official',
              suggestions: ['Which events need state advisor approval?', 'What do I need to submit?'] }
        ), state, debug);
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

// Handles the two intent families NOT already resolved earlier in
// processMessage (event comparisons and single-event answers). Every other
// intent family (deadline./conference./rule./general./state./career.byMajor/
// advisor.meaning) is fully handled in processMessage itself before this is
// ever called — processMessage either returns unconditionally for those
// intents, or (for deadline/conference/general/state specifically) only
// falls through here when its own resolver attempt already returned falsy,
// which a duplicate identical attempt can't turn into a truthy result. This
// function used to re-implement all of those branches too; that dead code
// was removed after it accumulated two separate ReferenceErrors (undefined
// `debug`, then undefined `text`) that nothing ever caught because nothing
// ever executed it.
function answerWithIntent(intent, state, norm, rawText, confidence = 0.8) {
    const asked = seasonInQuestion(rawText);

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

function handleControl(intent, norm, state, prevUserText) {
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
        case 'requestSupport': {
            // A direct ask ("contact support", "human please") opens the
            // real TSA Hub Support flow (category -> message -> confirm),
            // not National TSA's info — those are two different
            // destinations and must not be conflated (see contacts.js).
            const next = { ...state, misunderstandingCount: 0 };
            return { response: startSupportFlow(next, prevUserText), state: next };
        }
        case 'keepTrying':
            return { response: reply("Sure — what would you like to know?"), state: { ...state, misunderstandingCount: 0 } };
        default:
            return null;
    }
}

// --- TSA Hub Support flow ------------------------------------------------
// Guided draft: (context-aware auto-draft, or one question for the
// message) -> preview -> explicit "send" before anything is prepared.
// Never claims delivery happened — the final step hands the user a real
// mailto: link they have to actually send themselves, since there is no
// backend email endpoint in this app to deliver through. A real question
// asked while a draft sits waiting on "send" is answered normally instead
// of being swallowed (see the isConfirm/isCancel gate in processMessage) —
// only the confirm/cancel keywords and the direct answer to "what do you
// need help with" are treated as flow input.

function startSupportFlow(state, prevUserText) {
    // If the immediately preceding message already explains the problem
    // (e.g. a capability-limit trigger like "can you text them"), draft
    // from it directly instead of making the student retype it.
    const context = prevUserText && prevUserText.length > 3 ? prevUserText : null;
    if (context) {
        const category = 'TSA Coach';
        const message = `TSA Coach didn't fully resolve my question: "${context}"`;
        state.supportFlow = { step: 'confirm', category, message };
        return previewReply(category, message);
    }
    state.supportFlow = { step: 'awaiting_message' };
    return reply('What would you like help with? Pick a category or just tell me the issue.', { suggestions: SUPPORT_CATEGORIES.slice(0, 6) });
}

function matchCategory(text) {
    const lower = text.toLowerCase();
    return SUPPORT_CATEGORIES.find((c) => lower.includes(c.toLowerCase())) || 'Something else';
}

function supportMailto(category, message) {
    const subject = encodeURIComponent(`TSA Hub Support — ${category}`);
    const body = encodeURIComponent(`Category: ${category}\n\n${message}\n\n(Sent from TSA Coach)`);
    return `mailto:${TSA_HUB_SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
}

function previewReply(category, message) {
    return reply(
        `Here's what I'll prepare:\n\nCategory: ${category}\nMessage: "${message}"\n\nType "send" to confirm, or "cancel" to stop.`,
        { suggestions: ['send', 'cancel'] }
    );
}

function handleSupportFlow(text, state) {
    const flow = state.supportFlow;
    const lower = text.toLowerCase().trim();

    if (/\b(cancel|never ?mind|nvm|forget it|stop)\b/.test(lower)) {
        state.supportFlow = null;
        return reply("No problem — let me know if you need anything else.");
    }

    if (flow.step === 'awaiting_message') {
        const trimmed = text.trim();
        const category = matchCategory(trimmed);
        // A bare category chip click ("TSA Coach") still needs an actual
        // message — ask once more instead of drafting "Message: TSA Coach".
        if (category.toLowerCase() === trimmed.toLowerCase()) {
            state.supportFlow = { step: 'awaiting_message_after_category', category };
            return reply(`Got it — ${category}. What would you like to ask or get help with?`);
        }
        state.supportFlow = { step: 'confirm', category, message: trimmed };
        return previewReply(category, trimmed);
    }

    if (flow.step === 'awaiting_message_after_category') {
        const message = text.trim();
        state.supportFlow = { step: 'confirm', category: flow.category, message };
        return previewReply(flow.category, message);
    }

    // flow.step === 'confirm', and the early gate in processMessage already
    // confirmed this text matches the send keyword.
    const mailto = supportMailto(flow.category, flow.message);
    state.supportFlow = null;
    return reply(
        `Your message is ready — I've prepared an email to TSA Hub support (${TSA_HUB_SUPPORT_EMAIL}). Open it below and hit send from your email app to finish. I can't confirm it's received until you do.`,
        { mailto, suggestions: [] }
    );
}

// Consecutive GENUINE misunderstandings only — kind 'unknown' / 'tsa-unsupported'
// (the Coach truly has no idea what was asked). Clarifications that
// successfully identified what more is needed (which state, MS or HS, which
// event, a missing date) and "I don't have that specific data" answers are
// NOT misunderstandings and reset the counter, same as any normally
// answered question. See fallback.js for the 'kind' values this reads.
const MISUNDERSTANDING_KINDS = new Set(['unknown', 'tsa-unsupported']);

const MISUNDERSTANDING_TEXT = [
    null, // index 0 unused
    "I'm not totally sure what you mean. What are you trying to figure out?",
    "I'm still missing part of what you're asking. Is this about an event, a rule, a deadline, your state TSA, or something else?",
];
const SUPPORT_OFFER_TEXT = "I'm still having trouble understanding what you need. Would you like me to send your question to the TSA Hub support team?";

function trackMisunderstanding(response, state) {
    if (!MISUNDERSTANDING_KINDS.has(response.kind)) {
        state.misunderstandingCount = 0;
        return response;
    }
    const n = (state.misunderstandingCount = (state.misunderstandingCount || 0) + 1);
    if (n >= 3) {
        state.misunderstandingCount = 0; // takes 3 more before offering again
        return { ...response, text: SUPPORT_OFFER_TEXT, suggestions: ['Contact support', 'Keep trying'], supportOffer: true };
    }
    return { ...response, text: MISUNDERSTANDING_TEXT[n] };
}

function finish(response, state, debug) {
    const out = { ...trackMisunderstanding(response, state) };
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
