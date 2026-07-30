// ============================================================================
// Competition Rules & Preparation — knowledge base config (three levels).
//
//   Level 1  hub        /resources/competition-rules
//   Level 2  category   /resources/competition-rules/:cat
//   Level 3  topic      /resources/competition-rules/:cat/:topic
//
// Everything is generated from this one file. No per-page layout is hardcoded.
// No actual TSA rule text is stored yet — topic pages render placeholders.
// ============================================================================

export const RULES_PLACEHOLDER = 'Official rule content will be added from the TSA General Rules.';
export const DIVISION_PLACEHOLDER = 'High School and Middle School requirements will be shown here.';

// Source label metadata, keyed by division.
export const RULES_SOURCES = {
    HS: { label: 'High School General Rules', version: '2025–2026', status: null, url: null },
    MS: { label: 'Middle School General Rules', version: '2024–2025', status: 'Older version — verify before presenting as current', url: null },
};

export const COMPETITION_RULES = [
    {
        id: 'eligibility-participation',
        icon: 'users',
        title: 'Eligibility & Participation',
        description: 'Membership, conference registration, teams, event limits, and participant responsibilities.',
        sourceSection: 'Sections A–C — Eligibility & Participation',
        topics: [
            { id: 'membership-affiliation', title: 'Membership & Affiliation', description: 'Who must be affiliated with TSA to compete.', sourceSection: 'Section A — Membership', divisions: ['HS', 'MS'], points: ['Students, advisors, and chapters must be currently affiliated with TSA to enter competitive events.', 'TSA membership rights continue through the student\u2019s year of graduation.', 'Students who graduate midyear may compete at the National TSA Conference that immediately follows their end-of-year graduation.'], warnings: [], divisionDifferences: false, relatedTopics: ['event-limits-team-rules'] },
            { id: 'conference-registration-attendance', title: 'Conference Registration & Attendance', description: 'Registration and attendance requirements for National TSA Conferences.', sourceSection: 'Section B — Registration & Attendance', divisions: ['HS', 'MS'], points: ['Everyone attending the conference must complete conference registration.', 'Students must be registered and attend with an adult chaperone to compete or qualify as a semifinalist or finalist.', 'Students, advisors, and chaperones must attend the entire conference.', 'Conference identification badges must be worn at all times.'], warnings: [], divisionDifferences: false, relatedTopics: ['membership-affiliation'] },
            { id: 'event-limits-team-rules', title: 'Event Limits & Team Rules', description: 'Limits and requirements for individual and team events.', sourceSection: 'Section C — Teams & Event Limits', divisions: ['HS', 'MS'], points: ['Each participant may enter up to six competitive events per conference, including both individual and team events.', 'All members of a team must belong to the same TSA chapter.', 'Every team member must be identified during registration.', 'For events with online submissions, the chapter advisor must select one team captain.', 'The team captain uploads the entry and documentation for the entire team.', 'For events with a preliminary team exam, every member must take the exam. The team score is based on the average of all members\u2019 scores.', 'Unless an event states otherwise, a Middle School team must have between two and six members.'], note: 'Event-specific eligibility rules may set different team-size requirements.', warnings: [], divisionDifferences: false, relatedTopics: ['membership-affiliation', 'student-responsibilities-updates'] },
            { id: 'student-responsibilities-updates', title: 'Student Responsibilities & Rule Updates', description: 'What competitors are responsible for before participating.', sourceSection: 'Section C — Participant Responsibilities', divisions: ['HS', 'MS'], points: ['Each participant is responsible for obtaining and understanding all rules and guidelines for their event.', 'Not knowing or misunderstanding a rule is not a reason for receiving an exception or adjustment.', 'Students and advisors should regularly check TSAweb.org for updated rules and event information.', 'According to this guide, no additional updates are posted during the final month before the conference.', 'Competitors are responsible for knowing all updates, changes, and clarifications related to their events.', 'Students must make sure all required competition websites and online content work on their personal or school-issued device.', 'TSA is not responsible when a competitor cannot access a required competition platform or online resource.'], warnings: [], divisionDifferences: false, relatedTopics: ['event-limits-team-rules'] },
        ],
    },
    {
        id: 'competition-entries',
        icon: 'file-text',
        title: 'Competition Entries',
        description: 'Entry creation, portfolios, testing equipment, identification rules, displays, and USB drives.',
        sourceSection: 'Section D — Competition Entries',
        topics: [
            { id: 'creating-reusing-entries', title: 'Creating and Reusing Entries', description: 'Basic rules for creating and submitting competition entries.', sourceSection: 'Section D — Competition Entries', divisions: ['HS', 'MS'], points: ['All entries must be started and completed during the current school year.', 'An entry may only be submitted for one competition and for one year.', 'Reusing the same entry for more than one competition or more than one year results in disqualification.', 'Each participant or team may submit only one entry per event.'], warnings: [], divisionDifferences: false, relatedTopics: ['portfolios-language-checkin'] },
            { id: 'portfolios-language-checkin', title: 'Portfolios, Language & Check-In', description: 'Requirements for documentation portfolios and conference submission logistics.', sourceSection: 'Section D — Competition Entries', divisions: ['HS', 'MS'], points: ['If an event requires a documentation portfolio, it must be placed in a clear-front report cover unless the event rules say otherwise.', 'All entries must be in English.', 'Participants are responsible for checking in and picking up entries at the times and locations listed in the conference program or announced during the conference.'], warnings: [], divisionDifferences: false, relatedTopics: ['creating-reusing-entries'] },
            { id: 'testing-devices-supplies', title: 'Testing Devices & Supplies', description: 'What competitors must bring for onsite tests and required work.', sourceSection: 'Section D — Competition Entries', divisions: ['HS', 'MS'], points: ['If an event includes an onsite test, testing is normally administered online only.', 'Wi-Fi is provided at no cost for competitions.', 'Paper tests are generally not available unless TSA decides they are necessary.', { text: 'Each participant, or each team member when applicable, must bring:', sub: ['one laptop or tablet, either personal or school-issued;', 'a device that can connect to Wi-Fi;', 'a device that can run on battery power for up to two consecutive hours;', 'Chrome as the preferred browser.'] }, 'A mouse is optional.', 'If an event may require pencils, participants must bring two pencils to the test site.', { text: 'Acceptable pencils are:', sub: ['sharpened standard #2/HB pencils with erasers, or', '#2 mechanical pencils with erasers.'] }], warnings: [], divisionDifferences: false, relatedTopics: ['identification-display-rules'] },
            { id: 'entry-content-evaluation', title: 'Entry Content & Evaluation', description: 'How TSA treats entry content and how entries are scored.', sourceSection: 'Section D — Competition Entries', divisions: ['HS', 'MS'], points: ['TSA provides guidelines for what should be included in an entry, but participants are responsible for the actual content they submit.', 'Entries are judged using the official rating form for that event.'], warnings: [], divisionDifferences: false, relatedTopics: ['identification-display-rules'] },
            { id: 'identification-display-rules', title: 'Identification & Display Rules', description: 'What identifying information can appear on an entry, and display-size limits.', sourceSection: 'Section D — Competition Entries', divisions: ['HS', 'MS'], points: ['Unless an event specifically says otherwise, entries may not include identifying information other than a student or team ID number.', 'There are exceptions to this rule.'], groups: [
                    { heading: 'Middle School exceptions', intro: 'These middle school events may allow identifying information:', items: ['Career Prep', 'Children\u2019s Stories', 'Community Service Video', 'Construction Challenge', 'Structural Engineering'] },
                    { heading: 'High School exceptions', intro: 'These high school events may allow identifying information:', items: ['Children\u2019s Stories', 'Digital Video Production', 'Structural Design and Engineering'] },
                    { heading: 'Work Logs', items: ['If an event requires a Work Log, only student initials should be included.'] },
                    { heading: 'Display size', intro: 'Unless an event states otherwise, any required display may not exceed:', items: ['15 inches deep', '3 feet wide', '4 feet high'] },
                ], warnings: [], divisionDifferences: false, relatedTopics: ['entry-content-evaluation'] },
            { id: 'retained-entries-usb', title: 'Retained Entries & USB Drives', description: 'What TSA may keep after the conference.', sourceSection: 'Section D — Competition Entries', divisions: ['HS', 'MS'], points: ['TSA may choose to keep student entries submitted at the National TSA Conference.', 'Kept entries may be used by National TSA for promotional purposes.', 'If TSA uses a kept entry for promotion, credit will be given.', 'If a competition requires a USB flash drive, that drive may become TSA property and may not be returned.'], warnings: [], divisionDifferences: false, relatedTopics: ['portfolios-language-checkin'] },
        ],
    },
    {
        id: 'original-work-content',
        icon: 'shield',
        title: 'Original Work & Content Rules',
        description: 'Citations, copyright, original work, AI rules, prohibited materials, and restricted content.',
        sourceSection: 'Sections E–F — Original Work & Content',
        topics: [
            { id: 'citation-styles-references', title: 'Citation Styles & References', description: 'How sources must be documented in competition entries.', sourceSection: 'Section E — Citations & Copyright', divisions: ['HS', 'MS'], points: ['If an event requires citations, competitors must use a professional citation style unless the event specifies a required format.', 'Accepted examples include MLA, APA, Chicago, and IEEE.', 'If proper citation style is not used, the entry receives a 20% rules violation.'], warnings: [], divisionDifferences: false, relatedTopics: ['original-work-attribution'] },
            { id: 'original-work-attribution', title: 'Original Work & Source Attribution', description: 'Requirements for original work and outside sources.', sourceSection: 'Section E — Citations & Copyright', divisions: ['HS', 'MS'], points: ['Every entry must be the original work of the student or team.', 'Any outside ideas, text, images, or sound must be credited.', 'Even images marked for reuse still need citation.'], warnings: [], divisionDifferences: false, relatedTopics: ['citation-styles-references', 'plagiarism-honor-ai'] },
            { id: 'copyright-permission-branding', title: 'Copyright Permission & TSA Branding', description: 'Rules for copyrighted materials and TSA branding.', sourceSection: 'Section E — Citations & Copyright', divisions: ['HS', 'MS'], points: ['If copyrighted material is used, written permission must be included.', 'Students are expected to understand copyright and fair-use expectations before using outside materials.', 'For TSA logo use, competitors should follow the TSA Branding Guide in the Student Member Site.'], warnings: [], divisionDifferences: false, relatedTopics: ['original-work-attribution'] },
            { id: 'plagiarism-honor-ai', title: 'Honor Statement, Plagiarism & AI', description: 'What is prohibited under TSA\u2019s honor rules.', sourceSection: 'Section E — Citations & Copyright', divisions: ['HS', 'MS'], points: ['All work must be created and completed by the individual competitor or team.', { text: 'The following are prohibited:', sub: ['plagiarism;', 'copyright violation;', 'cheating;', 'falsifying information;', 'use of Generative AI (GenAI) tools.'] }, 'Competitors may not use generative AI tools such as ChatGPT, Google Gemini, GitHub Copilot, or similar tools.', 'TSA treats any attempt to gain an unfair advantage seriously.', 'By participating, competitors are expected to follow the TSA Honor Statement.', 'If a student violates the Honor Statement, the entry receives a 20% rules violation.'], warnings: [], divisionDifferences: false, relatedTopics: ['original-work-attribution'] },
            { id: 'hazardous-restricted-materials', title: 'Hazardous & Restricted Materials', description: 'Materials that are not allowed at the conference.', sourceSection: 'Section F — Prohibited Materials', divisions: ['HS', 'MS'], intro: 'The following are prohibited:', list: ['hazardous materials;', 'chemicals;', 'open or lighted flames;', 'combustible materials;', 'wet-cell batteries;', 'other similar dangerous substances.'], warnings: [], divisionDifferences: false, relatedTopics: ['prohibited-language-products'] },
            { id: 'prohibited-language-products', title: 'Prohibited Language, Products & Images', description: 'Content that may not appear in entries or presentations.', sourceSection: 'Section F — Prohibited Materials', divisions: ['HS', 'MS'], intro: 'Entries and presentations may not include:', list: ['racial or ethnic slurs or symbols;', 'references to gang affiliation;', 'vulgar, violent, subversive, or sexually suggestive language or imagery;', 'promotion of tobacco, alcohol, illegal drugs, or other products students cannot legally purchase;', 'images of guns, knives, or other weapons.'], footer: 'For video games and apps, competitors should also use ESRB guidance when deciding what content is appropriate. Judges make the final decision about whether content is acceptable, and violating these content rules may lead to disqualification.', warnings: [], divisionDifferences: false, relatedTopics: ['hazardous-restricted-materials'] },
        ],
    },
    {
        id: 'conflicts-emergencies-liability',
        icon: 'info',
        title: 'Conflicts, Emergencies & Liability',
        description: 'Personal property, event schedule conflicts, and emergency team substitutions.',
        sourceSection: 'Sections G–I — Conflicts, Emergencies & Liability',
        topics: [
            { id: 'personal-property-liability', title: 'Personal Property & TSA Liability', description: 'Who is responsible for items brought to the conference.', sourceSection: 'Section G — Liability', divisions: ['HS', 'MS'], points: ['TSA is not responsible for personal belongings, equipment, competition content, or materials brought to the National TSA Conference.', 'Participants and attendees are responsible for protecting and keeping track of everything they bring.'], warnings: [], divisionDifferences: false, relatedTopics: ['event-scheduling-conflicts'] },
            { id: 'event-scheduling-conflicts', title: 'Event Scheduling Conflicts', description: 'What happens when competition times overlap.', sourceSection: 'Section H — Scheduling Conflicts', divisions: ['HS', 'MS'], points: ['If a scheduling conflict prevents a student from participating in an event, the student may choose not to compete in that event.', 'TSA does not guarantee that conflicting event schedules can be adjusted.'], warnings: [], divisionDifferences: false, relatedTopics: ['emergency-team-substitutions'] },
            { id: 'emergency-team-substitutions', title: 'Emergency Team Substitutions', description: 'When a team member may be replaced.', sourceSection: 'Section I — Emergencies', divisions: ['HS', 'MS'], points: ['A team member substitution may be allowed when a documented emergency occurs.', 'This applies to team events that include written and semifinalist portions.', 'Every substitution must be approved by both the event manager and the event coordinator.'], warnings: [], divisionDifferences: false, relatedTopics: ['event-scheduling-conflicts'] },
        ],
    },
    {
        id: 'judging-grievances',
        icon: 'check',
        title: 'Judging & Grievances',
        description: 'Judging procedures, tier scoring, final decisions, and the grievance process.',
        sourceSection: 'Sections J–K — Judging & Grievances',
        topics: [
            { id: 'how-events-are-judged', title: 'How Events Are Judged', description: 'The standards used to evaluate competition entries.', sourceSection: 'Section J — Judging', divisions: ['HS', 'MS'], points: ['Every competitive event is judged according to the criteria listed in its official event guide.', 'Competitors should review the event requirements and rating criteria before submitting or presenting their work.'], warnings: [], divisionDifferences: false, relatedTopics: ['tier-scoring-decisions'] },
            { id: 'tier-scoring-decisions', title: 'Tier Scoring & Final Decisions', description: 'How some preliminary rounds are evaluated.', sourceSection: 'Section J — Judging', divisions: ['HS', 'MS'], points: ['Some events use tier scoring during the preliminary round.', 'Tier scoring helps streamline the evaluation process and determine which competitors advance as semifinalists.', 'Decisions made by competition judges are final.'], warnings: [], divisionDifferences: false, relatedTopics: ['how-events-are-judged'] },
            { id: 'who-can-file-grievance', title: 'Who Can File a Grievance', description: 'How competition concerns must be reported.', sourceSection: 'Section K — Grievances', divisions: ['HS', 'MS'], points: ['The Rules Interpretation Panel, or RIP, oversees competition-related rule concerns during the National TSA Conference.', 'The panel includes at least three members of the Competition Regulations Committee.', 'Only a state advisor may submit a grievance to the panel.', 'Students, teams, and chapter advisors must report their concern to their state advisor.', 'National TSA will not accept grievance forms directly from students, teams, or chapter advisors.'], warnings: [], divisionDifferences: false, relatedTopics: ['grievance-review-process'] },
            { id: 'grievance-review-process', title: 'Grievance Review Process', description: 'What happens after a concern is submitted.', sourceSection: 'Section K — Grievances', divisions: ['HS', 'MS'], points: ['Every grievance must be submitted in writing using the official Rules Interpretation Panel Grievance Form.', 'The form must be completed in full.', 'During the conference, the panel reviews and discusses the state advisor\u2019s concern.', 'The panel aims to provide a written response while the conference is still taking place.', 'Only the state advisor may collect the written response.', 'All decisions made by the Rules Interpretation Panel are final.'], warnings: [], divisionDifferences: false, relatedTopics: ['who-can-file-grievance'] },
        ],
    },
    {
        id: 'penalties-advancement',
        icon: 'trophy',
        title: 'Penalties & Advancement',
        description: 'Rules violations, disqualification, semifinalists, and advancement to the top ten.',
        sourceSection: 'Sections L–M — Penalties & Advancement',
        topics: [
            { id: 'rules-violations', title: '20% Rules Violations', description: 'When a rules violation causes a point deduction.', sourceSection: 'Section L — Penalties', divisions: ['HS', 'MS'], contentBlocks: [{ heading: 'What triggers a deduction' }, { heading: 'How the 20% is applied' }], warnings: [{ text: 'A rules violation can cost 20% of the total score.' }], divisionDifferences: false, relatedTopics: ['disqualification-process'] },
            { id: 'disqualification-process', title: 'Disqualification Process', description: 'When competitors may be disqualified and who must approve it.', sourceSection: 'Section L — Penalties', divisions: ['HS', 'MS'], contentBlocks: [{ heading: 'Grounds for disqualification' }, { heading: 'Approval' }], warnings: [], divisionDifferences: false, relatedTopics: ['rules-violations'] },
            { id: 'becoming-semifinalist', title: 'Becoming a Semifinalist', description: 'Minimum number of semifinalists and semifinal round qualification.', sourceSection: 'Section M — Advancement', divisions: ['HS', 'MS'], contentBlocks: [{ heading: 'Minimum semifinalists' }, { heading: 'Qualifying for semifinals' }], warnings: [], divisionDifferences: false, relatedTopics: ['advancing-top-ten'] },
            { id: 'advancing-top-ten', title: 'Advancing to the Top Ten', description: 'How semifinalists become event finalists.', sourceSection: 'Section M — Advancement', divisions: ['HS', 'MS'], contentBlocks: [{ heading: 'From semifinalist to finalist' }, { heading: 'The top ten' }], warnings: [], divisionDifferences: false, relatedTopics: ['becoming-semifinalist'] },
            { id: 'semifinalist-team-participation', title: 'Semifinalist Team Participation', description: 'Team member participation requirements during semifinal rounds.', sourceSection: 'Section M — Advancement', divisions: ['HS', 'MS'], contentBlocks: [{ heading: 'Team participation requirements' }], warnings: [], divisionDifferences: true, relatedTopics: ['becoming-semifinalist'] },
        ],
    },
];

export function getRuleCategory(catId) {
    return COMPETITION_RULES.find((c) => c.id === catId) || null;
}
export function getRuleTopic(catId, topicId) {
    const cat = getRuleCategory(catId);
    if (!cat) return null;
    const topic = cat.topics.find((t) => t.id === topicId) || null;
    return topic ? { category: cat, topic } : null;
}
export function resolveRelated(cat, ids) {
    return (ids || [])
        .map((id) => cat.topics.find((t) => t.id === id))
        .filter(Boolean)
        .map((t) => ({ id: t.id, title: t.title }));
}