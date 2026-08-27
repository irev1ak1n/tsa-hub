// TSA Hub — Help Center content. Local, structured data (no CMS, no
// backend) — same pattern as aboutTsa.js / competitionRules.js. Every
// article describes only real, current TSA Hub capabilities.

export const HELP_ARTICLES = [
    {
        id: 'using-tsa-assistant',
        title: 'Using TSA Assistant',
        intro: 'TSA Assistant (Coach) answers questions about events, rules, deadlines, and your state TSA using TSA Hub’s own data.',
        sections: [
            {
                heading: 'What it can help with',
                list: [
                    'Explaining an event, its team size, cost, and current theme',
                    'Finding official rules and requirements',
                    'Deadlines and conference dates',
                    'Comparing two events or getting a recommendation',
                    'Your state TSA contacts and resources',
                ],
            },
            {
                heading: 'Good to know',
                paragraphs: [
                    'Coach is not a general AI chatbot — it only answers from TSA Hub’s structured data, so it will tell you when it doesn’t have an answer instead of guessing.',
                ],
            },
        ],
        action: { label: 'Open TSA Assistant', to: '/coach' },
        keywords: ['coach', 'assistant', 'chatbot', 'ai assistant', 'tsa bot', 'chat'],
    },
    {
        id: 'finding-events',
        title: 'Finding competition events',
        intro: 'Browse every TSA competitive event, filter by category or division, or get a personalized recommendation.',
        sections: [
            {
                heading: 'Ways to find an event',
                list: [
                    'Browse all events and filter by category, division, or team size',
                    'Search events by name',
                    'Use Get Recommendations to find events that match your interests',
                ],
            },
        ],
        action: { label: 'Open Events', to: '/events' },
        keywords: ['events', 'competitions', 'browse events', 'find event'],
    },
    {
        id: 'themes-and-problems',
        title: 'Understanding themes & problems',
        intro: 'Most build and design events publish an annual theme or problem statement that your project must address.',
        sections: [
            {
                heading: 'Where to find it',
                paragraphs: [
                    'Open an event and look for its current theme or challenge. Not every event has an annual theme — some (like speech or leadership events) are judged on different criteria instead.',
                ],
            },
        ],
        action: { label: 'Open Events', to: '/events' },
        keywords: ['theme', 'problem', 'challenge', 'prompt', 'design brief'],
    },
    {
        id: 'official-documents',
        title: 'Finding official event documents',
        intro: 'Official TSA guides, rule PDFs, and reference documents are organized in Resources.',
        sections: [
            {
                heading: 'What you’ll find',
                list: [
                    'Competition rules & preparation guides by category',
                    'Competition requirements & updates',
                    'Links to official TSA/National TSA documents',
                ],
            },
        ],
        action: { label: 'Open Resources', to: '/resources' },
        keywords: ['documents', 'official resources', 'pdf', 'guide', 'rules document'],
    },
    {
        id: 'using-resources',
        title: 'Using Resources',
        intro: 'Resources is TSA Hub’s guide to official TSA information — rules, programs, your state TSA, and national contacts.',
        sections: [
            {
                heading: 'What’s inside',
                list: [
                    'About TSA and national programs',
                    'Competition rules & requirements',
                    'Your state TSA contacts and socials',
                    'National TSA leadership and contacts',
                ],
            },
        ],
        action: { label: 'Open Resources', to: '/resources' },
        keywords: ['resources', 'official resources', 'guides'],
    },
    {
        id: 'state-advisor',
        title: 'Finding your state advisor',
        intro: 'Set your state in Resources to see your state TSA’s advisor, officer team, website, and social links.',
        sections: [
            {
                heading: 'How to set it up',
                paragraphs: [
                    'Open Resources, scroll to the “Your State” section, and choose your state. Once set, TSA Hub shows your state’s available contacts and links.',
                ],
            },
        ],
        action: { label: 'Open Resources', to: '/resources' },
        keywords: ['advisor', 'state advisor', 'contact state', 'state tsa', 'state contact'],
    },
    {
        id: 'using-calendar',
        title: 'Using the Calendar',
        intro: 'The Calendar shows official TSA dates alongside anything personal you add, in four views.',
        sections: [
            {
                heading: 'Views',
                list: ['Year', 'Month', 'Week', 'Schedule'],
            },
            {
                heading: 'Good to know',
                paragraphs: [
                    'Official dates come from TSA Hub’s calendar data. Personal events and reminders you add are stored only on your own device — TSA Hub does not currently send reminders or notifications.',
                ],
            },
        ],
        action: { label: 'Open Calendar', to: '/calendar' },
        keywords: ['calendar', 'dates', 'schedule', 'year view', 'month view', 'week view'],
    },
    {
        id: 'personal-calendar-entries',
        title: 'Creating personal calendar entries',
        intro: 'Add your own events or reminders alongside the official TSA calendar.',
        sections: [
            {
                heading: 'How it works',
                list: [
                    'Open a date and add a personal event or reminder with a title, date/time, and optional notes',
                    'Edit or delete a personal entry any time',
                    'Personal entries are saved locally on this device and are never sent anywhere',
                ],
            },
        ],
        action: { label: 'Open Calendar', to: '/calendar' },
        keywords: ['reminder', 'personal event', 'add reminder', 'local storage', 'saved locally'],
    },
    {
        id: 'install',
        title: 'Installing TSA Hub',
        intro: 'TSA Hub runs entirely in your browser — there’s no app store download. You can add a shortcut to your home screen for quick, app-like access.',
        sections: [
            {
                heading: 'iPhone / Safari',
                list: [
                    'Open TSA Hub in Safari',
                    'Tap the Share icon',
                    'Tap “Add to Home Screen”',
                ],
            },
            {
                heading: 'Android / Chrome',
                list: [
                    'Open TSA Hub in Chrome',
                    'Tap the menu (⋮)',
                    'Tap “Add to Home screen” (or “Install app” if Chrome offers it)',
                ],
            },
            {
                heading: 'Desktop',
                list: [
                    'Most desktop browsers let you pin the tab or add a bookmark for quick access',
                ],
            },
        ],
        keywords: ['install', 'app', 'home screen', 'phone', 'pwa', 'add to home screen'],
    },
    {
        id: 'contacting-support',
        title: 'Contacting TSA Hub Support',
        intro: 'Use Contact Support for anything about TSA Hub itself — bugs, wrong data, Coach problems, or feedback.',
        sections: [
            {
                heading: 'How it works',
                paragraphs: [
                    'Pick a category and write your message. You’ll see exactly what will be sent before anything goes out — nothing is sent until you confirm.',
                ],
            },
        ],
        keywords: ['contact support', 'support', 'help article'],
    },
    {
        id: 'reporting-incorrect-info',
        title: 'Reporting incorrect information',
        intro: 'Found something wrong — an event detail, a date, a contact, or a broken link? Let us know so we can fix it.',
        sections: [
            {
                heading: 'How it works',
                paragraphs: [
                    'Choose what’s wrong and where, describe the issue, and preview your report before sending. This keeps TSA Hub’s information accurate for everyone.',
                ],
            },
        ],
        keywords: ['wrong', 'incorrect', 'bad info', 'report error', 'this is wrong', 'wrong information'],
    },
    {
        id: 'privacy',
        title: 'Privacy & transparency',
        intro: 'A plain explanation of how TSA Hub handles your information.',
        sections: [
            {
                heading: 'What stays on your device',
                paragraphs: [
                    'Personal Calendar events and reminders are stored locally on your device. TSA Hub does not upload them anywhere.',
                ],
            },
            {
                heading: 'What you send us',
                paragraphs: [
                    'Support messages and incorrect-information reports are only sent after you review and confirm them — nothing is submitted silently. Conversation context from TSA Assistant is not sent unless it’s part of a message you explicitly choose to send.',
                ],
            },
            {
                heading: 'Where official information comes from',
                paragraphs: [
                    'Event, rule, and conference information comes from TSA and National TSA resources. Where something is TSA Hub’s own guidance rather than an official rule, we say so.',
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
    {
        id: 'status',
        icon: 'activity',
        title: 'System status',
        subtitle: 'Check the current TSA Hub service status',
        to: '/help/status',
        keywords: ['status', 'system status', 'service status', 'is tsa hub down'],
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
