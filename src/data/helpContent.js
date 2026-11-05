// TSA Hub — Help Center content. Local, structured data (no CMS, no
// backend) — same pattern as aboutTsa.js / competitionRules.js. Every
// article describes only real, current TSA Hub capabilities.

export const HELP_ARTICLES = [
    {
        id: 'finding-events',
        title: 'Finding competition events',
        subtitle: 'Discover and explore TSA competitions.',
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
        subtitle: 'Learn how annual event themes work.',
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
        subtitle: 'Locate official rules and documents.',
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
        subtitle: 'Explore TSA guides, links, and materials.',
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
        subtitle: 'Find your state TSA contacts.',
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
        subtitle: 'Track TSA dates and set reminders.',
        intro: 'The Calendar shows official TSA dates alongside your own events and reminders, so everything you need to plan around is in one place.',
        sections: [
            {
                heading: 'Choose a view',
                list: [
                    'Year shows all twelve months at a glance. Tap a month to open it.',
                    'Month shows a full month. Tap a day to see what is on it.',
                    'Week lays out each day by the hour. Tap a time slot to add an event.',
                    'Schedule lists what is coming up next.',
                ],
                paragraphs: [
                    'Switch between four views at the top. Use the arrows to move between periods, and tap Today to jump back to the current date.',
                ],
            },
            {
                heading: 'Official TSA dates',
                paragraphs: [
                    'Conference dates, important dates, and other events from the National TSA calendar appear automatically. They are read-only. Tap one to see its details and a link to the official source when there is one.',
                    'TSA can change dates after they are published, so always confirm important dates on the official TSA website or with your advisor.',
                ],
            },
            {
                heading: 'Add your own events and reminders',
                list: [
                    'Tap any day, or the plus button, to create an event or a reminder.',
                    'Enter a title and a date. Add a time, location, notes, or a color if you like.',
                    'Tap an item to edit or delete it. Reminders can also be marked complete.',
                ],
            },
            {
                heading: 'Get notified',
                paragraphs: [
                    'When you create or edit your own event, choose when you want to be reminded. For an official TSA date, open it and tap Remind me to choose 30 minutes, 1 hour, 1 day, or 1 week before.',
                    'The first time you set a reminder, TSA Hub asks for permission to send notifications. In the iPhone app, reminders arrive even when TSA Hub is closed. On the website, they appear only while TSA Hub is open in your browser. If you turned notifications off, you can turn them back on in your device or browser settings.',
                ],
            },
            {
                heading: 'Use your device calendar',
                paragraphs: [
                    'Open any event and tap Add to device calendar. On the website this downloads a calendar file. In the iPhone app it opens the share sheet so you can add it to Calendar or save it.',
                ],
            },
            {
                heading: 'Where your events are saved',
                paragraphs: [
                    'Events and reminders you create are saved only on the device you are using. They will not appear on another device, and they are removed if you delete the app or clear your browser data.',
                ],
            },
        ],
        action: { label: 'Open Calendar', to: '/calendar' },
        keywords: ['calendar', 'dates', 'schedule', 'year view', 'month view', 'week view', 'reminders'],
    },
    {
        id: 'personal-calendar-entries',
        title: 'Creating personal calendar entries',
        subtitle: 'Add your own events and reminders.',
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
        id: 'contacting-support',
        title: 'Contacting TSA Hub Support',
        subtitle: 'Reach the TSA Hub support team.',
        intro: 'If something about TSA Hub itself isn’t working right, whether that’s a bug, information that looks wrong, or just feedback you want to share, Contact Support is the direct way to reach the people who maintain it.',
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
                    'If you’re not sure whether your question really belongs here, a good rule of thumb is this. If it’s about how TSA Hub works, or something feels broken, Contact Support is the right place. If it’s about an actual TSA rule or event detail, the Resources search will usually get you an answer faster.',
                ],
            },
        ],
        keywords: ['contact support', 'support', 'help article'],
    },
    {
        id: 'reporting-incorrect-info',
        title: 'Reporting incorrect information',
        subtitle: 'Tell us what needs fixing.',
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
        id: 'finding-event-rules',
        title: 'Finding event rules',
        subtitle: 'Find official rules and requirements.',
        intro: 'Rules, requirements, and eligibility details live in a few places in TSA Hub. This guide shows where to look.',
        sections: [
            {
                heading: 'Start with your event',
                list: [
                    'Open Events and tap an event to see its team size, how many entries are allowed, and its requirements.',
                    'In Resources, open Event Guide and choose an event for its full page, including the current theme and problem when one has been published and its team and submission requirements.',
                ],
            },
            {
                heading: 'Rules that apply to every event',
                paragraphs: [
                    'In Resources, the Competition Rules and Preparation section covers eligibility, entry requirements, work and content rules, schedule conflicts and emergencies, how judging works, and violations and advancement.',
                ],
            },
            {
                heading: 'Requirements and updates',
                paragraphs: [
                    'The Competition Requirements and Updates section in Resources includes Eligibility Charts, Preconference Submissions, National Competition Requirements, and State Advisor Approval Events.',
                ],
            },
            {
                heading: 'Search for a rule',
                paragraphs: [
                    'Use the Search bar at the top of Resources to look up a rule, event, or topic by name.',
                ],
            },
            {
                heading: 'Confirm with official sources',
                paragraphs: [
                    'TSA Hub organizes information published by TSA, and rules can change. Before you rely on a rule or deadline, check the official TSA document linked on the page or ask your advisor.',
                ],
            },
        ],
        action: { label: 'Explore Events', to: '/events' },
        keywords: ['rules', 'event rules', 'competition rules', 'requirements', 'eligibility', 'find rules'],
    },
    {
        id: 'browsing-official-resources',
        title: 'Browsing official resources',
        subtitle: 'Find official TSA information in one place.',
        intro: 'Resources gathers TSA information, competition materials, programs, and contacts so you do not have to search several websites.',
        sections: [
            {
                heading: 'What you will find',
                list: [
                    'About TSA, including what TSA is, its history, competitions, and divisions',
                    'Event Guide, with a full page for each competitive event',
                    'National Conference information',
                    'Competition Rules and Preparation, and Competition Requirements and Updates',
                    'Programs and Initiatives, such as Forward to Fifty, Awards and Scholarships, the Leadership Program, the National Service Project, and the TSA Achievement Program',
                    'Your State, where you can choose your state to see its TSA contacts and links',
                    'National TSA website and social media links, the official TSA Store, and leadership contacts',
                ],
            },
            {
                heading: 'Find what you need',
                paragraphs: [
                    'Scroll through the sections on the Resources page, or use the Search bar at the top to look something up by name. Tap any row to open its page.',
                ],
            },
            {
                heading: 'Official sources',
                paragraphs: [
                    'Many pages include links to the official TSA website, which open in your browser. Resources summarizes what TSA publishes, so check the official source for the latest version of any document or date.',
                ],
            },
        ],
        action: { label: 'Open Resources', to: '/resources' },
        keywords: ['resources', 'official resources', 'guides', 'documents', 'official links', 'tsa information'],
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
        id: 'contact-support',
        icon: 'headset',
        title: 'Contact Support',
        subtitle: 'Get help from the TSA Hub team.',
        modal: 'support',
        keywords: ['support', 'contact support', 'contact us', 'help'],
    },
    {
        id: 'report',
        icon: 'flag',
        title: 'Report Incorrect Information',
        subtitle: 'Help keep TSA Hub accurate.',
        modal: 'report',
        keywords: ['wrong', 'incorrect', 'bad info', 'report error', 'this is wrong', 'wrong information'],
    },
];

// Popular topics open a help article.
export const POPULAR_TOPICS = [
    {
        id: 'calendar',
        icon: 'cal',
        title: 'Calendar and Reminders',
        subtitle: 'Track TSA dates and set reminders.',
        article: 'using-calendar',
        keywords: ['calendar', 'reminders', 'dates', 'schedule'],
    },
    {
        id: 'event-rules',
        icon: 'shield',
        title: 'Finding Event Rules',
        subtitle: 'Find official rules and requirements.',
        article: 'finding-event-rules',
        keywords: ['rules', 'competition rules', 'requirements', 'eligibility'],
    },
    {
        id: 'official-resources',
        icon: 'file-text',
        title: 'Browsing Official Resources',
        subtitle: 'Find official TSA information in one place.',
        article: 'browsing-official-resources',
        keywords: ['official resources', 'resources', 'guides', 'documents'],
    },
];

// Articles listed under Help Articles on the Help Center page. Articles that
// already appear as a Popular Topic are left out so nothing shows twice. Every
// article stays reachable at /help/article/:id and through search.
export function listedArticles() {
    const featured = new Set(POPULAR_TOPICS.map((t) => t.article));
    return HELP_ARTICLES.filter((a) => !featured.has(a.id));
}

// ---------------------------------------------------------------------------
// Search index: title + subtitle + keywords/aliases across every section,
// plus every Help Article. Simple normalized substring match.
// ---------------------------------------------------------------------------

function normalize(s) {
    return (s || '').toLowerCase().trim();
}

function buildIndex() {
    const rows = [];
    for (const item of [...QUICK_HELP, ...POPULAR_TOPICS]) {
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
    // Quick Help opens the form directly, so its article is not a second result.
    const quickHelpArticles = new Set(['contacting-support', 'reporting-incorrect-info']);
    for (const article of HELP_ARTICLES) {
        // Skip ones already represented above as a section row (matched by
        // article id OR title) to avoid duplicate-looking search results
        // for the same destination.
        if (rows.some((r) => r.article === article.id)) continue;
        if (quickHelpArticles.has(article.id)) continue;
        if (coveredTitles.has(normalize(article.title))) continue;
        rows.push({
            id: `article-${article.id}`,
            title: article.title,
            subtitle: article.subtitle,
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
