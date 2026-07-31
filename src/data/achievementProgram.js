// ============================================================================
// TSA Achievement Program, Pathways to Excellence — content for its page.
// ============================================================================

export const ACHIEVEMENT_PROGRAM = {
    title: 'TSA Achievement Program, Pathways to Excellence',
    description: [
        'The TSA Achievement Program, Pathways to Excellence encourages student members to take part in three areas: service leadership, STEM immersion, and personal and professional development. By completing activities in these areas, members can earn bronze, silver, and gold awards at the local, state, and national levels.',
        'To be eligible for each award, a member completes one activity in each of the three areas, for a total of three activities per level.',
        'Members submit documentation of their activities for each level through the TSA Student Member Site, and chapter advisors verify that each activity is completed.',
    ],

    sections: [
        {
            id: 'recognition',
            heading: 'How awards are recognized',
            list: [
                'Bronze awards are usually presented at the chapter or district level, at award assemblies, regional conferences, or TSA banquets.',
                'Silver awards are recognized at the state level, usually at state conferences.',
                'Gold awards are recognized at the national TSA conference.',
            ],
        },
        {
            id: 'pins',
            heading: 'Award pins',
            intro: 'Bronze and silver award pins are available through the TSA Store:',
            list: [
                'Bronze: chapter advisors use a code (under the Total TSA tab in the chapter advisor site) to purchase pins for eligible members. Any pin fees are determined locally.',
                'Silver: state advisors use a code (under the Total TSA tab in the state advisor site) to purchase pins for eligible members. Any pin fees are determined at the state level.',
            ],
            note: 'Gold level pins have no fees and are distributed at the annual national TSA conference.',
            links: [
                { id: 'tsa-store', title: 'TSA Store', url: 'https://tsastore.mybrightsites.com/' },
            ],
        },
        {
            id: 'notes',
            heading: 'Good to know',
            list: [
                'Achievement Program activities and verifications may be audited by the state TSA advisor and/or national TSA.',
                'A member who earns a gold award may take part again in later years, starting again at the bronze level. Activities in any later year may not repeat ones already used to earn a bronze, silver, or gold award.',
            ],
        },
    ],

    resourcesTitle: 'Learn more',
    resources: [
        { id: 'chapter-advisor-site', title: 'TSA Chapter Advisor Site', url: 'https://tsamembership.registermychapter.com/' },
        { id: 'student-member-site', title: 'TSA Student Member Site', url: 'https://tsamembership.registermychapter.com/members' },
    ],
};