// ============================================================================
// Competition Requirements & Updates.
// Single data file for all four pages. Pages with `table` render a chart;
// pages without content still show the "coming soon" placeholder.
//
// Eligibility data transcribed from the official TSA eligibility charts:
//   - High School: 2027 & 2028 High School Competitions
//   - Middle School: 2026 & 2027 Middle School Competitions
// Only official data is used. Verify against the current TSA charts before
// relying on it, as TSA may update these each year.
// ============================================================================

export const COMPETITION_REQUIREMENTS = [
    {
        id: 'eligibility-charts',
        title: 'Eligibility Charts',
        icon: 'file-text',
        subtitle: 'How many entries each event allows, by division.',
        tables: [
            {
                heading: '2027 & 2028 High School Competitions',
                note: 'Each participant/team shall submit only one [1] entry for the following competitive events.',
                columns: ['Competition', 'Eligibility'],
                rows: [
                    ['Animatronics', 'three (3) teams of two to three (2-3) team members per state'],
                    ['Architectural Design', 'two (2) teams of two to four (2-4) members per state; individual entries are permitted'],
                    ['Artificial Intelligence (AI)', 'one (1) team of two (2) individuals per chapter'],
                    ['Audio Podcasting', 'three (3) teams per state; individual entries are permitted'],
                    ['Automated Manufacturing Systems', 'two (2) teams of two to three (2-3) members per state'],
                    ['Biotechnology Design', 'one (1) team per chapter'],
                    ['Board Game Design', 'three (3) teams of two to four (2-4) individuals per state'],
                    ['Chapter Team', 'one (1) team of six (6) members per chapter'],
                    ['Children\u2019s Stories', 'three (3) teams or three (3) individuals per state'],
                    ['Computer-Aided Design (CAD), Architecture', 'two (2) individuals per state'],
                    ['Computer-Aided Design (CAD), Engineering', 'two (2) individuals per state'],
                    ['Cybersecurity', 'one (1) team of two to four (2-4) members per chapter; one (1) entry per team'],
                    ['Data Science and Analytics', 'three (3) teams of two (2) individuals per state; individual entries are permitted'],
                    ['Debating Technological Issues', 'three (3) teams of two (2) individuals per state'],
                    ['Digital Video Production', 'three (3) teams or three (3) individuals per state'],
                    ['Dragster Design', 'two (2) individuals per chapter'],
                    ['Drone Challenge (UAV)', 'three (3) teams of two to six (2-6) members per state'],
                    ['Engineering Design', 'five (5) teams of two to four (2-4) individuals per state'],
                    ['Extemporaneous Speech', 'three (3) individuals per state'],
                    ['Fashion Design and Technology', 'five (5) teams of two to four (2-4) individuals per state'],
                    ['Flight Endurance', 'two (2) individuals per chapter'],
                    ['Forensic Science', 'one (1) team of two (2) individuals per chapter'],
                    ['Future Technology and Engineering Teacher', 'two (2) individuals per chapter'],
                    ['Hybrid Racer XL', 'one (1) team of two to four (2-4) individuals per chapter; one (1) entry per team'],
                    ['Interior Design', 'three (3) teams of two (2) individuals per state; individual entries are permitted'],
                    ['Manufacturing Prototype', 'one (1) team per chapter'],
                    ['Music Production', 'three (3) teams per state; individual entries are permitted'],
                    ['On Demand Video', 'one (1) team per chapter'],
                    ['Photographic Technology', 'one (1) individual per chapter'],
                    ['Prepared Presentation', 'three (3) individuals per state'],
                    ['Promotional Design', 'three (3) individuals per state'],
                    ['Robotics', 'two (2) teams of two to six (2-6) members per state'],
                    ['Software Development', 'one (1) team per chapter; presentation/interview is limited to three (3) members'],
                    ['STEM Mass Media', 'one (1) team of two to three (2-3) members per chapter'],
                    ['Structural Design and Engineering', 'one (1) team of two (2) individuals per chapter'],
                    ['Technology Bowl', 'one (1) team of three (3) individuals per chapter'],
                    ['Technology Problem Solving', 'one (1) team of two (2) individuals per chapter'],
                    ['Transportation Modeling', 'one (1) individual per chapter'],
                    ['Video Game Design', 'five (5) teams per state'],
                    ['Virtual Reality Simulation (VR)', 'one (1) team per chapter; individual entries are permitted'],
                    ['Vlogging', 'two (2) teams of two to six (2-6) members per chapter'],
                    ['Webmaster', 'one (1) team per chapter with a maximum of six (6) individuals; individual entries are permitted'],
                ],
            },
            {
                heading: '2026 & 2027 Middle School Competitions',
                note: 'Each participant/team shall submit only one [1] entry for the following competitive events.',
                columns: ['Competition', 'Eligibility'],
                rows: [
                    ['Audio Podcasting', 'three (3) teams per state; individual entries are permitted'],
                    ['Biotechnology', 'five (5) teams per state, consisting of at least three (3) individuals'],
                    ['Career Prep', 'one (1) individual per chapter'],
                    ['Challenging Technology Issues', 'three (3) teams of two (2) individuals per state'],
                    ['Chapter Team', 'one (1) team of six (6) individuals per chapter'],
                    ['Children\u2019s Stories', 'three (3) teams per state; individual entries are permitted'],
                    ['Coding', 'one (1) team of two (2) individuals per chapter'],
                    ['Community Service Video', 'one (1) team per chapter; individual entries are permitted'],
                    ['Computer-Aided Design (CAD) Foundations', 'two (2) individuals per state'],
                    ['Construction Challenge', 'one (1) team of at least two (2) individuals per chapter'],
                    ['Cybersecurity', 'three (3) individuals per chapter'],
                    ['Data Science and Analytics', 'three (3) teams of two to three (2-3) individuals per state'],
                    ['Digital Photography', 'three (3) individuals per state'],
                    ['Dragster', 'two (2) individuals per chapter'],
                    ['Drone Challenge (UAV)', 'three (3) teams of two (2) individuals per state'],
                    ['Electrical Applications', 'one (1) team of two (2) individuals per chapter'],
                    ['Flight', 'two (2) individuals per chapter'],
                    ['Forensic Technology', 'one (1) team of two (2) individuals per chapter'],
                    ['Inventions and Innovations', 'one (1) team of two (2) to four (4) individuals per chapter'],
                    ['Leadership Strategies', 'three (3) teams of three (3) individuals per state'],
                    ['Mass Production', 'one (1) team of at least three (3) individuals per chapter'],
                    ['Mechanical Engineering', 'one (1) team of two (2) individuals per chapter'],
                    ['Medical Technology', 'three (3) teams of two to three (2-3) individuals per state'],
                    ['Microcontroller Design', 'one (1) team per chapter; individual entries are permitted'],
                    ['Off the Grid', 'three (3) teams per state; individual entries are permitted'],
                    ['Prepared Speech', 'three (3) individuals per state'],
                    ['Problem Solving', 'one (1) team of two (2) individuals per chapter'],
                    ['Promotional Marketing', 'one (1) individual per chapter'],
                    ['Robotics', 'three (3) teams of two to six (2-6) team members per state'],
                    ['Solar Racer', 'one (1) team of two to four (2-4) individuals per chapter; one (1) entry per team'],
                    ['STEM Animation', 'three (3) teams of at least two (2) individuals per state'],
                    ['Structural Engineering', 'one (1) team of two (2) individuals per chapter'],
                    ['System Control Technology', 'one (1) team of three (3) individuals per state'],
                    ['Tech Bowl', 'one (1) team of three (3) individuals per chapter'],
                    ['Technical Design', 'one (1) team of two (2) individuals per chapter'],
                    ['Video Game Design', 'one (1) team of two (2) to six (6) individuals per chapter'],
                    ['Website Design', 'one (1) team of at least three (3) and a maximum of six (6) individuals per chapter'],
                ],
            },
        ],
    },
    {
        id: 'preconference-submissions',
        title: 'Preconference Submissions',
        icon: 'file-text',
        subtitle: 'What each event submits before the conference, and how many files or links.',
        footnote: '*Events that require state advisor approval.',
        tables: [
            {
                heading: 'High School',
                columns: ['High School', 'PDF', '# of files', 'URL', '# of links'],
                rows: [
                    ['Architectural Design*', 'Documentation Portfolio', '1', 'Virtual Walk-through', '1'],
                    ['Audio Podcasting*', 'Documentation Portfolio', '1', 'Audio Podcast', '1'],
                    ['Data Science and Analytics*', 'Documentation Portfolio; Photo/Film/Video Consent Forms (if applicable)', '2', '', ''],
                    ['Digital Video Production*', 'Documentation Portfolio', '1', 'Digital Video', '1'],
                    ['Future Technology and Engineering Teacher', 'Documentation Portfolio', '1', '', ''],
                    ['Music Production*', 'Documentation Portfolio', '1', 'Musical Piece', '1'],
                    ['Photographic Technology', 'Photographic Portfolio', '1', '', ''],
                    ['Promotional Design', 'Promotional Design Portfolio', '1', '', ''],
                    ['Software Development', 'Resources and AI Reflection Form', '1', 'Copy of Code (PDF or URL)', '1'],
                    ['STEM Mass Media', 'Documentation Portfolio', '1', 'Video News Story', '1'],
                    ['Video Game Design*', 'Documentation Portfolio', '1', 'Video Game & Demo Video', '2'],
                    ['Vlogging', 'Documentation Portfolio', '1', 'Video Series', '1'],
                    ['Webmaster', '', '', 'Website', '1'],
                ],
            },
            {
                heading: 'Middle School',
                columns: ['Middle School', 'PDF', '# of files', 'URL', '# of links'],
                rows: [
                    ['Audio Podcasting*', 'Documentation Portfolio', '1', 'Audio Podcast', '1'],
                    ['Career Prep', 'Letter of Introduction and Resume', '1', '', ''],
                    ['Community Service Video', 'Supporting Documentation', '1', 'Video', '1'],
                    ['Digital Photography*', 'Digital Photographic Portfolio', '1', '', ''],
                    ['Promotional Marketing', 'Marketing Portfolio', '1', 'Digital Signage', '1'],
                    ['STEM Animation*', 'Documentation Portfolio', '1', 'Animation Video', '1'],
                    ['Video Game Design', 'Documentation Portfolio', '1', 'Video Game', '1'],
                    ['Website Design', 'Documentation (included with URL)', '', 'Website', '1'],
                ],
            },
        ],
        notes: [
            { label: 'PDF documents', text: 'All documents must be in Portable Document Format (PDF). The competition component upload platform accepts only PDF files. The file size limit is 30 MB.' },
            { label: 'URL link', text: 'A web-based platform will be used by judges to access and view competition components. Competitors must ensure that access to the URLs is not private or password-protected. Any links or documents that cannot be accessed will not be judged (including those stored in Google Drive).' },
            { label: 'Submission Confirmation', text: 'When uploading the pre-conference submission competition components via the Student Member Site, student members can select \u201cPrint Confirmation\u201d (which produces a PDF to save or print) and/or \u201cEmail Confirmation\u201d (which sends an email to the address entered in the student member account) to confirm the submission upload.' },
        ],
    },
    {
        id: 'national-competition-requirements',
        title: 'National Competition Requirements',
        icon: 'file-text',
        subtitle: 'Some, but not all, requirements related to competition at the 2026 National TSA Conference.',
        sections: [
            {
                body: [
                    'The information that follows includes some, but not all, requirements related to competition at the 2026 National TSA Conference.',
                ],
            },
            {
                heading: 'Competitive Event Registration Deadline',
                body: [
                    [
                        'No competitive event changes or substitutions are permitted once chapter conference registration has closed on ',
                        { b: 'Wednesday, May 6 at 11:59pm ET/10:59pm CT/9:59pm MT/8:59pm PT' },
                        '. Such adjustments may be made only up until the close of chapter registration. No exceptions.',
                    ],
                ],
            },
            {
                heading: 'Documentation Portfolios',
                body: [
                    'Cover page: Either Washington DC or National Harbor, MD is acceptable for the conference city and state.',
                ],
            },
            {
                heading: 'Competitive events with preconference submission requirements',
                body: [
                    [
                        'Student members are responsible for uploading their competition components to the ',
                        { link: 'TSA Student Member Site', url: 'https://tsaweb.org' },
                        '. Once a student member has activated an account, the member can access the competition component upload platform. ',
                        { b: '*Competitors must upload competition components between May 11 at 9:00am ET and May 13 by 11:59pm ET/10:59pm CT/9:59pm MT/8:59pm PT. National TSA will not accept competition components after the deadline or via email. No exceptions.' },
                    ],
                ],
                links: [
                    { text: 'Middle school and high school competitions with preconference submission requirements', url: 'https://tsaweb.org/competitions/competitive-event-preconference-submission-requirements' },
                    { text: 'Instructions for uploading competition components', url: 'https://tsaweb.org/docs/default-source/national-conferences/2025/instructions/competition-component-upload-instructions.pdf' },
                ],
            },
            {
                heading: 'Competitive event onsite tests',
                body: [
                    'If a competition includes a test onsite at the conference, the test will be administered online only. (Wi-Fi service will be provided at no cost only for competitions.) Written (paper) tests will not be used unless deemed necessary onsite.',
                    'For team events that involve a test, all team members must take the test to determine an average team score.',
                    'Individual participants, or each team member, must bring to the testing site:',
                ],
                list: [
                    'One (1) laptop or tablet (personal or school-issued) capable of networking via Wi-Fi and able to run solely on battery power for up to two (2) consecutive hours. Chrome is the preferred browser.',
                    'Optional: One (1) mouse',
                    'Two (2) sharpened No.2 pencils',
                ],
                after: [
                    'External keyboards and monitors are not permitted.',
                    [
                        'AnswerWrite is the platform for onsite tests. Members will use their Student ID# and password to access ',
                        { link: 'AnswerWrite', url: 'https://www.answerwrite.com/Login.aspx?id=820' },
                        '. Members should test their device (personal or school-issued) in advance of the national TSA conference using the provided link.',
                    ],
                    'To take an onsite team event test at the conference, each team member will access the AnswerWrite platform, as described above.',
                ],
            },
            {
                heading: 'Competitive event onsite uploads',
                body: [
                    'Competitors who advance to the semifinal level in MS Audio Podcasting, MS Promotional Marketing, MS Technical Design, HS Audio Podcasting, and HS On Demand Video, must access JudgePro (National TSA\u2019s scoring system) to upload semifinalist entries.',
                    [
                        'Members will use their Student ID# and password to access ',
                        { link: 'JudgePro', url: 'https://judgepro.registermychapter.com/org/jptsa-national/conf/ntc2026/student#' },
                        '.',
                    ],
                ],
            },
            {
                body: [
                    [
                        { b: '*NOTE' },
                        ': Competitors are responsible for ensuring that all competition-related websites and internet-based content are accessible from their laptop or tablet. TSA assumes no responsibility for a competitor\u2019s inability to upload competition components preconference or to access national TSA conference competition platforms and/or web-based content.',
                    ],
                    'Check back for updates\u2026',
                ],
            },
        ],
    },
    {
        id: 'state-advisor-approval-events',
        title: 'State Advisor Approval Events',
        icon: 'file-text',
        subtitle: 'Participants in the events below require state advisor approval. One entry per team/individual is permitted.',
        footnote: '*Events with pre-submission',
        tables: [
            {
                heading: 'Middle School',
                columns: ['Event', 'Eligibility'],
                rows: [
                    ['Audio Podcasting*', 'three (3) teams per state; individual entries are permitted'],
                    ['Biotechnology', 'five (5) teams per state'],
                    ['Challenging Technology Issues', 'three (3) teams of two (2) individuals per state'],
                    ['Children\u2019s Stories', 'three (3) teams per state; individual entries are permitted'],
                    ['Computer-Aided Design (CAD) Foundations', 'two (2) individuals per state'],
                    ['Data Science and Analytics', 'three (3) teams of two to three (2-3) individuals per state'],
                    ['Digital Photography*', 'three (3) individuals per state'],
                    ['Drone Challenge (UAV)', 'three (3) teams of two (2) individuals per state'],
                    ['Leadership Strategies', 'three (3) teams of three (3) individuals per state'],
                    ['Medical Technology', 'three (3) teams of at least two (2) individuals per state'],
                    ['Off the Grid', 'three (3) teams per state; individual entries are permitted'],
                    ['Robotics', 'three (3) teams of two to six (2-6) individuals per state'],
                    ['Prepared Speech', 'three (3) individuals per state'],
                    ['Stem Animation*', 'three (3) teams of at least two (2) individuals per state'],
                    ['System Control Technology', 'one (1) team of three (3) individuals per state'],
                ],
            },
            {
                heading: 'High School',
                columns: ['Event', 'Eligibility'],
                rows: [
                    ['Animatronics', 'three (3) teams of two to three (2-3) team individuals per state'],
                    ['Architectural Design*', 'two (2) teams of two to four (2-4) members per state may participate; individual entries are permitted'],
                    ['Audio Podcasting*', 'three (3) teams per state; individual entries are permitted'],
                    ['Automated Manufacturing Systems', 'two (2) teams of two (2) to three (3) members per state'],
                    ['Board Game Design', 'three (3) teams of two to four (2-4) individuals per state'],
                    ['Children\u2019s Stories', 'three (3) teams or three (3) individuals per state'],
                    ['Computer-Aided Design (CAD), Architecture', 'two (2) individuals per state'],
                    ['Computer-Aided Design (CAD), Engineering', 'two (2) individuals per state'],
                    ['Data Science and Analytics*', 'three (3) teams of two (2) individuals per state; individual entries are permitted'],
                    ['Debating Technological Issues', 'three (3) teams of two (2) individuals per state'],
                    ['Digital Video Production*', 'three (3) teams or three (3) individuals per state'],
                    ['Drone Challenge (UAV)', 'three (3) teams of two to six (2-6) individuals per state'],
                    ['Engineering Design', 'five (5) teams of three (3) or more individuals per state'],
                    ['Extemporaneous Speech', 'three (3) individuals per state'],
                    ['Fashion Design and Technology', 'five (5) teams of two to four (2-4) individuals per state'],
                    ['Interior Design', 'three (3) teams of two (2) individuals per state; individual entries are permitted'],
                    ['Music Production*', 'three (3) teams per state; individual entries are permitted'],
                    ['Prepared Presentation', 'three (3) individuals per state'],
                    ['Promotional Design', 'three (3) individuals per state'],
                    ['Robotics', 'two (2) teams of two to six (2-6) members per state'],
                    ['Video Game Design*', 'five (5) teams of at least two (2) individuals per state'],
                ],
            },
        ],
        sections: [
            {
                body: [
                    [
                        'If there is no ',
                        { link: 'TSA State Advisor', url: 'https://tsaweb.org/about/state-delegations' },
                        ' in your state, and a chapter member is interested in participating in TSA State Advisor approval events, please email TSA Operations Manager, Maria Raza, at ',
                        { link: 'mraza@tsaweb.org', url: 'mailto:mraza@tsaweb.org' },
                        '.',
                    ],
                ],
            },
        ],
    },
];

export function getCompetitionRequirement(id) {
    return COMPETITION_REQUIREMENTS.find((r) => r.id === id) || null;
}