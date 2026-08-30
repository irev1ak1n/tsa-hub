// TSA Hub — Help Center content. Local, structured data (no CMS, no
// backend) — same pattern as aboutTsa.js / competitionRules.js. Every
// article describes only real, current TSA Hub capabilities.

export const HELP_ARTICLES = [
    {
        id: 'using-tsa-assistant',
        title: 'Using TSA Assistant',
        intro: 'TSA Assistant, which most people around here just call Coach, is the chat helper built into TSA Hub. It exists to save you time when you have a quick question about an event, a rule, a deadline, or your state TSA, instead of digging through pages on your own.',
        sections: [
            {
                heading: 'What Coach actually does',
                paragraphs: [
                    'Coach pulls its answers straight from the same data that powers the rest of TSA Hub. If you ask about an event’s team size, cost, or current theme, you’re getting the same information you’d find on that event’s own page, just delivered as a sentence instead of a list of fields.',
                    'It can also help you find official rules and requirements, check deadlines and conference dates, compare two events side by side, or point you toward a recommendation if you’re not sure what to compete in yet. Mention your state and it can surface your state TSA’s contacts too.',
                ],
            },
            {
                heading: 'A few things you can try asking',
                list: [
                    'What’s the team size for Robotics?',
                    'When is the deadline for online conference registration?',
                    'What’s the difference between Coding and Software Development?',
                    'Who’s my state advisor?',
                    'I don’t know what event to pick, can you help?',
                ],
            },
            {
                heading: 'Where Coach draws the line',
                paragraphs: [
                    'Coach isn’t a general purpose AI chatbot, and it won’t pretend to be one. It only answers using TSA Hub’s own structured data, so it won’t invent an answer just to give you something to read. If it doesn’t have the information you’re asking about, it says so directly instead of guessing.',
                    'That also means Coach can’t take actions outside of TSA Hub. It won’t register you for an event, submit a form for you, or reach out to your advisor on your behalf.',
                ],
            },
            {
                heading: 'If Coach can’t answer your question',
                paragraphs: [
                    'When Coach tells you it doesn’t know something, that usually means the information either hasn’t been published yet or lives somewhere outside TSA Hub, like with your state or your chapter advisor. Resources or Contact Support are good next stops in that case.',
                ],
            },
        ],
        action: { label: 'Open TSA Assistant', to: '/coach' },
        keywords: ['coach', 'assistant', 'chatbot', 'ai assistant', 'tsa bot', 'chat'],
    },
    {
        id: 'finding-events',
        title: 'Finding competition events',
        intro: 'TSA runs dozens of competitive events spread across categories like technology, leadership, and STEM, and figuring out which ones are worth a look can feel overwhelming when you’re just getting started. TSA Hub gives you a few different ways to explore the full list depending on how you like to search.',
        sections: [
            {
                heading: 'Browsing on your own terms',
                list: [
                    'Look through every event and narrow the list by category, division, or team size',
                    'Search for an event directly if you already know its name',
                    'Use Get Recommendations to answer a few quick questions and get suggestions based on what you enjoy',
                ],
            },
            {
                heading: 'Not sure where to start',
                paragraphs: [
                    'If none of that sounds appealing yet, that’s completely normal. Plenty of students go into their first year without a clear idea of what they want to compete in. Get Recommendations exists for exactly that situation. It asks about the kind of work you enjoy, building things, writing, presenting, working with a team versus working alone, and suggests events based on your answers.',
                    'Once you find something that looks interesting, open the event page. Every event lays out what’s actually involved, so you can decide whether it’s a good fit before you commit your whole season to it.',
                ],
            },
        ],
        action: { label: 'Open Events', to: '/events' },
        keywords: ['events', 'competitions', 'browse events', 'find event'],
    },
    {
        id: 'themes-and-problems',
        title: 'Understanding themes and problems',
        intro: 'Most build and design events get a new theme or problem statement every year, and your project is expected to respond to it directly. It’s worth understanding early, since your whole season tends to get built around it.',
        sections: [
            {
                heading: 'How to find your event’s theme',
                paragraphs: [
                    'Open the event you’re competing in and look for its current theme or challenge on the page. That’s where you’ll usually find the actual prompt you’re expected to design or build around, along with any constraints tied to it.',
                    'Not every event works this way. Presentation style events like public speaking or leadership competitions are typically judged on delivery and content rather than a design problem, so they won’t have an annual theme in the same sense.',
                ],
            },
            {
                heading: 'Why it’s worth rereading',
                paragraphs: [
                    'Say you’re competing in an event where the theme changes each year around a specific engineering problem. Your team wouldn’t just build something generic. You’d design specifically to solve that year’s stated problem, and judges would be scoring how well your solution actually addresses it.',
                    'It’s easy to drift away from the exact prompt once you’re deep into building something, so it helps to go back and reread the theme more than once while you’re planning, not just at the very beginning.',
                ],
            },
        ],
        action: { label: 'Open Events', to: '/events' },
        keywords: ['theme', 'problem', 'challenge', 'prompt', 'design brief'],
    },
    {
        id: 'official-documents',
        title: 'Finding official event documents',
        intro: 'Rule books, prep guides, and other official TSA paperwork all live in one place inside TSA Hub, so you’re not stuck hunting across different websites for the right file.',
        sections: [
            {
                heading: 'What’s actually in there',
                list: [
                    'Competition rules and preparation guides, organized by category',
                    'Updates and changes to competition requirements',
                    'Direct links to official TSA and National TSA documents',
                ],
            },
            {
                heading: 'A tip for using them well',
                paragraphs: [
                    'It helps to open the rules document for your specific event early in the season instead of waiting until right before competition. Requirements sometimes get small updates during the year, and catching a change in the fall is a lot less stressful than finding out about it the week of your competition.',
                ],
            },
        ],
        action: { label: 'Open Resources', to: '/resources' },
        keywords: ['documents', 'official resources', 'pdf', 'guide', 'rules document'],
    },
    {
        id: 'using-resources',
        title: 'Using Resources',
        intro: 'Resources is basically TSA Hub’s front door to everything official. Rules, programs, your state TSA, and how to reach National TSA leadership are all organized in one place, so you don’t have to remember which website has which piece of information.',
        sections: [
            {
                heading: 'What you’ll find inside',
                list: [
                    'Background on TSA and its national programs',
                    'Competition rules and requirements',
                    'Your state TSA’s contacts and social media',
                    'National TSA leadership and how to reach them',
                ],
            },
            {
                heading: 'Where to go from here',
                paragraphs: [
                    'If you’re new to TSA, Resources is a reasonable place to spend a few minutes just clicking around. It gives you a sense of how the organization is put together, which tends to make the rest of TSA Hub, and honestly the rest of your TSA experience, a lot easier to follow.',
                ],
            },
        ],
        action: { label: 'Open Resources', to: '/resources' },
        keywords: ['resources', 'official resources', 'guides'],
    },
    {
        id: 'state-advisor',
        title: 'Finding your state advisor',
        intro: 'Every state runs its own TSA chapter with its own advisor and officer team, and TSA Hub can show you exactly who yours is once you tell it which state you’re in.',
        sections: [
            {
                heading: 'Setting it up',
                paragraphs: [
                    'Head into Resources and scroll down to the section labeled Your State. Pick your state from there, and TSA Hub starts showing your state TSA’s available contacts, website, and social links wherever they’re relevant throughout the app.',
                    'You only need to do this once. After your state is set, TSA Hub remembers it and keeps showing the right information automatically from then on.',
                ],
            },
            {
                heading: 'If your state’s information looks thin',
                paragraphs: [
                    'Not every state TSA publishes the same amount of information online, so if you set your state and only see a little, that’s most likely just what’s publicly available rather than something missing on TSA Hub’s end. Your chapter advisor is usually still your best first contact for anything specific to your own team.',
                ],
            },
        ],
        action: { label: 'Open Resources', to: '/resources' },
        keywords: ['advisor', 'state advisor', 'contact state', 'state tsa', 'state contact'],
    },
    {
        id: 'using-calendar',
        title: 'Using the Calendar',
        intro: 'The Calendar brings together official TSA dates and anything personal you want to track, all in one place instead of juggling a separate planner on top of it.',
        sections: [
            {
                heading: 'Four ways to look at it',
                list: [
                    'Year, for a wide view of the whole season',
                    'Month, for planning around a specific stretch of weeks',
                    'Week, when you need to see what’s coming up day by day',
                    'Schedule, a simple running list of what’s next',
                ],
            },
            {
                heading: 'Where the dates actually come from',
                paragraphs: [
                    'Official dates you see on the Calendar come directly from TSA Hub’s own calendar data, so there’s no need to cross check them against a separate source. Anything personal you add on top of that, practice sessions, meetings, your own reminders, is stored only on your device.',
                    'One thing worth knowing is that TSA Hub doesn’t currently send push notifications or reminders for anything on the Calendar. It’s a place to see your schedule, not an alarm system, so if a date really matters to you, it’s still worth setting your own reminder somewhere too.',
                ],
            },
        ],
        action: { label: 'Open Calendar', to: '/calendar' },
        keywords: ['calendar', 'dates', 'schedule', 'year view', 'month view', 'week view'],
    },
    {
        id: 'personal-calendar-entries',
        title: 'Creating personal calendar entries',
        intro: 'Alongside the official TSA dates, you can add your own events and reminders directly into the Calendar, which is handy for things like tracking team practices or your own personal deadlines.',
        sections: [
            {
                heading: 'How adding one works',
                list: [
                    'Open the date you want and add a personal event or reminder',
                    'Give it a title, a date and time, and notes if you want to leave yourself more detail',
                    'Come back later to edit or delete it whenever you need to',
                ],
            },
            {
                heading: 'Where this information actually lives',
                paragraphs: [
                    'Everything you add this way is saved locally on the device you’re using, and it never gets sent anywhere else, not to TSA Hub’s servers, not anywhere. That’s good for privacy, but it also means personal entries won’t show up if you open TSA Hub on a different phone or computer.',
                    'If you regularly switch between devices, keep that in mind and maybe stick to noting down anything truly important somewhere else as a backup too.',
                ],
            },
        ],
        action: { label: 'Open Calendar', to: '/calendar' },
        keywords: ['reminder', 'personal event', 'add reminder', 'local storage', 'saved locally'],
    },
    {
        id: 'install',
        title: 'Installing TSA Hub',
        intro: 'TSA Hub runs entirely in your browser, so there’s nothing to download from an app store. What you can do instead is add a shortcut to your home screen, which makes it open and feel a lot like a regular installed app.',
        sections: [
            {
                heading: 'iPhone or Safari',
                paragraphs: [
                    'This only works in Safari. Other iPhone browsers don’t offer the same option to add a home screen icon.',
                ],
                list: [
                    'Open TSA Hub in Safari',
                    'Tap the Share icon',
                    'Tap “Add to Home Screen”',
                ],
            },
            {
                heading: 'Android or Chrome',
                list: [
                    'Open TSA Hub in Chrome',
                    'Tap the menu (⋮)',
                    'Tap “Add to Home screen” (or “Install app” if Chrome offers it)',
                ],
            },
            {
                heading: 'On a computer',
                paragraphs: [
                    'Most desktop browsers let you pin the tab or add a bookmark, which gets you quick access without a separate installation step.',
                ],
            },
            {
                heading: 'What changes once it’s added',
                paragraphs: [
                    'Tapping the home screen icon opens TSA Hub in its own window without the browser’s address bar, which makes it feel closer to a native app. It’s still the same website underneath, though, so anything you do in TSA Hub, like setting your state or adding calendar entries, works exactly the same whether you open it from the icon or from a regular browser tab.',
                ],
            },
        ],
        keywords: ['install', 'app', 'home screen', 'phone', 'pwa', 'add to home screen'],
    },
    {
        id: 'contacting-support',
        title: 'Contacting TSA Hub Support',
        intro: 'If something about TSA Hub itself isn’t working right, whether that’s a bug, information that looks wrong, a problem with Coach, or just feedback you want to share, Contact Support is the direct way to reach the people who maintain it.',
        sections: [
            {
                heading: 'What happens when you send one',
                paragraphs: [
                    'Start by picking the category that best matches what you’re reaching out about, then write your message in your own words. Before anything actually gets sent, TSA Hub shows you exactly what the message will look like, so you can double check it and fix anything that doesn’t read the way you meant.',
                    'Nothing goes out until you confirm it. There’s no background submission happening quietly while you’re still typing.',
                ],
            },
            {
                heading: 'Support versus other options',
                paragraphs: [
                    'If you’re not sure whether your question really belongs here, a good rule of thumb is this. If it’s about how TSA Hub works, or something feels broken, Contact Support is the right place. If it’s about an actual TSA rule or event detail, Coach or Resources will usually get you an answer faster.',
                ],
            },
        ],
        keywords: ['contact support', 'support', 'help article'],
    },
    {
        id: 'reporting-incorrect-info',
        title: 'Reporting incorrect information',
        intro: 'TSA Hub only stays useful if the information in it is accurate, so if you notice something wrong, an event detail, a date, a contact, or a link that leads nowhere, reporting it helps keep things correct for every student using the app, not just you.',
        sections: [
            {
                heading: 'How to send a report',
                paragraphs: [
                    'Choose what’s wrong and where you found it, then describe the issue in your own words. Before you submit anything, TSA Hub shows you a preview of exactly what will be sent, so there’s no guessing about what the report actually says once it’s out of your hands.',
                ],
            },
            {
                heading: 'Being specific helps a lot',
                paragraphs: [
                    'Try to include as much detail as you reasonably can. Naming the exact event and which field looks wrong is far more useful to us than a general “this seems off,” and it means whoever picks up the report can usually fix it much faster.',
                ],
            },
        ],
        keywords: ['wrong', 'incorrect', 'bad info', 'report error', 'this is wrong', 'wrong information'],
    },
    {
        id: 'privacy',
        title: 'Privacy and transparency',
        intro: 'Here’s a plain explanation of what TSA Hub actually does with your information, without the usual legal language getting in the way.',
        sections: [
            {
                heading: 'What never leaves your device',
                paragraphs: [
                    'Personal Calendar events and reminders you create are stored locally on whatever device you’re using. TSA Hub doesn’t upload them anywhere, and there’s no separate server copy sitting somewhere else. If you clear your browser data or switch devices, those entries go with it.',
                ],
            },
            {
                heading: 'What actually gets sent to us',
                paragraphs: [
                    'Support messages and incorrect information reports are the only things that get sent, and only after you’ve reviewed and confirmed them yourself. Nothing is submitted quietly in the background.',
                    'Conversations you have with TSA Assistant stay on your side unless you specifically choose to include part of one in a message you’re sending us. Coach itself doesn’t forward what you ask it anywhere.',
                ],
            },
            {
                heading: 'Where the official information comes from',
                paragraphs: [
                    'Event details, rules, and conference dates come from TSA and National TSA’s own published resources. When something you’re reading is TSA Hub’s own guidance rather than an official rule, a study tip rather than a requirement, for example, we try to make that distinction clear instead of blurring the line.',
                ],
            },
        ],
        action: { label: 'Read the full Privacy Policy', to: '/privacy' },
        keywords: ['privacy', 'data', 'local storage', 'saved locally', 'transparency'],
    },
];

export function getHelpArticle(id) {
    return HELP_ARTICLES.find((a) => a.id === id) || null;
}

// ---------------------------------------------------------------------------
// Section content shown directly on the Help Center page.
// ---------------------------------------------------------------------------

export const QUICK_HELP = [
    {
        id: 'assistant',
        icon: 'chat-bubble',
        title: 'Using TSA Assistant',
        subtitle: 'Get help from our in-app assistant',
        to: '/coach',
        keywords: ['coach', 'assistant', 'chatbot', 'ai assistant', 'tsa bot', 'chat'],
    },
    {
        id: 'rules',
        icon: 'shield',
        title: 'Find event rules',
        subtitle: 'View official rules and requirements',
        to: '/resources',
        keywords: ['rules', 'competition rules', 'requirements', 'eligibility'],
    },
    {
        id: 'official-resources',
        icon: 'file-text',
        title: 'Browse official resources',
        subtitle: 'Access TSA guides, documents, and official links',
        to: '/resources',
        keywords: ['official resources', 'resources', 'guides', 'documents'],
    },
];

export const POPULAR_TOPICS = [
    {
        id: 'install',
        icon: 'download',
        title: 'Install TSA Hub on your phone',
        subtitle: 'Add TSA Hub to your device and set it up',
        article: 'install',
        keywords: ['install', 'app', 'home screen', 'phone', 'pwa', 'add to home screen'],
    },
    {
        id: 'calendar',
        icon: 'cal',
        title: 'Calendar and reminders',
        subtitle: 'Manage TSA dates and your personal schedule',
        article: 'using-calendar',
        keywords: ['calendar', 'reminders', 'dates', 'schedule'],
    },
    {
        id: 'report',
        icon: 'flag',
        title: 'Report incorrect information',
        subtitle: 'Help us keep TSA Hub information accurate',
        modal: 'report',
        // Also covers the 'reporting-incorrect-info' article's content —
        // set so search dedup doesn't surface both as separate results.
        article: 'reporting-incorrect-info',
        keywords: ['wrong', 'incorrect', 'bad info', 'report error', 'this is wrong', 'wrong information'],
    },
    {
        id: 'privacy',
        icon: 'shield',
        title: 'Privacy & transparency',
        subtitle: 'Learn how TSA Hub handles your data',
        article: 'privacy',
        keywords: ['privacy', 'data', 'local storage', 'saved locally'],
    },
];

export const MORE_RESOURCES = [
    {
        id: 'contact-support',
        icon: 'headset',
        title: 'Contact support',
        subtitle: 'Get in touch with the TSA Hub support team',
        modal: 'support',
        // Also covers the 'contacting-support' article's content — set so
        // search dedup doesn't surface both as separate results.
        article: 'contacting-support',
        keywords: ['support', 'contact support', 'contact us'],
    },
    {
        id: 'help-articles',
        icon: 'help',
        title: 'Help articles',
        subtitle: 'Find detailed answers to common questions',
        to: '/help/articles',
        keywords: ['help article', 'articles', 'faq'],
    },
];

// ---------------------------------------------------------------------------
// Search index: title + subtitle + keywords/aliases across every section,
// plus every Help Article. Simple normalized substring match.
// ---------------------------------------------------------------------------

function normalize(s) {
    return (s || '').toLowerCase().trim();
}

function buildIndex() {
    const rows = [];
    for (const item of [...QUICK_HELP, ...POPULAR_TOPICS, ...MORE_RESOURCES]) {
        rows.push({
            id: item.id,
            title: item.title,
            subtitle: item.subtitle,
            icon: item.icon,
            to: item.to,
            article: item.article,
            modal: item.modal,
            haystack: normalize([item.title, item.subtitle, ...(item.keywords || [])].join(' ')),
        });
    }
    const coveredTitles = new Set(rows.map((r) => normalize(r.title)));
    for (const article of HELP_ARTICLES) {
        // Skip ones already represented above as a section row (matched by
        // article id OR title) to avoid duplicate-looking search results
        // for the same destination.
        if (rows.some((r) => r.article === article.id)) continue;
        if (coveredTitles.has(normalize(article.title))) continue;
        rows.push({
            id: `article-${article.id}`,
            title: article.title,
            subtitle: article.intro,
            icon: 'help',
            article: article.id,
            haystack: normalize([article.title, article.intro, ...(article.keywords || [])].join(' ')),
        });
    }
    return rows;
}

let cachedIndex = null;
export function searchHelp(query) {
    const q = normalize(query);
    if (!q) return [];
    if (!cachedIndex) cachedIndex = buildIndex();
    return cachedIndex.filter((row) => row.haystack.includes(q));
}
