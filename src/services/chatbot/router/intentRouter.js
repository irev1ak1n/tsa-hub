// Intent detection with confidence. Phrase evidence outranks token evidence,
// and guards suppress well known false positives.

// Phrases that must never be read as a difficulty question.
const DIFFICULTY_BLOCKERS = [
    /hard time/, /having a hard/, /hard to (choose|decide|pick)/, /tough call/,
];

// Question shapes that carry meaning beyond the keyword.
const PHRASES = [
    // Genuinely ambiguous "what do I need" — could mean bring-to-competition,
    // preconference submission, or what to build. Lower confidence than any
    // specific "materials"/"submit"/"bring" phrasing below so those still win
    // when the user is actually specific; this only catches the bare form.
    { intent: 'clarify.needAmbiguous', re: /\bwhat (do|would) (i|we) need\b(?!.{0,20}(submit|material|bring|build|pack|wear))/, c: 0.8 },
    { intent: 'clarify.needAmbiguous', re: /\bwhat do we need to bring\b|\bso what do we need to bring\b/, c: 0.8 },
    // A conversation opener ("I have a question about Webmaster") is NOT
    // itself the question — it's an announcement that one is coming.
    // Confidence is deliberately below every specific-topic PHRASE below
    // (team/cost/theme/etc all score 0.85+) so a message that opens AND
    // asks in the same breath ("i have a question about webmaster how many
    // people can do it") still resolves to the real question, not this.
    {
        intent: 'question.opening',
        // NOTE: "wanna"/"gonna" are contraction-expanded to "want to"/
        // "going to" before this runs (normalize.js) — only the expanded
        // forms ever reach this regex.
        re: /(\bi (have|got|need to ask|want to ask|was going to ask|was wondering)( a| something| about)?\b.{0,25}\bquestion\b)|(\bgot a question\b)|(\bquick question\b)|(^question[?\s.]*$)|(\bcan i ask (you|u)?( a| something)?\b)|(\blet me ask\b)|(\b(theres|there is) something i want to ask\b)|(\bi need to know something\b)|(\bgot something to ask\b)|(\bquestion for (you|u)\b)|(\bi got something\b)|(\bcan i ask about\b)|(\bquestion about\b)|(\bi want to ask about\b)|(\bi need to ask about\b)|(\bi (want to|need to) ask (you |u )?about\b)|(\bcan i ask (about )?something (weird|random)\b)|(\bthis might (be a dumb|sound dumb)\b)|(\brandom question\b)|(\bstupid question\b)|(\bdont judge but\b)|(\bi might be confused about something\b)|(\bcan (you|u) clear something up\b)|(\bi need clarification\b)|(\bcan i (check|confirm) something\b)|(\bi want to make sure about something\b)|(\bi (want to|need to) ask (you |u )?something\b)|(\bi was going to ask\b)|(\bi was wondering (something|about (this|that))\b)|(\bi have something to ask\b)|(\bone more question\b)|(\bi had a question\b)/,
        c: 0.78,
    },
    // "what would you recommend" — preference-elicitation, not a lookup.
    // Broad on purpose: this is the single most common real-student shape
    // ("what should I do/pick", "any ideas", "idk what event to pick",
    // "something I can do alone") and every one of these should start a
    // preference conversation rather than fall through to unknown.
    // NOTE: "what events should i do" / "what should i compete in" were the
    // mission's headline regression — the earlier alternatives all required
    // "pick"/"choose"/"recommend" specifically and never matched "do" or
    // "compete in" as the verb, even though they mean the exact same thing.
    // Standalone/near-standalone only — NOT wrapped in the big \b(...)\b
    // alternation below, because "what should i do" and "what would you
    // suggest" as bare SUBSTRINGS are too generic ("what should i do if my
    // project breaks", "what would you suggest for lunch" are NOT event
    // recommendation asks). Anchored to (near) the full message instead.
    { intent: 'clarify.recommend', re: /\bwhat should i do[?.\s]*$|^what would you suggest[?.\s]*$|\bwhat should i do this year\b|\bhow do i (pick|choose) an? event\b|\bhow (can|should) i (pick|choose) an? event\b|\bhow do i (pick|choose|decide on) (which|what) event\b|\bwhat do i do[?.\s]*$|\bi(m| am) new what do i do\b|\bi(m| am) new to tsa\b/, c: 0.85 },
    { intent: 'clarify.recommend', re: /\b(what would you recommend|can you recommend|recommend (an |)event|suggest (an |)event|help me (choose|pick|decide)( an event)?|what (do|would) (you|u) (recommend|pick|choose)|what should i (pick|choose)|what events? should i (do|pick|choose)|which (event|one) should i (do|pick|choose)|which (one|event) (should|would) (i|you) (pick|choose)|what event (should i do|should i choose|is good|is easiest for beginners)|what (should|can|would) i (compete in|sign up for|join)|what can i compete in|(idk|i do not know|i dont know) what (to compete in|event to do|event to join)|any (event )?(recommendations|ideas)\b|what competitions? should i (look at|choose|pick|do)|which event (makes sense for me|is good for me)|i need something to compete in|what are some good events|what should my first event be|what event should i join|where should i start with events|i need help choosing|what is a good event to try|not sure what (event to pick|to compete in)|i have no clue what event to do|what (fits|would fit) me|which (event|one) fits me|what (would be|is) best for me|what event would be good for me|what should a beginner do|what do you think i should do|what events? would i like|what do you think i('?d| would) like|what should someone like me do|(idk|i do not know|i dont know) what (event to pick|i want to do)|i need an event|i need help picking an event|give me some events|give me some event ideas|anything good for (coding|builders?)|anything without presenting|something (easy to start with|i can do (with friends|alone))|i want something fun|what do most beginners pick|trying to decide between (two |several |multiple )?events?|(dont|do not) know anything about (either|any) (event|events)|what fits someone like me|what would be realistic for me|what would be easiest to start|what event has the (least|most) (presenting|coding|building)|what event lets us build the most|is [a-z ]+ a good event for beginners|what events are worth doing|what event would you pick for me|what would be a good event for me|what event would suit me)\b/, c: 0.88 },
    // "I wanna do something with coding" / "...involving robotics" — the
    // interest word varies (section 8's compound-preference phrasing), so a
    // fixed alternative list per word isn't maintainable; this catches the
    // SHAPE instead. Confidence stays below any specific-topic PHRASE.
    { intent: 'event.preference', re: /\bi want to do something (with|involving) [a-z]+\b|\bi(m| am) (really |super )?into video games?\b/, c: 0.7 },
    // Preference / interest statements ("I like coding", "I hate
    // presenting", "I'm good at talking") aren't questions at all, but real
    // students say them expecting Coach to steer them toward an event —
    // same destination as clarify.recommend, just phrased as a statement.
    // NOTE: "wanna" is contraction-expanded to "want to" before this runs —
    // only the expanded form ever reaches this regex.
    { intent: 'event.preference', re: /(\bi (really )?(like|love|enjoy|prefer)\b.{0,25}\b(building|electronics|drawing|design|editing|science|medicine|math|engineering|architecture|computers?|art|writing|robots?)\b)|(\bi (really |honestly |kind of |sort of )?(hate|dislike|dont like|don't like|do not like)\b.{0,20}\b(presenting|speaking|talking|coding|writing|building|design)\b)|(\bi (dont|do not) mind (presenting|speaking|coding)\b)|(\b(im|i am) (good|bad) at (talking|speaking|presenting|coding|math|building|writing)\b)|(\bi want something (hands on|creative|technical|easy to practice|i can do at home|good for college|useful for cs|fun)\b)|(\bi want to (be|become) an? (engineer|doctor|programmer|designer|scientist|architect)\b)|(\bi only have a? ?(laptop|computer)\b)|(\bour school (doesnt|does not) have (much )?equipment\b)|(\bi want to do something with friends\b)|(\bi want to work alone\b)|(\bi want to build stuff but (dont|do not) have (much )?equipment\b)|(\bi want something that looks good on college apps\b)|(\bi want an event with less stress\b)|(\bi (dont|do not) want to do anything with public speaking\b)|(\bi want to try something new this year\b)|(\b(im|i am) not very artistic\b)|(\bi want to study cs what events fit\b)|(\bi want something related to (business|medicine|science)\b)|(\bi want to do something hands on but our school (doesnt|does not) have\b)|(\b(im|i am) good at public speaking but i (dont|do not) want to build\b)/, c: 0.75 },
    { intent: 'team.individual', re: /(can|could) (i|we|you) .*(alone|by myself|individual|solo)/, c: 0.93 },
    { intent: 'team.individual', re: /\b(individual|solo) (entries|entry|competitor|participation) (is|are)?\b/, c: 0.9 },
    { intent: 'team.individual', re: /\b(do|compete|enter|participate) (it )?(alone|solo)\b/, c: 0.92 },
    { intent: 'team.minimum', re: /(minimum|at least|fewest|smallest) .*(team|people|member)/, c: 0.9 },
    { intent: 'team.maximum', re: /(maximum|at most|up to|largest|biggest) .*(team|people|member)/, c: 0.9 },
    { intent: 'team.general', re: /how (big|many) .*(team|people|member)/, c: 0.9 },
    { intent: 'team.general', re: /\bteam size\b/, c: 0.92 },
    // Messy real-student phrasing that asks a team-size question without
    // "how many/big" — e.g. "can all 4 of us do it" or "is that too many".
    { intent: 'team.general', re: /\bcan (all|both|the)? ?(\d+|two|three|four|five|six|seven) ?(of )?(us|them|we)\b.{0,25}\b(do|be on|join|compete|enter)\b/, c: 0.88 },
    { intent: 'team.general', re: /\bcan (all|both) (of )?(us|them|we)\b.{0,25}\b(do|be on|join|compete|enter)\b/, c: 0.88 },
    { intent: 'team.general', re: /\bis (that|this) too many\b/, c: 0.85 },
    { intent: 'team.general', re: /\bif there('?s| is) \d+ of us\b/, c: 0.85 },
    { intent: 'team.general', re: /\b(there are|theres|there is) (two|three|four|five|six|\d+) of us\b|\bdoes everybody have to compete\b|\bdoes everyone have to present\b|\bcan it just be me\b|\bcan our whole class do this\b|\bcan me my \d+ cousins\b|^(two|three|four|five|six) of us[?.\s]*$|^just my friend and me[?.\s]*$/, c: 0.85 },
    { intent: 'team.individual', re: /^just me[?.\s]*$/, c: 0.85 },
    // Capability-limit requests — an outbound-action VERB directed at a
    // target ("can you text them", "email my advisor", "call national tsa
    // for me"). Deliberately requires an action verb, so a plain factual
    // "what is national tsa's email" (no verb) never lands here — see
    // contact.nationalInfo below for that case.
    { intent: 'capability.outboundContact', re: /\b(can|could|will) (you|u) (text|call|phone|dm|message|email)\b/, c: 0.94 },
    { intent: 'capability.outboundContact', re: /\b(text|call|phone|dm|message|email) (them|him|her|it|tsa|national tsa|my advisor)\b.{0,20}\bfor me\b/, c: 0.92 },
    { intent: 'capability.outboundContact', re: /\bsend (them|him|her|it) (a |an )?(text|message|dm|email|instagram dm|facebook message)\b/, c: 0.93 },
    { intent: 'capability.outboundContact', re: /\bsend (a |an )?message to (national tsa|my advisor|them|him|her|tsa)\b/, c: 0.93 },
    { intent: 'capability.outboundContact', re: /\bmake the (phone )?call\b/, c: 0.9 },
    { intent: 'capability.outboundContact', re: /\b(can|could) (you|u) (reach out|talk) to (them|him|her|my advisor|tsa|national tsa)\b/, c: 0.9 },
    { intent: 'capability.outboundContact', re: /\bcontact (them|him|her|my advisor|tsa|national tsa|somebody|someone) for me\b/, c: 0.9 },
    { intent: 'capability.outboundContact', re: /\b(open gmail and email|send it automatically|can (you|u) send it automatically)\b/, c: 0.9 },
    { intent: 'capability.outboundContact', re: /\b(text|call|phone|dm|message) (tsa|national tsa|alabama tsa|my advisor)\b/, c: 0.88 },
    { intent: 'capability.outboundContact', re: /\bemail (my advisor|national tsa|tsa hub)\b/, c: 0.88 },
    // Bare imperative form, no leading "can you" — "call them", "dm them",
    // "contact them", "reach out to them", "message them".
    { intent: 'capability.outboundContact', re: /^(call|phone|message|dm|contact|text) (them|him|her|it|tsa)\b/, c: 0.9 },
    { intent: 'capability.outboundContact', re: /\breach out to (them|him|her|tsa|my advisor)\b/, c: 0.88 },
    { intent: 'capability.outboundContact', re: /\btalk to (them|him|her) for me\b/, c: 0.88 },
    { intent: 'capability.outboundContact', re: /\bcan (you|u) send (an |a )?(instagram|facebook) (dm|message)\b/, c: 0.92 },
    { intent: 'capability.outboundContact', re: /\bcan (you|u) (do it|submit (this|it)) for me\b/, c: 0.85 },
    { intent: 'capability.outboundContact', re: /\bcan (you|u) (sign me up|file this for me|post this for me|upload my submission|fill out the form for me|book my hotel|print this for me|sign this for me|register me|pay (the|my) (fee|registration)|schedule a meeting|fax this)\b/, c: 0.9 },
    // Broad "can you [do this real-world/account thing]" — Coach can't take
    // any action outside answering questions: no logins, no sending on the
    // student's behalf, no accessing personal accounts/devices. Grouped as
    // one regex (mission's own QA list), not per-phrase branches.
    { intent: 'capability.outboundContact', re: /\b(can|could|will) (you|u) (send email|open my gmail|access my calendar|check my calendar|see my school|see my account|access my account|send a text( message)?|make a( phone)? call|access the internet|log ?into tsa|log ?in to tsa|register me|submit for me|access my account|open websites|search the internet|google (that|something)( for me)?|browse the web|look something up online|check my email|read my email|call my school|text my mom|call my parents|make a reservation|order something( for me)?|buy something( for me)?|edit my project|submit my project( for me)?|upload my (file|submission)|take a test for me|do my homework|fill (this|out)( this)?( form)?( out)?( for me)?|renew my membership|cancel my registration|change my registration|update my (team )?roster|add a teammate( for me)?|remove a teammate( for me)?|check if i(m| am) registered|confirm my registration|tell my advisor something( for me)?|relay a message( to my teammates)?|set a reminder( for me)?|notify me( before the deadline)?|save my progress|remember what i told you( last time)?|post (this |it )?on (social media|instagram|tiktok)|tweet this|update my profile|change my settings( for me)?|delete my account|create an account( for me)?|log me in|verify my identity|scan a document( for me)?|translate a document( for me)?|generate an image( for me)?|make a video( for me)?|record audio( for me)?|transcribe something( for me)?|fax something|mail something physically|print my certificate|order supplies( for my team)?|track my package|check the weather( for me)?|set an alarm|play music|call (an |a )?uber( for me)?|book a flight( for me)?|check my grades|access my school portal|log ?into canvas( for me)?|check my bank account|pay for something with my card|access my social media|hack into something|bypass a login|access someone(')?s account|find someone(')?s (personal information|address|phone number))\b/, c: 0.9 },
    // Confidence above state.advisor's broad "contact.*(state|advisor)"
    // catch-all below — "can you contact X" is an action request, not the
    // "who is my advisor" factual question that catch-all exists for.
    { intent: 'capability.outboundContact', re: /\b(can|could) (you|u) contact (my advisor|them|him|her|tsa|national tsa)\b/, c: 0.95 },
    { intent: 'capability.outboundContact', re: /\bcan (you|u) (send|tell|message) my advisor( a message| something)?\b|\bcan (you|u) text my (mom|dad|parents)\b|\bcan (you|u) call my (mom|dad|parents)\b|\bcan (you|u) buy something( for me)?\b|\bcan (you|u) do my homework\b|\bis it possible (you|u) (send email|call|text|message)\b/, c: 0.9 },
    // Factual "what is National TSA's contact info" — has real, sourced data
    // to give, so this is NOT a capability limit.
    { intent: 'contact.nationalInfo', re: /\b(what'?s?|what is) (national tsa'?s?|the national tsa) (phone|email|number|contact)\b/, c: 0.92 },
    { intent: 'contact.nationalInfo', re: /\bnational tsa'?s? (phone number|email|contact info|contact information)\b/, c: 0.9 },
    { intent: 'contact.nationalInfo', re: /\b(contact information|contact info) for national tsa\b/, c: 0.88 },
    { intent: 'contact.nationalInfo', re: /\b(need|want|trying) to (contact|reach) national tsa\b/, c: 0.88 },
    { intent: 'contact.nationalInfo', re: /^contact national tsa\b/, c: 0.85 },
    { intent: 'contact.nationalInfo', re: /\bnational tsa contact\b/, c: 0.9 },
    { intent: 'cost.isExpensive', re: /\b(is|are) .*(expensive|pricey|cheap|affordable)\b/, c: 0.9 },
    { intent: 'cost.general', re: /how much .*(cost|price|pay|spend)/, c: 0.92 },
    { intent: 'cost.general', re: /\bcan i do it (for )?free\b|\bdo we need hosting\b|\bdo we need equipment\b(?!.{0,20}(what|list))|\bdo i need to spend a lot\b/, c: 0.85 },
    { intent: 'time.general', re: /how (long|much time)/, c: 0.9 },
    { intent: 'time.general', re: /(time (commitment|required)|takes more time|how many hours)/, c: 0.9 },
    { intent: 'difficulty.general', re: /how (hard|difficult|challenging|easy)/, c: 0.9 },
    { intent: 'difficulty.general', re: /\bhow much work\b|\bcan we finish in a week\b|\bdoes this take months\b|\bdo we need to practice a lot\b/, c: 0.85 },
    { intent: 'difficulty.general', re: /\b(is|are) (it|this|that|.*) (hard|difficult|easy)\b/, c: 0.85 },
    // "whats up" is contraction-expanded to "what is up" before this runs —
    // exclude it, it's always the greeting, never a real "what is X" ask.
    { intent: 'overview.general', re: /(tell me about|what is(?! up\b)|what's|explain) /, c: 0.8 },
    { intent: 'overview.general', re: /what (do|would) (i|you|we) (do|actually do)/, c: 0.85 },
    { intent: 'career.general', re: /(what|which) (careers?|jobs?|majors?)/, c: 0.9 },
    { intent: 'career.general', re: /(lead to|connect to|good for) .*(career|job|major|engineering|software)/, c: 0.85 },
    { intent: 'career.general', re: /\bwhat should i (study|major in)\b|\bcollege major\b|\bcareer path\b|\bdoes this help with (engineering|cs|computer science)\b|\bgood for (computer science|medicine|architecture|engineering)\b|\bwhat can i become\b|\bwould this help college\b|\bwhat can this lead to\b|\bwhat could i do after school\b|\bwhat degree\b|\bwould this help with college\b|\bwould this look good on a college app\b|\bwhat industries relate to this\b/, c: 0.85 },
    { intent: 'preconference.general', re: /(what do i (need to )?submit|preconference|pre-conference)/, c: 0.9 },
    { intent: 'material.general', re: /\bdo they provide computers\b|\bdo i need printed copies\b|\bwhat hardware\b|^what software[?.\s]*$|\bwhat stuff should be ready\b|\bwhat should we pack\b|\bis there anything i need to buy\b|\bdo i need my own computer\b|\bdo i need internet access\b|\bdo i need a specific program\b|\bwhat tools does this event need\b|\bdo i need a charger\b/, c: 0.8 },
    { intent: 'preconference.general', re: /\bwhat files\b|\bwhat gets uploaded\b|\bwhat do i send\b|\bwhat needs to be submitted beforehand\b|\bwhat has to be done online\b|\bdo we upload a pdf\b|\bwhat file type\b|\bwhat format\b|\bis there an online portion\b|\bdo we submit anything digital\b|\bwhat exactly gets turned in\b/, c: 0.85 },
    // General question about what advisor approval IS — no event needed
    { intent: 'advisor.meaning', re: /\b(what|explain|mean|how does).*(state )?advis[oe]r approval\b/, c: 0.93 },
    { intent: 'advisor.meaning', re: /\badvis[oe]r approval\b.{0,30}(mean|what|why|how|explain)/, c: 0.91 },
    { intent: 'advisor.meaning', re: /\bstate advisor approval\b.{0,30}(mean|what|why|how|explain)/, c: 0.91 },
    // "what events are best for X major/career" — career search, not event lookup
    { intent: 'career.byMajor', re: /\b(what|which)\b.{0,20}\bevents?\b.{0,30}\b(major|career|field|degree|path)\b/, c: 0.93 },
    { intent: 'career.byMajor', re: /\bevents?.{0,20}(best|good).{0,20}(software|engineering|medicine|design|business|marketing|data|cyber|aerospace|film|media|art|fashion|research)/, c: 0.89 },
        { intent: 'advisor.general', re: /(advisor approval|state advisor|need approval)/, c: 0.9 },
    { intent: 'eligibility.general', re: /(who can (enter|compete)|am i eligible|eligibility)/, c: 0.88 },
    // Allows an event name (or a couple of filler words) between "the" and
    // "theme" — "what's the Webmaster theme" / "what is the current theme"
    // must win over overview.general's broader "what is " match, not just
    // the bare "what is the theme" phrasing with nothing in between.
    { intent: 'theme.general', re: /(this year'?s? theme|what('?s| is) the (\S+\s+){0,3}theme|annual theme)/, c: 0.9 },
    { intent: 'theme.general', re: /\bwhat are we building\b|\bdid they release it\b|\bwhat do we actually have to do\b|\bwhat matters in the pdf\b/, c: 0.8 },

    { intent: 'deadline.regionals', re: /\b(when|date).*(regional|regionals)\b/, c: 0.92 },
    { intent: 'deadline.states', re: /\b(when|date).*(state|states)\s*(conference|comp)/, c: 0.92 },
    { intent: 'deadline.states', re: /\bstate conference\b/, c: 0.88 },
    { intent: 'deadline.states', re: /\bwhen.*(the )?states?\b/, c: 0.85 },
    { intent: 'deadline.states', re: /\b(states?|state)\s*(date|when|deadline)/, c: 0.85 },
    { intent: 'deadline.nationals', re: /\b(when|date|how (many|long)|days).*(national|nationals)\b/, c: 0.92 },
    { intent: 'deadline.all', re: /\b(when|what|all).*(deadline|dates|schedule)\b/, c: 0.85 },
    // Vague "what's coming up" style deadline asks students actually use —
    // no explicit "deadline"/"date" word, just a sense of "what's next".
    // NOTE: "whats" -> "what is" pre-expansion (normalize.js).
    { intent: 'deadline.all', re: /\b(what is|anything) (coming up|next|happening soon|soon)\b/, c: 0.82 },
    { intent: 'deadline.all', re: /\b(next|important) (important )?dates?\b/, c: 0.82 },
    { intent: 'deadline.all', re: /\bwhat happens (this|next) (week|month)\b/, c: 0.82 },
    { intent: 'deadline.all', re: /\b(what did i miss|what('s| has| already)? already passed|calendar stuff|tsa dates)\b/, c: 0.8 },
    { intent: 'deadline.all', re: /\bwhen is (tsa week|affiliation)\b/, c: 0.85 },
    { intent: 'deadline.all', re: /\bhow many days until\b/, c: 0.82 },
    { intent: 'deadline.all', re: /\bwhen does affiliation (open|close)\b|\bdid i miss anything\b|^tsa calendar$|\bwhat happens in (january|february|march|april|may|june|july|august|september|october|november|december)\b|\bwhat is due in (january|february|march|april|may|june|july|august|september|october|november|december)\b|\bis anything due in (january|february|march|april|may|june|july|august|september|october|november|december)\b|\bwhat is coming up in (january|february|march|april|may|june|july|august|september|october|november|december)\b|^(next week|this month|next month)[?.\s]*$|\bwhen do i find out results\b|\bwhen does it end\b/, c: 0.8 },
    { intent: 'conference.when', re: /\bwhen is (the )?conference\b/, c: 0.9 },
    { intent: 'conference.where', re: /\bwhere is (the )?conference\b/, c: 0.9 },
    { intent: 'conference.theme', re: /\bconference theme\b/, c: 0.88 },
    { intent: 'conference.search', re: /\b(conference|nationals).*(store|shirt|badge|shuttle|transport|session|safety|lost|luggage|app|pin exchange|meet and greet|advisor|hotel|stay)/, c: 0.85 },
    { intent: 'conference.search', re: /\b(what hotel|where do we stay|what happens there)\b/, c: 0.8 },
    { intent: 'rule.search', re: /\bhow many (move on|advance|people move on)\b/, c: 0.85 },

    { intent: 'state.advisor', re: /\b(who is (the |my )?(state )?advisor|contact.*(state|advisor)|state advisor (website|email|phone|info|page)|who do i (contact|email)\b)/, c: 0.92 },
    { intent: 'state.website', re: /\b(state (tsa )?(website|site|page|url)|my state.*(website|site))/, c: 0.9 },
    { intent: 'state.website', re: /\btsa (website|site|page)\b/, c: 0.85 },
    { intent: 'state.website', re: /^what is the (website|site)\??$/, c: 0.8 },
    { intent: 'state.social', re: /\b(state.*(instagram|facebook|social|twitter)|my state.*(instagram|social))/, c: 0.88 },
    { intent: 'state.officers', re: /\b(state officer|officer team|who are the (state )?officers)/, c: 0.88 },
    { intent: 'state.general', re: /\b(my state|state tsa|state delegation|state info|state information)\b/, c: 0.82 },

    { intent: 'general.what-is-tsa', re: /\bwhat is tsa\b/, c: 0.92 },
    { intent: 'general.divisions', re: /\b(what|which) (divisions|division)/, c: 0.88 },
    { intent: 'general.divisions', re: /\b(middle school|high school) division/, c: 0.85 },
    { intent: 'general.competitions', re: /\bhow many (events|competitions)/, c: 0.88 },
    { intent: 'general.competitions', re: /\bwhat (are |events|competitions).*tsa\b/, c: 0.82 },
    { intent: 'general.history', re: /\b(history|when was tsa (founded|started|created))/, c: 0.88 },
    { intent: 'general.mission', re: /\b(tsa (mission|vision|motto)|what is tsa'?s? mission)/, c: 0.88 },
    { intent: 'general.achievement', re: /\b(achievement program|pathways to excellence)/, c: 0.9 },
    { intent: 'general.scholarships', re: /\b(scholarship|scholarships|financial aid|nths)/, c: 0.88 },
    { intent: 'general.awards', re: /\b(awards?|recognition|advisor of the year)/, c: 0.82 },
    { intent: 'general.leadership', re: /\b(leadership program|tsa voices|21st century skills)/, c: 0.88 },
    { intent: 'general.how-to-start', re: /\b(how (do i|to) (get started|start|join|sign up)|new to tsa)/, c: 0.9 },
    { intent: 'general.how-competitions-work', re: /\bhow (do|does) (tsa )?(competitions?|events?) work/, c: 0.88 },
    { intent: 'rule.search', re: /\bcitation/, c: 0.85 },
    { intent: 'conference.search', re: /\bshuttle/, c: 0.85 },
    // NOTE: deliberately no bare "ai"/"artificial intelligence" alternative
    // here — that hijacked "What is Artificial Intelligence (AI)?" (an exact
    // event name) into an unrelated rule citation, since this phrase beat
    // overview.general's confidence by a hair. Genuine AI-policy questions
    // ("can we use ai", "is ai allowed") already match via "can (i|we) use" /
    // "allowed" below, and the rules-domain fallback in engine.js still
    // searches on the raw tokens (including ai/artificial) for anything else.
    { intent: 'rule.search', re: /\b(rule|rules|allowed|prohibited|can (i|we) use|dress code|citation|plagiarism|original work|penalties|judging|grievance|disqualif|what (cant|can not) we do|what do we have to follow|what happens if (we are|were) late|can (we|i) bring (this|that|a \w+)|is (this|that) legal|does tsa allow (this|that)|is (this|that) okay\b|can my (grandma|grandmother|grandpa|mom|dad|parent) be on the team|can (my|our|this) \w+ weigh \d+|is there an age limit|can a parent help build it|can we reuse a project from last year|how many rounds are there|how does scoring work|how is this judged|what is the criteria|how many actual rounds|how is this actually judged|how is the (exact )?tiebreaker decided|what is the criteria they use|what are the actual rules i need to follow|which school wins the most|will i win if i do this project|is my project good enough to win|will this project beat other teams|how many total participants competed in 2024 exactly)/, c: 0.82 },
    // Dress-code phrasing that never says the words "dress code" — real
    // students ask about the specific garment, not the policy name.
    // Scoped to actually be about clothing FOR competition — a bare "what
    // shoes/pants should I ___" with no TSA/wear anchor is just as likely to
    // be a completely unrelated question, and confidently answering it with
    // the dress-code rule would be a wrong answer with false authority.
    { intent: 'rule.search', re: /\bwhat (do|should) i wear\b|\b(tsa|nationals?|conference) (outfit|uniform)\b|\bofficial dress\b|\bdo i need a (suit|blazer|tie)\b|\bcan i wear (sneakers|jeans|a hoodie)\b|\bbusiness casual\b|\bdo (i|girls) (need|wear)( a)? (skirt|the uniform)\b|\bcan girls wear pants\b|\bwhat (shoes|pants) (do i|should i)? ?wear\b|^what shoes[?.\s]*$|\bdo i need to dress up for\b|\bis there a specific outfit for\b|\bdo girls have to wear a skirt\b|\bcan guys wear a polo\b|\bwhat is too casual for\b/, c: 0.85 },
    { intent: 'compare.general', re: /\b(compare|versus|vs\.?)\b/, c: 0.9 },

    { intent: 'compare.general', re: /(difference between|what'?s the difference|how are they different)/, c: 0.9 },
    { intent: 'compare.general', re: /\bwhich (should i choose|one takes more work|one has less presenting)\b/, c: 0.85 },
    { intent: 'compare.difficulty', re: /which (one )?(is )?(harder|easier|more difficult)/, c: 0.92 },
    { intent: 'compare.time', re: /which (one )?(takes|needs) (more|less) time/, c: 0.92 },
    { intent: 'compare.cost', re: /which (one )?(costs?|is) (more|less|cheaper|expensive)/, c: 0.92 },
    { intent: 'compare.team', re: /which (one )?can i do (alone|solo)/, c: 0.92 },

    // Hypotheticals ("what if my teammate quits") that don't hit any
    // specific topic PHRASE above still deserve a real, honest answer
    // instead of falling to unknown — deliberately low confidence so any
    // specific-topic PHRASE (team/deadline/dress code/etc, all 0.8+) still
    // wins when the hypothetical is really about a known topic.
    { intent: 'whatif.general', re: /^what if\b/, c: 0.6 },

    // Planning / preparation language — "what should we do first", "make me
    // a plan" — general prep guidance, not a specific data lookup.
    { intent: 'planning.general', re: /(\bwhat should we do first\b)|(\bwhere should we start\b)|(\bwhat (do|should) we (work on|focus on) first\b)|(\bhow should we split the work\b)|(\bwhat should i focus on\b)|(\bwhat can wait\b)|(\bwhat should we finish first\b)|(\bhow early should we start\b)|(\bare we behind\b)|(\bis it too late to start\b)|(\bmake me a plan\b)|(\bhelp me plan (this|it)\b)|(\bcan (you|u) make a checklist\b)|(\bwhat should we (do|prepare|practice|test)\b.{0,20}(this week|before states|before nationals)?)|(\bwhat do judges (usually |typically )?care about\b)|(\bhow should we get ready\b)|(\bwhat are the biggest mistakes\b)|(\bwhat should we avoid\b)|(\bwhat can get us in trouble\b)|(\bwhat should we double check\b)|(\bwhat should we have done already\b)|(\bwhat should we bring\b)|(\bwhat should i remember\b)|(\bhow much time should we give ourselves\b)|(\b(dont|do not) know what order things (are supposed to happen|happen) in\b)|(\bplan our (whole )?semester\b)|(\bwhat should we tackle first\b)|(\bhow do we divide tasks\b)|(\bwhen should we be done by\b)|(\bhow do we stay on track\b)|(\bwhat should we work on\b)|(\bwhat should we prioritize\b)|(\bwhat mistakes should we avoid\b)|(\bhow should we practice interview\b)|(\bwhat should we review\b)/, c: 0.72 },

    // Real-life conference logistics Coach has no official data for — be
    // honest about that instead of guessing or going unknown.
    { intent: 'conference.life', re: /(\bwhen should we arrive\b)|(\bwhat should i bring with me\b)|(\bdo i need my id\b)|(\bdo i need cash\b)|(\bcan (my )?parents come\b)|(\bcan my family watch\b)|(\bcome watch me compete\b)|(\bwhere do we check ?in\b)|(\bwhat happens at check ?in\b)|(\bwhere do we go first\b)|(\bcan i leave and come back\b)|(\bdo we (stay at|need to stay at) (a|the official) hotel\b)|(\bwhat happens after (the )?competition\b)|(\bcan i bring a backpack\b)|(\bwhat should i pack\b)|(\bdo i need my laptop\b)|(\bdo i carry my project around\b)|(\bwhere do projects go\b)|(\bwhat happens if something breaks there\b)|(\bwho do i ask for help\b)|(\bhow do i find my room\b)|(\bwhat if i miss my competition time\b)|(\bwhen do i know my competition time\b)|(\bis there food there\b)|(\bshould i bring food\b)|(\bwhen are awards\b)|(\bcan we walk around during the day\b)|(\bwhere do we get our badges\b)|(\bis registration separate from competition\b)|(\bdo we need to bring our own snacks\b)|(\bhow early should we get there\b)/, c: 0.72 },

    // Bare self-disclosure / context statements with no active event yet —
    // "I'm in middle school", "there's four of us" — acknowledge, don't
    // assume a question was asked.
    // NOTE: "im"/"dont"/"isnt"/"havent" are the pre-expansion literal
    // spellings — CONTRACTIONS in normalize.js rewrites "I'm"->"i am",
    // "isn't"->"is not", "haven't"->"have not" (but leaves "don't" as
    // "do not" via COMMON_TYPOS-adjacent expansion too), so every one of
    // these needs BOTH forms or the standard-spelling version is dead code.
    { intent: 'context.acknowledge', re: /(\b(im|i am) in (middle|high) school\b)|(\b(im|i am) in \d+(st|nd|rd|th) grade\b)|(\b(im|i am) a (freshman|sophomore|junior|senior)\b)|(\bthis is my first year\b)|(\b(ive|i have) done tsa before\b)|(\bmy first (tsa )?competition\b)|(\b(dont|do not) know what to expect\b)|(\b(theres|there is) (two|three|four|five|\d+) of us\b)|(\bmy team has \d+ (people|members)\b)|(\bi have no teammates\b)|(\b(im|i am) (from|in) [a-z]+\b)|(\bi (qualified for|won) states\b)|(\bmy school has no equipment\b)|(\bmy advisor (isnt|is not) helping( much)?\b)|(\bi already started the project\b)|(\bwe just picked our event\b)|(\b(we|i) (havent|have not) started yet\b)|(\bim new to this whole thing\b)|(\bwe ended up picking [a-z ]+\b)|(\bour chapter is doing [a-z ]+ this year\b)/, c: 0.65 },
];

// Token evidence, weaker than phrases.
const TOKEN_INTENTS = [
    { intent: 'preconference.general', tokens: ['preconference'] },
    { intent: 'advisor.general', tokens: ['advisor'] },
    { intent: 'team.individual', tokens: ['individual'] },
    { intent: 'team.general', tokens: ['team'] },
    { intent: 'cost.general', tokens: ['cost'] },
    { intent: 'time.general', tokens: ['time'] },
    { intent: 'difficulty.general', tokens: ['difficulty'] },
    { intent: 'career.general', tokens: ['career'] },
    { intent: 'eligibility.general', tokens: ['eligibility'] },
    { intent: 'theme.general', tokens: ['theme'] },
    { intent: 'category.general', tokens: ['category'] },
    { intent: 'division.general', tokens: ['division'] },
    { intent: 'material.general', tokens: ['material'] },
    { intent: 'overview.general', tokens: ['overview'] },

    { intent: 'compare.general', tokens: ['compare'] },
];

// Raw words that imply difficulty but need the blocker check.
const RAW_DIFFICULTY = ['hard', 'easy', 'harder', 'easier', 'hardest', 'easiest'];

function comparisonFamily(intent) {
    return intent && intent.startsWith('compare.');
}

/**
 * Detect intent for a message.
 * Returns { intent, confidence, evidence, alternatives }.
 */
export function detectIntent(norm, { eventCount = 0, state = null } = {}) {
    const text = norm.rawJoined;
    const blocked = DIFFICULTY_BLOCKERS.some((re) => re.test(text));
    const found = [];

    for (const p of PHRASES) {
        if (!p.re.test(text)) continue;
        if (blocked && p.intent.includes('difficulty')) continue;
        found.push({ intent: p.intent, confidence: p.c, evidence: [p.re.source.slice(0, 28)] });
    }

    for (const t of TOKEN_INTENTS) {
        const hits = t.tokens.filter((w) => norm.tokens.includes(w));
        if (!hits.length) continue;
        if (blocked && t.intent.includes('difficulty')) continue;
        found.push({ intent: t.intent, confidence: 0.68, evidence: hits });
    }

    if (!blocked && RAW_DIFFICULTY.some((w) => norm.raw.includes(w))) {
        found.push({ intent: 'difficulty.general', confidence: 0.72, evidence: ['difficulty word'] });
    }

    if (!found.length) {
        // No signal of its own. A bare event name is an overview request.
        if (eventCount > 0) {
            // No topic words at all, just an event name. Flagged so the engine
            // can inherit the previous intent for follow ups like "what about X".
            return { intent: 'overview.general', confidence: 0.6, evidence: ['event only'], alternatives: [], eventOnly: true };
        }
        return { intent: null, confidence: 0, evidence: [], alternatives: [] };
    }

    // Two events plus a "which" style question is a comparison.
    if (eventCount >= 2) {
        const cmp = found.find((f) => comparisonFamily(f.intent));
        if (cmp) {
            found.forEach((f) => { if (f === cmp) f.confidence = Math.max(f.confidence, 0.92); });
        } else if (/\bwhich\b|\bbetter\b|\bor\b/.test(text)) {
            const topic = found[0].intent.split('.')[0];
            found.unshift({ intent: `compare.${topic}`, confidence: 0.85, evidence: ['two events'] });
        } else {
            found.unshift({ intent: 'compare.general', confidence: 0.8, evidence: ['two events'] });
        }
    }

    found.sort((a, b) => b.confidence - a.confidence);
    const best = found[0];

    // Knowing the event lifts confidence, not knowing it lowers it.
    let confidence = best.confidence;
    if (eventCount > 0) confidence = Math.min(0.97, confidence + 0.05);
    else if (!state?.activeEvent) confidence -= 0.12;

    return {
        intent: best.intent,
        confidence: Math.max(0, Math.round(confidence * 100) / 100),
        evidence: best.evidence,
        alternatives: found.slice(1, 3).map((f) => f.intent),
    };
}

// Intents that cannot be answered without an event.
export const REQUIRES_EVENT = new Set([
    'team.general', 'team.individual', 'team.minimum', 'team.maximum',
    'cost.general', 'cost.isExpensive', 'time.general', 'difficulty.general',
    'overview.general', 'theme.general', 'category.general', 'division.general',
    'career.general', 'eligibility.general', 'preconference.general',
    'advisor.general', 'material.general',
]);

export const REQUIRES_TWO_EVENTS = new Set([
    'compare.general', 'compare.team', 'compare.time', 'compare.cost',
    'compare.difficulty', 'compare.work', 'compare.career', 'compare.overview',
]);
