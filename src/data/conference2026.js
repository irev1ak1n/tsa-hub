// ============================================================================
// 2026 National TSA Conference — data.
// Organized into the 8 landing-page topics. Each topic's `sections` are rendered
// by the shared ConferenceTopicPage component. 2026-specific only (does not
// duplicate the general Conference Essentials pages).
//
// Section fields the renderer understands:
//   heading      blue subheading
//   paragraphs   [str] body copy
//   list         [str] bullet list
//   lines        [str] plain labelled lines (schedules/hours)
//   contacts     [{ label, value, tel? }] contact rows (tel -> clickable)
//   collapsible  true -> `list` renders as a show/hide group
//   items        [{ label, meta?:[str], text?, list? }] labelled sub-blocks
//   note         muted footnote
//   attribution  { name, role }
// ============================================================================

export const CONFERENCE_2026_HEADER = {
    eyebrow: 'National Conference Guide',
    title: '2026 National Conference',
    dateLabel: 'June 22\u201326, 2026',
    venue: 'Gaylord National Resort and Convention Center',
    location: 'National Harbor, Maryland',
    theme: 'Unity Through Community',
};

// Landing-page topic rows.
export const CONFERENCE_2026_TOPICS = [
    { id: 'overview', icon: 'info', title: 'Conference Overview', desc: 'Welcome, details, theme, and purpose of the 2026 conference.' },
    { id: 'services', icon: 'grid', title: 'Conference Services', desc: 'Information Desk, TSA Store, shirts, ribbons, lost and found, and the app.' },
    { id: 'advisors', icon: 'users', title: 'Advisor Information', desc: 'Required meetings, schedules, updates, responsibilities, and daily gifts.' },
    { id: 'activities', icon: 'spark', title: 'Conference Activities', desc: 'Meet and Greet, Pin Exchange, dates, times, and locations.' },
    { id: 'team', icon: 'user', title: 'Conference Team', desc: 'Managers for operations, volunteers, judging, logistics, and sessions.' },
    { id: 'safety', icon: 'shield', title: 'Safety and Emergency', desc: 'Venue safety, emergency numbers, medical services, and health guidance.' },
    { id: 'transportation', icon: 'globe', title: 'Transportation', desc: 'TSA shuttles, hotel stops, hours, circulator, and water taxi.' },
    { id: 'general-sessions', icon: 'cal', title: 'General Sessions', desc: 'Opening, Recognition, Business Meeting, Awards, times, and rules.' },
];

export const CONFERENCE_2026 = {
    overview: {
        title: 'Conference Overview',
        sections: [
            {
                heading: 'Conference Details',
                lines: [
                    'June 22\u201326, 2026',
                    'Gaylord National Resort and Convention Center',
                    'National Harbor, Maryland',
                ],
            },
            { heading: 'Theme', paragraphs: ['Unity Through Community'] },
            {
                heading: 'Welcome',
                paragraphs: [
                    'The 2026 National TSA Conference is the 48th National TSA Conference. It brings TSA members together for competitive events, leadership development, networking, recognition, and opportunities to explore the Washington, D.C. area.',
                    'The theme \u201CUnity Through Community\u201D represents the relationships that connect TSA members across chapters and state delegations. Attendees are encouraged to meet new people, participate in conference activities, explore STEM opportunities, and give their best effort in competition.',
                ],
                attribution: { name: 'Sen Yakandawala', role: '2025\u20132026 National TSA President' },
            },
            {
                heading: 'National Officer Team',
                items: [
                    { label: 'President', text: 'Sen Yakandawala' },
                    { label: 'Vice President', text: 'Lizzie Grounds' },
                    { label: 'Secretary', text: 'Veronica Gao' },
                    { label: 'Treasurer', text: 'Avni Patel' },
                    { label: 'Reporter', text: 'Rebecca Mogga' },
                    { label: 'Sergeant-at-Arms', text: 'Daniel Blackburn' },
                ],
            },
        ],
    },

    services: {
        title: 'Conference Services',
        sections: [
            {
                heading: 'Information Desk',
                lines: [
                    'Location: Potomac Ballroom Registration Desk',
                    'Monday, June 22: 5:00 PM\u20138:00 PM',
                    'Tuesday, June 23: 8:00 AM\u20135:00 PM',
                    'Wednesday, June 24: 8:00 AM\u20135:00 PM',
                    'Thursday, June 25: 8:00 AM\u20135:00 PM',
                ],
            },
            {
                heading: 'TSA Store',
                lines: [
                    'Location: Maryland Ballroom 1 and 2',
                    'Tuesday, June 23: 8:00 AM\u20135:00 PM',
                    'Wednesday, June 24: 8:00 AM\u20135:00 PM',
                    'Thursday, June 25: 8:00 AM\u20132:00 PM',
                ],
                paragraphs: ['The store is cashless. Apple Pay and credit or debit cards are accepted.'],
            },
            {
                heading: 'Conference T-Shirts',
                paragraphs: ['Attendees receiving the complimentary 2026 conference shirt must bring the T-shirt ticket included in their conference packet.'],
                lines: [
                    'Pickup: Prince George\u2019s Exhibition Hall Registration Desk, Lower Atrium',
                    'Tuesday, June 23: 11:00 AM\u20135:00 PM',
                    'Wednesday, June 24: 11:00 AM\u20135:00 PM',
                ],
            },
            {
                heading: 'Conference Ribbons',
                paragraphs: ['Conference ribbons are based on requests submitted with registrations before May 14. Additional ribbons will not be available onsite or through the Information Desk.'],
            },
            {
                heading: 'Lost and Found',
                paragraphs: ['Lost items may be given to the hotel front desk or another hotel staff member. National TSA is not responsible for lost items.'],
                contacts: [
                    { label: 'Hotel extension', value: '54520' },
                    { label: 'Outside phone', value: '301-965-4520', tel: true },
                ],
            },
            {
                heading: 'Guest Luggage Storage',
                lines: ['Friday, June 26: 6:30 AM\u201312:00 PM', 'Maryland Ballroom C'],
                paragraphs: ['All luggage must be removed by noon. National TSA is not responsible for stored luggage.'],
            },
            {
                heading: 'Business Center',
                paragraphs: ['The FedEx Office Business Center is located on the second floor of the Gaylord National Resort.'],
                lines: ['Hours: 6:00 AM\u20139:00 PM daily'],
                contacts: [{ label: 'Phone', value: '301-567-0457', tel: true }],
            },
            {
                heading: 'Show Your Badge',
                paragraphs: ['Participating National Harbor businesses may provide discounts or special offers when attendees show their official TSA Conference badge.'],
            },
            {
                heading: 'Official Conference App',
                paragraphs: ['Registered attendees receive access through an email invitation from Guidebook. The official app provides:'],
                list: [
                    'competitive event schedules',
                    'semifinalist and finalist postings',
                    'conference highlights',
                    'the full program of activities',
                    'important push notifications',
                    'general session livestreams when available',
                    'voting access for authorized voting delegates',
                ],
                note: 'Access is sent directly to registered attendees.',
            },
        ],
    },

    advisors: {
        title: 'Advisor Information',
        intro: ['Chapter advisors and parents serving as chapter advisors are required to attend daily Advisor Update Meetings to receive important conference information.'],
        sections: [
            { heading: 'Location', paragraphs: ['Potomac Ballroom A'] },
            {
                heading: 'Schedule and Gifts',
                items: [
                    { label: 'Tuesday, June 23', meta: ['11:30 AM\u201312:30 PM'], text: 'Gift: TSA Beanie' },
                    { label: 'Wednesday, June 24', meta: ['11:30 AM\u201312:30 PM'], text: 'Gift: TSA Canvas Lunch Bag' },
                    { label: 'Thursday, June 25', meta: ['11:30 AM\u201312:30 PM'], text: 'Gift: National TSA Conference Mug' },
                ],
                note: 'Advisor gifts are not distributed or sold at the Information Desk. Advisors may receive each gift only by attending the meeting on the day it is distributed.',
            },
            {
                heading: 'Advisor Responsibilities',
                paragraphs: ['Advisors should:'],
                list: [
                    'meet periodically with their students',
                    'review conference schedules and activities',
                    'receive progress reports from competitors',
                    'remind students about important times',
                    'provide students with contact information',
                    'remain available throughout the conference',
                    'ensure that students follow conference rules',
                    'take responsibility for the conduct of their chapter delegation',
                ],
            },
            {
                heading: 'Appreciation',
                paragraphs: ['National TSA recognizes retiring advisors for their years of leadership, service, and support of TSA members.'],
            },
        ],
    },

    activities: {
        title: 'Conference Activities',
        sections: [
            {
                heading: 'TSA Meet and Greet',
                lines: ['Wednesday, June 24: 1:00 PM\u20135:00 PM', 'Potomac Ballroom Pre-function'],
                paragraphs: ['The TSA Meet and Greet connects attendees with National TSA officers, officer candidates, education organizations, professional associations, STEM companies, and other TSA partners. Attendees can explore programs and opportunities that support STEM education, leadership, and future careers.'],
                list: [
                    '2025\u20132026 National TSA Officers',
                    '2026\u20132027 National TSA Officer Candidates',
                    'ACTE Engineering and Technology Education Division',
                    'American Red Cross',
                    'Creative Designs By Sara',
                    'International Technology and Engineering Educators Association',
                    'G-W Publishers',
                    'Moffatt and Nichol',
                    'National Technical Honor Society',
                    'Next Gen Trucking',
                    'Pitsco Education',
                    'Stokes Robotics',
                    'West Chester University',
                ],
            },
            {
                heading: 'TSA Pin Exchange',
                paragraphs: ['The Pin Exchange gives attendees an opportunity to meet members from other delegations and exchange state or chapter pins after the first three general sessions.'],
                lines: [
                    'Tuesday, June 23: 11:00 AM\u20131:00 PM',
                    'Wednesday, June 24: 11:00 AM\u20131:00 PM',
                    'Thursday, June 25: 11:00 AM\u20131:00 PM',
                    'Convention Center Pre-function',
                ],
            },
        ],
    },

    team: {
        title: '2026 Conference Team',
        intro: ['The National Conference Team supports event operations, volunteers, judging, logistics, and general sessions throughout the conference.'],
        sections: [
            {
                items: [
                    { label: 'Conference Team Managers', text: 'BJ Scott, Nicole Shipman' },
                    { label: 'Volunteer Manager', text: 'Robert Dennis' },
                    { label: 'Judge Manager', text: 'Paul Emler III' },
                    { label: 'Logistics Manager', text: 'Frank Calfee' },
                    { label: 'General Sessions Manager', text: 'Sara Reynolds' },
                ],
            },
        ],
    },

    safety: {
        title: 'Safety and Emergency',
        sections: [
            {
                heading: 'Venue Safety',
                paragraphs: ['Attendees should review the safety information provided in their guest rooms and establish a chapter safety plan.'],
                list: [
                    'review emergency exit information in the hotel room',
                    'locate exits in meeting rooms and general session spaces',
                    'leave immediately during an emergency without collecting belongings',
                    'select an outdoor chapter meeting location',
                    'do not open hotel-room doors to unknown people',
                    'travel in pairs',
                    'keep an advisor or parent informed of your location',
                    'follow chapter and venue instructions',
                    'report suspicious or unsafe activity',
                ],
            },
            {
                heading: 'Gaylord Emergency Numbers',
                contacts: [
                    { label: 'Emergency', value: '333' },
                    { label: 'Security and Safety', value: '54500' },
                    { label: 'Fire Department', value: '9-911' },
                    { label: 'Lost and Found', value: '54520' },
                    { label: 'Hotel Operator', value: '0' },
                ],
                paragraphs: ['A Safety Services leader is available 24 hours a day. Gaylord Safety Services staff are trained first responders and certified in CPR and AED response.'],
            },
            {
                heading: 'Health Guidance',
                paragraphs: ['Attendees experiencing symptoms of COVID-19 or another contagious illness should not enter the hotel or conference area.'],
            },
            {
                heading: 'Overflow Hotels',
                collapsible: true,
                list: [
                    'Residence Inn',
                    'AC Hotel',
                    'MGM National Harbor',
                    'SpringHill Suites Old Town Alexandria',
                    'Courtyard Marriott Old Town Alexandria',
                    'Hampton Inn and Suites National Harbor/Alexandria Area',
                    'Westin National Harbor',
                    'Harborside Hotel',
                    'Hyatt Place National Harbor',
                ],
                note: 'Guests should review the emergency information posted inside their assigned hotel room.',
            },
            {
                heading: 'Nearby Medical and Safety Services',
                items: [
                    { label: 'Fort Washington Medical Center', meta: ['11711 Livingston Road', 'Fort Washington, MD 20744'], contact: { value: '301-292-7000', tel: true } },
                    { label: 'CVS Pharmacy', meta: ['162 Fleet Street', 'National Harbor, MD 20745'], contact: { value: '301-686-0248', tel: true } },
                    { label: 'Onsite Safety Services', meta: ['201 Waterfront Street', 'National Harbor, MD 20745'], contact: { value: '301-965-4500', tel: true } },
                    { label: 'Police Department', meta: ['5135 Indian Head Highway', 'Oxon Hill, MD'], contact: { value: '301-749-4900', tel: true, note: 'Non-emergency' } },
                ],
            },
        ],
    },

    transportation: {
        title: 'Transportation',
        sections: [
            {
                heading: 'Complimentary TSA Shuttles',
                paragraphs: ['Complimentary shuttle transportation is available to registered attendees staying at selected overflow hotels. Passengers must show a hotel room key or hotel-provided bus pass.'],
                list: [
                    'Courtyard Marriott Old Town Alexandria',
                    'SpringHill Suites Old Town Alexandria',
                    'Harborside Hotel',
                    'MGM National Harbor',
                ],
            },
            {
                heading: 'Shuttle Stops',
                items: [
                    { label: 'Gaylord National Resort and Convention Center', text: 'Maryland Bus Loop beyond the Woodrow Wilson doors' },
                    { label: 'Courtyard Marriott Old Town Alexandria', text: 'Front entrance' },
                    { label: 'SpringHill Suites Old Town Alexandria', text: 'Front entrance' },
                    { label: 'Harborside Hotel', text: 'Front entrance' },
                    { label: 'MGM National Harbor', text: 'Theatre entrance on Monument Drive' },
                ],
            },
            {
                heading: 'Operating Hours',
                lines: [
                    'Monday, June 22: 4:00 PM\u201310:00 PM',
                    'Tuesday, June 23: 7:00 AM\u201310:00 PM',
                    'Wednesday, June 24: 7:00 AM\u201310:00 PM',
                    'Thursday, June 25: 6:30 AM\u201310:00 PM',
                    'Friday, June 26: 6:30 AM\u201312:00 PM',
                ],
            },
            {
                heading: 'National Harbor Circulator',
                lines: [
                    'Stops: Waterfront District on St. George Boulevard, Gaylord National Resort and Convention Center, Tanger Outlets, MGM National Harbor',
                    'Sunday through Thursday: 12:00 PM\u201312:00 AM',
                    'Friday and Saturday: 11:00 AM\u20132:00 AM',
                ],
                paragraphs: ['$10 for an all-day pass. Gaylord National Resort guests may ride without charge by showing their room key.'],
                contacts: [{ label: 'Phone', value: '703-790-5466', tel: true }],
            },
            {
                heading: 'Water Taxi',
                paragraphs: ['The Potomac Riverboat Company provides paid water taxi service between National Harbor and selected destinations in Washington, D.C., Virginia, and Maryland.'],
                contacts: [{ label: 'Phone', value: '703-684-0580', tel: true }],
            },
            {
                heading: 'Transportation Desk',
                paragraphs: ['The Gaylord Transportation Desk can assist with tours and additional transportation services.'],
                contacts: [{ label: 'Phone', value: '301-965-2081', tel: true }],
            },
        ],
    },

    'general-sessions': {
        title: 'General Sessions',
        intro: ['All four general sessions take place in the Potomac Ballroom. The ballroom is expected to reach full capacity. Groups should arrive together because saving seats is not permitted.'],
        sections: [
            {
                heading: 'Opening General Session',
                lines: ['Tuesday, June 23: 9:00 AM\u201311:00 AM', 'Doors open 8:00 AM'],
                paragraphs: ['The conference opens with the Parade of State Flags, presentation of colors, the National Anthem, special presentations, Forward to Fifty recognition, and campaign speeches from National TSA officer candidates.'],
            },
            {
                heading: 'Recognition Assembly',
                lines: ['Wednesday, June 24: 9:00 AM\u201311:00 AM', 'Doors open 8:00 AM'],
                paragraphs: ['Members and advisors are recognized for their achievements. Special awards, Chapter Advisor of the Year honors, partnership announcements, and years-of-service recognition are presented. Officer candidates also answer extemporaneous questions.'],
            },
            {
                heading: 'Business Meeting',
                lines: ['Thursday, June 25: 9:00 AM\u201311:00 AM', 'Voting delegate seating 7:00 AM\u20137:30 AM', 'General seating approximately 8:45 AM'],
                paragraphs: ['The annual Business Meeting includes the election of National TSA officers by voting delegates and the Parade of State Presidents.'],
            },
            {
                heading: 'Awards Ceremony',
                lines: ['Friday, June 26: 7:30 AM\u201310:30 AM', 'Doors open 6:30 AM'],
                paragraphs: ['The Awards Ceremony recognizes National TSA competitive event finalists. First, second, and third-place competitors receive trophies. The top ten finalists and their chapter advisors receive finalist pins.'],
            },
            {
                heading: 'Important Session Rules',
                list: [
                    'bags larger than the official TSA drawstring backpack are not permitted',
                    'all bags may be inspected',
                    'National TSA is not responsible for lost or stolen belongings',
                    'livestreaming is available through the official Conference App',
                ],
            },
        ],
    },
};

export function getConference2026Topic(id) {
    return CONFERENCE_2026[id] || null;
}