// ============================================================================
// National Conference — Resources section config.
//   items[] drives the rows rendered on the Resources page:
//     type 'link'     -> a normal clickable row -> route
//     type 'dropdown' -> an accordion; children[] revealed on expand
// The Conference Guides page reads GUIDES below.
// ============================================================================

export const NATIONAL_CONFERENCE = {
    id: 'national-conference',
    title: 'National Conference',
    items: [
        {
            id: 'conference-guides',
            title: 'Conference Guides',
            icon: 'book',
            type: 'dropdown',
            children: [
                { id: 'conference-2026', title: '2026 National Conference', route: '/resources/national-conference/2026' },
                { id: 'conference-2027', title: '2027 National Conference', status: 'Upcoming', route: '/resources/national-conference/2027' },
            ],
        },
        {
            id: 'conference-essentials',
            title: 'Conference Essentials',
            icon: 'info',
            type: 'dropdown',
            children: [
                { id: 'registration-badges', title: 'Registration and Badges', route: '/resources/national-conference/registration-badges' },
                { id: 'dress-code', title: 'Dress Code', route: '/resources/national-conference/dress-code' },
                { id: 'code-of-conduct', title: 'Code of Conduct', route: '/resources/national-conference/code-of-conduct' },
                { id: 'packing-checklist', title: 'Packing Checklist', route: '/resources/national-conference/packing-checklist' },
                { id: 'competition-requirements', title: 'Competition Requirements', route: '/resources/national-conference/competition-requirements' },
                { id: 'travel-meals-budget', title: 'Travel, Meals and Budget', route: '/resources/national-conference/travel-meals-budget' },
                { id: 'safety-emergencies', title: 'Safety and Emergencies', route: '/resources/national-conference/safety-emergencies' },
                { id: 'results-awards', title: 'Results and Awards', route: '/resources/national-conference/results-awards' },
            ],
        },
    ],
};

// Conference Guides page — one row per conference year.
// `url` opens the official resource; leave '' to fill later.
export const CONFERENCE_GUIDES = [
    {
        id: 'nc-2027',
        title: '2027 National TSA Conference',
        detail: 'Status: Upcoming',
        url: '',
    },
    {
        id: 'nc-2026',
        title: '2026 National TSA Conference',
        detail: 'National Harbor, Maryland \u00B7 June 22\u201326, 2026',
        route: '/resources/national-conference/guides/2026',
    },
];

// Lookup for the (currently placeholder) Conference Essentials topic pages.
export function getConferenceTopic(topicId) {
    const dd = NATIONAL_CONFERENCE.items.find((i) => i.type === 'dropdown');
    return (dd?.children || []).find((c) => c.id === topicId) || null;
}