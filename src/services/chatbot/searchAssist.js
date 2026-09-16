// Runs a global-search query through TSA Coach's real answering engine (the
// same intent/resolver pipeline the Coach chat uses — not a second knowledge
// system) and returns a short, confident direct answer for the search page,
// or null when Coach doesn't have one. Always uses a fresh, throwaway
// conversation state so a search never touches or is affected by the user's
// real Coach chat session.
import { processMessage } from './engine.js';
import { createState } from './conversation/state.js';

// Only question-like / information-seeking queries should trigger the
// assist section — plain keyword searches ("national", "webmaster",
// "conference") must keep showing normal results only. A query counts as
// question-like when it ends in "?", or opens with a question word and has
// enough words to be a real question (not a bare single keyword).
const QUESTION_START_RE = /^(what|when|where|why|how|who|which|is|are|do|does|did|can|could|will|would|should)\b/i;
function looksLikeQuestionQuery(q) {
    const t = (q || '').trim();
    if (!t) return false;
    if (/\?\s*$/.test(t)) return true;
    if (t.split(/\s+/).length < 3) return false;
    return QUESTION_START_RE.test(t);
}

// Domains that carry real factual answers. Excludes smalltalk, off-topic,
// navigation-only, and capability-limit replies, which aren't "helpful
// answers" in the search-assist sense.
const ALLOWED_DOMAINS = new Set(['events', 'rules', 'deadlines', 'conference', 'state', 'general', 'careers']);

// Intents that are conversational management (invite a question, ask a
// clarifying follow-up, elicit a preference) rather than an actual answer.
const EXCLUDED_INTENTS = new Set([
    'question.opening', 'context.acknowledge', 'clarify.recommend',
    'clarify.needAmbiguous', 'event.preference',
]);

// Coach's own "I don't have verified data" phrasing (see resolvers/fallback.js
// and the many per-resolver "missing" branches) — never surface this as if
// it were a confident answer, and never show a generic "I don't know" either.
const NO_ANSWER_RE = /\bi don'?t have\b|\bi couldn'?t find\b|\bi don'?t know\b|\bdoesn'?t have\b|\bnot (currently )?(on file|available)\b|\bno official\b|\bi can'?t confirm\b|\bi wasn'?t able\b|\bi don'?t want to guess\b/i;

// A short reply that's itself just a question back ("Which state are you
// competing in?") is a clarification prompt, not an answer.
function isShortQuestionBack(text) {
    const t = (text || '').trim();
    if (!t.endsWith('?')) return false;
    return t.split(/\s+/).length <= 8;
}

export function getSearchAssistAnswer(query) {
    const text = (query || '').trim();
    if (!looksLikeQuestionQuery(text)) return null;

    const { response, state } = processMessage(text, createState());

    if (response.kind) return null; // any fallback() response
    if (state.lastAnswerType === 'missing') return null;
    if (!response.domain || !ALLOWED_DOMAINS.has(response.domain)) return null;
    if (response.intent && EXCLUDED_INTENTS.has(response.intent)) return null;
    if (!response.text || NO_ANSWER_RE.test(response.text)) return null;
    if (isShortQuestionBack(response.text)) return null;

    const navAction = (response.actions || []).find((a) => a?.type === 'NAVIGATE' && a.route);
    return {
        text: response.text,
        source: navAction && response.sourceType === 'official'
            ? { label: navAction.label || 'View source', route: navAction.route }
            : null,
    };
}
