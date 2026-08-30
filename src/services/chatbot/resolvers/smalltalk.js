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
const PERSONAL_QUESTION = [
    "I don't have a personal life like that — I'm an AI assistant built to help with TSA.",
    "I don't have family, an age, or a home. I'm just here to help with TSA Hub.",
    "That's not something I have, but happy to help with TSA instead.",
    "I don't have personal favorites or a life outside of TSA Hub, but I do like helping with TSA questions.",
];
const CONFUSION = ['No worries. Which part should I explain differently?', 'Sure, I can try to make that clearer. What part didn\'t make sense?'];
const NOT_SURE = ["I only state what's in the data. If I said it's a TSA Hub classification, that's our rating, not an official TSA judgment."];
const OFF_TOPIC = [
    "I'm focused on TSA, but I can help with events, rules, deadlines, conferences, or getting started.",
    "That's outside what I cover, but if it's about TSA, I'll do my best.",
    "I stick to TSA questions. Want help with an event or requirement instead?",
    "I can't help with that one, but I'm all yours for TSA questions.",
    "I don't have reliable data for that through the TSA resources I use.",
    "That's outside the TSA information I have access to. I can help with TSA events, rules, deadlines, conferences, or choosing an event.",
    "I don't have accurate information for that question in the resources available to me.",
    "I can't verify that through TSA Hub's resources.",
    "This isn't something my TSA resources cover.",
];

const RULES = [
    { intent: 'restart', re: /^(start over|restart|reset|new chat|clear|lets start over|let us start over)\b/, control: true },
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
    { intent: 'requestSupport', re: /^(human|support|help me|bug|feedback)[!.?\s]*$/, control: true },
    { intent: 'keepTrying', re: /^(keep trying|i'?ll keep trying)\b/, control: true },
    { intent: 'style.simple', re: /(explain|say|put) (it |that )?(more )?simpl|simpler|in simple terms|dumb it down/, control: true },
    { intent: 'style.detail', re: /(tell me more|more detail|explain more|go deeper|elaborate)/, control: true },
    { intent: 'style.short', re: /(short answer|keep it short|be brief|shorter|tldr)/, control: true },
    { intent: 'repeat', re: /(say that again|repeat that|come again|what did you say)/, control: true },
    { intent: 'correction', re: /\b(i meant|i mean|no,? i meant|actually i meant|not that one|wrong (event|division|year)|scratch that|forget that|actually nevermind|changed my mind|i clicked the wrong thing|(thats|that is) the wrong (year|event)|i said (middle|high) school|(im|i am) actually in (middle|high) school|not what to submit|actually high school not middle school|actually middle school not high school|go back to the last question|forget what i said before|actually scratch what i just asked)\b/, control: true },
    // Frustration / conversational repair — real, distinct from a genuine
    // misunderstanding (the response has no `kind`, so it never advances
    // the support-escalation counter). Acknowledges the miss and asks the
    // student to restate rather than repeating the same answer verbatim.
    {
        intent: 'repair',
        // NOTE: "ur" is contraction-expanded to "your" before this runs, so
        // "ur not listening" arrives as "your not listening" — match the
        // post-expansion form, same class of bug fixed elsewhere this
        // session. "i'll" is ALSO a CONTRACTIONS entry (-> "i will"), so
        // "i'll try again" always arrives as "i will try again" — the
        // `('ll| will)` alternation still covers both because "i'll" is
        // fully expanded before this regex ever runs. "ill" (no apostrophe,
        // not a CONTRACTIONS key) is matched as its own literal alternative.
        re: /(\b(thats|that is) not what i asked\b)|(\byou misunderstood me\b)|(\byou (dont|do not) get what i mean\b)|(\b(thats|that is) not what i meant\b)|(\bwhy are you answering that\b)|(\byou keep repeating yourself\b)|(\byou already said that\b)|(\bstop giving me the same answer\b)|(\b(thats|that is) the same answer\b)|(\bcan you actually answer my question\b)|(\bi asked something else\b)|(\b(ur|your|youre|you are) not listening\b)|(\bbro listen\b)|(\bwait listen\b)|(\blet me explain again\b)|(\blet me explain better\b)|(\bi('ll| will) try again\b)|(\bill try again\b)|(\blet me say it differently\b)|(\bmaybe i explained it (bad|wrong)\b)|(\blet me rephrase\b)|(\bdifferent question\b)|(\bno forget that answer\b)|(\bcan we restart this\b)|(\byou got the wrong (event|division|year)\b)|(\bthat sounds wrong\b)|(\bi (dont|do not) think (thats|that is) right\b)|(\bmy advisor said different\b)|(\bthe (website|pdf) says something else\b)|(\bwebsite says different\b)|(\bcan (you|u) check again\b)|(\b(thats|that is) not my question\b)|(\byou answered something else\b)|(\bi was asking something different\b)|(\byou keep giving me the same answer\b)|(\bstop repeating that\b)|(\bcan you check that again please\b)|(\bill try to rephrase this\b)|(\btry again please\b)|(\bthat answer (doesnt|does not) make sense for my question\b)|(\bthis (isnt|is not) answering my question\b)|(\b(youre|you are) still not getting it\b)|(\bthis (isnt|is not) what i asked\b)|(\b(youre|you are) not getting it\b)|(\bi already told you the event\b)|(\bwe went over this already\b)|(\bcan we please just start over\b)|(\b(youre|you are) answering a totally different question\b)|(\bthis is frustrating can you just answer directly\b)|(\bi (dont|do not) think you understood what i said\b)|(\bcan you actually read what i typed\b)|(\b(youre|you are) giving me info i (didnt|did not) ask for\b)/,
        control: true,
    },
    // Negative lookahead: "ok thanks"/"okay bye" etc. are thanks/bye, not a
    // clarification affirmation — without this, "ok"/"yes" at the start
    // greedily wins before the thanks/bye rules ever get a chance.
    // NOTE: "bet"/"gotcha" deliberately excluded — they're already the
    // anchored thanks-reaction rule below, which never gets a turn if
    // affirm (scanned first) claims them here with no pending clarification
    // to act on.
    { intent: 'affirm', re: /^(yes|yeah|yep|yup|yea|sure|ok|okay|alright|correct|right|fair|cool|nice ok|got it|i see|oh+ ?okay|ah+ ?okay|ah+ i see|oh+)\b(?!.*\b(thanks|thank you|bye|goodbye)\b)/, control: true },
    { intent: 'deny', re: /^(no|nope|nah|not really|incorrect|maybe|probably|i guess|kinda|sorta|not that|i (really )?dont want that|i (really )?do not want that|i dont like that|i do not like that|not presenting|nothing with speaking|not that event|give me something else|not a chance|definitely not|thats a no for me|that is a no for me|skip that one)\b/, control: true },
    { intent: 'thanks', re: /\b(thanks|thank you|thx|ty|appreciate (it|you)|got it thanks|(cool|ok|okay|awesome) thanks|good answer|goated|ur goated|big w)\b/, variants: THANKS_GENERIC },
    { intent: 'thanks', re: /^(bet|w|nice)( bro)?[!.\s]*$/, variants: THANKS_GENERIC },
    // "perfect"/"gotcha"/"makes sense"/"that helps" are only reliably THANKS
    // when they're the whole reaction, not a substring — unanchored, these
    // swallow real questions that happen to contain the same words (e.g.
    // "does the rule makes sense to you", "what's the perfect team size").
    { intent: 'thanks', re: /^(that )?makes sense[!.\s]*$|^perfect[!.\s]*$|^gotcha[!.\s]*$|^that (helps|was helpful)[!.\s]*$/, variants: THANKS_GENERIC },
    // NOTE: "whats"/"what's" are contraction-expanded to "what is" before
    // this runs, so "whats up"/"what's up" both arrive as "what is up" —
    // matching literal "whats? up" here never actually worked.
    { intent: 'greeting', re: /^(hi+|hey+|hello|yo|sup|wsp|wsg|what is up|howdy|hiya|good (morning|afternoon|evening)|gm|morning)\b/, variants: GREETING },
    { intent: 'greeting', re: /^(hey|yo|hi|hello) (bro|man|coach|tsa|there|assistant)\b/, variants: GREETING },
    // NOTE: "that's" is contraction-expanded to "that is" before this runs.
    // NOTE: "gotta" is contraction-expanded to "got to" before this runs.
    { intent: 'bye', re: /\b(bye|goodbye|see you|see ya|cya|catch you later|gtg|got to go|talk later|peace( out)?|later( bro)?|(im|i'?m|i am) (done|good now)|that'?s? all|that is all)\b/, variants: BYE },
    // NOTE: "u" is contraction-expanded to "you" before this regex runs
    // (normalize.js), so "how u doing" arrives here as "how you doing" —
    // matched by "how you (doing|been)", not a literal "u".
    // NOTE: "whats"/"what's" -> "what is" pre-expansion, same as greeting.
    { intent: 'howareyou', re: /how (are|r) (you|u)( (doing|been))?|how you (doing|been)|how('?s| is) it going|how have you been|hows it going|wyd|what is good\b|you good\??$/, variants: HOW_ARE_YOU },
    // NOTE: bare "chatgpt"/"gpt" used to match ANY mention of the word
    // anywhere in a message — which meant a real AI-usage-policy question
    // like "can I use chatgpt for this event" got hijacked into "are you an
    // AI?" instead of answering the actual rules question. Scoped to the
    // identity-question shape only; "can/may (we/i) use chatgpt/gpt" and
    // similar usage questions are handled by rule.search instead.
    { intent: 'areyouai', re: /(are you (an? )?(ai|bot|robot|human|real)|are (u|you) (chatgpt|gpt)|is this chatgpt|language model)/, variants: ARE_YOU_AI },
    { intent: 'whobuilt', re: /(who (made|built|created) you|who are you built by)/, variants: WHO_BUILT },
    // Personal questions about the assistant itself — never a "which event
    // do you mean?" clarification. Matched BEFORE any event-resolution logic
    // runs (smalltalk always runs first), so "whats ur mom name" (which
    // expands to "what is your mom name" and would otherwise trip
    // overview.general's bare "what is " pattern) never reaches it.
    {
        intent: 'personalQuestion',
        re: /(\bwhat is (ur|your) (mom|dad|mother|father|parents?)( s)? name\b)|(\bdo (you|u) have (a mom|a dad|a mother|a father|parents|a family|siblings|kids|children|a pet|a crush|a job|feelings|emotions|fears|hobbies|friends|a favorite|a life)\b)|(\bwho is (your|ur) (mom|dad|mother|father)\b)|(\bhow old are (you|u)\b)|(\bwhat is (your|ur) (age|name|zodiac sign|dream job)\b)|(\bdo (you|u) (sleep|dream|eat|drink|get tired|get bored|get lonely|get sick|get annoyed|get hungry|go to school|go outside|watch tv|play games|read books|believe in god|celebrate (christmas|birthdays)|wish you were human|want to be human|know everything|fall in love|love me|care about me)\b)|(\bwhere do (you|u) live\b)|(\bwhat is (your|ur) (favorite|favourite) (color|colour|event|food|movie|song|number|book|band|hobby|animal|season|subject|game|holiday)\b)|(\bwhat is (your|ur) (least favorite|dream job|zodiac sign)\b)|(\bdo (you|u) like (me|tsa|school|animals|music|your job)\b)|(\bare (you|u) (married|single|smarter than me|happy|afraid of anything|scared of anything)\b)|(\bdo (you|u) have (a )?(life|hobbies|friends|fears|emotions)\b)|(\bcan (you|u) (feel|get tired|get sick|fall in love|get lonely)\b)|(\bcan i be (your|ur) friend\b)|(\bwill (you|u) be my friend\b)|(\b(whos|who is) your best friend\b)|(\b(whats|what is) it like (being an ai|to be a chatbot)\b)|(\bdo (you|u) have (a girlfriend|a boyfriend)\b)|(\bwhen is (your|ur) birthday\b)/,
        variants: PERSONAL_QUESTION,
    },
    { intent: 'identity', re: /(who are you|what are you|your name)/, variants: IDENTITY },
    { intent: 'capabilities', re: /^(what can you (do|help)|how can you help|what do you know about|what are you able|what can you help me with|what can u (do|help)|what do you do|what are you for)[?\s.]*$/, variants: CAPABILITIES },
    { intent: 'limitations', re: /(what can'?t you|your limits|limitations|what are you not able to do|what things can'?t you help with|are there things you can'?t do|what is outside your capabilities|is there anything you can'?t do|what don'?t you have access to|can you do everything)/, variants: LIMITATIONS },
    { intent: 'source', re: /(where did you get|what('| i)s your source|how do you know|source for that|according to|(show|see) (me )?(the |a )?(source|pdf|link)|^source$|^official source$|official link|give me the link|is that official|where does tsa say that|can i (verify that|double check that)|show me where it says that|prove it|where can i (check|double check)|is that from national tsa|what document says that|where is this written|who says that|is that your opinion|is that tsa hubs opinion|is that official or just advice|can you prove that|what page\b|what pdf\b|which document\b|what section\b|what year is that from|is that current\b|is that for this season|is that old\b|did they change it|when was that updated|is that still true|can (you|u) check the newest rules|can (you|u) double check\b|my advisor says different|the website says something else|is that a guess|are you making that up|is that confirmed|where is that from exactly|is that verified|what document\b|which section\b|is that your advice or official|pdf says different|is that a fact or a guess|website says different)/, variants: SOURCE },
    { intent: 'notsure', re: /(are you sure|is that right|are you certain|really\?)/, variants: NOT_SURE },
    {
        intent: 'confusion',
        // NOTE: "idk" is contraction-expanded to "i do not know" before this
        // runs — matched via "do not know how to ask this", not literal "idk".
        re: /(i (don'?t|do not) (understand|get it)|(dont|do not) (understand|get it)|(dont|do not) really get it|i get it but not really|confused|makes no sense|huh\?|do not know how to ask this|i might be wrong|reading it wrong|not sure what (this|that) means|(dont|do not) know if (this|that) makes sense|this is confusing( me)?|(can|could) (you|u) (say|explain) that (differently|another way|better)|still (dont|do not) get it|^hold up\b|^wait what\b|(didnt|did not) make sense|what does (that|this) (actually |really )?mean|give me the simple version|explain (it |that )?in normal words|can we go over that again|what am i missing|why does that matter|what am i supposed to (take from|get from) that|i think (im|i am) misunderstanding|(im|i am) trying to understand)/,
        variants: CONFUSION,
    },
    // Broad HELP coverage — real students rarely say the bare word "help".
    // One maintainable regex with grouped alternatives beats 40 near-
    // duplicate rules; each group below corresponds to a phrasing family
    // from the mission brief (direct asks, "what do I do", "I'm lost", etc).
    {
        intent: 'help',
        re: /(^(help|what now|what should i ask)[?\s.]*$)|((can|could) (you|u) (please |pls |plz )?help( me)?\b)|(\bi need (some |ur |your )?help\b)|(\bcan (someone|somebody|anyone) help me\b)|(\bwhat can (you|u) (do|help with)\b)|(\bwhat do you do\b)|(\bwhat can i ask (you|u)\b)|(\bwhere (do|should) i (start|begin)\b)|(\b(i'?m|i am) (lost|confused)\b)|(\bi have no idea what (i'?m|i am) doing\b)|(\b(idk|i do not know|i dont know) what to do\b)|(^what (do|should) i do\??$)|(\bcan (you|u) explain (stuff|this) to me\b)|(\bcan (you|u) explain tsa\b)|(\b(pls|please) help\b)|(\bhelp (pls|please)\b)|(\bcan (you|u) (walk me through|guide me)\b)|(\bi need guidance\b)|(\bshow me what to do\b)|(\btell me what to do\b)|(^how does this work\??$)|(\bwhat am i supposed to do( here)?\b)|(\bpoint me in the right direction\b)|(\bbro help\b)|(\bany help (would be|is) appreciated\b)|(\bhelp me understand tsa\b)|(\bi (dont|do not) know where to begin\b)|(\bi need some direction\b)|(\bcan (you|u) point me somewhere useful\b)|(\bgive me the basics\b)|(\bwalk me through the basics\b)|(\bhow do i even begin with tsa\b)|(\bcan (you|u) simplify this for me\b)|(\bi (dont|do not) get how any of this works\b)/,
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
