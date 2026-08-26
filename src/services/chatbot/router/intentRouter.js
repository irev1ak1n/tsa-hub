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
    // Messy real-student phrasing that asks a team-size question without
    // "how many/big" — e.g. "can all 4 of us do it" or "is that too many".
    { intent: 'team.general', re: /\bcan (all|both|the) (\d+|two|three|four|five|six|seven) ?(of )?(us|them|we)\b.{0,25}\b(do|be on|join|compete|enter)\b/, c: 0.88 },
    { intent: 'team.general', re: /\bcan (all|both) (of )?(us|them|we)\b.{0,25}\b(do|be on|join|compete|enter)\b/, c: 0.88 },
    { intent: 'team.general', re: /\bis (that|this) too many\b/, c: 0.85 },
    { intent: 'team.general', re: /\bif there('?s| is) \d+ of us\b/, c: 0.85 },
    // Capability-limit requests — an outbound-action VERB directed at a
    // target ("can you text them", "email my advisor", "call national tsa
    // for me"). Deliberately requires an action verb, so a plain factual
    // "what is national tsa's email" (no verb) never lands here — see
    // contact.nationalInfo below for that case.
    { intent: 'capability.outboundContact', re: /\b(can|could|will) (you|u) (text|call|phone|dm|message|email)\b/, c: 0.94 },
    { intent: 'capability.outboundContact', re: /\b(text|call|phone|dm|message|email) (them|him|her|it|tsa|national tsa|my advisor)\b.{0,20}\bfor me\b/, c: 0.92 },
    { intent: 'capability.outboundContact', re: /\bsend (them|him|her|it) (a |an )?(text|message|dm|email|instagram dm|facebook message)\b/, c: 0.93 },
    { intent: 'capability.outboundContact', re: /\bmake the (phone )?call\b/, c: 0.9 },
    { intent: 'capability.outboundContact', re: /\b(can|could) (you|u) (reach out|talk) to (them|him|her|my advisor|tsa|national tsa)\b/, c: 0.9 },
    { intent: 'capability.outboundContact', re: /\bcontact (them|him|her|my advisor|tsa|national tsa|somebody|someone) for me\b/, c: 0.9 },
    { intent: 'capability.outboundContact', re: /\b(open gmail and email|send it automatically|can (you|u) send it automatically)\b/, c: 0.9 },
    { intent: 'capability.outboundContact', re: /\b(text|call|phone|dm|message) (tsa|national tsa|alabama tsa|my advisor)\b/, c: 0.88 },
    { intent: 'capability.outboundContact', re: /\bemail (my advisor|national tsa|tsa hub)\b/, c: 0.88 },
    // Confidence above state.advisor's broad "contact.*(state|advisor)"
    // catch-all below — "can you contact X" is an action request, not the
    // "who is my advisor" factual question that catch-all exists for.
    { intent: 'capability.outboundContact', re: /\b(can|could) (you|u) contact (my advisor|them|him|her|tsa|national tsa)\b/, c: 0.95 },
    // Factual "what is National TSA's contact info" — has real, sourced data
    // to give, so this is NOT a capability limit.
    { intent: 'contact.nationalInfo', re: /\b(what'?s?|what is) (national tsa'?s?|the national tsa) (phone|email|number|contact)\b/, c: 0.92 },
    { intent: 'contact.nationalInfo', re: /\bnational tsa'?s? (phone number|email|contact info|contact information)\b/, c: 0.9 },
    { intent: 'contact.nationalInfo', re: /\b(contact information|contact info) for national tsa\b/, c: 0.88 },
    { intent: 'contact.nationalInfo', re: /\b(need|want|trying) to (contact|reach) national tsa\b/, c: 0.88 },
    { intent: 'contact.nationalInfo', re: /^contact national tsa\b/, c: 0.85 },
    { intent: 'contact.nationalInfo', re: /\bnational tsa contact\b/, c: 0.9 },
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
    // General question about what advisor approval IS — no event needed
    { intent: 'advisor.meaning', re: /\b(what|explain|mean|how does).*(state )?advis[oe]r approval\b/, c: 0.93 },
    { intent: 'advisor.meaning', re: /\badvis[oe]r approval\b.{0,30}(mean|what|why|how|explain)/, c: 0.91 },
    { intent: 'advisor.meaning', re: /\bstate advisor approval\b.{0,30}(mean|what|why|how|explain)/, c: 0.91 },
    // "what events are best for X major/career" — career search, not event lookup
    { intent: 'career.byMajor', re: /\b(what|which)\b.{0,20}\bevents?\b.{0,30}\b(major|career|field|degree|path)\b/, c: 0.93 },
    { intent: 'career.byMajor', re: /\bevents?.{0,20}(best|good).{0,20}(software|engineering|medicine|design|business|marketing|data|cyber|aerospace|film|media|art|fashion|research)/, c: 0.89 },
        { intent: 'advisor.general', re: /(advisor approval|state advisor|need approval)/, c: 0.9 },
    { intent: 'eligibility.general', re: /(who can (enter|compete)|am i eligible|eligibility)/, c: 0.88 },
    { intent: 'theme.general', re: /(this year'?s? theme|what is the theme|annual theme)/, c: 0.9 },

    { intent: 'deadline.regionals', re: /\b(when|date).*(regional|regionals)\b/, c: 0.92 },
    { intent: 'deadline.states', re: /\b(when|date).*(state|states)\s*(conference|comp)/, c: 0.92 },
    { intent: 'deadline.states', re: /\bstate conference\b/, c: 0.88 },
    { intent: 'deadline.states', re: /\bwhen.*(the )?states?\b/, c: 0.85 },
    { intent: 'deadline.states', re: /\b(states?|state)\s*(date|when|deadline)/, c: 0.85 },
    { intent: 'deadline.nationals', re: /\b(when|date|how (many|long)|days).*(national|nationals)\b/, c: 0.92 },
    { intent: 'deadline.all', re: /\b(when|what|all).*(deadline|dates|schedule)\b/, c: 0.85 },
    { intent: 'conference.when', re: /\bwhen is (the )?conference\b/, c: 0.9 },
    { intent: 'conference.where', re: /\bwhere is (the )?conference\b/, c: 0.9 },
    { intent: 'conference.theme', re: /\bconference theme\b/, c: 0.88 },
    { intent: 'conference.search', re: /\b(conference|nationals).*(store|shirt|badge|shuttle|transport|session|safety|lost|luggage|app|pin exchange|meet and greet|advisor)/, c: 0.85 },

    { intent: 'state.advisor', re: /\b(who is (the |my )?(state )?advisor|contact.*(state|advisor)|state advisor (website|email|phone|info|page))/, c: 0.92 },
    { intent: 'state.website', re: /\b(state (tsa )?(website|site|page|url)|my state.*(website|site))/, c: 0.9 },
    { intent: 'state.website', re: /\btsa (website|site|page)\b/, c: 0.85 },
    { intent: 'state.website', re: /^what is the (website|site)\??$/, c: 0.8 },
    { intent: 'state.social', re: /\b(state.*(instagram|facebook|social|twitter)|my state.*(instagram|social))/, c: 0.88 },
    { intent: 'state.officers', re: /\b(state officer|officer team|who are the (state )?officers)/, c: 0.88 },
    { intent: 'state.general', re: /\b(my state|state tsa|state delegation|state info|state information)\b/, c: 0.82 },

    { intent: 'general.what-is-tsa', re: /\bwhat is tsa\b/, c: 0.92 },
    { intent: 'general.divisions', re: /\b(what|which) (divisions|division)/, c: 0.88 },
    { intent: 'general.divisions', re: /\b(middle school|high school) division/, c: 0.85 },
    { intent: 'general.competitions', re: /\bhow many (events|competitions)/, c: 0.88 },
    { intent: 'general.competitions', re: /\bwhat (are |events|competitions).*tsa\b/, c: 0.82 },
    { intent: 'general.history', re: /\b(history|when was tsa (founded|started|created))/, c: 0.88 },
    { intent: 'general.mission', re: /\b(tsa (mission|vision|motto)|what is tsa'?s? mission)/, c: 0.88 },
    { intent: 'general.achievement', re: /\b(achievement program|pathways to excellence)/, c: 0.9 },
    { intent: 'general.scholarships', re: /\b(scholarship|scholarships|financial aid|nths)/, c: 0.88 },
    { intent: 'general.awards', re: /\b(awards?|recognition|advisor of the year)/, c: 0.82 },
    { intent: 'general.leadership', re: /\b(leadership program|tsa voices|21st century skills)/, c: 0.88 },
    { intent: 'general.how-to-start', re: /\b(how (do i|to) (get started|start|join|sign up)|new to tsa)/, c: 0.9 },
    { intent: 'general.how-competitions-work', re: /\bhow (do|does) (tsa )?(competitions?|events?) work/, c: 0.88 },
    { intent: 'rule.search', re: /\bcitation/, c: 0.85 },
    { intent: 'conference.search', re: /\bshuttle/, c: 0.85 },
    // NOTE: deliberately no bare "ai"/"artificial intelligence" alternative
    // here — that hijacked "What is Artificial Intelligence (AI)?" (an exact
    // event name) into an unrelated rule citation, since this phrase beat
    // overview.general's confidence by a hair. Genuine AI-policy questions
    // ("can we use ai", "is ai allowed") already match via "can (i|we) use" /
    // "allowed" below, and the rules-domain fallback in engine.js still
    // searches on the raw tokens (including ai/artificial) for anything else.
    { intent: 'rule.search', re: /\b(rule|rules|allowed|prohibited|can (i|we) use|dress code|citation|plagiarism|original work|penalties|judging|grievance|disqualif)/, c: 0.82 },
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
