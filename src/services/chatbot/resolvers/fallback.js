import { pick } from '../core/variation.js';

// Fallbacks are typed, so the user gets a useful next step instead of a wall
// of "I don't understand".

const CATEGORIES = ['Events', 'Rules & Requirements', 'Deadlines & Conference', 'Careers & Majors', 'Getting Started'];

export function fallback(kind, { seed = '', candidates = [], domain = null } = {}) {
    switch (kind) {
        case 'tsa-unsupported':
            return {
                text: pick([
                    "I understand you're asking about TSA, but I don't have a reliable answer for that yet.",
                    "That's a TSA question I can't answer confidently yet.",
                ], seed) + ` I can help with ${CATEGORIES.slice(0, 4).join(', ')}, or getting started.`,
                kind,
            };
        case 'need-event':
            return { text: 'That depends on the event. Which event are you asking about?', kind };
        case 'need-second-event':
            return { text: 'Which two events would you like me to compare?', kind };
        case 'ambiguous-event': {
            const names = candidates.map((c) => c.name).filter(Boolean);
            const list = names.length === 2 ? names.join(' or ') : names.join(', ');
            return { text: `I couldn't confidently match that event name. Did you mean ${list}?`, kind, candidates };
        }
        case 'unknown-event':
            return { text: "I couldn't match that to an event I have on file. Try the full event name.", kind };
        case 'missing-data':
            return { text: "I don't have an official value for that yet, so I don't want to guess.", kind };
        case 'unsupported-domain':
            return {
                text: `I don't have ${domain || 'that'} data loaded yet, so I can't answer that reliably. I can help with events, requirements, and comparisons right now.`,
                kind,
            };
        default:
            return {
                text: "I'm not sure what you're asking. You can ask about an event, a requirement, a deadline, or compare two events.",
                kind: 'unknown',
            };
    }
}
