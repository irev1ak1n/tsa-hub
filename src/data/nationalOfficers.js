// ============================================================================
// National TSA Officers — single source of truth.
//
// Text below is the exact 2026-2027 officer copy supplied directly by the
// user (title, name, school, city/state, email, full biography paragraphs)
// — NOT scraped or paraphrased from tsaweb.org. Do not shorten or rewrite
// these bios; if a field is ever missing for a future officer, ask for the
// exact text rather than pulling a replacement from the website.
//
// Reused by both the dedicated National TSA Officers page
// (src/screens/resources/NationalOfficers.jsx) and the 2026 Conference
// guide's officer-grid preview (src/data/conference2026.js) — one array,
// not two copies of the same roster.
//
// `img` is a filename (without extension) in
// src/assets/img/national-officers/, matching the six local officer photos
// in that folder (president/vice-president/secretary/treasurer/reporter/
// sergeant-at-arms).
// ============================================================================

export const NATIONAL_OFFICERS = [
    {
        id: 'president',
        role: 'President',
        name: 'Leona Ghirmai',
        school: 'Edmonds-Woodway High School',
        location: 'Lynnwood, Washington',
        email: 'nationaltsapresident@tsaweb.org',
        img: 'president',
        bio: [
            'Thanks to my eighth-grade math partner’s enthusiasm for STEM, I was convinced to join TSA. After just one year in the organization, I developed a deep passion for leadership and exploring the intersection of STEM fields. I have since competed in events such as Biotechnology Design, Extemporaneous Speech, and STEM Mass Media. Participation in each of these events has shaped my communication, teamwork, and advocacy skills. Deepening my TSA involvement as a chapter and state officer – and most recently as the Washington TSA State President - taught me the meaning of service-driven leadership as I grew confidence as a leader and person.',
            'Beyond TSA, I lead and participate in the American Red Cross and Girls on the Run organizations. I also work as a pharmacy technician apprentice at a local pharmacy. I am an active member of DECA and the National Honor Society. In my free time, you will find me by the beach, crocheting, spending time with friends, or at the CD shop.',
            'I am privileged to have transformed through TSA and developed vital 21st-century skills. I am grateful for the impact TSA involvement has had on me. It is the honor of my life to serve as the 2026-2027 National TSA President.',
        ],
    },
    {
        id: 'vice-president',
        role: 'Vice President',
        name: 'Ted Boulanger',
        school: 'Apex Friendship High School',
        location: 'Apex, North Carolina',
        email: 'nationaltsavicepresident@tsaweb.org',
        img: 'vice-president',
        bio: [
            'I joined TSA in the seventh grade – with limited knowledge of TSA chapter involvement – when I went to an informational meeting that included snacks for attending students. Little did I know joining TSA would be the most impactful decision I ever made. Since that time, TSA has helped me develop not just a high interest in engineering – but also an eagerness to lead.',
            'Outside of TSA, I hold leadership positions in my First Robotics team and my Speech and Debate team. I enjoy hanging out with friends and can often be found at a park playing pickleball or spikeball. I also enjoy gardening and working with plants. I hope to one day become an agricultural engineer, which will combine my enthusiasm for engineering and gardening.',
            'Had I not become involved in TSA, it is unlikely I would be the person I am today. I have progressed from barely being able to speak in front of a class of students, to speaking in front of a nearly 10,000-person audience at the national TSA conference. I am honored to have the opportunity to serve as your 2026-2027 National TSA Vice President.',
        ],
    },
    {
        id: 'secretary',
        role: 'Secretary',
        name: 'Natalie Branstetter',
        school: 'State College Area High School',
        location: 'State College, Pennsylvania',
        email: 'nationaltsasecretary@tsaweb.org',
        img: 'secretary',
        bio: [
            'My TSA journey began in the sixth grade. Through participation in competitive events (initially virtually) and the encouragement of student and teacher mentors, I quickly discovered that TSA would have a tremendous impact on my life. Since then, I have competed in a wide range of events; Chapter Team, Future Technology Teacher, and Animatronics are a few of my favorites. Every conference, competition, and leadership opportunity has challenged me to become a stronger leader, a more confident person, and someone who is always eager to help others grow.',
            'Outside of TSA, you can usually find me figure skating at the rink, running with friends, planning school activities as my school’s Senior Senate Vice President, or growing thousands of sunflowers on my grandfather’s farm. I especially enjoy traveling, spending time with family and friends, meeting new people, and experiencing nature.',
            'The friendships, leadership opportunities, and experiences I have gained through involvement in TSA have shaped me into the person I am today. I am grateful for everything this organization has given me, and I am extremely honored to serve as your 2026–2027 National TSA Secretary.',
        ],
    },
    {
        id: 'treasurer',
        role: 'Treasurer',
        name: 'Krishna Deepak',
        school: 'Franklin High School',
        location: 'Franklin, Tennessee',
        email: 'nationaltsatreasurer@tsaweb.org',
        img: 'treasurer',
        bio: [
            'I began my TSA journey in seventh grade. With little knowledge of TSA, I founded my middle school TSA chapter with the help and guidance of my science teacher. Through TSA events, such as Extemporaneous Speech and Prepared Presentation, I discovered my interest in the field of public policy and honed my leadership skills. TSA has provided me with opportunities to work as part of a team and to grow as a person, leader, and team member.',
            'Outside of TSA, I serve as a National Youth Advocate for YMCA Childcare and as one of the primary delegates for the Conference on National Affairs (CONA) in Tennessee. I also am involved in Model United Nations, Youth in Government, DECA, and HOSA, which all have broadened my interests in policy and health sciences.',
            'In my free time, I enjoy being outdoors and particularly enjoy hiking. I also climb and lift weights, but more than anything, I value spending time with the people close to me and meeting new individuals along the way.',
            'TSA has shaped me into the leader I am today, and I am honored to represent this organization as the 2026-2027 National TSA Treasurer.',
        ],
    },
    {
        id: 'reporter',
        role: 'Reporter',
        name: 'Tiffany Kim',
        school: 'Wesleyan School (HS)',
        location: 'Alpharetta, Georgia',
        email: 'nationaltsareporter@tsaweb.org',
        img: 'reporter',
        bio: [
            'I joined TSA in sixth grade. I was a quiet student, not knowing what to expect from TSA chapter involvement. I was welcomed by my fellow members and my advisor and worked on projects that helped me build my STEM-related knowledge. I knew I had found my new home. After my first state conference, I saw how much my STEM skills had grown. Driven to give back to TSA, I served as Georgia’s Second Vice President in eighth grade and state Reporter in ninth grade.',
            'Outside of TSA, I enjoy art, photography, graphic design, and anything creative. I am an officer in my school’s National Art Honor Society and have won numerous art competitions. I also have served on honor council and volunteered to help with activities in my school in the mornings. In addition, I am a huge animal lover, with nine pets.',
            'Thank you to all the TSA members who helped me move forward in the direction of the national officer position I now hold. I hope to make a positive impact this year and inspire other members to find their leadership roles. I look forward to serving as your 2026-2027 National TSA Reporter.',
        ],
    },
    {
        id: 'sergeant-at-arms',
        role: 'Sergeant-at-Arms',
        name: 'Emma Grace Maisonneuve',
        school: 'Franklin County School',
        location: 'Hartwell, Georgia',
        email: 'nationaltsasergeantatarms@tsaweb.org',
        img: 'sergeant-at-arms',
        bio: [
            'I joined TSA as a sixth grader. At the time, I had no idea of the impact the organization would have in shaping my life. Thanks to incredible role models at the state level and the encouragement of my middle school advisor, I quickly discovered that TSA was much more than participation in competitions.',
            'With confidence gained through involvement in TSA, I was honored to serve as the 2024–2025 Georgia TSA State Reporter and the 2025–2026 Georgia TSA First Vice President. These experiences strengthened my leadership skills and taught me that leadership is about serving and inspiring others.',
            'One of the most meaningful moments of my TSA journey came when a younger member told me I had inspired him to run for state office. He was elected, and we later had the opportunity to serve together. That experience reminded me that the greatest impact of leadership is helping others recognize their own potential.',
            'Serving as the 2026-2027 National TSA Sergeant-at-Arms is an incredible honor. I look forward to working on behalf of members across the nation.',
        ],
    },
];
