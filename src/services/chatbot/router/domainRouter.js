import { hasAny } from '../language/normalize.js';

// Whitelist style domain detection. We only claim confidence for TSA domains,
// everything else falls through to off topic or unknown.

const DOMAIN_SIGNALS = {
    events: ['event', 'team', 'individual', 'cost', 'time', 'difficulty', 'overview',
        'theme', 'category', 'career', 'compete', 'competition', 'material',
        'preconference', 'submission', 'advisor', 'eligibility', 'compare'],
    rules: ['rule', 'requirement', 'dress', 'code', 'penalty', 'penalties', 'judging',
        'judge', 'judges', 'citation', 'citations', 'cite', 'prohibited', 'allowed', 'appeal', 'ai', 'artificial', 'citation', 'citations', 'cite', 'copyright'],
    deadlines: ['deadline', 'due', 'register', 'registration', 'submit', 'submission'],
    conference: ['conference', 'nationals', 'regionals', 'store', 'shuttle', 'transport', 'session', 'badge', 'pin'],
    careers: ['career', 'major', 'college', 'profession'],
    state: ['state', 'chapter', 'delegation', 'officer', 'advisor'],
    'getting-started': ['start', 'started', 'begin', 'join'],
};

// Topics we will not attempt, used only to phrase a friendly redirect.
const OFF_TOPIC_HINTS = [
    'weather', 'rain', 'snow', 'temperature', 'forecast',
    'president', 'election', 'politics', 'news',
    'nba', 'nfl', 'football', 'basketball', 'soccer', 'superbowl', 'super',
    'movie', 'song', 'netflix', 'joke', 'recipe', 'food',
    'essay', 'homework', 'math', 'calculate', 'translate', 'stock', 'crypto',
    'love', 'dating', 'horoscope', 'bitcoin', 'pizza', 'math', 'homework',
    'apple', 'stock', 'invest', 'restaurant', 'celebrity', 'lyrics', 'meme',
];

// Arithmetic and translation style requests are never TSA questions.
const OFF_TOPIC_PATTERNS = [
    /\d+\s*[+*/]\s*\d+/,
    /\d+\s+-\s+\d+/,
    /\bplus\b.*\d|\d.*\bplus\b/,
    /\btranslate\b/,
    /\bwrite (me )?(an? )?(essay|poem|story|code)\b/,
];

// Short follow ups that only make sense against existing context.
const FOLLOWUP_PATTERNS = [
    /^(and )?what about\b/, /^how much\b/, /^how many\b/, /^how long\b/,
    /^when is it\b/, /^is it\b/, /^can i\b/, /^does it\b/, /^which one\b/,
    /^what if\b/, /^why\b/, /^and\b/,
];

function looksLikeFollowUp(norm) {
    const t = norm.rawJoined;
    if (norm.raw.length <= 4) return true;
    return FOLLOWUP_PATTERNS.some((re) => re.test(t));
}

function hasPronounReference(norm) {
    return /\b(it|that|this|them|they|those|one)\b/.test(norm.rawJoined);
}

/**
 * Detect the domain of a message.
 * Returns { domain, confidence, inherited, evidence }.
 */
export function detectDomain(norm, state, { eventCount = 0 } = {}) {
    const tokens = norm.tokens;
    const scores = [];

    // Off topic is decided before domain scoring, otherwise a stray synonym
    // such as price to cost drags a general question into the events domain.
    const offTopicWord = OFF_TOPIC_HINTS.find((w) => tokens.includes(w) || norm.raw.includes(w));
    const offTopicShape = OFF_TOPIC_PATTERNS.some((re) => re.test(norm.original || norm.rawJoined));
    const pronounFollowUp = hasPronounReference(norm) && !!(state?.activeEvent);
    if ((offTopicWord || offTopicShape) && !pronounFollowUp && eventCount === 0) {
        return { domain: 'off-topic', confidence: 0.9, inherited: false, evidence: [offTopicWord || 'pattern'] };
    }

    for (const [domain, words] of Object.entries(DOMAIN_SIGNALS)) {
        const hits = words.filter((w) => tokens.includes(w));
        if (hits.length) {
            scores.push({ domain, score: 0.55 + Math.min(0.35, hits.length * 0.15), evidence: hits });
        }
    }

    scores.sort((a, b) => b.score - a.score);

    // Context first for short follow ups and pronoun references.
    const hasContext = !!(state?.activeEvent || state?.activeEvents?.length || state?.activeDomain);
    if (hasContext && (looksLikeFollowUp(norm) || hasPronounReference(norm))) {
        // A follow up may still name its own domain, prefer that when strong.
        if (scores.length && scores[0].score >= 0.7) {
            return { domain: scores[0].domain, confidence: scores[0].score, inherited: false, evidence: scores[0].evidence };
        }
        return {
            domain: state.activeDomain || 'events',
            confidence: 0.7,
            inherited: true,
            evidence: ['context'],
        };
    }

    if (scores.length) {
        return { domain: scores[0].domain, confidence: scores[0].score, inherited: false, evidence: scores[0].evidence };
    }

    return { domain: 'unknown', confidence: 0.3, inherited: false, evidence: [] };
}
