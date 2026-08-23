// Intent detection with confidence. Phrase evidence outranks token evidence,
// and guards suppress well known false positives.

// Phrases that must never be read as a difficulty question.
const DIFFICULTY_BLOCKERS = [
    /hard time/, /having a hard/, /hard to (choose|decide|pick)/, /tough call/,
];

// Question shapes that carry meaning beyond the keyword.
const PHRASES = [
    { intent: 'team.individual', re: /(can|could) (i|we|you) .*(alone|by myself|individual|solo)/, c: 0.93 },
    { intent: 'team.individual', re: /\b(individual|solo) (entries|entry|competitor|participation) (is|are)?\b/, c: 0.9 },
    { intent: 'team.individual', re: /\b(do|compete|enter|participate) (it )?(alone|solo)\b/, c: 0.92 },
    { intent: 'team.minimum', re: /(minimum|at least|fewest|smallest) .*(team|people|member)/, c: 0.9 },
    { intent: 'team.maximum', re: /(maximum|at most|up to|largest|biggest) .*(team|people|member)/, c: 0.9 },
    { intent: 'team.general', re: /how (big|many) .*(team|people|member)/, c: 0.9 },
    { intent: 'team.general', re: /\bteam size\b/, c: 0.92 },
    { intent: 'cost.isExpensive', re: /\b(is|are) .*(expensive|pricey|cheap|affordable)\b/, c: 0.9 },
    { intent: 'cost.general', re: /how much .*(cost|price|pay|spend)/, c: 0.92 },
    { intent: 'time.general', re: /how (long|much time)/, c: 0.9 },
    { intent: 'time.general', re: /(time (commitment|required)|takes more time|how many hours)/, c: 0.9 },
    { intent: 'difficulty.general', re: /how (hard|difficult|challenging|easy)/, c: 0.9 },
    { intent: 'difficulty.general', re: /\b(is|are) (it|this|that|.*) (hard|difficult|easy)\b/, c: 0.85 },
    { intent: 'overview.general', re: /(tell me about|what is|what's|explain) /, c: 0.8 },
    { intent: 'overview.general', re: /what (do|would) (i|you|we) (do|actually do)/, c: 0.85 },
    { intent: 'career.general', re: /(what|which) (careers?|jobs?|majors?)/, c: 0.9 },
    { intent: 'career.general', re: /(lead to|connect to|good for) .*(career|job|major|engineering|software)/, c: 0.85 },
    { intent: 'preconference.general', re: /(what do i (need to )?submit|preconference|pre-conference)/, c: 0.9 },
    { intent: 'advisor.general', re: /(advisor approval|state advisor|need approval)/, c: 0.9 },
    { intent: 'eligibility.general', re: /(who can (enter|compete)|am i eligible|eligibility)/, c: 0.88 },
    { intent: 'theme.general', re: /(this year'?s? theme|what is the theme|annual theme)/, c: 0.9 },

    { intent: 'deadline.regionals', re: /\b(when|date).*(regional|regionals)\b/, c: 0.92 },
    { intent: 'deadline.states', re: /\b(when|date).*(state|states)\s*(conference|comp)/, c: 0.92 },
    { intent: 'deadline.states', re: /\bstate conference\b/, c: 0.88 },
    { intent: 'deadline.nationals', re: /\b(when|date|how (many|long)|days).*(national|nationals)\b/, c: 0.92 },
    { intent: 'deadline.all', re: /\b(when|what|all).*(deadline|dates|schedule)\b/, c: 0.85 },
    { intent: 'conference.when', re: /\bwhen is (the )?conference\b/, c: 0.9 },
    { intent: 'conference.where', re: /\bwhere is (the )?conference\b/, c: 0.9 },
    { intent: 'conference.theme', re: /\bconference theme\b/, c: 0.88 },
    { intent: 'conference.search', re: /\b(conference|nationals).*(store|shirt|badge|shuttle|transport|session|safety|lost|luggage|app|pin exchange|meet and greet|advisor)/, c: 0.85 },
    { intent: 'rule.search', re: /\bcitation/, c: 0.85 },
    { intent: 'conference.search', re: /\bshuttle/, c: 0.85 },
    { intent: 'rule.search', re: /\b(rule|rules|allowed|prohibited|can (i|we) use|dress code|citation|plagiarism|ai|artificial intelligence|original work|penalties|judging|grievance|disqualif)/, c: 0.82 },
    { intent: 'compare.general', re: /\b(compare|versus|vs\.?)\b/, c: 0.9 },

    { intent: 'compare.general', re: /(difference between|what'?s the difference)/, c: 0.9 },
    { intent: 'compare.difficulty', re: /which (one )?(is )?(harder|easier|more difficult)/, c: 0.92 },
    { intent: 'compare.time', re: /which (one )?(takes|needs) (more|less) time/, c: 0.92 },
    { intent: 'compare.cost', re: /which (one )?(costs?|is) (more|less|cheaper|expensive)/, c: 0.92 },
    { intent: 'compare.team', re: /which (one )?can i do (alone|solo)/, c: 0.92 },
];

// Token evidence, weaker than phrases.
const TOKEN_INTENTS = [
    { intent: 'preconference.general', tokens: ['preconference'] },
    { intent: 'advisor.general', tokens: ['advisor'] },
    { intent: 'team.individual', tokens: ['individual'] },
    { intent: 'team.general', tokens: ['team'] },
    { intent: 'cost.general', tokens: ['cost'] },
    { intent: 'time.general', tokens: ['time'] },
    { intent: 'difficulty.general', tokens: ['difficulty'] },
    { intent: 'career.general', tokens: ['career'] },
    { intent: 'eligibility.general', tokens: ['eligibility'] },
    { intent: 'theme.general', tokens: ['theme'] },
    { intent: 'category.general', tokens: ['category'] },
    { intent: 'division.general', tokens: ['division'] },
    { intent: 'material.general', tokens: ['material'] },
    { intent: 'overview.general', tokens: ['overview'] },

    { intent: 'compare.general', tokens: ['compare'] },
];

// Raw words that imply difficulty but need the blocker check.
const RAW_DIFFICULTY = ['hard', 'easy', 'harder', 'easier', 'hardest', 'easiest'];

function comparisonFamily(intent) {
    return intent && intent.startsWith('compare.');
}

/**
 * Detect intent for a message.
 * Returns { intent, confidence, evidence, alternatives }.
 */
export function detectIntent(norm, { eventCount = 0, state = null } = {}) {
    const text = norm.rawJoined;
    const blocked = DIFFICULTY_BLOCKERS.some((re) => re.test(text));
    const found = [];

    for (const p of PHRASES) {
        if (!p.re.test(text)) continue;
        if (blocked && p.intent.includes('difficulty')) continue;
        found.push({ intent: p.intent, confidence: p.c, evidence: [p.re.source.slice(0, 28)] });
    }

    for (const t of TOKEN_INTENTS) {
        const hits = t.tokens.filter((w) => norm.tokens.includes(w));
        if (!hits.length) continue;
        if (blocked && t.intent.includes('difficulty')) continue;
        found.push({ intent: t.intent, confidence: 0.68, evidence: hits });
    }

    if (!blocked && RAW_DIFFICULTY.some((w) => norm.raw.includes(w))) {
        found.push({ intent: 'difficulty.general', confidence: 0.72, evidence: ['difficulty word'] });
    }

    if (!found.length) {
        // No signal of its own. A bare event name is an overview request.
        if (eventCount > 0) {
            // No topic words at all, just an event name. Flagged so the engine
            // can inherit the previous intent for follow ups like "what about X".
            return { intent: 'overview.general', confidence: 0.6, evidence: ['event only'], alternatives: [], eventOnly: true };
        }
        return { intent: null, confidence: 0, evidence: [], alternatives: [] };
    }

    // Two events plus a "which" style question is a comparison.
    if (eventCount >= 2) {
        const cmp = found.find((f) => comparisonFamily(f.intent));
        if (cmp) {
            found.forEach((f) => { if (f === cmp) f.confidence = Math.max(f.confidence, 0.92); });
        } else if (/\bwhich\b|\bbetter\b|\bor\b/.test(text)) {
            const topic = found[0].intent.split('.')[0];
            found.unshift({ intent: `compare.${topic}`, confidence: 0.85, evidence: ['two events'] });
        } else {
            found.unshift({ intent: 'compare.general', confidence: 0.8, evidence: ['two events'] });
        }
    }

    found.sort((a, b) => b.confidence - a.confidence);
    const best = found[0];

    // Knowing the event lifts confidence, not knowing it lowers it.
    let confidence = best.confidence;
    if (eventCount > 0) confidence = Math.min(0.97, confidence + 0.05);
    else if (!state?.activeEvent) confidence -= 0.12;

    return {
        intent: best.intent,
        confidence: Math.max(0, Math.round(confidence * 100) / 100),
        evidence: best.evidence,
        alternatives: found.slice(1, 3).map((f) => f.intent),
    };
}

// Intents that cannot be answered without an event.
export const REQUIRES_EVENT = new Set([
    'team.general', 'team.individual', 'team.minimum', 'team.maximum',
    'cost.general', 'cost.isExpensive', 'time.general', 'difficulty.general',
    'overview.general', 'theme.general', 'category.general', 'division.general',
    'career.general', 'eligibility.general', 'preconference.general',
    'advisor.general', 'material.general',
]);

export const REQUIRES_TWO_EVENTS = new Set([
    'compare.general', 'compare.team', 'compare.time', 'compare.cost',
    'compare.difficulty', 'compare.work', 'compare.career', 'compare.overview',
]);
