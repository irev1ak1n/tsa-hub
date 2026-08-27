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
const HELP_VARIANTS = [
    "Of course. Tell me what you're trying to figure out. I can help with events, rules, deadlines, choosing an event, conference questions, state TSA info, or TSA Hub itself.",
    "Absolutely. What are you stuck on? If you're not sure where to start, tell me whether it's about an event, competition rules, deadlines, or choosing what to compete in.",
    "Sure — what do you need? I can explain an event, check rules or requirements, look up dates, help you pick something, or point you to your state TSA info.",
];
const HOW_ARE_YOU = ['Doing fine! What can I help you with?', 'All good here. What TSA question do you have?'];
const IDENTITY = [
    "I'm the TSA Hub Assistant. I use TSA Hub's structured data and official TSA resources to answer questions. I'm not a generative AI, so I won't make anything up.",
];
const CAPABILITIES = [
    "A lot of TSA stuff. I can explain events, tell you the current theme or challenge, check team sizes and requirements, explain official rules, look up deadlines and conference dates, help you choose or compare events, find your state TSA contacts, and connect events to careers or majors.\n\nYou don't need to phrase it formally either — just tell me what you're trying to figure out.",
    "I cover events (what they are, team size, cost, difficulty, current theme), rules and requirements, deadlines and conference info, state TSA contacts, careers connected to events, and getting started if you're new.\n\nAsk however you'd normally ask — I'll do my best to figure out what you mean.",
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
const NOT_SURE = ["I only state what's in the data. If I said it's a TSA Hub classification, that's our rating, not an official TSA judgment."];
const OFF_TOPIC = [
    "I'm focused on TSA, but I can help with events, rules, deadlines, conferences, or getting started.",
    "That's outside what I cover, but if it's about TSA, I'll do my best.",
    "I stick to TSA questions. Want help with an event or requirement instead?",
    "I can't help with that one, but I'm all yours for TSA questions.",
];

const RULES = [
    { intent: 'restart', re: /^(start over|restart|reset|new chat|clear)\b/, control: true },
    // Explicit ask for a human — opens the support flow immediately,
    // independent of the consecutive-misunderstanding counter in engine.js.
    { intent: 'requestSupport', re: /\b(contact support|contact tsa hub support|contact tsa hub|tsa hub support|customer support|tech support|i need support|i need app help|talk to (a |)(human|someone|somebody|person)|speak to (a )?(human|person)|human please|real person|i need a human|can (someone|somebody) help me|someone help me|somebody help me|i want to talk to (someone|a person|a human)|let me talk to (a person|someone|somebody|a human)|this bot (isn'?t|is not) (helping|understanding( me)?|working)|this (isn'?t|is not) (helping|working)|bot isnt understanding|you'?re not helping)\b/, control: true },
    // Product/app problem reports also route to TSA Hub Support (section 29)
    // — the student reporting a bug means TSA Hub, never National TSA.
    { intent: 'requestSupport', re: /\b(calendar|search( page)?|coach|website|(this |the )?app) (is broken|broken|is crashing|crashes|keeps crashing|is not working|isn'?t working|gives? (me )?(the )?(wrong|same) (answers?|thing))\b/, control: true },
    { intent: 'requestSupport', re: /\b(who do i tell about|report|i found) a bug\b/, control: true },
    { intent: 'requestSupport', re: /\bsomething is broken\b/, control: true },
    { intent: 'requestSupport', re: /\bcoach keeps giving me (the )?(wrong|same) (answers?|thing)\b/, control: true },
    { intent: 'requestSupport', re: /\byou keep giving me the same thing\b/, control: true },
    { intent: 'requestSupport', re: /^(human|support|help me)[!.?\s]*$/, control: true },
    { intent: 'keepTrying', re: /^(keep trying|i'?ll keep trying)\b/, control: true },
    { intent: 'style.simple', re: /(explain|say|put) (it |that )?(more )?simpl|simpler|in simple terms|dumb it down/, control: true },
    { intent: 'style.detail', re: /(tell me more|more detail|explain more|go deeper|elaborate)/, control: true },
    { intent: 'style.short', re: /(short answer|keep it short|be brief|shorter|tldr)/, control: true },
    { intent: 'repeat', re: /(say that again|repeat that|come again|what did you say)/, control: true },
    { intent: 'correction', re: /\b(i meant|i mean|no,? i meant|actually i meant)\b/, control: true },
    // Negative lookahead: "ok thanks"/"okay bye" etc. are thanks/bye, not a
    // clarification affirmation — without this, "ok"/"yes" at the start
    // greedily wins before the thanks/bye rules ever get a chance.
    { intent: 'affirm', re: /^(yes|yeah|yep|yup|sure|ok|okay|correct|right)\b(?!.*\b(thanks|thank you|bye|goodbye)\b)/, control: true },
    { intent: 'deny', re: /^(no|nope|nah|not really|incorrect)\b/, control: true },
    { intent: 'thanks', re: /\b(thanks|thank you|thx|ty|appreciate (it|you)|got it thanks|(cool|ok|okay|awesome) thanks|good answer|goated|ur goated|big w)\b/, variants: THANKS_GENERIC },
    { intent: 'thanks', re: /^(bet|w|nice)( bro)?[!.\s]*$/, variants: THANKS_GENERIC },
    // "perfect"/"gotcha"/"makes sense"/"that helps" are only reliably THANKS
    // when they're the whole reaction, not a substring — unanchored, these
    // swallow real questions that happen to contain the same words (e.g.
    // "does the rule makes sense to you", "what's the perfect team size").
    { intent: 'thanks', re: /^(that )?makes sense[!.\s]*$|^perfect[!.\s]*$|^gotcha[!.\s]*$|^that (helps|was helpful)[!.\s]*$/, variants: THANKS_GENERIC },
    { intent: 'greeting', re: /^(hi+|hey+|hello|yo|sup|wsp|wsg|whats? up|howdy|hiya|good (morning|afternoon|evening)|gm|morning)\b/, variants: GREETING },
    { intent: 'greeting', re: /^(hey|yo|hi|hello) (bro|man|coach|tsa|there|assistant)\b/, variants: GREETING },
    // NOTE: "that's" is contraction-expanded to "that is" before this runs.
    { intent: 'bye', re: /\b(bye|goodbye|see you|see ya|cya|catch you later|gtg|gotta go|talk later|peace( out)?|later( bro)?|(im|i'?m) (done|good now)|that'?s? all|that is all)\b/, variants: BYE },
    // NOTE: "u" is contraction-expanded to "you" before this regex runs
    // (normalize.js), so "how u doing" arrives here as "how you doing" —
    // matched by "how you (doing|been)", not a literal "u".
    { intent: 'howareyou', re: /how (are|r) (you|u)( (doing|been))?|how you (doing|been)|how('?s| is) it going|how have you been|hows it going|wyd|whats good|what'?s good|you good\??$/, variants: HOW_ARE_YOU },
    { intent: 'areyouai', re: /(are you (an )?(ai|bot|robot|human|real)|chatgpt|gpt|language model)/, variants: ARE_YOU_AI },
    { intent: 'whobuilt', re: /(who (made|built|created) you|who are you built by)/, variants: WHO_BUILT },
    { intent: 'identity', re: /(who are you|what are you|your name)/, variants: IDENTITY },
    { intent: 'capabilities', re: /^(what can you (do|help)|how can you help|what do you know about|what are you able|what can you help me with|what can u (do|help)|what do you do|what are you for)[?\s.]*$/, variants: CAPABILITIES },
    { intent: 'limitations', re: /(what can(no|')t you|your limits|limitations)/, variants: LIMITATIONS },
    { intent: 'source', re: /(where did you get|what('| i)s your source|how do you know|source for that|according to|(show|see) (me )?(the |a )?(source|pdf|link)|^source$|^official source$|official link|give me the link|is that official|where does tsa say that|can i (verify that|double check that)|show me where it says that|prove it|where can i (check|double check)|is that from national tsa|what document says that|where is this written)/, variants: SOURCE },
    { intent: 'notsure', re: /(are you sure|is that right|are you certain|really\?)/, variants: NOT_SURE },
    { intent: 'confusion', re: /(i (don'?t|do not) (understand|get it)|confused|makes no sense|huh\?)/, variants: CONFUSION },
    // Broad HELP coverage — real students rarely say the bare word "help".
    // One maintainable regex with grouped alternatives beats 40 near-
    // duplicate rules; each group below corresponds to a phrasing family
    // from the mission brief (direct asks, "what do I do", "I'm lost", etc).
    {
        intent: 'help',
        re: /(^(help|what now|what should i ask)[?\s.]*$)|((can|could) (you|u) (please |pls |plz )?help( me)?\b)|(\bi need (some |ur |your )?help\b)|(\bcan (someone|somebody|anyone) help me\b)|(\bwhat can (you|u) (do|help with)\b)|(\bwhat do you do\b)|(\bwhat can i ask (you|u)\b)|(\bwhere (do|should) i (start|begin)\b)|(\bi'?m (lost|confused)\b)|(\bi have no idea what i'?m doing\b)|(\b(idk|i do not know|i dont know) what to do\b)|(^what (do|should) i do\??$)|(\bcan (you|u) explain (stuff|this) to me\b)|(\bcan (you|u) explain tsa\b)|(\b(pls|please) help\b)|(\bhelp (pls|please)\b)|(\bcan (you|u) (walk me through|guide me)\b)|(\bi need guidance\b)|(\bshow me what to do\b)|(\btell me what to do\b)|(^how does this work\??$)|(\bwhat am i supposed to do( here)?\b)|(\bpoint me in the right direction\b)|(\bbro help\b)/,
        variants: HELP_VARIANTS,
    },
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
