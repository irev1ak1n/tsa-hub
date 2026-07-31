// ============================================================================
// About TSA — section list (drives the Resources rows) + page content.
// Each page has its own dedicated route under /resources/about/:id.
// ============================================================================

export const ABOUT_TSA = [
    { id: 'what-is-tsa', icon: 'info', title: 'What is TSA?' },
    { id: 'who-we-are', icon: 'users', title: 'Who We Are' },
    { id: 'history', icon: 'book', title: 'History' },
    { id: 'tsa-competitions', icon: 'trophy', title: 'TSA Competitions' },
];

export function getAboutPage(id) {
    return ABOUT_TSA_CONTENT[id] || null;
}

// ---------------------------------------------------------------------------
// Page content, keyed by id.
//   paragraphs   plain text blocks (white body copy)
//   sections     { heading, paragraphs?, list?, links? } named subsections
//   links        { id, title, url } blue-globe rows
// ---------------------------------------------------------------------------

export const ABOUT_TSA_CONTENT = {
    'what-is-tsa': {
        title: 'What is TSA?',
        paragraphs: [
            'The Technology Student Association (TSA) is a national non-profit career and technical student organization (CTSO) for middle and high school students engaged in science, technology, engineering, and mathematics (STEM).',
            'Today, over 300,000 students take part in TSA\u2019s competitions, intracurricular activities, leadership opportunities, and community service.',
        ],
    },

    'who-we-are': {
        title: 'Who We Are',
        sections: [
            {
                heading: 'Mission',
                paragraphs: [
                    'TSA enhances personal development, leadership, and career opportunities in STEM, as members apply and integrate these concepts through intracurricular activities, competitions, and related programs.',
                ],
            },
            {
                heading: 'Vision',
                paragraphs: [
                    'TSA accelerates student achievement and supports teachers by providing engaging opportunities to develop STEM skills.',
                ],
            },
            {
                heading: 'Motto',
                paragraphs: [
                    'Learning to lead in a technical world.',
                ],
            },
            {
                heading: 'CTE and CTSOs',
                paragraphs: [
                    'Career and technical education (CTE) prepares students for a wide range of high-skill, high-demand careers. As one of eight career and technical student organizations (CTSOs), TSA offers intracurricular competitions and programs that inspire and challenge students.',
                ],
                links: [
                    { id: 'cte-ctsos', title: 'CTE and CTSOs', url: 'https://tsaweb.org/about/cte-and-ctsos' },
                ],
            },
        ],
    },

    'history': {
        title: 'History',
        paragraphs: [
            'The Technology Student Association (TSA), formerly the American Industrial Arts Student Association (AIASA), is the oldest student membership organization dedicated exclusively to students enrolled in technology and engineering education classes in middle and high schools. Its history spans more than four decades.',
            'From 1958 to 1978, AIASA was a sponsored activity of the American Industrial Arts Association (AIAA). In 1978, the non-profit corporation AIASA, Inc. was formed to oversee AIASA as a separate organization.',
            'From 1978 to 1988, the organization grew in size, strength, structure, and impact on students and secondary school programs. In the summer of 1988, AIASA became the Technology Student Association.',
        ],
    },

    'tsa-competitions': {
        title: 'TSA Competitions',
        paragraphs: [
            'TSA provides rules and guidelines for more than 75 middle school and high school competitions. For classroom use, all competitions are aligned with STEM standards, 21st century leadership skills, and the U.S. Department of Education\u2019s National Career Clusters Framework\u00AE.',
        ],
        sections: [
            {
                heading: 'Competition categories',
                list: [
                    'Architecture and Construction Technology',
                    'Communications Technology',
                    'Computer Science and Information Technology',
                    'Leadership',
                    'Manufacturing and Transportation Technology',
                    'STEM (General)',
                    'STEM and the Arts',
                    'Technology and Research',
                ],
            },
            {
                heading: 'Computer Science',
                paragraphs: [
                    'TSA Computer Science competitions are designed to integrate into existing middle and high school curriculum. They focus on technologies such as data analytics, artificial intelligence, machine learning, virtual reality, and autonomous systems.',
                ],
            },
            {
                heading: 'TEAMS',
                paragraphs: [
                    'Tests of Engineering Aptitude, Mathematics, and Science (TEAMS) is a set of four engineering-focused competitions for middle and high school students, centered on the math and science skills engineers use to solve real-world challenges. For 2027, TSA has partnered with the National Council of Teachers of Mathematics (NCTM) to develop the competition content.',
                ],
            },
        ],
    },
};