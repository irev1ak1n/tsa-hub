import { pick } from '../core/variation.js';

// Conversational responses. Some entries are control intents that the engine
// acts on rather than answering directly.

const GREETING = [
    'Hey. What would you like to know about TSA?',
    'Hi. Ask me about events, rules, deadlines, or getting started.',
    'Hello. What can I help you find?',
];

const THANKS_GENERIC = ['Anytime.', 'Happy to help.', 'Of course.'];

const BYE = ['See you. Good luck with your events.', 'Take care.'];

const HOW_ARE_YOU = ['Doing fine, thanks. What can I help you with?'];

const IDENTITY = [
    "I'm the TSA Hub Assistant. I answer TSA questions using TSA Hub's structured event data and official TSA resources.",
];

const CAPABILITIES = [
    'I can help with competitive events, requirements, event comparisons, rules, deadlines, conferences, careers connected to events, and getting started with TSA.',
];

const LIMITATIONS = [
    "I only cover TSA. I won't guess at anything I don't have data for, and I'll tell you when information is missing or might be out of date.",
];

const SOURCE = [
    "My answers come from TSA Hub's event data and official TSA resources loaded into the app. When something is a TSA Hub classification rather than an official rule, I say so.",
];

const ARE_YOU_AI = [
    "I'm not a generative AI. I'm a rule based assistant that reads TSA Hub's structured data, so my answers stay consistent and I don't invent facts.",
];

const WHO_BUILT = ['I was built as part of TSA Hub to help students navigate TSA competitions.'];

const CONFUSION = [
    "Let me try again. Which part should I clarify?",
];

const HELP = [
    'Ask me about an event, a requirement, a deadline, or a comparison. For example, "Can I compete alone in Webmaster?"',
];

const NOT_SURE = [
    "I only state what's in the data. If I said something is a TSA Hub classification, that's our rating, not an official TSA ruling.",
];

const OFF_TOPIC = [
    "I'm focused on TSA, but I can help with events, rules, deadlines, conferences, or getting started.",
    "That's outside what I cover. I can help with TSA events, requirements, deadlines, or careers though.",
    "I stick to TSA questions. Ask me about an event, a rule, or a deadline and I'm all yours.",
];

const RULES = [
    { intent: 'restart', re: /^(start over|restart|reset|new chat|clear)\b/, control: true },
    { intent: 'style.simple', re: /(explain|say|put) (it |that )?(more )?simpl|simpler|in simple terms|dumb it down/, control: true },
    { intent: 'style.detail', re: /(tell me more|more detail|explain more|go deeper|elaborate)/, control: true },
    { intent: 'style.short', re: /(short answer|keep it short|be brief|shorter|tldr)/, control: true },
    { intent: 'repeat', re: /(say that again|repeat that|come again|what did you say)/, control: true },
    { intent: 'correction', re: /\b(i meant|i mean|no,? i meant|actually i meant)\b/, control: true },
    { intent: 'affirm', re: /^(yes|yeah|yep|yup|sure|ok|okay|correct|right)\b/, control: true },
    { intent: 'deny', re: /^(no|nope|nah|not really|incorrect)\b/, control: true },
    { intent: 'thanks', re: /\b(thanks|thank you|thx|appreciate it|ty)\b/, variants: THANKS_GENERIC },
    { intent: 'greeting', re: /^(hi|hey|hello|yo|sup|howdy|hiya|good (morning|afternoon|evening))\b/, variants: GREETING },
    { intent: 'bye', re: /\b(bye|goodbye|see you|cya|later)\b/, variants: BYE },
    { intent: 'howareyou', re: /how (are|r) (you|u)|how is it going|how have you been/, variants: HOW_ARE_YOU },
    { intent: 'areyouai', re: /(are you (an )?(ai|bot|robot|human|real)|chatgpt|gpt|language model)/, variants: ARE_YOU_AI },
    { intent: 'whobuilt', re: /(who (made|built|created) you|who are you built by)/, variants: WHO_BUILT },
    { intent: 'identity', re: /(who are you|what are you|your name)/, variants: IDENTITY },
    { intent: 'capabilities', re: /^(what can you (do|help)|how can you help|what do you know about|what are you able)/, variants: CAPABILITIES },
    { intent: 'limitations', re: /(what can(no|')t you|your limits|limitations)/, variants: LIMITATIONS },
    { intent: 'source', re: /(where did you get|what('| i)s your source|how do you know|source for that|according to)/, variants: SOURCE },
    { intent: 'notsure', re: /(are you sure|is that right|are you certain|really\?)/, variants: NOT_SURE },
    { intent: 'confusion', re: /(i (don'?t|do not) (understand|get it)|confused|makes no sense|huh\?)/, variants: CONFUSION },
    { intent: 'help', re: /^(help|what now|what should i ask)[\s?!.]*$/, variants: HELP },
];

/**
 * Detect small talk or a control intent.
 * Returns { intent, control, text } or null.
 */
export function detectSmallTalk(norm, state) {
    const text = norm.rawJoined;
    if (!text) return null;
    for (const rule of RULES) {
        if (!rule.re.test(text)) continue;
        if (rule.control) return { intent: rule.intent, control: true };
        return {
            intent: rule.intent,
            control: false,
            text: contextualize(rule.intent, pick(rule.variants, text + rule.intent), state),
        };
    }
    return null;
}

// Light context awareness, used sparingly so it does not feel canned.
function contextualize(intent, text, state) {
    if (intent === 'thanks' && state?.activeEvent?.name) {
        return `${text} You can ask me anything else about ${state.activeEvent.name}.`;
    }
    if (intent === 'thanks' && state?.activeDomain === 'rules') {
        return `${text} I can also help you find another rule or requirement.`;
    }
    return text;
}

export function offTopicReply(seed) {
    return pick(OFF_TOPIC, seed);
}
