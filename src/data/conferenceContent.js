// ============================================================================
// Conference Essentials — topic page content, keyed by topic id.
// Only topics with content appear here; others fall back to a placeholder.
//
// Page shape:
//   { title, intro?: [str], sections: [Section], footer?: str }
// Section shape:
//   { heading, paragraphs?: [str], list?: [str],
//     items?: [{ label, text?, notAllowed?: [str] }] }
//   - `items` render as labelled sub-blocks (e.g. Shirt / Pants / Shoes),
//     each with optional body text and an optional "Not allowed" list.
// ============================================================================

export const CONFERENCE_CONTENT = {
    'dress-code': {
        title: 'Dress Code',
        intro: [
            'Everyone attending the National TSA Conference \u2014 students, advisors, parents, guests, and children \u2014 must follow the TSA Dress Code, and must wear their official conference identification badge at all times.',
            'Students must wear competition attire when participating in competitive events. A student who competes in incorrect attire may still be allowed to participate, but may receive a 20% point deduction for each round.',
        ],
        sections: [
            {
                heading: 'Competition Attire',
                items: [
                    { label: 'Shirt', text: 'Official royal blue TSA shirt.' },
                    {
                        label: 'Pants or Skirt',
                        text: 'Gray pants or a gray skirt that is at least knee length.',
                        notAllowed: ['jeans', 'jeggings', 'leggings', 'baggy pants', 'pants with exterior pockets', 'shorts'],
                    },
                    {
                        label: 'Shoes',
                        text: 'Black dress shoes with black or dark blue socks. Hosiery is optional. Open-toed dress shoes and sandals are allowed.',
                        notAllowed: ['athletic shoes', 'flip-flops', 'military boots', 'work boots'],
                    },
                ],
            },
            {
                heading: 'Chapter Team Attire',
                paragraphs: ['Middle School and High School students in the Chapter Team event must also wear:'],
                list: [
                    'a navy blue blazer with the official TSA patch',
                    'an official TSA tie for male participants',
                ],
                paragraphsAfter: [
                    'Female participants may also wear the official TSA tie and will not be penalized for doing so. This full attire may also be worn for other competitive events.',
                ],
            },
            {
                heading: 'General Session Attire',
                items: [
                    {
                        label: 'Shirt',
                        text: 'The official royal blue TSA shirt is preferred. A button-down or polo shirt may also be worn.',
                        notAllowed: ['T-shirts', 'halter tops', 'tank tops'],
                    },
                    {
                        label: 'Pants, Dress, or Skirt',
                        text: 'Pants, a dress, or a skirt that is at least knee length.',
                        notAllowed: ['jeans', 'jeggings', 'leggings', 'baggy pants', 'pants with exterior pockets', 'shorts'],
                    },
                    { label: 'Optional Items', text: 'A navy blue blazer with the official TSA patch, and the official TSA tie.' },
                    {
                        label: 'Shoes',
                        text: 'Dress shoes with dark socks. Hosiery is optional. Open-toed dress shoes and sandals are allowed.',
                        notAllowed: ['athletic shoes', 'flip-flops', 'military boots', 'work boots'],
                    },
                ],
            },
            {
                heading: 'Casual Attire',
                paragraphs: [
                    'Appropriate T-shirts, shorts, and jeans may be worn during casual conference activities. Casual attire may not be worn during competitions or general sessions.',
                ],
            },
            {
                heading: 'Parents, Guests, and Children',
                paragraphs: [
                    'Registered parents, guests, and children should wear appropriate general-session attire when attending sessions or the Awards Ceremony.',
                    'Those who do not meet the General Session Attire requirements may be placed in a designated seating area or may not be permitted to enter.',
                ],
            },
            {
                heading: 'Official TSA Attire',
                paragraphs: [
                    'Official TSA clothing and accessories may be purchased through the Shop section of the TSA website.',
                ],
            },
        ],
        footer: 'Official source: National TSA Conference Dress Code and Official Conference Attire Guidelines.',
    },

    'code-of-conduct': {
        title: 'Code of Conduct',
        intro: [
            'The National TSA Conference Code of Conduct applies to students, advisors, alumni, parents, volunteers, guests, and all other attendees. Everyone is expected to behave respectfully, follow applicable laws, and comply with TSA and facility rules.',
        ],
        sections: [
            {
                heading: 'Respectful Behavior',
                paragraphs: ['The following behavior is not allowed:'],
                list: [
                    'abusive or threatening language',
                    'bullying or discrimination',
                    'sexual harassment',
                    'physical harm or violence',
                    'other disrespectful or unsafe conduct',
                ],
            },
            {
                heading: 'Prohibited Items',
                paragraphs: ['Attendees may not possess:'],
                list: ['alcohol', 'narcotics or illegal drugs', 'firearms', 'weapons of any kind'],
            },
            {
                heading: 'Student Responsibilities',
                paragraphs: ['Students must:'],
                list: [
                    'keep their advisor informed of their activities and location',
                    'arrive on time and be prepared for scheduled activities',
                    'attend assigned meetings, sessions, and competitive events',
                    'wear their conference badge visibly on a TSA lanyard',
                    'follow the National TSA Dress Code',
                    'receive advisor permission before leaving the conference hotel or venue',
                    'return to their assigned hotel room by the announced curfew',
                    'follow school, district, chapter, state TSA, and National TSA rules',
                ],
            },
            {
                heading: 'Conference Property',
                paragraphs: [
                    'Attendees must follow facility rules for displaying signs, notices, or posters.',
                    'Damaging hotel or convention-center property is prohibited, and the responsible attendee or chapter may be required to pay for any damage.',
                    'Helium balloons and water balloons are not permitted.',
                ],
            },
            {
                heading: 'Advisor Responsibilities',
                paragraphs: ['Advisors are expected to:'],
                list: [
                    'meet periodically with their students',
                    'review schedules, activities, and student progress',
                    'provide students with contact information and their own schedule',
                    'remain available throughout the conference',
                    'ensure that students follow the Code of Conduct and Dress Code',
                    'take responsibility for the conduct of their chapter delegation',
                ],
            },
            {
                heading: 'Violations',
                paragraphs: ['Violating conference rules may result in:'],
                list: [
                    'removal from an activity',
                    'competition disqualification',
                    'the delegation losing seating privileges',
                    'dismissal from the conference',
                    'the attendee being sent home at their own expense',
                ],
                paragraphsAfter: [
                    'The TSA Executive Committee may dismiss anyone from the conference for inappropriate conduct.',
                ],
            },
        ],
    },

    'safety-emergencies': {
        title: 'Safety and Emergencies',
        intro: [
            'TSA, conference facilities, and local authorities work together to maintain a safe environment. All attendees should understand emergency procedures and follow instructions from advisors, security staff, hotel staff, and TSA officials.',
        ],
        sections: [
            {
                heading: 'General Safety Guidelines',
                paragraphs: ['Attendees should:'],
                list: [
                    'review emergency exits in hotel rooms and meeting spaces',
                    'identify the nearest exit when entering a large session',
                    'leave immediately during an emergency without stopping for belongings',
                    'establish a chapter meeting location outside the building',
                    'avoid opening hotel-room doors to unknown people',
                    'travel with another person when possible',
                    'keep an advisor or parent informed of their location',
                    'report suspicious or unsafe activity immediately',
                    'follow all instructions from conference and facility staff',
                ],
            },
            {
                heading: 'Registration and Identification',
                list: [
                    'Everyone attending the conference must be officially registered.',
                    'Conference badges must remain visible while attendees are in conference areas.',
                    'The conference is not open to unregistered members of the public.',
                ],
            },
            {
                heading: 'Curfew and Supervision',
                list: [
                    'Student curfews are enforced.',
                    'Students must return to their assigned hotel rooms by the announced curfew.',
                    'Students may not leave the conference hotel or venue without advisor permission.',
                    'Exact curfew times may vary, so attendees should check the current conference guide.',
                ],
            },
            {
                heading: 'Personal Belongings',
                paragraphs: ['Attendees are responsible for protecting their own:'],
                list: [
                    'phones and electronics',
                    'money and personal valuables',
                    'competition materials',
                    'luggage',
                    'equipment and projects',
                ],
                paragraphsAfter: [
                    'TSA is not responsible for lost, misplaced, stolen, or damaged items.',
                ],
            },
            {
                heading: 'Emergency Contacts',
                paragraphs: [
                    'Emergency phone numbers, medical facilities, pharmacies, security contacts, and hotel procedures change by conference location and year. Check the current conference guide for details.',
                ],
            },
        ],
    },

    'registration-badges': {
        title: 'Registration and Badges',
        intro: [
            'Everyone attending the National TSA Conference must be officially registered \u2014 students, advisors, parents, guests, volunteers, and children.',
        ],
        sections: [
            {
                heading: 'Conference Registration',
                list: [
                    'Registration is required to attend conference activities, competitions, general sessions, and the Awards Ceremony.',
                    'Students must attend with their chapter and an adult chaperone or advisor.',
                    'Registration deadlines and procedures may change each year, so review the current conference guide.',
                ],
            },
            {
                heading: 'Conference Identification',
                list: [
                    'Every registered attendee receives an official conference name badge.',
                    'The badge must be worn visibly on a TSA lanyard while in conference areas.',
                    'A badge may be required to enter sessions, competitions, activities, transportation, and other restricted spaces.',
                    'Report lost badges to the conference information desk or an advisor immediately.',
                ],
            },
            {
                heading: 'Important',
                paragraphs: [
                    'The National TSA Conference is not open to unregistered members of the public. Parents and guests must also register before attending official conference activities.',
                ],
            },
        ],
    },

    'packing-checklist': {
        title: 'Packing Checklist',
        intro: [
            'Use this checklist as a general starting point. Always review your event requirements and instructions from your chapter or state delegation before traveling.',
        ],
        sections: [
            {
                heading: 'TSA Attire',
                list: [
                    'Official royal blue TSA shirt',
                    'Gray pants or a gray skirt',
                    'Black dress shoes',
                    'Black or dark blue dress socks',
                    'Navy blazer with official TSA patch, if required',
                    'Official TSA tie, if required',
                    'Appropriate clothing for general sessions',
                    'Casual clothing for permitted activities',
                ],
            },
            {
                heading: 'Personal Clothing',
                list: [
                    'Sleepwear',
                    'Undergarments and socks',
                    'Comfortable clothing for travel and downtime',
                    'Weather-appropriate clothing',
                    'Any clothing required for chapter or delegation activities',
                ],
            },
            {
                heading: 'Toiletries',
                list: [
                    'Toothbrush and toothpaste',
                    'Shampoo and conditioner',
                    'Soap or body wash',
                    'Deodorant',
                    'Hairbrush or comb',
                    'Sunscreen',
                    'Personal hygiene products',
                    'Required medications',
                ],
            },
            {
                heading: 'Competition Materials',
                list: [
                    'Competition project or entry',
                    'Printed documentation portfolio in the required report cover',
                    'Laptop or tablet',
                    'Device charger',
                    'Required USB drive',
                    'Backup USB drive',
                    'HDMI or other presentation cables',
                    'Extension cord, if permitted and needed',
                    'Event-specific tools, supplies, or documentation',
                ],
            },
            {
                heading: 'Personal Items',
                list: [
                    'Conference travel information',
                    'Identification and payment method',
                    'Reusable water bottle',
                    'Phone and charger',
                    'Small bag that meets conference restrictions',
                ],
            },
            {
                heading: 'Reminder',
                paragraphs: [
                    'TSA is not responsible for lost, misplaced, damaged, or stolen belongings. Keep important items secured and clearly labeled.',
                ],
            },
        ],
    },

    'competition-requirements': {
        title: 'Competition Requirements',
        intro: [
            'Competitors are responsible for reviewing both the general TSA rules and the specific requirements for their event.',
        ],
        sections: [
            {
                heading: 'Required Technology',
                paragraphs: ['For applicable testing and submission events, competitors may need:'],
                list: [
                    'one laptop or tablet',
                    'Wi-Fi capability',
                    'enough battery power for up to two consecutive hours',
                    'Chrome as the preferred browser',
                    'TSA Student Member Site ID and password',
                    'an optional mouse',
                    'two sharpened No. 2 pencils',
                ],
                paragraphsAfter: [
                    'External keyboards and monitors may not be permitted for onsite testing.',
                ],
            },
            {
                heading: 'Portfolios and Entries',
                list: [
                    'Bring the complete competition entry and all required materials.',
                    'Printed documentation portfolios should be placed in a clear-front report cover unless the event rules state otherwise.',
                    'Remove identifying information unless the event specifically permits it.',
                    'Bring required USB drives and keep a separate backup.',
                    'Check the official schedule for project check-in and pickup times.',
                ],
            },
            {
                heading: 'Before the Event',
                paragraphs: ['Competitors should confirm:'],
                list: [
                    'event time and location',
                    'preliminary and semifinal requirements',
                    'required attire',
                    'presentation equipment',
                    'testing login information',
                    'upload requirements',
                    'event-specific forms and documentation',
                ],
            },
            {
                heading: 'Important',
                paragraphs: [
                    'Students are responsible for knowing current rules, updates, and clarifications. TSA may not provide exceptions when a participant has misunderstood or failed to review the requirements.',
                ],
            },
        ],
    },

    'travel-meals-budget': {
        title: 'Travel, Meals and Budget',
        intro: [
            'Travel, hotel, meal, and spending arrangements may differ by year, location, chapter, and state delegation.',
        ],
        sections: [
            {
                heading: 'Travel Planning',
                paragraphs: ['Before leaving, confirm:'],
                list: [
                    'flight or driving arrangements',
                    'airport transportation',
                    'shuttle reservations',
                    'hotel name and address',
                    'arrival and departure times',
                    'chapter meeting location',
                    'advisor contact information',
                ],
                paragraphsAfter: [
                    'Students should tell their advisor when they arrive and should not travel away from the conference area without permission.',
                ],
            },
            {
                heading: 'Hotel Check-In',
                list: [
                    'Room availability may depend on the hotel\u2019s official check-in time.',
                    'Early arrivals may need to wait before entering their rooms.',
                    'Room keys and assignments may be distributed by the chapter or state delegation.',
                    'Review hotel safety instructions after checking in.',
                ],
            },
            {
                heading: 'Meals',
                paragraphs: ['Conference registration may not include meals. Attendees should:'],
                list: [
                    'plan meals before arriving',
                    'expect restaurants near the venue to be busy',
                    'allow extra time for food lines',
                    'check whether the hotel room has a refrigerator or microwave',
                    'bring appropriate snacks when allowed',
                    'coordinate meal plans with the chapter',
                ],
            },
            {
                heading: 'Budget',
                paragraphs: ['Bring enough money or an approved payment method for:'],
                list: [
                    'meals',
                    'transportation',
                    'emergency expenses',
                    'conference merchandise',
                    'optional activities',
                ],
                paragraphsAfter: [
                    'The exact recommended amount depends on the location and delegation plan. Follow guidance from your advisor rather than relying on one universal daily estimate.',
                ],
            },
            {
                heading: 'Year-Specific Transportation',
                paragraphs: [
                    'Hotel shuttles, airport transportation, pickup locations, schedules, and local transit options change each year. Review the current Conference Guide before traveling. The 2025 and 2026 programs, for example, list different hotels, shuttle systems, schedules, and pickup points.',
                ],
            },
        ],
    },

    'results-awards': {
        title: 'Results and Awards',
        intro: [
            'National TSA competitive events may include preliminary, semifinal, and finalist rounds.',
        ],
        sections: [
            {
                heading: 'Semifinalists',
                paragraphs: ['A semifinalist is an individual or team selected to compete in the semifinal portion of an event.'],
                list: [
                    'Semifinalist lists are usually posted through official TSA conference platforms.',
                    'Lists may be presented in random order.',
                    'Semifinalists must follow any additional presentation, testing, interview, or upload instructions.',
                    'Unless the event rules state otherwise, all members of a semifinalist team must participate.',
                ],
            },
            {
                heading: 'Top Ten Finalists',
                paragraphs: [
                    'Semifinalists compete for placement among the top ten finalists in their event.',
                    'Top-ten results are typically announced during the Awards Ceremony and may also be published online after the conference.',
                ],
            },
            {
                heading: 'Awards',
                list: [
                    'The top ten finalists receive recognition and finalist lapel pins.',
                    'Chapter advisors of finalists may also receive finalist pins.',
                    'First, second, and third-place competitors receive trophies.',
                    'Additional or duplicate trophies may be available separately after the conference.',
                ],
            },
            {
                heading: 'Awards Ceremony',
                paragraphs: [
                    'Attendance requires conference registration, and attendees must follow badge, dress code, security, and bag requirements.',
                    'Exact ceremony dates, times, locations, and result-posting procedures belong in the guide for the specific conference year.',
                ],
            },
        ],
    },
};

export function getConferenceContent(topicId) {
    return CONFERENCE_CONTENT[topicId] || null;
}