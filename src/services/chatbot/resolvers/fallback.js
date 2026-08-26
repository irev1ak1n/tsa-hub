import { pick } from '../core/variation.js';

export function fallback(kind, { seed = '', candidates = [], domain = null } = {}) {
    switch (kind) {
        case 'tsa-unsupported':
            return {
                text: pick([
                    "I understand you're asking about TSA, but I don't have a reliable answer for that yet. I can help with events, rules, deadlines, conference info, or getting started.",
                    "That's a TSA question I can't answer confidently yet. Try asking about a specific event, rule, or deadline.",
                ], seed),
                kind,
            };
        case 'need-event':
            return { text: pick([
                'That depends on the event. Which one are you asking about?',
                'I can check that. What\'s the event name?',
                'Which event do you mean?',
            ], seed), kind };
        case 'need-second-event':
            return { text: pick([
                'Which two events would you like me to compare?',
                'I need two event names to compare. Which ones?',
            ], seed), kind };
        case 'ambiguous-event': {
            const names = candidates.map((c) => c.name).filter(Boolean);
            const divisions = new Set(candidates.map((c) => c.division).filter(Boolean));
            // Same event name in both divisions ("Audio Podcasting") — "did
            // you mean X or X?" would be nonsense, ask about division instead.
            if (names.length >= 2 && new Set(names).size === 1 && divisions.size >= 2) {
                const divLabel = (d) => (d === 'HS' ? 'High School' : 'Middle School');
                const divList = [...divisions].map(divLabel).join(' or ');
                return { text: `Are you asking about the ${divList} version of ${names[0]}? (${divList.replace(' or ', ' and ')} have different details.)`, kind, candidates };
            }
            const list = names.length === 2 ? names.join(' or ') : names.join(', ');
            return { text: pick([
                `I found more than one possible match. Did you mean ${list}?`,
                `Did you mean ${list}?`,
            ], seed), kind, candidates };
        }
        case 'unknown-event':
            return { text: pick([
                "I couldn't match that to an event I have on file. Try the full event name.",
                "I'm not finding that event. Can you give me the full name?",
            ], seed), kind };
        case 'missing-data':
            return { text: pick([
                "I don't have a reliable answer for that yet. Check the current official guide for the exact requirement.",
                "I don't have an official value for that right now, and I don't want to guess.",
            ], seed), kind };
        case 'unsupported-domain':
            return {
                text: `I don't have ${domain || 'that'} data loaded yet. I can help with events, rules, deadlines, conference info, and state TSA right now.`,
                kind,
            };
        default:
            return {
                text: pick([
                    "I'm not sure what you're asking. You can ask about an event, a rule, a deadline, or compare two events.",
                    "I didn't catch that. Try asking about a specific event, rule, or deadline.",
                ], seed),
                kind: 'unknown',
            };
    }
}
