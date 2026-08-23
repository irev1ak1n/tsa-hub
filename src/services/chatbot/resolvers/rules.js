import { ALL_RULES } from '../../../data/rules.js';
import { COMPETITION_RULES } from '../../../data/competitionRules.js';
import { pick } from '../core/variation.js';

function lower(s) { return (s || '').toLowerCase(); }

// Search ALL_RULES by keyword overlap, returning the best matches.
function searchRules(tokens, eventId) {
    const scored = ALL_RULES.map((rule) => {
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
    }).filter((r) => r.score >= 3).sort((a, b) => b.score - a.score);
    return scored.slice(0, 3).map((s) => s.rule);
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
    // First try the structured competition rules (richer answers).
    const topicHits = searchTopics(tokens);
    if (topicHits.length) {
        const { cat, topic } = topicHits[0];
        const body = topicToText(topic);
        const source = topic.sourceSection || cat.sourceSection || '';
        const cite = source ? ` (${source})` : '';
        return {
            text: `${topic.title}${cite}: ${body}`,
            sourceType: 'official',
            source: { title: topic.title, section: source },
        };
    }

    // Fallback to the flat ALL_RULES search.
    const hits = searchRules(tokens, eventId);
    if (!hits.length) return null;

    const r = hits[0];
    const cite = r.id ? ` [${r.id}]` : '';
    const scope = r.scope === 'Event rule' && r.eventId ? ` (${r.eventId})` : '';
    return {
        text: `${r.title}${cite}${scope}: ${r.text}`,
        sourceType: 'official',
        source: { title: r.title, section: r.id },
    };
}
