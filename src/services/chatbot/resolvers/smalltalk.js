import { pick } from '../core/variation.js';

const GREETING = [
    'Hey! What do you want to know about TSA?',
    'Hi! I can help with events, rules, deadlines, and getting started.',
    'Hey! Ask me anything about TSA events or requirements.',
    'Hello! What can I help you find?',
];
const THANKS_GENERIC = [
    'Of course. Let me know if you have more questions.',
    'Anytime. Want to check another requirement?',
    'No problem. I can also help compare events or check rules.',
    'Happy to help.',
];
const BYE = ['See you. Good luck with your events!', 'Take care! Come back anytime.', 'Good luck this season!'];
const HOW_ARE_YOU = ['Doing fine! What can I help you with?', 'All good here. What TSA question do you have?'];
const IDENTITY = [
    "I'm the TSA Hub Assistant. I use TSA Hub's structured data and official TSA resources to answer questions. I'm not a generative AI, so I won't make anything up.",
];
const CAPABILITIES = [
    'I can help with competitive events, team sizes, costs, deadlines, rules, conference info, careers connected to events, state TSA info, and getting started.',
    'I cover events, requirements, comparisons, rules, deadlines, conference details, state info, and careers. Ask me anything in those areas.',
];
const LIMITATIONS = [
    "I only cover TSA topics. I won't guess at anything I don't have data for, and I'll tell you when something is missing or might be out of date.",
];
const SOURCE = [
    "My answers come from TSA Hub's event database and official TSA resources. When something is a TSA Hub classification rather than an official rule, I say so.",
];
const ARE_YOU_AI = [
    "I'm not a generative AI. I'm a rule-based assistant that reads TSA Hub's structured data, so my answers stay consistent and I don't invent facts.",
];
const WHO_BUILT = ['I was built as part of TSA Hub to help students navigate TSA competitions.'];
const CONFUSION = ['No worries. Which part should I explain differently?', 'Sure, I can try to make that clearer. What part didn\'t make sense?'];
const HELP = ['You can ask about an event, a requirement, a deadline, or compare two events. For example, "Can I compete alone in Webmaster?"'];
const NOT_SURE = ["I only state what's in the data. If I said it's a TSA Hub classification, that's our rating, not an official TSA judgment."];
const OFF_TOPIC = [
    "I'm focused on TSA, but I can help with events, rules, deadlines, conferences, or getting started.",
    "That's outside what I cover, but if it's about TSA, I'll do my best.",
    "I stick to TSA questions. Want help with an event or requirement instead?",
    "I can't help with that one, but I'm all yours for TSA questions.",
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
    { intent: 'capabilities', re: /^(what can you (do|help)|how can you help|what do you know about|what are you able|what can you help me with)[?\s.]*$/, variants: CAPABILITIES },
    { intent: 'limitations', re: /(what can(no|')t you|your limits|limitations)/, variants: LIMITATIONS },
    { intent: 'source', re: /(where did you get|what('| i)s your source|how do you know|source for that|according to)/, variants: SOURCE },
    { intent: 'notsure', re: /(are you sure|is that right|are you certain|really\?)/, variants: NOT_SURE },
    { intent: 'confusion', re: /(i (don'?t|do not) (understand|get it)|confused|makes no sense|huh\?)/, variants: CONFUSION },
    { intent: 'help', re: /^(help|what now|what should i ask)[?\s.]*$/, variants: HELP },
];

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

function contextualize(intent, text, state) {
    if (intent === 'thanks' && state?.activeEvent?.name) {
        return pick([
            `${text} You can ask me anything else about ${state.activeEvent.name}.`,
            `${text} Want to know something else about ${state.activeEvent.name}?`,
        ], state.activeEvent.name);
    }
    if (intent === 'thanks' && state?.activeDomain === 'rules') return `${text} I can also help you find another rule.`;
    if (intent === 'thanks' && state?.activeDomain === 'deadlines') return `${text} I can also check other dates for you.`;
    if (intent === 'thanks' && state?.activeDomain === 'state') return `${text} Want to check another state detail?`;
    return text;
}

export function offTopicReply(seed) { return pick(OFF_TOPIC, seed); }
