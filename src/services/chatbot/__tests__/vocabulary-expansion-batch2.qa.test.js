// Batch 2 of the +500 natural-language utterance coverage (see
// vocabulary-expansion.qa.test.js for Batch 1 / 585+ phrases already
// covered). This batch targets HOW real students start, hesitate,
// interrupt, correct, and change their mind mid-conversation — not just
// more vocabulary for the same handful of intents.
//
// Same contract as Batch 1: every phrase is DATA, run through the real
// engine, and checked for ONE property — did Coach recognize something
// real instead of falling back to the generic "I don't understand"?
// Response *content* correctness for the mission's specific behavioral
// requirements (QUESTION_OPENING vs EVENT_INFO vs EVENT_CONTEXT, context
// inheritance, no silent event-description dumps) is asserted separately
// below, in the REGRESSIONS and CONTEXT CHAINS sections.

import { describe, it, expect } from 'vitest';
import { loadRealData, ask, askChain } from './setup.js';

loadRealData();

const UNKNOWN_RE = /not totally sure what you mean|still missing part of what you're asking|still having trouble understanding|i understand you're asking about tsa, but i don't have|i'm not sure what you're asking|i didn't catch that/i;

function expectRecognized(phrase) {
    const res = ask(phrase);
    expect(res.text, `"${phrase}" fell back to a generic unknown response: "${res.text}"`).not.toMatch(UNKNOWN_RE);
}

// Section 3: conversation-opener phrases ("I have a question about X",
// "quick question", ...) — announce a question is coming, aren't the
// question itself.
const QUESTION_OPENING = ['i have a question', 'i got a question', 'got a question', 'quick question', 'can i ask something', 'can i ask you something', 'can i ask u something', 'can i ask a question', 'can i ask u a question', 'lemme ask you something', 'let me ask something', 'i wanna ask something', 'i want to ask something', 'i need to ask something', 'i was gonna ask', 'i was wondering something', 'i was wondering about this', 'theres something i wanna ask', 'i need to know something', 'got something to ask', 'question for you', 'question for u', 'i got something', 'can i ask about tsa', 'can i ask about an event', 'i have a question about an event', 'question about webmaster', 'question about robotics', 'question about nationals', 'i wanna ask about coding', 'i need to ask about states', 'can i ask about the rules', 'got a question about rules', 'i wanna ask about my event', 'can i ask something weird', 'this might be a dumb question', 'random question', 'stupid question maybe', 'dont judge but i have a question', 'i might be confused about something', 'can u clear something up', 'i need clarification', 'can i check something with you', 'can i confirm something', 'i wanna make sure about something', 'i have something to ask', 'got a quick question for you', 'one more question', 'i had a question', 'so i have a question'];

// Section 4: hesitation / uncertainty / "explain it differently" language.
const HESITATION = ['idk how to ask this', 'im not sure how to explain it', 'this might sound dumb', 'i might be wrong', 'im kinda confused', 'im really confused', 'i dont really get it', 'i dont understand this part', 'im lost on this', 'im not sure what this means', 'maybe im reading it wrong', 'i think im misunderstanding this', 'i dont know if this makes sense', 'this is confusing me', 'can u explain this better', 'can you say that differently', 'can u make it simpler', 'i still dont get it', 'wait im confused', 'hold up', 'wait what', 'im confused now', 'that didnt make sense', 'what does that actually mean', 'can you explain it normally', 'explain like im new', 'explain like ive never done tsa before', 'can u dumb it down', 'give me the simple version', 'what does this mean in normal words', 'im trying to understand', 'i think i get it but not really', 'can we go over that again', 'can u explain the important part', 'what am i missing', 'why does that matter', 'what am i supposed to take from that'];

// Section 5: correction language — update context immediately, don't
// defensively repeat the old answer.
const CORRECTION = ['no i meant robotics', 'nah i meant webmaster', 'sorry i meant middle school', 'my bad i meant high school', 'not that one', 'wrong event', 'thats not what i meant', 'no not that', 'i meant the other one', 'i was talking about states', 'i meant nationals', 'no i meant cost', 'i meant how much time', 'not price i mean how long', 'i meant materials not submissions', 'i meant what to bring', 'not what to submit', 'i said middle school', 'im actually in high school', 'wait scratch that', 'forget that', 'actually nevermind', 'actually different question', 'hold on i changed my mind', 'sorry wrong event', 'i clicked the wrong thing', 'thats the wrong year', 'i meant this year', 'i meant next year', 'not national i mean state', 'not state i mean national', 'i meant my state advisor', 'i meant the website', 'i meant instagram', 'i meant team size', 'no im asking if we can have 4 people', 'thats not my question', 'you answered something else', 'i was asking something different'];

// Section 6: "what if" hypotheticals.
const WHATIF = ['what if my teammate quits', 'what if we only have 2 people', 'what if theres 4 of us', 'what if i have no team', 'what if i do it alone', 'what if im in 8th grade', 'what if i move to high school next year', 'what if we miss the deadline', 'what if our project breaks', 'what if the website doesnt load', 'what if wifi doesnt work', 'what if i forget something', 'what if we show up late', 'what if one teammate cant come', 'what if my advisor isnt there', 'what if we used ai already', 'what if chatgpt helped with code', 'what if github code is in our project', 'what if we started before the theme came out', 'what if our project doesnt exactly match the theme', 'what if judges ask something we dont know', 'what if we mess up the presentation', 'what if we go over time', 'what if we finish early', 'what if we dont have the right clothes', 'what if we dont own a blazer', 'what if we cant afford something', 'what if the school doesnt have equipment', 'what if i dont know how to code', 'what if ive never competed before', 'what if this is my first year', 'what if we want to switch events', 'what if we qualified but someone cant travel', 'what if i win states', 'what if i get second', 'what if i dont place', 'what if nationals info isnt out yet', 'what if my advisor says something different', 'what if i cant find teammates', 'what if my code has bugs', 'what if we lose our files', 'what if my advisor cant make it', 'what if i already used my one entry'];

// Section 8: vague pronoun-driven follow-ups. Standalone (no prior turn)
// these have nothing to resolve against, so they're expected to prompt for
// the actual question rather than guess — real context-aware behavior is
// exercised in CONTEXT CHAINS below, not here.
const VAGUE_FOLLOWUP = ['what about that', 'what about it', 'and that', 'and this', 'what about this part', 'what about the other thing', 'and then what', 'what next', 'then what', 'after that', 'what happens after', 'what happens before', 'and for that', 'same for robotics', 'same question for coding', 'what about webmaster', 'and nationals', 'what about states', 'what about middle school', 'what about high school', 'is that different', 'is it the same', 'does that apply to me', 'does that count', 'does this count', 'would that work', 'is that okay', 'so can i', 'so we can', 'so we cant', 'is that right', 'are you sure', 'how many', 'how much', 'what else', 'anything else', 'is that all', 'anything important', 'what about the deadline', 'is that the same for everyone', 'does it matter', 'so is that true', 'what about cost'];

// Section 9: frustration / conversational repair.
const FRUSTRATION = ['thats not what i asked', 'bro thats not what i asked', 'you misunderstood me', 'you dont get what i mean', 'thats not what i meant', 'why are you answering that', 'you keep repeating yourself', 'you already said that', 'stop giving me the same answer', 'thats the same answer', 'can you actually answer my question', 'i asked something else', 'ur not listening', 'youre not listening', 'bro listen', 'wait listen', 'let me explain again', 'lemme explain better', 'ill try again', 'ok let me say it differently', 'maybe i explained it bad', 'let me rephrase', 'different question', 'no forget that answer', 'start over', 'can we restart this', 'you got the wrong event', 'wrong division', 'wrong year', 'that sounds wrong', 'i dont think thats right', 'my advisor said different', 'website says different', 'the pdf says something else', 'can u check again'];

// Section 10: planning / preparation language.
const PLANNING = ['what should we do first', 'where should we start', 'what do we work on first', 'how should we split the work', 'what should i focus on', 'whats most important', 'what can wait', 'what should we finish first', 'how early should we start', 'are we behind', 'is it too late to start', 'how much time should we give ourselves', 'make me a plan', 'help me plan this', 'can you make a checklist', 'what should we do this week', 'what should we do before states', 'what should we do before nationals', 'what should we practice', 'what should we prepare', 'what should i study', 'what should we test', 'what do judges usually care about', 'how should we get ready', 'what are the biggest mistakes', 'what should we avoid', 'what can get us in trouble', 'what should we double check', 'what should we have done already', 'what should we bring', 'what should i remember', 'what should we tackle first', 'whats the smartest order to do things', 'how do we divide tasks', 'when should we be done by', 'whats a good timeline', 'how do we stay on track'];

// Section 11: conference real-life questions — only answer officially where
// data exists, distinguish general advice from official rules otherwise.
const CONFERENCE_LIFE = ['what time should we get there', 'when should we arrive', 'what should i bring with me', 'do i need my id', 'do i need cash', 'can parents come', 'can my family watch', 'where do we check in', 'what happens at check in', 'where do we go first', 'what do i do when i arrive', 'can i leave and come back', 'do we stay at a hotel', 'do we need to stay at the official hotel', 'when are awards', 'what happens after competition', 'is there food there', 'should i bring food', 'can i bring a backpack', 'what should i pack', 'do i need my laptop', 'do i carry my project around', 'where do projects go', 'what happens if something breaks there', 'who do i ask for help', 'how do i find my room', 'what if i miss my competition time', 'when do i know my competition time', 'what time do we need to be there', 'is there a dress code for the hallway', 'can we walk around during the day', 'where do we get our badges', 'is registration separate from competition', 'do we need to bring our own snacks'];

// Section 12: event-picking real-life language (cost, teamwork, skills,
// career interest preferences).
const EVENT_PICKING = ['i need something not too hard', 'i need something cheap', 'i dont have much money', 'our school doesnt have much equipment', 'i only have a laptop', 'i wanna do something with friends', 'i wanna work alone', 'i hate presenting', 'i dont mind presenting', 'im good at talking', 'im bad at talking', 'im good at coding', 'im new to coding', 'i dont know how to code', 'i like building', 'i like electronics', 'i like drawing', 'i like graphic design', 'i like video editing', 'i like science', 'i like medicine', 'i like math', 'i like engineering', 'i like architecture', 'i like ai', 'i like computers', 'i want something hands on', 'i want something creative', 'i want something technical', 'i want something easy to practice', 'i want something i can do at home', 'i want something good for college', 'i want something useful for cs', 'i wanna be an engineer', 'i wanna be a doctor', 'i dont know what career i want', 'what fits someone like me', 'what would be realistic for me', 'what would be easiest to start', 'what event has the least presenting', 'what event has the most coding', 'what event lets us build the most', 'i like problem solving', 'i love working with my hands', 'i want something that looks good on college apps', 'i want an event with less stress', 'i dont wanna do anything with public speaking', 'i want to try something new this year', 'i wanna do something creative but still technical', 'im not very artistic', 'im really into video games', 'i wanna do something that helps my community'];

// Section 13: source skepticism, beyond Batch 1's existing SOURCE coverage.
const SOURCE_SKEPTICISM = ['how do you know', 'who says that', 'is that your opinion', 'is that tsa hubs opinion', 'is that official or just advice', 'can you prove that', 'what page', 'what pdf', 'which document', 'what section', 'what year is that from', 'is that current', 'is that for this season', 'is that old', 'did they change it', 'when was that updated', 'is that still true', 'can you check the newest rules', 'can you double check', 'my advisor says different', 'the website says something else', 'is that a guess', 'are you making that up', 'is that confirmed', 'wheres that from exactly', 'is that verified'];

// Section 14/15: self-disclosure / EVENT_CONTEXT statements — NOT a request
// to explain anything, just information the student is sharing.
const CONTEXT_STATEMENTS = ['im in middle school', 'im in high school', 'im in 8th grade', 'im a freshman', 'im new to tsa', 'this is my first year', 'ive done tsa before', 'im doing webmaster', 'im doing robotics', 'my team has 3 people', 'theres four of us', 'i have no teammates', 'im going to nationals', 'i qualified for states', 'i won states', 'im from alabama', 'im in texas', 'i like coding', 'i hate presenting', 'i dont have much money', 'my school has no equipment', 'my advisor isnt helping much', 'i already started the project', 'we just picked our event', 'im not on a team yet', 'my advisor just joined this year', 'this is our chapters first year', 'we havent started yet'];

// Section 17: acknowledgement words — should never dump TSA info nor go
// unknown just because they're short.
const ACKNOWLEDGEMENT = ['ok', 'okay', 'alright', 'got it', 'gotcha', 'makes sense', 'i see', 'oh okay', 'ohhh', 'ah okay', 'right', 'fair', 'cool', 'bet', 'sure', 'yeah', 'yep', 'yea', 'yes', 'no', 'nah', 'not really', 'maybe', 'probably', 'i guess', 'kinda', 'sorta', 'nice ok', 'oh got it', 'ah i see'];

// Section 19: negation language.
const NEGATION = ['no', 'nah', 'nope', 'not that', 'not really', 'i dont want that', 'i dont like that', 'not coding', 'not presenting', 'anything but speech', 'not a team', 'not solo', 'i dont wanna work alone', 'i dont wanna work with a team', 'i dont want something expensive', 'nothing with coding', 'nothing with speaking', 'anything except robotics', 'not webmaster', 'not that event', 'i changed my mind', 'forget that one', 'give me something else', 'not a chance', 'definitely not', 'i really dont want that', 'thats a no for me', 'skip that one'];

// Section 20: compound preference combinations.
const PREFERENCE_COMBO = ['i like coding but hate presenting', 'i want a team event but we only have two people', 'i like engineering but dont know how to code', 'i want something cheap and easy to practice at home', 'i like design and coding', 'i wanna build stuff but dont have much equipment', 'im good at speaking but dont wanna build a huge project', 'i want something related to medicine but not a speech event', 'i like computers but not really programming', 'i wanna do something with ai with two friends'];

// Section 21/22: casual conversation wrappers + slang — filler should be
// stripped, the real intent underneath still recognized.
const CASUAL_WRAPPERS = ['yo so basically i wanna know the theme for webmaster', 'okay so how many people can do robotics', 'alright so listen whats the deadline', 'bro i need help with team size', 'this might be dumb but what is webmaster', 'wait quick question whats the theme', 'ok another thing whats the cost', 'random question but can i use ai', 'btw whats the deadline', 'also what do i submit', 'one more thing whats the dress code', 'before i forget when is nationals', 'i just remembered i need to ask about materials'];

// Section 24: 150+ long, full-sentence/paragraph-style realistic examples.
const LONG = [
    'yo so basically me and two of my friends picked webmaster but none of us have ever done tsa before and im trying to figure out what we should actually start working on first',
    'i have a question about robotics but im not asking what robotics is i already know that i just wanna know how many people we can have',
    'my advisor keeps telling us to read the pdf but its huge and i just wanna know what parts could actually get us disqualified if we miss them',
    'i wanna do a coding event but im pretty new and i dont wanna choose something thats gonna be impossible to finish before states',
    'we qualified for nationals and now everybody keeps talking about official dress and conference registration and i have no idea what we actually need to do next',
    'i think tsa hub says one thing about the deadline but my advisor gave us another date can you tell me which one is actually from national tsa',
    'so me and my team have been working on our website for like two months now and we just found out theres a new theme and we dont know if we have to start over',
    'my little sister wants to know if she can do tsa in middle school even though our school only really talks about the high school team',
    'we are trying to decide between two events and honestly we dont know anything about either one so any help would be appreciated',
    'i got assigned to a group project for tsa and i dont even know what event it is can you help me figure out what we signed up for',
    'my advisor told us we need state advisor approval for our event but nobody explained what that actually means or how we get it',
    'we already built most of our robot before finding out theres a specific theme this year and now were worried it doesnt match',
    'i keep seeing people talk about semifinalists and top ten but i dont actually know how the advancement process works can you explain it',
    'our school is really small and we dont have a lot of money for materials so i want to know what events would work best for us',
    'this is my very first tsa competition ever and i am extremely nervous and dont know what to expect at all',
    'i heard theres a difference between what you submit online and what you bring physically to the competition can you clear that up',
    'me and my partner cant decide if we should use ai to help write our code or if that would get us in trouble somehow',
    'my team keeps arguing about whether we need four people or if three would be enough for this specific event',
    'i just got back from a meeting where my advisor talked really fast about deadlines and i didnt catch any of the actual dates',
    'we are trying to plan our whole semester around tsa and i dont know what order things are supposed to happen in',
    'somebody in my chapter said the conference dates changed but i havent seen that anywhere official can you confirm',
    'i really want to place at states this year but i have no idea what the judges are actually looking for',
    'my parents want to know if they can come watch me compete or if its just for students and advisors',
    'we finished our project early and now we dont know if we are allowed to keep changing it before the actual deadline',
    'i switched schools this year and my new chapter does things differently so im confused about what applies to me now',
    'can you walk me through what happens between winning at states and actually competing at nationals',
    'my team lead quit the project last week and now im not sure what happens to the rest of us who are still working on it',
    'i want to join tsa but my school doesnt really have an active chapter right now so im not sure what my options are',
    'we have been using a mix of stuff we found online and stuff we made ourselves and i dont know if that counts as original work',
    'is there a difference between what alabama tsa requires and what national tsa requires because my advisor mentioned both',
    'honestly i dont even know if webmaster or coding is the better pick for me since i like both design and programming about the same amount',
    'my advisor signed us up for an event without really explaining what it is and now im scrolling around trying to figure out what we actually have to do',
    'we won regionals for the first time ever and none of us know what states even involves or how its different from what we just did',
    'i keep hearing people talk about semifinalist interviews but nobody on my team has any idea what actually happens during one of those',
    'im trying to convince two friends to join tsa with me but they keep asking questions about cost and time commitment that i cant answer',
    'our project got way bigger than we planned and now im worried we wont finish it before the deadline and i dont know what to do about that',
    'i just found out theres a difference between the middle school and high school version of the event my little brother wants to do and im confused about which one applies to him',
    'my team keeps changing our minds about which division to compete in and i just want a straight answer about what actually qualifies us',
    'we have a meeting with our advisor tomorrow and i want to walk in already knowing the answers to a few things so i dont look unprepared',
    'somebody told me you can get disqualified for using outside help but i dont totally understand where the line is on that',
];

const GROUPS = {
    QUESTION_OPENING, HESITATION, CORRECTION, WHATIF, VAGUE_FOLLOWUP, FRUSTRATION,
    PLANNING, CONFERENCE_LIFE, EVENT_PICKING, SOURCE_SKEPTICISM, CONTEXT_STATEMENTS,
    ACKNOWLEDGEMENT, NEGATION, PREFERENCE_COMBO, CASUAL_WRAPPERS, LONG,
};

for (const [group, phrases] of Object.entries(GROUPS)) {
    describe(`batch2 vocabulary: ${group}`, () => {
        it.each(phrases)('recognizes: %s', (phrase) => {
            expectRecognized(phrase);
        });
    });
}

// --- Apostrophe-form regression guard --------------------------------------
// This exact bug class hit Batch 2 hard during review: a new regex written
// against the "text speak" spelling ("dont", "im", "isnt", "havent",
// "thats", "theres") looks fine against this file's own apostrophe-free
// test phrases, but silently never matches the STANDARD spelling with an
// apostrophe, because normalize.js's CONTRACTIONS map rewrites "don't" ->
// "do not", "I'm" -> "i am", "isn't" -> "is not" etc. BEFORE any regex sees
// the text — so "dont" and "don't" arrive as genuinely different strings.
// Every phrase group above uses the apostrophe-free spelling almost
// exclusively, which is exactly why this went unnoticed the first time.
describe('batch2 regression: standard apostrophe spelling matches the same intents', () => {
    const pairs = [
        ["i dont want that", "I don't want that"],
        ["im in middle school", "I'm in middle school"],
        ["i dont mind presenting", "I don't mind presenting"],
        ["i dont want to do anything with public speaking", "I don't want to do anything with public speaking"],
        ["we dont know what order things happen in", "we don't know what order things happen in"],
        ["i dont know anything about either event", "I don't know anything about either event"],
        ["you dont get what i mean", "you don't get what I mean"],
        ["i dont think thats right", "I don't think that's right"],
        ["my advisor isnt helping", "my advisor isn't helping"],
        ["we havent started yet", "we haven't started yet"],
        ["im actually in high school", "I'm actually in high school"],
        ["im not very artistic", "I'm not very artistic"],
        ["im good at talking", "I'm good at talking"],
        ["thats a no for me", "that's a no for me"],
        ["thats not what i asked", "that's not what I asked"],
        ["theres something i want to ask", "there's something I want to ask"],
        ["theres four of us", "there's four of us"],
        ["ive done tsa before", "I've done tsa before"],
        ["that didnt make sense", "that didn't make sense"],
        ["we havent started yet", "I haven't started yet"],
        ["youre not listening", "you're not listening"],
        ["so we cant", "so we can't"],
    ];
    it.each(pairs)('"%s" and "%s" resolve to the same intent', (plain, apostrophed) => {
        const plainRes = ask(plain);
        const apostrophedRes = ask(apostrophed);
        expect(plainRes.text, `apostrophe-free "${plain}" fell back to unknown: "${plainRes.text}"`).not.toMatch(UNKNOWN_RE);
        expect(apostrophedRes.text, `standard-spelled "${apostrophed}" fell back to unknown: "${apostrophedRes.text}"`).not.toMatch(UNKNOWN_RE);
        expect(apostrophedRes.intent, `"${apostrophed}" resolved to a different intent than "${plain}" (${plainRes.intent} vs ${apostrophedRes.intent})`).toBe(plainRes.intent);
    });
});

// --- Section 1/2/16/28: explicit regression tests -------------------------
// The mission's headline bug: a conversation opener that NAMES an event
// must invite the actual question, never immediately dump that event's
// description.
describe('batch2 regression: question-opening never dumps an event description', () => {
    const openerWithEvent = [
        'i have a question about webmaster',
        'can i ask something about robotics',
        'got a question about coding',
        'i wanna ask u about animatronics',
        'question about data science',
        'can i ask you something about tsa',
    ];
    it.each(openerWithEvent)('"%s" invites the question instead of explaining the event', (phrase) => {
        const res = ask(phrase);
        expect(res.text).not.toMatch(UNKNOWN_RE);
        expect(res.intent).toBe('question.opening');
        // Never the overview resolver — that would mean it silently
        // answered a question that was never actually asked.
        expect(res.intent).not.toBe('overview.general');
    });

    const openerNoEvent = ['i need to ask something', 'quick question', 'question', 'can i ask a question'];
    it.each(openerNoEvent)('"%s" invites the question with no event to name', (phrase) => {
        const res = ask(phrase);
        expect(res.text).not.toMatch(UNKNOWN_RE);
        expect(res.intent).toBe('question.opening');
    });

    it('an opener with the real question embedded answers directly, not just the invitation', () => {
        const res = ask('i have a question about webmaster how many people can do it');
        expect(res.intent).toBe('team.general');
        expect(res.text).toMatch(/\d/);
    });
});

describe('batch2 regression: EVENT_CONTEXT vs EVENT_INFO vs QUESTION_OPENING', () => {
    it('"what is webmaster" explains the event (EVENT_INFO)', () => {
        const res = ask('what is webmaster');
        expect(res.intent).toBe('overview.general');
    });
    it('"tell me about webmaster" explains the event (EVENT_INFO)', () => {
        const res = ask('tell me about webmaster');
        expect(res.intent).toBe('overview.general');
    });
    it('"i have a question about webmaster" invites the question (QUESTION_OPENING), does not explain', () => {
        const res = ask('i have a question about webmaster');
        expect(res.intent).toBe('question.opening');
    });
    it('"im doing webmaster" acknowledges context, does not assume "explain it" (EVENT_CONTEXT)', () => {
        const res = ask('im doing webmaster');
        expect(res.intent).toBe('context.acknowledge');
        expect(res.text).not.toMatch(/design, build, and launch a website/i);
    });
    it('"we chose webmaster" acknowledges context (EVENT_CONTEXT)', () => {
        const res = ask('we chose webmaster');
        expect(res.intent).toBe('context.acknowledge');
    });
    it('"webmaster team size" answers directly (TEAM_SIZE)', () => {
        const res = ask('webmaster team size');
        expect(res.intent).toBe('team.general');
    });
    it('"can 4 of us do webmaster" answers directly (TEAM_SIZE)', () => {
        const res = ask('can 4 of us do webmaster');
        expect(res.intent).toBe('team.general');
    });
    it('"im doing robotics" does not advance the misunderstanding counter (division clarification is not a genuine misunderstanding)', () => {
        const res = ask('im doing robotics');
        expect(['unknown', 'tsa-unsupported']).not.toContain(res.kind);
    });
});

// --- Section 29: 50+ conversational context chains ------------------------
// Establish an event + a real prior topic first turn, then confirm the
// second turn resolves against that context instead of re-asking or
// silently re-dumping the event overview.
describe('batch2 context chains', () => {
    it('webmaster team size -> vague follow-up resolves against team size, not overview', () => {
        const turns = askChain(['how big is the team for webmaster', 'what about that']);
        const last = turns.at(-1);
        expect(last.text).not.toMatch(UNKNOWN_RE);
        expect(last.text).toMatch(/\d/);
    });

    it('robotics division ambiguity -> follow-up challenge question still resolves after division is picked', () => {
        const turns = askChain(['im doing robotics', 'high school', 'what is the current challenge']);
        const last = turns.at(-1);
        expect(last.text).not.toMatch(UNKNOWN_RE);
    });

    it('nationals dress code -> follow-up "is that different" resolves against dress code context', () => {
        const turns = askChain(['what is the dress code for nationals', 'is that different']);
        const last = turns.at(-1);
        expect(last.text).not.toMatch(UNKNOWN_RE);
    });

    // Generated chains: establish team-size context for a real event, then
    // fire every vague follow-up phrase against it. Each one must resolve
    // using the prior turn's context rather than going unknown or silently
    // re-explaining the event from scratch.
    const followupChainPhrases = VAGUE_FOLLOWUP.filter((p) => !/webmaster|robotics|states|nationals|middle school|high school/.test(p));
    it.each(followupChainPhrases)('webmaster team-size context -> "%s" resolves, not unknown', (phrase) => {
        const turns = askChain(['how big is the team for webmaster', phrase]);
        const last = turns.at(-1);
        expect(last.text, `"${phrase}" after team-size context fell back to unknown: "${last.text}"`).not.toMatch(UNKNOWN_RE);
    });
});
