// ============================================================================
// TSA Hub app-navigation knowledge — the "map" that lets Coach act as TSA
// Hub's own search/navigation layer instead of a generic chatbot. Every
// entry here is a REAL screen this app actually has (cross-checked against
// src/App.jsx's route table) — this file is never the place to invent a
// destination that doesn't exist.
//
// This is a knowledge structure, not a UI component: navigation.js reads it
// to decide where a message should go, and engine.js turns a match into a
// structured NAVIGATE action (see resolvers/navigation.js for the action
// shape). Help Center topics are pulled in from the real HELP_ARTICLES data
// instead of being retyped here, so there is exactly one place that
// describes what a Help article covers.
// ============================================================================

import { HELP_ARTICLES } from '../../../data/helpContent.js';

export const APP_DESTINATIONS = [
    {
        id: 'events', title: 'Events', route: '/events',
        aliases: ['events', 'all events', 'event list', 'competitive events', 'browse events'],
        keywords: ['browse', 'catalog', 'list', 'divisions', 'categories'],
        description: 'Browse every TSA competitive event, filtered by category, division, or team size.',
    },
    {
        id: 'eventSearch', title: 'Event Search', route: '/events/search',
        aliases: ['search events', 'find an event', 'event search', 'look up an event'],
        keywords: ['search', 'find', 'lookup'],
        description: 'Search events directly by name.',
    },
    {
        id: 'recommend', title: 'Get Recommendations', route: '/recommend',
        aliases: ['get recommendations', 'recommend an event', 'help me choose an event', 'event quiz', 'smart recommender'],
        keywords: ['recommend', 'choose', 'quiz', 'match', 'interests'],
        description: 'A short quiz that ranks every event against your interests, skills, and preferences.',
    },
    {
        id: 'eventGuideHub', title: 'Event Guide', route: '/resources/events/themes',
        aliases: ['event guide', 'themes and problems', 'event details', 'event themes', 'all event themes', 'themes', 'guide', 'guides', 'documents', 'pdfs', 'official pdf', 'official documents'],
        keywords: ['theme', 'problem', 'requirements', 'submission', 'guide', 'per event'],
        description: 'Every event’s current theme, requirements, submissions, resources, and other details, by division.',
    },
    {
        id: 'calendar', title: 'Calendar', route: '/calendar',
        aliases: ['calendar', 'my calendar', 'schedule', 'my schedule', 'dates', 'my dates'],
        keywords: ['dates', 'reminders', 'deadlines', 'events', 'year', 'month', 'week', 'today', 'personal events'],
        description: 'Official TSA dates alongside your own personal events and reminders.',
    },
    {
        id: 'resources', title: 'Resources', route: '/resources',
        aliases: ['resources', 'tsa resources', 'resource guide', 'official resources'],
        keywords: ['guide', 'documents', 'links', 'state', 'national', 'programs'],
        description: 'TSA Hub’s guide to official TSA information — rules, programs, your state TSA, and national contacts.',
    },
    {
        id: 'resourceSearch', title: 'Resource Search', route: '/resources/search',
        aliases: ['search resources', 'find a resource'],
        keywords: ['search', 'find'],
        description: 'Search everything in Resources.',
    },
    {
        id: 'studentLeadership', title: 'Student Leadership', route: '/resources/student-leadership',
        aliases: ['student leadership', 'student officers', 'state officers', 'national officers', 'officer team'],
        keywords: ['officers', 'leadership', 'president', 'election'],
        description: 'State and national student officer teams.',
    },
    {
        id: 'leadershipSupport', title: 'TSA Leadership & Support', route: '/resources/leadership-support',
        aliases: ['tsa leadership and support', 'state advisor', 'my state advisor', 'national leadership', 'national advisor', 'board of directors', 'national office contact', 'state contact', 'contacts'],
        keywords: ['advisor', 'contact', 'national office', 'staff'],
        description: 'Advisors, national TSA leadership, and official contacts.',
    },
    {
        id: 'nationalSocial', title: 'National TSA Social Links', route: '/resources',
        aliases: ['instagram', 'tsa instagram', 'national tsa instagram', 'facebook', 'tsa facebook', 'national tsa facebook', 'youtube', 'tsa youtube', 'national tsa youtube', 'official tsa website'],
        keywords: ['instagram', 'facebook', 'youtube', 'social'],
        description: 'National TSA’s official Instagram, Facebook, YouTube, and website links, under National TSA in Resources.',
    },
    {
        id: 'coach', title: 'TSA Assistant', route: '/coach',
        aliases: ['coach', 'tsa assistant', 'chatbot', 'ask coach', 'assistant'],
        keywords: ['assistant', 'chat', 'ask'],
        description: 'TSA Hub’s in-app assistant — you’re using it right now.',
    },
    {
        id: 'settings', title: 'Settings', route: '/settings',
        aliases: ['settings', 'preferences', 'appearance', 'theme toggle', 'my state setting', 'dark mode', 'light mode'],
        keywords: ['configure', 'change', 'state', 'appearance', 'theme'],
        description: 'Appearance, your state, and other TSA Hub preferences.',
    },
    {
        id: 'privacy', title: 'Privacy Policy', route: '/privacy',
        aliases: ['privacy policy', 'privacy', 'data policy', 'what data do you save', 'what information do you save'],
        keywords: ['data', 'local storage', 'information saved', 'tracking'],
        description: 'A plain explanation of what TSA Hub stores and what it sends.',
    },
    {
        id: 'terms', title: 'Terms and Policies', route: '/terms',
        aliases: ['terms', 'terms of service', 'terms and policies', 'terms and conditions'],
        keywords: ['policies', 'legal', 'independent', 'student-built'],
        description: 'TSA Hub’s terms and its independent, student-built status.',
    },
    {
        id: 'help', title: 'Help Center', route: '/help',
        aliases: ['help', 'help center', 'support center', 'faq'],
        keywords: ['support', 'questions', 'articles', 'contact'],
        description: 'Search Help Center topics, contact support, or report incorrect information.',
    },
    {
        id: 'helpArticles', title: 'Help Articles', route: '/help/articles',
        aliases: ['help articles', 'all help articles', 'frequently asked questions'],
        keywords: ['articles', 'faq', 'guides'],
        description: 'Every Help Center article in one list.',
    },
];

// One destination per real Help article, generated from the canonical
// HELP_ARTICLES data (src/data/helpContent.js) rather than retyped here.
const HELP_ARTICLE_DESTINATIONS = HELP_ARTICLES.map((a) => ({
    id: `help:${a.id}`,
    title: a.title,
    route: `/help/article/${a.id}`,
    aliases: [a.title.toLowerCase()],
    keywords: a.keywords || [],
    description: a.intro,
}));

export const ALL_DESTINATIONS = [...APP_DESTINATIONS, ...HELP_ARTICLE_DESTINATIONS];

function normalizeWords(s) {
    return String(s || '').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
}

// Simple word-overlap scorer, deliberately smaller/simpler than the
// chatbot's full intent router — this only needs to pick "which real
// screen is this message about", not carry conversational nuance. A single
// shared keyword ("contact", "theme", "recommend") is NOT enough evidence
// on its own — that's exactly how "what do you recommend" or "national tsa
// contact" would get hijacked away from intents that already answer them
// correctly. Only a full alias PHRASE match counts by default; keywords are
// a same-weight tie-breaker among destinations that already cleared that bar.
function scoreDestination(dest, queryWords) {
    let aliasScore = 0;
    for (const alias of dest.aliases) {
        const aliasWords = normalizeWords(alias);
        if (!aliasWords.length) continue;
        if (aliasWords.every((w) => queryWords.includes(w))) aliasScore = Math.max(aliasScore, aliasWords.length * 3);
    }
    let keywordScore = 0;
    for (const kw of dest.keywords) {
        if (queryWords.includes(kw.toLowerCase())) keywordScore += 1;
    }
    return { aliasScore, total: aliasScore + keywordScore };
}

// Finds the single best-matching real destination for a phrase, or null if
// nothing scores meaningfully — callers must never fabricate a route when
// this returns null. `requireAliasMatch` (the default) means a destination
// only wins by actually matching one of its named aliases as a phrase, not
// merely sharing one generic keyword with the query — see scoreDestination.
export function findDestination(text, { requireAliasMatch = true } = {}) {
    const queryWords = normalizeWords(text);
    if (!queryWords.length) return null;
    let best = null;
    let bestScore = 0;
    for (const dest of ALL_DESTINATIONS) {
        const { aliasScore, total } = scoreDestination(dest, queryWords);
        if (requireAliasMatch && aliasScore === 0) continue;
        if (total > bestScore) { bestScore = total; best = dest; }
    }
    return bestScore > 0 ? best : null;
}

export function getDestination(id) {
    return ALL_DESTINATIONS.find((d) => d.id === id) || null;
}
