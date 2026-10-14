import { ALL_RULES } from '../../../data/rules.js';
import { COMPETITION_RULES } from '../../../data/competitionRules.js';
import { pick } from '../core/variation.js';

function lower(s) { return (s || '').toLowerCase(); }

// Search ALL_RULES by keyword overlap, returning the best matches with
// their scores (kept, not just the rules themselves — answerRule below
// needs them to compare against searchTopics' best score).
function searchRules(tokens, eventId) {
    return ALL_RULES.map((rule) => {
        let score = 0;
        const title = lower(rule.title);
        const text = lower(rule.text);
        for (const t of tokens) {
            if (title.includes(t)) score += 3;
            if (text.includes(t)) score += 1;
        }
        if (eventId && rule.eventId === eventId) score += 3;
        if (eventId && rule.eventId && rule.eventId !== eventId) score -= 2;
        return { rule, score };
    }).filter((r) => r.score >= 3).sort((a, b) => b.score - a.score).slice(0, 3);
}

// Search the structured COMPETITION_RULES categories/topics.
function searchTopics(tokens) {
    const results = [];
    for (const cat of COMPETITION_RULES) {
        for (const topic of (cat.topics || [])) {
            let score = 0;
            const title = lower(topic.title);
            const desc = lower(topic.description || '');
            for (const t of tokens) {
                if (title.includes(t)) score += 3;
                if (desc.includes(t)) score += 1;
            }
            if (score >= 3) results.push({ cat, topic, score });
        }
    }
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, 2);
}

function topicToText(topic) {
    if (!topic.points || !topic.points.length) return topic.description || '';
    const points = topic.points.filter((p) => typeof p === 'string').slice(0, 3);
    return points.join(' ');
}

export function answerRule(tokens, { eventId = null, seed = '' } = {}) {
    // Structured competition-rules topics are the richer answer format, but
    // a single generic token (e.g. "tsa") can clear their low match bar
    // without the topic actually being about what was asked — "what is the
    // TSA dress code" once matched "Copyright Permission & TSA Branding" on
    // the word "tsa" alone (score 3) before the much stronger flat-rules
    // dress-code match (score 9, from "dress"+"code" in both its title and
    // text) ever got a chance to compete. Run both searches and let whoever
    // scored higher win; topics keep their edge only on an actual tie.
    const topicHits = searchTopics(tokens);
    const ruleHits = searchRules(tokens, eventId);
    const topicScore = topicHits.length ? topicHits[0].score : -Infinity;
    const ruleScore = ruleHits.length ? ruleHits[0].score : -Infinity;

    if (topicHits.length && topicScore >= ruleScore) {
        const { cat, topic } = topicHits[0];
        const body = topicToText(topic);
        const source = topic.sourceSection || cat.sourceSection || '';
        const cite = source ? ` (${source})` : '';
        return {
            text: `${topic.title}${cite}. ${body}`,
            sourceType: 'official',
            source: { title: topic.title, section: source },
        };
    }

    if (!ruleHits.length) return null;

    const r = ruleHits[0].rule;
    const cite = r.id ? ` [${r.id}]` : '';
    const scope = r.scope === 'Event rule' && r.eventId ? ` (${r.eventId})` : '';
    return {
        text: `${r.title}${cite}${scope}. ${r.text}`,
        sourceType: 'official',
        source: { title: r.title, section: r.id },
    };
}
