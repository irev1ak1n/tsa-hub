// ============================================================================
// Awards & Scholarships — content for the dedicated program page.
// URLs are left empty ('') so official links can be added later. No deadlines,
// amounts, or requirements beyond the supplied content are invented.
// ============================================================================

export const AWARDS_SCHOLARSHIPS = {
    header: {
        title: 'Awards and Scholarships',
    },

    awards: {
        title: 'Awards and Recognition',
        intro:
            'TSA awards and recognition programs highlight the achievements and contributions of TSA members, advisors, alumni, and others who support the organization.',
        note:
            'Award criteria, nomination forms, and instructions are available to affiliated chapter advisors through the TSA Membership System and to affiliated student members through the Student Member Site under the Total TSA section.',
        items: [
            { id: 'chapter-advisor-of-the-year', title: 'Chapter Advisor of the Year', url: 'https://tsaweb.org/docs/default-source/national-conferences/chapter-advisor-of-the-year.pdf?sfvrsn=829cc4a1_3' },
            { id: 'distinguished-alumni-award', title: 'Distinguished Alumni Award', url: 'https://tsaweb.org/programs/awards-and-scholarships/distinguished-alumni-award' },
            { id: 'bob-hanson-distinguished-student', title: 'Dr. Bob Hanson Distinguished Student Award', url: 'https://tsaweb.org/programs/awards-and-scholarships/dr.-bob-hanson-distinguished-student-award-recipients' },
            { id: 'harvey-dean-recognition', title: 'Dr. Harvey Dean Recognition Award', url: 'https://tsaweb.org/programs/awards-and-scholarships/dr.-harvey-dean-recognition-award-recipients' },
            { id: 'honorary-lifetime-achievement', title: 'Honorary Lifetime Achievement Award', url: 'https://tsaweb.org/programs/awards-and-scholarships/honorary-lifetime-achievement-award-recipients' },
            { id: 'years-of-service', title: 'Years of Service Award', url: 'https://tsaweb.org/docs/default-source/national-conferences/2025/2025-service-awards.pdf?sfvrsn=5a368ee_1' },
        ],
    },

    scholarshipsTitle: 'Scholarships',
    scholarships: [
        {
            id: 'nths-scholarship',
            title: 'National Technical Honor Society Scholarship',
            description: [
                'Founded in 1984, the National Technical Honor Society (NTHS) is the honor society for Career and Technical Education. It recognizes over 76,000 new members and awards nearly $335,000 in scholarships each year. TSA and NTHS partner to bring these benefits to TSA members.',
                'For the 2027 National TSA Conference, NTHS plans to award three $1,000 academic scholarships to applicants with active membership in both TSA and NTHS.',
                'A TSA member must be nominated for NTHS by their school\u2019s NTHS chapter advisor, and the school must have a current NTHS chapter. Use the links below to learn more.',
            ],
            eligibility: [
                'Current TSA member',
                'Current NTHS member',
                'Completed scholarship application',
                'Required attachments must be included',
            ],
            resourcesTitle: 'Helpful NTHS Resources',
            resources: [
                { id: 'nths-what-we-do', title: 'The benefits of NTHS membership', url: 'https://nths.org/what-we-do/' },
                { id: 'nths-chapter-directory', title: 'Find out if your school has an NTHS chapter', url: 'https://nths.org/chapter-directory/' },
                { id: 'nths-establish-chapter', title: 'How to establish an NTHS chapter', url: 'https://nths.org/establish-a-chapter/' },
                { id: 'nths-website', title: 'NTHS Website', url: 'https://nths.org/' },
                { id: 'nths-student-member-site', title: 'TSA Student Member Site', url: 'https://tsamembership.registermychapter.com/members' },
            ],
            applicationNote:
                'The NTHS scholarship application is available through the password-protected Student Member Site in the TSA Membership System. Students who are current members of both TSA and NTHS may apply. Completed applications, with all required attachments, should be emailed to general@tsaweb.org.',
        },
        {
            id: 'elrod-memorial-scholarship',
            title: 'William P. Elrod Memorial Scholarship',
            description: [
                'The William P. Elrod Memorial Scholarship honors William P. Elrod, a founding leader of TSA who was recognized for his longstanding leadership and involvement with the organization.',
                'The scholarship provides $2,500 annually to an eligible TSA student member.',
            ],
            applicationNote:
                'TSA members can access the scholarship criteria, instructions, and application through the TSA Student Member Site.',
            resources: [
                { id: 'elrod-info', title: 'TSA Student Member Site', url: 'https://tsamembership.registermychapter.com/members' },
            ],
        },
        {
            id: 'alumni-scholarship',
            title: 'National TSA Alumni Scholarship',
            description: [
                'The National TSA Alumni Scholarship provides $1,000 annually to a TSA alumnus or alumna for educational financial support.',
                'The award is distributed directly to the recipient\u2019s college or university financial aid office.',
            ],
            resources: [
                { id: 'alumni-application', title: 'National TSA Alumni Scholarship Application', url: 'https://tsaweb.org/docs/default-source/awards-and-scholarships/collegiate-alumni_alumnae-scholarship.pdf?sfvrsn=4379e026_3' },
            ],
        },
    ],
};