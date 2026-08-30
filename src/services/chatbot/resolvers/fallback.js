import { pick } from '../core/variation.js';

// Strong, transparent "I understand the question, I just don't have a
// verified answer" wording — deliberately never "I don't know" (too weak)
// and never invents a number/fact to fill the gap. Rotated by `pick(..., seed)`
// so repeated no-data answers in one session don't sound copy-pasted.
const NO_VERIFIED_DATA = [
    "I couldn't find verified information about that in the TSA resources available to me.",
    "I don't have an accurate source for that, so I don't want to guess.",
    "I couldn't verify that from the official or trusted TSA resources currently available to TSA Hub.",
    "There isn't enough verified information in my available resources for me to answer that confidently.",
    "I found no reliable TSA Hub resource that answers that specific question.",
    "I don't have confirmed information for that yet.",
    "I can't give you a reliable answer from the resources I have.",
    "The available TSA resources don't provide a clear answer to that.",
    "I couldn't find an official source that confirms that.",
    "I don't want to make up an answer — I wasn't able to verify this from the TSA resources currently available.",
    "I couldn't find a reliable TSA source for that.",
    "I don't have verified information for that specific question.",
    "The resources available to me don't answer that clearly.",
    "I wasn't able to confirm that from an official TSA source.",
    "I don't have enough trustworthy information to give you an accurate answer.",
    "I couldn't verify that, and I'd rather not guess.",
    "That detail isn't included in the TSA resources I currently have.",
    "I couldn't find that information in the resources available to TSA Hub.",
    "I don't have a confirmed answer for that.",
    "I don't see an official source that specifies that.",
    "National TSA doesn't appear to publish that information in the sources I have.",
    "I don't have reliable data for that exact value.",
    "I wasn't able to find a current official answer for that.",
    "I can't confirm that from the current TSA documents.",
    "I understand what you're asking, but I don't have reliable data for it.",
    "I'd rather not guess when I can't verify the information.",
    "That isn't covered by the TSA resources I currently have.",
    "I can help with TSA-related information, but I don't have data for that topic.",
];

// Out-of-scope wording — for questions Coach understood but that have
// nothing to do with TSA. Distinct in tone from NO_VERIFIED_DATA: this isn't
// "the data is missing," it's "this isn't something I cover at all."
const OUT_OF_SCOPE_TEXT = [
    "I don't have reliable data for that through the TSA resources I use.",
    "That's outside the TSA information I have access to. I can help with TSA events, rules, deadlines, conferences, or resources.",
    "I don't have accurate information for that question in the resources available to me.",
    "I can't verify that through TSA Hub's resources.",
    "This isn't something my TSA resources cover.",
    "That question is outside the TSA information I have access to.",
];

export function fallback(kind, { seed = '', candidates = [], domain = null, eventName = '', suggestions = [] } = {}) {
    switch (kind) {
        // TSA_NO_VERIFIED_DATA — Coach understood the question, it's
        // TSA-related, but no trusted source answers it. NOT a
        // misunderstanding (see engine.js's MISUNDERSTANDING_KINDS).
        case 'tsa-unsupported': {
            const prefix = eventName ? `For ${eventName}: ` : '';
            return { text: `${prefix}${pick(NO_VERIFIED_DATA, seed)}`, kind };
        }
        case 'out-of-scope':
            return { text: pick(OUT_OF_SCOPE_TEXT, seed), kind };
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
        // TSA_NO_RESOURCE_MATCH — the message looks like it's naming a
        // specific TSA event, but nothing in the event data matches. Never
        // invent a fake event to answer with; name real events only when
        // offering alternatives to check instead.
        case 'unknown-event': {
            const namePart = eventName ? ` called '${eventName}'` : '';
            const base = `I couldn't find an official TSA event${namePart} in the event resources I have.`;
            if (suggestions.length) {
                const list = suggestions.length === 1 ? suggestions[0] : `${suggestions.slice(0, -1).join(', ')} or ${suggestions[suggestions.length - 1]}`;
                return { text: `${base} If you meant ${list}, tell me which one and I'll check it.`, kind };
            }
            return { text: `${base} Try the full event name and I'll check it.`, kind };
        }
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
                    "I'm not sure what you mean yet. Can you tell me a little more about what you're trying to figure out?",
                    "I couldn't make out the question. Try saying it another way and I'll give it another shot.",
                    "I may be missing what you mean. What are you trying to get help with?",
                    "I'm not sure what you're asking. You can ask about an event, a rule, a deadline, or compare two events.",
                    "I didn't catch that. Try asking about a specific event, rule, or deadline.",
                ], seed),
                kind: 'unknown',
            };
    }
}
