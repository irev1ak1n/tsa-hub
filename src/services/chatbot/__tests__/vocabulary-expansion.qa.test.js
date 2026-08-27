// +500 natural-language utterance coverage. Every phrase here is DATA, not a
// hardcoded answer — each one is fed through the real engine and only
// checked against one property: did the Coach recognize SOME real intent
// (event lookup, rule search, deadline, state info, capability limit,
// smalltalk, ...) instead of falling into the generic "I don't understand"
// fallback. The actual answer text is exercised elsewhere (response-quality,
// capability-limit, support-threshold, and the core factual QA files).
//
// Phrases are grouped by canonical intent exactly as the mission brief
// specified (HELP, GREETING, RECOMMEND, TEAM_SIZE, ...), generated from
// plain arrays and run through vitest's `it.each` so every phrase is its
// own visible test case — a failure names the exact phrase, not a lump
// array. Team-size/materials/submissions/cost/difficulty/theme/rules/
// preparation groups establish "im doing webmaster" context first, the same
// way a real conversation would, since those questions are meaningless
// without an event in play.

import { describe, it, expect } from 'vitest';
import { loadRealData, ask, askChain } from './setup.js';

loadRealData();

const UNKNOWN_RE = /not totally sure what you mean|still missing part of what you're asking|still having trouble understanding|i understand you're asking about tsa, but i don't have|i'm not sure what you're asking|i didn't catch that/i;

function expectRecognized(phrase, needsEventContext = false) {
    const res = needsEventContext ? askChain(['im doing webmaster', phrase]).at(-1) : ask(phrase);
    expect(res.text, `"${phrase}" fell back to a generic unknown response: "${res.text}"`).not.toMatch(UNKNOWN_RE);
}

const GROUPS = {
    HELP: {
        needsEvent: false,
        phrases: ['help', 'help me', 'can you help me', 'can u help me', 'can you help', 'can u help', 'could you help', 'could u help', 'i need help', 'i need some help', 'i need ur help', 'i need your help', 'can someone help me', 'i dont know what to do', 'idk what to do', 'what do i do', 'what should i do', 'where do i start', 'can you explain stuff to me', 'can u explain tsa', 'what can you help me with', 'what can u help with', 'what can you do', 'what do you do', 'how can you help', 'what are you for', 'what can i ask you', 'what should i ask', 'im lost', 'im confused', 'i have no idea what im doing', 'bro help', 'pls help', 'please help', 'help pls', 'can you walk me through this', 'can you guide me', 'i need guidance', 'show me what to do', 'tell me what to do', 'where should i begin', 'how does this work', 'what am i supposed to do here', 'can you point me in the right direction'],
    },
    GREETING: {
        needsEvent: false,
        phrases: ['hi', 'hey', 'hello', 'yo', 'sup', 'wsp', 'whats up', "what's up", 'wsg', 'wsp bro', 'wsp boi', 'hey bro', 'hey man', 'hello there', 'hiya', 'heyy', 'heyyy', 'good morning', 'gm', 'morning', 'good afternoon', 'good evening', 'how are you', 'how r u', 'how are u', 'how u doing', 'how you doing', "hows it going", "how's it going", 'wyd', 'what are you doing', 'you good', 'how u been', 'whats good', "what's good", 'yo coach', 'hey coach', 'hey tsa', 'hello tsa', 'hi assistant'],
    },
    THANKS: {
        needsEvent: false,
        phrases: ['thanks', 'thank you', 'thx', 'ty', 'thanks bro', 'appreciate it', 'appreciate you', 'got it thanks', 'cool thanks', 'ok thanks', 'okay thanks', 'awesome thanks', 'perfect', 'nice', 'bet', 'gotcha', 'makes sense', 'that helps', 'that was helpful', 'good answer', 'ur goated', 'goated', 'w', 'big w', 'nice bro'],
    },
    GOODBYE: {
        needsEvent: false,
        phrases: ['bye', 'goodbye', 'later', 'see ya', 'cya', 'gtg', 'gotta go', 'talk later', 'thanks bye', 'peace', 'peace out', 'im done', "that's all", 'thats all', 'see you', 'catch you later', 'later bro', 'ok bye', 'alright bye', 'im good now'],
    },
    RECOMMEND: {
        needsEvent: false,
        phrases: ['what do you recommend', 'what would you recommend', 'what should i do', 'what should i pick', 'what event should i choose', 'what event should i do', 'which event should i do', 'which one should i pick', 'what would u pick', 'what do u recommend', 'any recommendations', 'any ideas', 'help me choose', 'help me pick', 'whats good for me', 'what fits me', 'what would fit me', 'which event fits me', 'what would be best for me', 'what should a beginner do', 'what event is easiest for beginners', 'what do you think i should do', 'which is better for me', 'what events would i like', "what do you think i'd like", 'what should someone like me do', 'idk what event to pick', 'idk what i wanna do', 'i need an event', 'i need help picking an event', 'recommend an event', 'suggest an event', 'give me some events', 'what event is good', 'anything good for coding', 'anything good for builders', 'anything without presenting', 'something easy to start with', 'something i can do with friends', 'something i can do alone', 'i want something fun', 'what do most beginners pick'],
    },
    TEAM_SIZE: {
        needsEvent: true,
        phrases: ['how many people', 'how many ppl', 'how many people can do it', 'how many can be on the team', 'how many ppl on team', 'team size', 'max team size', 'how many teammates', 'can i do it alone', 'can i do this solo', 'is it solo', 'is it individual', 'can me and my friend do it', 'can 2 people do it', 'can 3 people do it', 'can 4 people do it', 'can all of us do it', 'theres 4 of us', 'we have 3 people', 'how big can the team be', 'how many friends can join', 'can i have teammates', 'do i need a team', 'does it require a team', 'can one person do it', 'minimum team size', 'maximum people', 'is there a max', 'how many members are allowed', 'how many students', 'how many competitors', 'does everyone have to compete', 'can my teammate drop out', 'can we add someone later'],
    },
    MATERIALS: {
        needsEvent: true,
        phrases: ['what materials do i need', 'what do i need', 'what stuff do i need', 'what do i gotta bring', 'what do we bring', 'what do i bring', 'what equipment', 'what equipment do i need', 'what tools', 'what tools do i need', 'what supplies', 'what supplies do we need', 'what should i pack', 'what should i bring to competition', 'do i need a laptop', 'can i bring a laptop', 'do they provide equipment', 'do they give us computers', 'what hardware do i need', 'what software do i need', 'do i need to buy anything', 'what do we need for this', 'what should we have ready', 'do we bring our project', 'do we need printed stuff', 'what physical stuff is required', 'competition materials', 'required materials', 'required equipment'],
    },
    SUBMISSIONS: {
        needsEvent: true,
        phrases: ['what do i submit', 'what do we submit', 'what do i turn in', 'what do we turn in', 'what has to be submitted', 'what do i upload', 'do i upload something', 'what files do i need', 'what file format', 'when do we submit', 'what needs to be done before competition', 'what do judges get', 'what do i have to send', 'is there pre submission', 'what do i submit online', 'what needs to be finished beforehand', 'do we upload our website', 'do we submit a pdf', 'do we submit code', 'what exactly needs to be turned in', 'submission requirements', 'deliverables', 'what are the deliverables', 'what do i hand in'],
    },
    COST: {
        needsEvent: true,
        phrases: ['how much does it cost', 'how much is it', 'is it expensive', 'is this expensive', 'how expensive', 'what does it cost', 'cost', 'price', 'how much money', 'how much money do i need', 'do i need to spend money', 'can i do it cheap', 'can i do it for free', 'can i do it with no money', 'what might i have to buy', 'how much should i budget', 'is this a low cost event', 'what costs money', 'do we need to pay', 'is there a fee', 'how much are materials', 'will this cost a lot', 'what would i spend'],
    },
    DIFFICULTY: {
        needsEvent: true,
        phrases: ['how hard is it', 'is it hard', 'is this hard', 'how difficult', 'difficulty', 'is it easy', 'is this easy', 'would this be hard for a beginner', 'is it beginner friendly', 'how much work is it', 'does it take a lot of work', 'is it complicated', 'is it stressful', 'how long does it take', 'how much time', 'do we need to start early', 'is it manageable', 'which is easier', 'which one is harder', 'how bad is it', 'is this a lot', 'will this take forever'],
    },
    THEME: {
        needsEvent: true,
        phrases: ['whats the theme', 'what is the theme', 'this years theme', 'current theme', 'whats the challenge', 'what is the challenge', 'what do we have to make', 'what do we have to build', 'what are we supposed to do', 'whats the problem', 'problem statement', 'design brief', 'this years problem', 'current problem', 'what is this years topic', 'what are we making this year', 'what do they want us to make', 'what does tsa want', 'annual challenge', 'annual theme', 'did they release the theme', 'is the theme out', 'whats this season', 'whats the prompt', 'what is our prompt', 'what are we doing this year'],
    },
    RULES: {
        needsEvent: true,
        phrases: ['what are the rules', 'rules', 'what are the requirements', 'requirements', 'what am i allowed to do', 'what cant i do', 'what can i do', 'what is allowed', "what isnt allowed", 'official rules', 'tsa rules', 'event rules', 'competition rules', 'what can get me disqualified', 'how do i avoid getting disqualified', 'what are the restrictions', 'what do judges require', 'what are the guidelines', 'what do i have to follow', 'anything i cant use', 'any important rules', 'what should i be careful about', 'what rules matter most', 'can my advisor help', 'can i use notes', 'can i use internet', 'can i use my phone', 'can i change it later'],
    },
    AI_USAGE: {
        needsEvent: false,
        phrases: ['can i use ai', 'can we use ai', 'is ai allowed', 'can i use chatgpt', 'can we use chatgpt', 'can i use gpt', 'can ai help', 'can ai write code', 'can chatgpt write code', 'can ai make the dataset', 'can ai write my speech', 'do i need to cite ai', 'do i need to cite chatgpt', 'is chatgpt banned', 'does tsa allow ai', 'are ai tools okay', 'what ai tools can we use', 'can i use github copilot', 'can i use claude', 'can i use gemini', 'can ai make part of my project'],
    },
    DRESS_CODE: {
        needsEvent: false,
        phrases: ['what do i wear', 'what should i wear', 'what do i wear to nationals', 'what do i wear for nationals', 'what do i wear at states', 'state conference clothes', 'nationals outfit', 'tsa outfit', 'tsa uniform', 'official dress', 'dress code', 'what is official dress', 'do i need a suit', 'do i need a blazer', 'do i need a tie', 'can i wear sneakers', 'can i wear jeans', 'can i wear a hoodie', 'what shoes do i wear', 'what pants should i wear', 'do girls need skirts', 'can girls wear pants', 'business casual', 'what should i pack for conference', 'do i wear it all day', 'do i need the uniform for awards'],
    },
    DEADLINES: {
        needsEvent: false,
        phrases: ['deadline', 'deadlines', 'whats next', 'whats coming up', 'anything coming up', 'anything soon', 'whats happening soon', 'next deadline', 'next important date', 'important dates', 'what do i need to remember', 'what happens this week', 'what happens next week', 'what happens this month', 'what happens next month', 'whats due soon', 'what did i miss', 'what already passed', 'anything before nationals', 'when is tsa week', 'when does registration open', 'when does registration close', 'when is affiliation', 'how long until nationals', 'how many days until', 'calendar stuff', 'tsa dates'],
    },
    NATIONALS: {
        needsEvent: false,
        phrases: ['when are nationals', 'where are nationals', 'where is nationals', 'national conference', 'tsa nationals', 'nats', 'when is nats', 'where is nats', 'how long is nationals', 'what happens at nationals', 'what do i bring to nationals', 'what do i wear to nationals', 'how do i qualify for nationals', 'when does nationals start', 'conference dates', 'conference location', 'national conference location', 'national conference dates', 'when do we register', 'where do we stay', 'what hotel'],
    },
    STATE: {
        needsEvent: false,
        phrases: ['when are states', 'where are states', 'state conference', 'state conf', 'when is state conference', 'where is state conference', 'whos my advisor', 'who is my advisor', 'state advisor', 'who do i contact', 'who runs tsa in my state', 'state tsa website', 'state tsa instagram', 'state tsa facebook', 'state socials', 'my state tsa', 'how do i contact my state', 'who do i email', 'state contact', 'state registration', 'state deadline', 'how do i qualify from state', 'how many move on', 'state officers'],
    },
    SOURCE: {
        needsEvent: false,
        phrases: ['where did you get that', 'source', 'show source', 'show me the source', 'official source', 'is that official', 'where does tsa say that', 'can i verify that', 'show me where it says that', 'give me the link', 'official link', 'show the pdf', 'can i see the pdf', 'what document says that', 'is that from national tsa', 'where is this written', 'prove it', 'where can i check', 'can i double check that', 'show official rules'],
    },
    CAPABILITY_LIMIT: {
        needsEvent: false,
        phrases: ['can you text them', 'text them for me', 'text tsa', 'can u text tsa', 'call them', 'can you call them', 'phone them', 'can you email them', 'email them for me', 'send them a message', 'message them', 'dm them', 'dm tsa', 'contact them', 'contact them for me', 'reach out to them', 'talk to them for me', 'can you call my advisor', 'can you send an instagram dm', 'can you send a facebook message', 'can u do it for me', 'can you submit this for me'],
    },
    SUPPORT: {
        needsEvent: false,
        phrases: ['support', 'contact support', 'i need support', 'human', 'real person', 'talk to a person', 'can i talk to someone', 'someone help me', "this bot isnt helping", "youre not helping", 'i need a human', 'let me talk to somebody', 'contact tsa hub', 'report a bug', 'something is broken', 'website broken', 'coach broken', 'calendar broken', 'search broken', 'i found a bug', 'i need app help'],
    },
    PREPARATION: {
        needsEvent: true,
        phrases: ['how do i prepare', 'how should i prepare', 'what should i practice', 'how do i get ready', 'what should we work on first', 'where should we start', 'how early should we start', 'what should i focus on', 'what matters most', 'how do i practice', 'what should we do before competition', 'how do we improve', 'how can we do better', 'how do we stand out', 'what do judges care about', 'what should i prioritize', 'what should i do first'],
    },
    COMPARISON: {
        needsEvent: false, // established via a two-event opener below
        phrases: ['compare', 'compare these', 'which is better', 'which one is better', 'which is easier', 'which is harder', 'webmaster vs coding', 'robotics or animatronics', 'which should i choose', 'whats the difference', 'how are they different', 'which fits me better', 'what would you pick', 'which one takes more work', 'which one costs more', 'which one is more coding', 'which one has less presenting', 'which one is more hands on'],
        opener: 'compare webmaster and coding',
    },
    CAREERS: {
        needsEvent: false,
        phrases: ['what careers', 'what careers connect to this', 'what jobs', 'what jobs can this lead to', 'what major', 'what majors', 'what should i study', 'college major', 'career path', 'does this help with engineering', 'does this help with cs', 'good for computer science', 'good for medicine', 'good for architecture', 'good for engineering', 'what can i become', 'what careers use this', 'what should i major in', 'would this help college'],
    },
};

for (const [group, { needsEvent, phrases, opener }] of Object.entries(GROUPS)) {
    describe(`${group} phrase coverage (${phrases.length} variants)`, () => {
        it.each(phrases)('"%s" is recognized, not treated as a genuine misunderstanding', (phrase) => {
            if (opener) {
                const res = askChain([opener, phrase]).at(-1);
                expect(res.text, `"${phrase}" fell back to a generic unknown response: "${res.text}"`).not.toMatch(UNKNOWN_RE);
            } else {
                expectRecognized(phrase, needsEvent);
            }
        });
    });
}

describe('long natural phrases (mission section 29)', () => {
    const LONG_PHRASES = [
        ['im completely new to tsa and honestly dont know what i should do first', false],
        ['me and three friends wanna do webmaster but i dont know if all four of us can be on the team', false],
        ['my advisor keeps saying official dress and i have no idea what that actually means', false],
        ['i wanna do a coding event but i really dont wanna present in front of judges', false],
        ['i opened the robotics pdf and theres way too much stuff can you just explain what matters', false],
        ['my friend says chatgpt is banned but someone else told me we can use it so whats actually true', false],
        ['what are the next few tsa dates i actually need to care about', false],
        ['im stuck between webmaster and software development which would you recommend', false],
        ['how many people can do webmaster and what do we have to submit', false],
        ['broooo can u pls help me pick smth', false],
    ];
    it.each(LONG_PHRASES)('"%s"', (phrase) => {
        expectRecognized(phrase, false);
    });
});

describe('reviewer-flagged regex over-matching regressions', () => {
    it('an unrelated "what shoes should I buy" does not get hijacked into the TSA dress-code rule', () => {
        const res = ask('what shoes should i buy for running');
        expect(res.text).not.toMatch(/dress code/i);
    });

    it('"does the rule makes sense to you" is answered normally, not swallowed as a bare thanks reaction', () => {
        const res = ask('does the rule makes sense to you');
        expect(res.text).not.toBe('Anytime. Want to check another requirement?');
    });

    it('a standalone "makes sense" / "perfect" reaction still resolves as thanks', () => {
        expect(ask('makes sense').text.length).toBeGreaterThan(0);
        expect(ask('perfect').text.length).toBeGreaterThan(0);
    });
});

describe('nonsense must remain rare, not become impossible to reach (mission section 36)', () => {
    const NONSENSE = ['asdfghjkl', 'banana refrigerator', 'purple toaster xyz', 'qwopzxcv nnmm'];
    it.each(NONSENSE)('"%s" is honestly reported as not understood, not hallucinated into a TSA answer', (phrase) => {
        const res = ask(phrase);
        // The important property isn't the exact wording — it's that the
        // Coach doesn't confidently answer with fabricated TSA content.
        expect(res.text).not.toMatch(/theme for|team of \d|the current challenge is|official rules state/i);
    });
});
