import { normalize } from './language/normalize.js';
import { resolveEvents, findDivision } from './entities/events.js';
import { detectDomain } from './router/domainRouter.js';
import { detectIntent, REQUIRES_EVENT, REQUIRES_TWO_EVENTS } from './router/intentRouter.js';
import { answerEventIntent } from './resolvers/events.js';
import { answerEventFilter } from './resolvers/eventFilters.js';
import { getEvents } from './dataProvider.js';
import { answerCompare } from './resolvers/compare.js';
import { detectSmallTalk, offTopicReply } from './resolvers/smalltalk.js';
import { fallback } from './resolvers/fallback.js';
import { answerDeadline } from './resolvers/deadlines.js';
import { answerRule } from './resolvers/rules.js';
import { answerConference } from './resolvers/conference.js';
import { answerState } from './resolvers/state.js';
import { answerGeneral } from './resolvers/general.js';
import { answerCapabilityLimit, answerNationalContactInfo } from './resolvers/capability.js';
import { resolveNavigation } from './resolvers/navigation.js';
import { getDestination } from './knowledge/appDestinations.js';
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

// Vague pronoun-driven follow-ups ("what about that", "is that right", "how
// many") that carry no topic of their own — only meaningful when there's a
// real prior topic + event to resolve the pronoun against (checked by the
// caller), this just recognizes the SHAPE of a follow-up.
const VAGUE_FOLLOWUP_RE = /(\bwhat about (that|it|this part|the other thing|middle school|high school)\b)|(\band (that|this|for that)\b)|(\band (then )?what\b)|(\bthen what\b)|(^what next\b)|(\bafter that\b)|(\bwhat happens (after|before)\b)|(\bis (that|it) (different|the same|okay|right)\b)|(\bdoes (that|this) (apply to me|count)\b)|(\bwould that work\b)|(\bis this allowed\b)|(\bso (can|we can|we cant|we can not)( i)?\b)|(^how many\??$)|(^how much\??$)|(\bwhat else\b)|(\banything else\b)|(\bis that all\b)|(\banything important\b)|(\bdoes it matter\b)|(\bso is that true\b)|(\bis that true for (middle|high) school too\b)|(\bdoes that change anything\b)|(\bwould that still work\b)|(\bis that the same everywhere\b)|(\bwhat happens then\b)|(^(why|how|when|where|who)[?.\s]*$)|(^and( if (not|so))?[?.\s]*$)/;
function looksVagueFollowup(text) {
    return VAGUE_FOLLOWUP_RE.test(text);
}

// Distinguishes a real question ("what percentage of Webmaster teams win")
// from a bare context statement ("im doing webmaster") when both resolve an
// event but match no specific intent — a wh-word/question shape means Coach
// should admit it doesn't have that data, not just acknowledge the event.
const QUESTION_SHAPE_RE = /^(what|who|when|where|why|how|which|is|are|do|does|did|can|will|would)\b|\?\s*$|\bpercent(age)?\b/i;
function looksLikeQuestion(text) {
    return QUESTION_SHAPE_RE.test((text || '').trim());
}

// "what is X" / "tell me about X" / "rules for X" where X is a multi-word
// phrase that resolveEvents couldn't match to anything — X reads as a
// specific (fake) event name attempt, not a generic "which event?" ask.
// Deliberately requires 2+ real words in X: a single generic word ("what is
// the theme", "tell me about it") is a genuine missing-context question, not
// a named-but-nonexistent event.
// Checked in order, MOST specific first — "rules for X" must win over the
// looser "what is X" even when both technically appear in the same message
// ("what are the rules for X"), or the captured "name" ends up being
// "rules for X" instead of just X.
const EVENT_NAME_ATTEMPT_PATTERNS = [
    /\brules for\s+(?:the\s+)?(.+?)[?.\s]*$/i,
    /\brules of\s+(?:the\s+)?(.+?)[?.\s]*$/i,
    /\brequirements for\s+(?:the\s+)?(.+?)[?.\s]*$/i,
    /\btell me about\s+(?:the\s+)?(.+?)[?.\s]*$/i,
    /\bhow does\s+(?:the\s+)?(.+?)\s+work[?.\s]*$/i,
    /\bwhat('?s| is| are)\s+(?:the\s+)?(.+?)(?:\s+(?:work|event|about))?[?.\s]*$/i,
];
const NAME_ATTEMPT_STOPWORDS = new Set(['it', 'that', 'this', 'them', 'those', 'the', 'a', 'an', 'theme', 'rules', 'rule', 'deadline', 'cost', 'team']);
// Real event names are never dates/schedule phrasing — "what's happening
// february 30" is a (garbage) calendar question, not an attempted event
// name, even though it matches the same "what is X" shape.
const NAME_ATTEMPT_REJECT_RE = /\d|\b(happening|going on|next week|next month|this week|this month|january|february|march|april|may|june|july|august|september|october|november|december)\b/i;
function extractAttemptedEventName(text) {
    const t = text || '';
    for (const re of EVENT_NAME_ATTEMPT_PATTERNS) {
        const m = t.match(re);
        if (!m) continue;
        const name = m[m.length - 1].trim();
        if (NAME_ATTEMPT_REJECT_RE.test(name)) return null;
        const words = name.split(/\s+/).filter((w) => w && !NAME_ATTEMPT_STOPWORDS.has(w.toLowerCase()));
        if (words.length < 2) return null;
        return name;
    }
    return null;
}

// A lighter version of intentRouter's question.opening PHRASE, used only to
// preempt division-ambiguity clarification (see resolveEvents.ambiguous
// below) — deliberately narrower than the real PHRASE since this only needs
// to catch the "announcing a question, not asking one yet" shape.
// A question about a SPECIFIC future year/edition Coach has no way to know
// ("what will robotics theme be in 2035", "what hotel will tsa use in
// 2030") — never answer with current-year data as if it answered the future
// question; that's exactly the "confident wrong answer" mission section 34
// warns against.
const FUTURE_PREDICTION_RE = /\b(in|for) 20[3-9]\d\b|\bnext years?\b.{0,15}\b(theme|challenge|problem|location|hotel|host)\b|\bfuture (theme|challenge|problem)\b|\bwill (the |next years? )?(theme|challenge|hotel|location) be\b/i;
const QUESTION_OPENING_PREEMPT_RE = /(\bi (have|got|need to ask|want to ask)( a| something| about)?\b.{0,25}\bquestion\b)|(\bgot a question\b)|(\bquick question\b)|(\bcan i ask (you|u)?( a| something)?\b)|(\bi (want to|need to) ask (you |u )?(about|something)\b)|(\bquestion about\b)|(\bquestion for (you|u)\b)/;

// Cross-event descriptive/filter queries ("solo events", "low cost events",
// "events for coding", "I like coding") describe a KIND of event, not one
// specific event — resolveEvents() must never see these, since a
// coincidental real event name inside the phrase (e.g. "Coding") would
// hijack the whole question into a single ambiguous-event lookup instead of
// a list across events. Checked, and dispatched, before resolveEvents() runs
// at all. Matched against norm.rawJoined (post-contraction, post-punctuation)
// so "don't"/"dont" and "what's"/"whats" are both covered without duplicating
// every alternative by hand.
// Deliberately restricted to short messages — these are canonical
// suggestion-style questions ("events for coding", 3 words), not a signal to
// look for inside a long multi-clause sentence that happens to mention an
// event in passing (that stays with the existing multi-intent handling).
const FILTER_QUERY_MAX_WORDS = 9;

const FILTER_PATTERNS = [
    { kind: 'solo', re: /\bwhat events? can i do solo\b|\bwhat can i do solo\b|\bwhat events? are individual\b|\bindividual events?\b|\bsolo events?\b|\bcan i compete as an individual\b|\bevents? i can do (alone|solo|by myself)\b|\bevents? (that )?(allow|permit) (solo|individual) (entry|entries|participation)\b/ },
    { kind: 'team', re: /\bteam events?\b|\bevents? (that )?(need|require) a team\b|\bwhat events? (need|require) a team\b/ },
    { kind: 'costLow', re: /\blow(er)? cost events?\b|\bcheap(er)? events?\b|\bcheapest events?\b|\baffordable events?\b|\bwhat (is|are) the (low cost|cheap|cheapest|affordable) events?\b/ },
    { kind: 'beginner', re: /\bbeginner friendly events?\b|\beasy events? for beginners?\b|\bgood first events?\b|\bevents? (are |that are )?good for beginners?\b|\beasiest events? to start with\b|\bevents? for (a )?beginners?\b|\bwhat (is|are) (a |the )?beginner friendly events?\b/ },
    { kind: 'noPresent', re: /\bevents? without (much )?presenting\b|\bevents? that (dont|do not) (need|require|have) (much )?presenting\b/ },
    { kind: 'lowEquipment', re: /\bevents? (that )?(dont|do not) need (much )?equipment\b|\bevents? with (little|no|not much) equipment\b/ },
    { kind: 'noPreconference', re: /\bevents? (that have |with )?no preconference submission\b|\bwhich events? have no preconference submission\b/ },
    { kind: 'materialsNeeded', re: /\bevents? need materials or supplies\b|\bevents? that need materials\b|\bwhat events? need (materials|supplies)\b/ },
];

// Cross-event CAREER filters ("which events connect to software careers")
// reuse the same weighted `careers` map already used per-event by the
// existing career.general intent — never an invented mapping.
const CAREER_FILTER_PATTERNS = [
    { re: /\bsoftware careers?\b/, keys: ['software'] },
    { re: /\bengineering majors?\b/, keys: ['mechanical-eng', 'civil-eng', 'electrical-eng'] },
    { re: /\binterested in medicine\b|\bmedicine careers?\b/, keys: ['medicine'] },
    { re: /\baerospace careers?\b/, keys: ['aerospace'] },
    { re: /\beducation majors?\b/, keys: ['education'] },
    { re: /\bcomputer science\b/, keys: ['software', 'cybersecurity', 'ai', 'data-science'] },
    { re: /\bgame development\b/, keys: ['game-dev'] },
];

function detectCareerFilter(text) {
    if (!/\bevents?\b/.test(text)) return null;
    for (const { re, keys } of CAREER_FILTER_PATTERNS) {
        if (re.test(text)) return { kind: 'career', careers: keys };
    }
    return null;
}

// Words that map a captured interest/category word to the real projectType
// tag (or, for "video", the closest real category) that events.js data
// actually carries — never an invented classification.
const FILTER_INTEREST_WORDS = {
    coding: 'code', programming: 'code', code: 'code', software: 'code',
    building: 'build', builders: 'build', builder: 'build', build: 'build',
    design: 'design', designing: 'design',
    video: 'video', film: 'video', media: 'video',
};

function detectFilterKeywordInterest(text) {
    const framed = text.match(/\bevents?\s+(?:for|involving|involve|about)\s+([a-z]+)\b/);
    if (framed) {
        const key = FILTER_INTEREST_WORDS[framed[1]];
        return key ? { kind: 'interest', interest: key } : null;
    }
    // Bare "X event(s)" (no framing preposition) is the one shape that can
    // coincide with a REAL event's own name — "coding" is literally the name
    // of a real TSA event. "coding events"/"coding event" alone still reads
    // as a category ask (mission's own example), but "the coding event" or
    // "what is the coding event" names ONE specific thing via the definite
    // article, and must fall through to normal event-name resolution instead
    // of being swallowed here.
    const bare = text.match(/\b(the\s+)?([a-z]+)\s+events?\b/);
    if (!bare || bare[1]) return null;
    const key = FILTER_INTEREST_WORDS[bare[2]];
    return key ? { kind: 'interest', interest: key } : null;
}

// Bare preference STATEMENTS ("I like coding", "I want a team event") carry
// the exact same event-name-collision risk as the questions above.
function detectPreferenceFilter(text) {
    if (/\bi (dont|do not) (like|want)( to)? presenting\b|\bi (hate|dislike) presenting\b/.test(text)) return { kind: 'noPresent' };
    if (/\bi want (a |an )?team event\b|\bi want to (work|be) (with|on) a team\b/.test(text)) return { kind: 'team' };
    if (/\bi want (a |an )?solo event\b|\bi want to work alone\b|\bi want to compete (solo|alone|by myself)\b/.test(text)) return { kind: 'solo' };
    const m = text.match(/\bi (really |honestly |kind of |sort of )?(like|love|enjoy|prefer)\s+([a-z]+)/);
    if (m) {
        const key = FILTER_INTEREST_WORDS[m[3]];
        if (key) return { kind: 'interest', interest: key };
    }
    return null;
}

function detectEventFilterQuery(norm) {
    if (norm.raw.length > FILTER_QUERY_MAX_WORDS) return null;
    const t = norm.rawJoined;
    for (const { kind, re } of FILTER_PATTERNS) {
        if (re.test(t)) return { kind };
    }
    return detectCareerFilter(t) || detectFilterKeywordInterest(t) || detectPreferenceFilter(t);
}

// Domains that have no resolver yet. We say so instead of inventing answers.
// Small talk that should never be swallowed by conversation context. A short
// "thanks" after an event answer is still small talk, not a follow up question.
const ALWAYS_SMALLTALK = new Set([
    'greeting', 'thanks', 'bye', 'howareyou', 'areyouai', 'whobuilt', 'identity',
    'capabilities', 'limitations', 'source', 'notsure', 'confusion', 'help',
    'personalQuestion',
]);

const UNBUILT_DOMAINS = new Set([]);

let DEBUG = false;
export function setDebug(on) { DEBUG = !!on; }

function reply(text, extra = {}) {
    return { text, suggestions: [], actions: [], ...extra };
}

// The one place an "Open X Event Guide" action gets built, so every caller
// (per-event answers, ambiguous-event clarification, bare event mentions)
// points at the exact same canonical route this session's Event Guide
// rebuild established — /resources/events/:id. Any resolved event from the
// real catalog has a genuinely non-empty Event Guide page (it always shows
// at least description/eligibility/careers from the same catalog record,
// even when that event has no extra theme content), so this never needs a
// separate "does detail exist" flag — the guard is just "is this a real event".
function eventGuideAction(event, label) {
    if (!event) return null;
    return { type: 'NAVIGATE', label: label || `Open ${event.name} Event Guide`, route: `/resources/events/${event.id}` };
}

// Trailing topic words on a bare event mention ("webmaster pdf", "animatronics
// requirements") that have no single existing factual intent of their own —
// used only to make the context.acknowledge reply name the actual thing the
// student asked about instead of a fully generic question.
const TOPIC_WORD_HINTS = [
    [/\b(pdf|pdfs|documents?|official resources?)\b/, (name) => `${name}'s official documents`],
    [/\brequirements?\b/, (name) => `${name}'s full requirements`],
    [/\bsubmissions?\b/, (name) => `${name}'s submission details`],
];

// "the calendar is broken" / "coach isn't working" — a bug report, not a
// request for TSA information. Goes straight into the existing guided TSA
// Hub Support flow (drafts the actual complaint as the message) rather than
// a generic "I can't do that" or, worse, trying to answer it as a TSA
// question. See section 15 of the Coach repositioning brief.
const BUG_REPORT_RE = /\b(the |my )?(calendar|coach|assistant|events?|resources?|search|help center|app|site|website|page)\s+(is|isnt|is not|arent|are not|doesnt|does not)\s+(broken|working|loading|working right|working properly|showing up|updating)\b|\bsomething('?s| is) (broken|wrong|not working)\b|\b(this|it) (is|s) broken\b/;

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

    // A bug report ("the calendar is broken") is a support matter, not a TSA
    // question — route it into the real guided Support flow with the
    // complaint itself already drafted, instead of trying to answer it.
    // Checked before the generic smalltalk 'requestSupport' control intent
    // below, which also matches some of this same phrasing ("calendar
    // broken") but only offers the generic "pick a category" flow — the
    // drafted-preview flow here is strictly more useful, so it must win.
    if (BUG_REPORT_RE.test(norm.rawJoined)) {
        const next = { ...state, misunderstandingCount: 0 };
        debug.resolver = 'bug-report';
        return finish(startBugReportFlow(next, text), next, debug);
    }

    // Control intents run first, they change state rather than answer facts.
    const small = detectSmallTalk(norm, state);
    if (small?.control) {
        const handled = handleControl(small.intent, norm, state, prevUserText);
        if (handled) {
            debug.resolver = `control:${small.intent}`;
            return finish(handled.response, handled.state, debug);
        }
    }

    // Cross-event filter/preference queries must be decided before any event
    // name gets resolved — see detectEventFilterQuery above.
    const filterQuery = detectEventFilterQuery(norm);
    if (filterQuery) {
        const res = answerEventFilter(filterQuery.kind, getEvents(), filterQuery);
        if (res) {
            const intent = `event.filter.${filterQuery.kind}`;
            state.activeDomain = 'events';
            state.lastAnswerType = res.missing ? 'missing' : 'fact';
            state.lastIntent = intent;
            debug.resolver = `event-filter:${filterQuery.kind}`;
            return finish(reply(res.text, {
                domain: 'events',
                intent,
                confidence: 0.85,
                sourceType: res.sourceType,
                suggestions: followupsFor(intent, { justAsked: text }),
            }), state, debug);
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
            return finish(reply(sres.text, { domain: 'state', intent: stateIntent, confidence: 0.9, sourceType: sres.sourceType, suggestions: ['Who is my state advisor?', 'What is my state website?', 'State officer team'], actions: [{ type: 'NAVIGATE', label: `View ${state.activeState} TSA Information`, route: '/resources' }] }), state, debug);
        }
    }


    // Small talk is checked before domain routing so short messages such as
    // "thanks" are not inherited into the previous TSA domain.
    if (small && !small.control && !resolved.events.length && ALWAYS_SMALLTALK.has(small.intent)) {
        state.lastAnswerType = 'smalltalk';
        debug.resolver = `smalltalk:${small.intent}`;
        return finish(reply(small.text, { domain: 'smalltalk', intent: small.intent, confidence: 0.9 }), state, debug);
    }

    // "where do I find my advisor" — genuinely ambiguous between an event's
    // required advisor APPROVAL and a state TSA advisor's contact info, but
    // when no event is in play at all it can only mean the latter. Mirrors
    // the state-early block below: known state gets the real answer +
    // action, unknown state asks instead of guessing.
    const STATE_ADVISOR_NAV_RE = /\bwhere (do|can|is) i find my (state )?advisor\b|\bwhere is my (state )?advisor\b|\bhow do i find my (state )?advisor\b|\b(find|show me) my (state )?advisor\b|^advisor$/;
    if (!resolved.events.length && !resolved.ambiguous && STATE_ADVISOR_NAV_RE.test(norm.rawJoined)) {
        if (state.activeState) {
            debug.resolver = 'state-advisor-nav';
            return finish(reply(`Your ${state.activeState} state advisor information is available in Resources.`, {
                domain: 'state', confidence: 0.85, sourceType: 'official',
                actions: [{ type: 'NAVIGATE', label: `View ${state.activeState} TSA Information`, route: '/resources' }],
            }), state, debug);
        }
        // Deliberately does NOT set state.pendingClarification — this is a
        // one-off informational question, not a tracked multi-turn flow, and
        // nothing else in the pipeline consumes a `need: 'state'` shape
        // (only `need: 'event'` is handled at the top of processMessage).
        // Setting it here would only ever block the navigation check right
        // below (gated on `!state.pendingClarification`) for every future
        // turn until something unrelated happened to clear it.
        debug.resolver = 'state-advisor-need-state';
        return finish(reply('Which state are you competing in?', { domain: 'state', confidence: 0.8 }), state, debug);
    }

    // A single, genuinely ambiguous word ("rules") could mean several real
    // things in TSA Hub — offer the real destinations instead of guessing
    // which specific rule the user meant. Real NAVIGATE actions, not chips,
    // since neither destination maps to a supported chat intent on its own.
    if (['rules', 'rule'].includes(norm.rawJoined.trim())) {
        debug.resolver = 'rules-ambiguous';
        return finish(reply('What are you looking for?', {
            domain: 'navigation', confidence: 0.8,
            actions: [
                { type: 'NAVIGATE', label: 'Event Guide (theme, requirements, rules)', route: '/resources/events/themes' },
                { type: 'NAVIGATE', label: 'TSA Resources', route: '/resources' },
            ],
        }), state, debug);
    }

    // Bare "leadership" is ambiguous between the student officer teams and
    // the general leadership/advisor contacts page — offer both real pages.
    if (norm.rawJoined.trim() === 'leadership') {
        debug.resolver = 'leadership-ambiguous';
        return finish(reply('What are you looking for?', {
            domain: 'navigation', confidence: 0.8,
            actions: [
                { type: 'NAVIGATE', label: 'Student Leadership (officer teams)', route: '/resources/student-leadership' },
                { type: 'NAVIGATE', label: 'TSA Leadership & Support (advisors, contacts)', route: '/resources/leadership-support' },
            ],
        }), state, debug);
    }

    // A bare "requirements"/"submission" with no event already active is the
    // same shape of problem — there's no single TSA-wide answer, and
    // guessing one specific unrelated rule (which the generic rules search
    // would otherwise do) is worse than pointing at where every event's own
    // requirements and submissions actually live.
    if (!state.activeEvent && ['requirements', 'requirement', 'submission', 'submissions'].includes(norm.rawJoined.trim())) {
        debug.resolver = 'requirements-ambiguous';
        return finish(reply('Requirements and submissions are listed on each event\'s own Event Guide page.', {
            domain: 'navigation', confidence: 0.8,
            actions: [{ type: 'NAVIGATE', label: 'Open Event Guide', route: '/resources/events/themes' }],
        }), state, debug);
    }

    // Same reasoning for a bare "contact" — could mean TSA Hub Support, or
    // your state/national TSA contacts. Offer both real destinations.
    if (norm.rawJoined.trim() === 'contact') {
        debug.resolver = 'contact-ambiguous';
        return finish(reply('What are you looking for?', {
            domain: 'navigation', confidence: 0.8,
            actions: [
                { type: 'NAVIGATE', label: 'Contact TSA Hub Support', route: '/help/article/contacting-support' },
                { type: 'NAVIGATE', label: 'State & National TSA Contacts', route: '/resources/leadership-support' },
            ],
        }), state, debug);
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
            // pending.intent is only set when a real "answer this once you
            // know the event" follow-up was parked (e.g. team-size question
            // with no event named yet). A bare ambiguous-event dispatch
            // carries no intent, so naming a DIFFERENT event here ("whats
            // the webmaster theme" while a stale Robotics HS/MS
            // clarification was pending) must never fall back to a stale
            // state.lastIntent from an unrelated earlier turn — detect the
            // current message's own intent fresh instead.
            const intent = pending.intent || detectIntent(norm, { eventCount: resolved.events.length }).intent || state.lastIntent || 'overview.general';
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
                const intent = pending.intent || detectIntent(norm, { eventCount: 1 }).intent || state.lastIntent || 'overview.general';
                debug.resolver = 'clarification-resolved-by-division';
                return finish(answerWithIntent(intent, state, norm, text), state, debug);
            }
        }
        if (resolved.ambiguous) {
            debug.resolver = 'clarification-still-ambiguous';
            return finish({
                ...fallback('ambiguous-event', { candidates: resolved.candidates }),
                actions: resolved.candidates.slice(0, 2).map((c) => eventGuideAction(c, `${c.division === 'HS' ? 'High School' : 'Middle School'} ${c.name} Event Guide`)),
            }, state, debug);
        }
        // None of the above matched — this message isn't an attempt to
        // answer the pending clarification at all (no event mentioned, no
        // division reply, not itself ambiguous). Don't leave it stuck
        // forever: let it fall through and be answered like a fresh
        // question. The nav check right below explicitly clears it too, so
        // a clean destination match ("state instagram", "open calendar")
        // right after an abandoned clarification doesn't stay blocked.
    }

    // App-navigation / "how do I" questions and bare destination fragments
    // ("calendar", "privacy", "open resources") — checked once no real event
    // is in play. Runs after the pendingClarification block above, so a
    // clarification that's actually about to be resolved (event named,
    // division reply, still-ambiguous reply) is always handled first; only
    // once that block falls through untouched — proving this message isn't
    // an answer to it — is a pending clarification abandoned in favor of a
    // confident nav match. See resolvers/navigation.js.
    if (!resolved.events.length && !resolved.ambiguous) {
        const nav = resolveNavigation(norm.rawJoined, norm.raw.length);
        if (nav) {
            state.lastAnswerType = 'fact';
            state.pendingClarification = null;
            debug.resolver = 'navigation';
            return finish(reply(nav.text, { domain: 'navigation', confidence: 0.8, sourceType: 'official', actions: nav.actions }), state, debug);
        }
    }

    if (domain.domain === 'off-topic') {
        state.lastAnswerType = 'off-topic';
        debug.resolver = 'off-topic';
        return finish(reply(offTopicReply(text), { domain: 'off-topic', confidence: domain.confidence }), state, debug);
    }

    // Ambiguous event name, never guess.
    if (resolved.ambiguous) {
        // "can i ask something about robotics" / "got a question about
        // coding" name an event that happens to need HS/MS disambiguation,
        // but the student hasn't asked anything yet — forcing "High School
        // or Middle School?" first would answer a question that was never
        // asked. Invite the real question instead; the division only
        // matters once there's something specific to look up.
        if (QUESTION_OPENING_PREEMPT_RE.test(norm.rawJoined)) {
            debug.resolver = 'question-opening-preempt-ambiguous';
            return finish(reply("Sure, go ahead — what do you want to know? Once I know what you're asking, I can check which division it applies to.", { domain: 'events', intent: 'question.opening', confidence: 0.78, suggestions: [] }), state, debug);
        }
        // "what will robotics theme be in 2035" — no division answers this
        // (nobody has published a 2035 theme for either), so asking
        // "High School or Middle School?" first would just delay an answer
        // Coach can already give: it doesn't have that data, period.
        if (FUTURE_PREDICTION_RE.test(norm.rawJoined)) {
            const names = [...new Set(resolved.candidates.map((c) => c.name))].join('/');
            debug.resolver = 'no-verified-data-future';
            return finish(fallback('tsa-unsupported', { seed: text, eventName: names }), state, debug);
        }
        state.pendingClarification = { need: 'event', intent: null, candidates: resolved.candidates };
        debug.resolver = 'ambiguous-event';
        return finish({
            ...fallback('ambiguous-event', { candidates: resolved.candidates }),
            actions: resolved.candidates.slice(0, 2).map((c) => eventGuideAction(c, `${c.division === 'HS' ? 'High School' : 'Middle School'} ${c.name} Event Guide`)),
        }, state, debug);
    }

    if (resolved.events.length) state = applyEvents(state, resolved.events);

    // "what will webmaster theme be in 2035" — a single, unambiguous event
    // still must not get answered with THIS season's theme/schedule/etc as
    // if it addressed the future question. Checked once, before any
    // intent-specific resolver runs, so it can't be bypassed by whichever
    // keyword (theme/deadline/location) happens to match first.
    if (FUTURE_PREDICTION_RE.test(norm.rawJoined)) {
        debug.resolver = 'no-verified-data-future';
        return finish({ ...fallback('tsa-unsupported', { seed: text, eventName: state.activeEvent?.name }), actions: state.activeEvent ? [eventGuideAction(state.activeEvent)] : [] }, state, debug);
    }

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
    } else if (eventOnly && !debug.inheritedContext && looksLikeQuestion(norm.rawJoined)) {
        // The event resolved but nothing else matched a real intent, AND the
        // message is shaped like an actual question ("what percentage of
        // Webmaster teams win", not just "im doing webmaster") — Coach
        // understood there's a real ask here, it just doesn't have verified
        // data for that specific detail. TSA_NO_VERIFIED_DATA with the event
        // preserved, not a silent "got it, what do you want to know?".
        debug.resolver = 'no-verified-data-event';
        return finish({ ...fallback('tsa-unsupported', { seed: text, eventName: state.activeEvent?.name }), actions: state.activeEvent ? [eventGuideAction(state.activeEvent)] : [] }, state, debug);
    } else if (eventOnly && !debug.inheritedContext) {
        // A bare event mention with nothing else ("im doing webmaster", "we
        // picked robotics", "our event is coding") is a CONTEXT statement,
        // not a request to explain the event — and with no prior topic to
        // follow up on (the two branches above), there's no reason to
        // assume "explain it" specifically. An explicit "what is X" /
        // "tell me about X" is a real, separately-matched overview.general
        // PHRASE (intentResult.eventOnly is false for those), so this only
        // ever intercepts the heuristic bare-mention case.
        intent = 'context.acknowledge';
        confidence = 0.6;
    } else if ((!intent || confidence < CLARIFY || (intent === 'overview.general' && intentResult.eventOnly)) && !resolved.events.length && state.lastIntent && state.activeEvent && looksVagueFollowup(norm.rawJoined)) {
        // Vague follow-up with no event mention of its own ("what about
        // that", "is that right", "how many"). Checked against the RAW
        // intentResult.eventOnly, not the local `eventOnly` above — that one
        // requires an event named in THIS message, but a carried
        // state.activeEvent with nothing new said still makes detectIntent's
        // own heuristic default to a confident 'overview.general' (0.6,
        // above CLARIFY), which would otherwise skip every branch above and
        // silently re-dump the event description on a plain "what about
        // that?". Gated on looksVagueFollowup so genuine off-topic/unknown
        // input still falls through normally.
        intent = state.lastIntent;
        confidence = 0.65;
        debug.inheritedContext = `vague:${intent}`;
    } else if (!intent && !resolved.events.length && looksVagueFollowup(norm.rawJoined)) {
        // Same follow-up shape but with no prior topic to resolve it
        // against — nothing to safely infer, so ask instead of guessing or
        // going fully unknown.
        intent = 'question.opening';
        confidence = 0.55;
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
            if (res) { state.activeDomain = 'deadlines'; debug.resolver = 'deadlines-fallback'; return finish(reply(res.text, { domain: 'deadlines', sourceType: res.sourceType, actions: [{ type: 'NAVIGATE', label: 'View in Calendar', route: '/calendar' }] }), state, debug); }
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
            debug.resolver = 'deadlines'; return finish(reply(res.text, { domain: 'deadlines', intent, confidence, sourceType: res.sourceType, suggestions: ['When is nationals?', 'When are regionals?'], actions: [{ type: 'NAVIGATE', label: 'View in Calendar', route: '/calendar' }] }), state, debug);
        }
    }

    // Conference intents.
    if (intent && intent.startsWith('conference.')) {
        const res = answerConference(intent, norm.tokens);
        if (res) {
            state.activeDomain = 'conference';
            state.lastIntent = intent;
            state.lastAnswerType = 'fact';
            debug.resolver = 'conference'; return finish(reply(res.text, { domain: 'conference', intent, confidence, sourceType: res.sourceType, suggestions: ['When is the conference?', 'Where is it?', 'What is the theme?'], actions: [{ type: 'NAVIGATE', label: 'View in Calendar', route: '/calendar' }] }), state, debug);
        }
    }

    // Rule intents.
    if (intent && intent.startsWith('rule.')) {
        // "what are the rules for quantum rocket engineering" names a
        // specific (fake) event — a generic keyword search would otherwise
        // happily return some unrelated rule that merely shares the word
        // "rules". Catch the fake-event-name shape before searching.
        if (!state.activeEvent) {
            const attempted = extractAttemptedEventName(text);
            if (attempted) {
                debug.resolver = 'unknown-event';
                return finish(fallback('unknown-event', { eventName: attempted }), state, debug);
            }
        }
        const eventId = state.activeEvent?.id || null;
        const res = answerRule(norm.tokens, { eventId, seed: text });
        if (res) {
            state.activeDomain = 'rules';
            state.lastIntent = intent;
            state.lastAnswerType = 'fact';
            debug.resolver = 'rules'; return finish(reply(res.text, { domain: 'rules', intent, confidence, sourceType: res.sourceType, source: res.source, suggestions: ['Can we use AI?', 'What is the dress code?', 'What about citations?'] }), state, debug);
        }
        // A real rules question ("what am I allowed to do in X") that's too
        // broad to match one specific rule — Coach genuinely understood the
        // ask, it just isn't a lookup any single rule answers. Point at the
        // real categories instead of a silent "I don't understand" (no
        // `kind`, so this never counts as a misunderstanding).
        const eventName = state.activeEvent?.name;
        const text2 = eventName
            ? `I don't have one single rule that covers that broadly for ${eventName} — I can look up something specific though: AI/tool use, original work, dress code, disqualification, or judging. Which one?`
            : "I don't have one rule that covers that broadly — I can look up something specific though: AI/tool use, original work, dress code, disqualification, or judging. Which one?";
        debug.resolver = 'rules-generic';
        return finish(reply(text2, { domain: 'rules', intent, confidence, suggestions: ['Can we use AI?', 'What is the dress code?', 'What counts as original work?'] }), state, debug);
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

    // "what do i need" — genuinely ambiguous (bring vs submit vs build).
    // Answer directly only when we already know which the user means;
    // otherwise ask the specific three-way question instead of a generic
    // "what do you mean?" or silently re-explaining the event overview.
    if (intent === 'clarify.needAmbiguous') {
        const eventName = state.activeEvent?.name;
        const text2 = eventName
            ? `Do you mean what you need to bring to competition, what you need to submit beforehand, or what you need to build for ${eventName}?`
            : "Do you mean what you need to bring to competition, what you need to submit beforehand, or what you need to build — and for which event?";
        state.activeDomain = 'events';
        state.lastIntent = intent;
        debug.resolver = 'clarify-need';
        return finish(reply(text2, { domain: 'events', intent, confidence, suggestions: ['What do I need to bring?', 'What do I need to submit?', 'What do I need to build?'] }), state, debug);
    }

    // "what would you recommend" — preference elicitation, not a lookup.
    // Points to the Smart Recommender for a full ranked list too, since
    // that tool already does real interest/skill scoring — this doesn't
    // duplicate that logic, it just starts the conversation.
    if (intent === 'clarify.recommend') {
        const text2 = "I can narrow the event list based on what you like.";
        state.activeDomain = 'events';
        state.lastIntent = intent;
        debug.resolver = 'clarify-recommend';
        return finish(reply(text2, {
            domain: 'events', intent, confidence,
            suggestions: ['I like coding', 'I want a team event', "I don't like presenting"],
            actions: [{ type: 'NAVIGATE', label: 'Get Recommendations', route: '/recommend' }],
        }), state, debug);
    }

    // A conversation opener ("i have a question about webmaster", "quick
    // question", "can i ask something") — invite the actual question
    // instead of guessing what it is. If an event was named in the same
    // breath, mention it so the student doesn't have to repeat it.
    if (intent === 'question.opening') {
        const event = state.activeEvent;
        const text2 = event
            ? `Sure, what do you want to know about ${event.name}? I can help with the current challenge, team size, submissions, rules, or preparation.`
            : "Sure, go ahead — what's your question? I can help with events, rules, deadlines, choosing an event, conference info, or your state TSA.";
        state.activeDomain = 'events';
        debug.resolver = 'question-opening';
        return finish(reply(text2, { domain: 'events', intent, confidence, suggestions: [] }), state, debug);
    }

    // A bare event-context statement ("im doing webmaster", "we picked
    // robotics", "our event is coding") — acknowledge it and ask what they
    // actually want to know, instead of silently dumping the full overview
    // every single time an event name gets mentioned in passing.
    if (intent === 'context.acknowledge') {
        const event = state.activeEvent;
        // A trailing topic word ("webmaster pdf", "animatronics requirements")
        // has no single existing factual intent to answer it directly, but it
        // does tell us specifically what the student is after — say so,
        // instead of the fully generic "what do you want to know?", while
        // still pointing at the one real place that actually has it.
        const topicWord = event && TOPIC_WORD_HINTS.find(([re]) => re.test(norm.rawJoined));
        const text2 = topicWord
            ? `${topicWord[1](event.name)} are in its Event Guide.`
            : event
                ? `Got it — ${event.name}. What do you want to know?`
                : "Got it. What do you want to know?";
        state.activeDomain = 'events';
        debug.resolver = 'context-acknowledge';
        return finish(reply(text2, {
            domain: 'events', intent, confidence,
            suggestions: event && !topicWord ? ['What is the current challenge?', 'How big is the team?', 'What do I need to submit?'] : [],
            actions: event ? [eventGuideAction(event)] : [],
        }), state, debug);
    }

    // Preference/interest statements ("i like coding", "i hate presenting")
    // — same destination as clarify.recommend, just phrased as a statement
    // instead of a question.
    if (intent === 'event.preference') {
        const text2 = "Good to know — that helps narrow it down. Want me to suggest a few event types based on that, or would you rather check Events → Get recommendations for a full ranked list based on your interests?";
        state.activeDomain = 'events';
        state.lastIntent = intent;
        debug.resolver = 'event-preference';
        return finish(reply(text2, { domain: 'events', intent, confidence, suggestions: ['Give me a few ideas', 'Tell me about a specific event', 'What do most beginners pick?'] }), state, debug);
    }

    // Hypotheticals ("what if my teammate quits") with no specific-topic
    // match — honest general guidance instead of a made-up official ruling.
    if (intent === 'whatif.general') {
        const text2 = "I don't have an official ruling on that specific hypothetical. For anything that could affect eligibility or scoring, your advisor or state TSA director has the final say — but if you tell me which event or requirement this touches on, I can look up the actual rule or deadline for you.";
        state.activeDomain = 'events';
        debug.resolver = 'whatif-general';
        return finish(reply(text2, { domain: 'events', intent, confidence, suggestions: [] }), state, debug);
    }

    // Planning/preparation language ("what should we do first", "make me a
    // plan") — general prep guidance, event-aware when possible.
    if (intent === 'planning.general') {
        const event = state.activeEvent;
        const text2 = event
            ? `For ${event.name}, I'd start with the current challenge and requirements, then check the deadline for what's due, and confirm your team size and submissions. Want me to walk through any of those?`
            : "I'd start by picking your event (if you haven't already), then check its requirements, deadline, and what you need to submit. Which part do you want to dig into?";
        state.activeDomain = 'events';
        debug.resolver = 'planning-general';
        return finish(reply(text2, { domain: 'events', intent, confidence, suggestions: event ? ['What is the current challenge?', 'When is the deadline?', 'What do I need to submit?'] : ['Help me pick an event'] }), state, debug);
    }

    // Real-life conference logistics — Coach has no official data for most
    // of these, so say so honestly instead of guessing.
    if (intent === 'conference.life') {
        const text2 = "I don't have official logistics details for that specific question — things like arrival times, check-in, hotels, and what to pack usually come from your conference registration packet or your advisor. I can help with the conference dates, deadlines, and official rules though.";
        state.activeDomain = 'conference';
        debug.resolver = 'conference-life';
        return finish(reply(text2, { domain: 'conference', intent, confidence, suggestions: ['When is the conference?', 'Where is it?'] }), state, debug);
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
        // "what is quantum rocket engineering" named something specific
        // that just doesn't exist — that's TSA_NO_RESOURCE_MATCH, not a
        // generic "which event do you mean?" clarification (which is for
        // genuinely event-less asks like "what is the theme").
        const attempted = extractAttemptedEventName(text);
        if (attempted) {
            debug.resolver = 'unknown-event';
            return finish(fallback('unknown-event', { eventName: attempted }), state, debug);
        }
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
            suggestions: followupsFor(intent, { justAsked: rawText }),
            actions: state.activeEvents.slice(0, 2).map((e) => eventGuideAction(e)).filter(Boolean),
        });
    }

    const event = state.activeEvent;
    const res = answerEventIntent(event, intent, { style: state.answerStyle, seed: event?.id || '' });
    if (!res) return { ...fallback('tsa-unsupported', { seed: rawText, eventName: event?.name }), actions: event ? [eventGuideAction(event)] : [] };

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
        suggestions: res.missing ? [] : followupsFor(intent, { event, justAsked: rawText }),
        actions: event ? [eventGuideAction(event)] : [],
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
            // "yes but also when are nationals" starts with the affirm word
            // but carries a real question after it — that must still fall
            // through to normal processing, not get swallowed by a generic
            // acknowledgement. Only treat it as a bare "ok"/"got it"/"sure"
            // when the acknowledgement is essentially the whole message.
            if (norm.raw.length > 3) return null;
            // A bare "ok"/"got it"/"sure" with nothing pending isn't a real
            // TSA question — don't dump info, but don't go unknown either
            // (section 17). Acknowledge and leave the door open.
            const text2 = state.activeEvent
                ? `Sounds good. Anything else about ${state.activeEvent.name}?`
                : 'Got it! Let me know if you have any other questions.';
            return { response: reply(text2), state };
        }
        case 'deny': {
            if (state.pendingClarification) {
                return { response: reply('No problem. What did you mean?'), state: { ...state, pendingClarification: null } };
            }
            if (norm.raw.length > 6) return null;
            return { response: reply('Got it. What would you like to know instead?'), state };
        }
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
        case 'repair': {
            const event = state.activeEvent;
            const text2 = event
                ? `Sorry about that — let's try again. What do you want to know about ${event.name}?`
                : "Sorry about that — let's try again. What are you trying to find out?";
            return { response: reply(text2), state };
        }
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

// A bug report drafts straight from the complaint itself, with a category
// guessed from which part of the app was named — "Website/app issue" when
// nothing more specific is mentioned.
const BUG_AREA_CATEGORY = [
    [/\bcalendar\b/, 'Calendar or deadlines'],
    [/\b(coach|assistant)\b/, 'TSA Coach'],
    [/\bevents?\b/, 'Events'],
    [/\bresources?\b/, 'Resources search'],
];
function startBugReportFlow(state, complaintText) {
    const lower = complaintText.toLowerCase();
    const category = BUG_AREA_CATEGORY.find(([re]) => re.test(lower))?.[1] || 'Website/app issue';
    const message = `Something isn't working right: "${complaintText}"`;
    state.supportFlow = { step: 'confirm', category, message };
    return previewReply(category, message);
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

// Consecutive GENUINE misunderstandings only — kind 'unknown' (Coach truly
// has no idea what was asked). Everything else Coach can actually classify —
// TSA-related-but-no-verified-data ('tsa-unsupported'), clarifications
// ('need-event'/'ambiguous-event'/etc), unmatched-event-name
// ('unknown-event'), out-of-scope, personal, and capability-limit — means
// Coach correctly understood the request, it just doesn't have the data or
// can't perform the action. None of those are misunderstandings, so none of
// them should push a student toward "contact support" just because the
// answer was "I don't have that." See fallback.js for the 'kind' values.
const MISUNDERSTANDING_KINDS = new Set(['unknown']);

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

// Lets the guided-flow UI skip a "which state?" picker when the user's state
// is already known from earlier in the conversation.
export function getActiveState() {
    return sharedState.activeState;
}

export function getConversationState() {
    return sharedState;
}

// Restores a previously-saved conversation state (e.g. from the 5-minute
// Coach session memory). Merges onto a fresh default state so an
// older/partial saved blob never crashes on a missing field.
export function setConversationState(saved) {
    sharedState = { ...createState(), ...(saved || {}) };
}
