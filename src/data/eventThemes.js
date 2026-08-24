// ============================================================================
// 2026-2027 TSA Event Themes & Problems
// Structured content so the UI can render rich detail pages without opening
// external PDFs. PDF-only events preserve the official link as a resource.
// ============================================================================

// Resource type: 'pdf' | 'csv' | 'pptx' | 'external'
// status: 'theme' (has content) | 'no-theme' (no annual theme this season)

export const EVENT_THEMES = {

    // ──────────────────────────────────────────────────────────────────────
    // MIDDLE SCHOOL
    // ──────────────────────────────────────────────────────────────────────

    'ms-audio-podcasting': {
        season: '2026-2027',
        division: 'MS',
        name: 'Audio Podcasting',
        theme: 'Breaking News from the Future',
        description: 'Students create an audio podcast reporting on a fictional future event, discovery, invention, or crisis as if it is happening live.',
    },

    'ms-biotechnology': {
        season: '2026-2027',
        division: 'MS',
        name: 'Biotechnology',
        theme: 'Biotechnology in Food',
        description: 'Biotechnology can be used to improve crops, make food last longer, or create new types of food. Explain how biotechnology is used in food production and describe one way it could help farmers or consumers.',
    },

    'ms-career-prep': {
        season: '2026-2027',
        division: 'MS',
        name: 'Career Prep',
        theme: 'Digital Technology Careers',
        description: 'Choose a career from the Career Clusters Digital Technology category within one of the following subclusters:',
        list: [
            'Data Science & Artificial Intelligence',
            'Information Technology (IT) Support & Services',
            'Network Systems & Cybersecurity',
            'Software Solutions',
            'Unmanned Vehicle Technology',
        ],
    },

    'ms-challenging-tech-issues': {
        season: '2026-2027',
        division: 'MS',
        name: 'Challenging Technology Issues',
        description: 'Select one of the following topics for the debate:',
        list: [
            'The Use of AI to Write News Articles',
            'Requiring Coding as a Core Subject in Middle School',
            'Virtual Reality Replacing Physical Labs in High School Science Classes',
            'Medical Tourism as a Means of Accessible Treatment Options',
            'Robots in Elderly & Child Care',
        ],
    },

    'ms-childrens-stories': {
        season: '2026-2027',
        division: 'MS',
        name: "Children's Stories",
        theme: 'A Story About the Weather',
        description: 'Create a book that tells a story about the weather.',
        requirements: [
            'The book must include at least five tactile elements.',
        ],
    },

    'ms-coding': {
        season: '2026-2027',
        division: 'MS',
        name: 'Coding',
        description: 'Teams should have knowledge of software development, computer science, and coding concepts covered on the written test. Teams should also be familiar with Scratch.',
        sections: [
            {
                heading: 'Scratch',
                content: 'The offline version of Scratch must be installed on each team\'s laptop before the competition. There will be no Internet access during the semifinal level.',
                resources: [
                    { title: 'Download Scratch (offline)', url: 'https://scratch.mit.edu/download', type: 'external' },
                    { title: 'Scratch starter projects', url: 'https://scratch.mit.edu/starter-projects', type: 'external' },
                ],
            },
            {
                heading: 'Semifinal Challenge',
                content: 'Teams advancing to semifinals based on written-test performance complete an onsite Scratch programming challenge. Semifinalists receive two hours to complete the challenge. No Internet access during semifinals — Scratch must be available offline.',
            },
        ],
    },

    'ms-construction-challenge': {
        season: '2026-2027',
        division: 'MS',
        name: 'Construction Challenge',
        theme: 'Urban Community Greenhouse',
        description: 'Design an urban community greenhouse and garden for a densely populated city neighborhood.',
        requirements: [
            'Entire facility must fit inside a 25 ft × 100 ft footprint.',
            'Must safely accommodate 20–30 community members at once.',
            'Must use at least two sustainable architectural or engineering practices.',
            'Students should describe the practices and design choices used to satisfy the constraints.',
        ],
    },

    'ms-cybersecurity': {
        season: '2026-2027',
        division: 'MS',
        name: 'Cybersecurity',
        theme: 'FinStream Technologies Security Incident',
        problemStatement: 'FinStream Technologies is a fast-growing financial technology startup. During a routine audit, the security team notices network anomalies. A senior software engineer who recently submitted a two-week notice has been downloading unusually large amounts of proprietary source code and client financial data from the cloud repository to a local workstation and then transferring that data to an unencrypted external USB drive.',
        requirements: [
            'Analyze the immediate actions required to secure the data.',
            'Investigate the scope of the exfiltration.',
            'Recommend policy changes.',
        ],
    },

    'ms-data-science': {
        season: '2026-2027',
        division: 'MS',
        name: 'Data Science and Analytics',
        theme: 'Yellowstone Wildlife Conservation',
        topic: 'Explore how wildlife populations and migration behaviors have shifted in Yellowstone National Park over the last 50 years.',
        description: 'Students should analyze ecological, environmental, and human characteristics in the dataset. Based on the analysis, create data-driven criteria that could help Yellowstone National Park plan wildlife conservation. Support predictive criteria with evidence from the data.',
        resources: [
            {
                title: 'Yellowstone_Wildlife.csv',
                url: 'https://tsaweb.org/docs/default-source/competitions/themes-and-problems-2026-2027/middle-school/yellowstone_wildlife.csv?sfvrsn=884ed5a9_1',
                type: 'csv',
            },
        ],
    },

    'ms-digital-photography': {
        season: '2026-2027',
        division: 'MS',
        name: 'Digital Photography',
        theme: 'Rainbow Photo Series',
        description: 'Create a digital photo series consisting of seven color photographs. All seven photographs must be connected through one theme, story, location, subject, or idea. The assigned color should be prominent in each image while the complete set should feel cohesive.',
        list: [
            'Red',
            'Orange',
            'Yellow',
            'Green',
            'Blue',
            'Indigo',
            'Violet',
        ],
    },

    'ms-dragster': {
        season: '2026-2027',
        division: 'MS',
        name: 'Dragster',
        status: 'no-theme',
    },

    'ms-drone-challenge-uav': {
        season: '2026-2027',
        division: 'MS',
        name: 'Drone Challenge (UAV)',
        theme: 'Humanitarian Aid and Rescue',
        resources: [
            {
                title: 'Official Theme PDF',
                url: 'https://tsaweb.org/docs/default-source/competitions/themes-and-problems-2026-2027/middle-school/2027-ms-drone-theme.pdf?sfvrsn=26c64b18_1',
                type: 'pdf',
            },
        ],
    },

    'ms-forensic-technology': {
        season: '2026-2027',
        division: 'MS',
        name: 'Forensic Technology',
        description: 'Teams will be assessed on the following forensic skills:',
        list: [
            'Forensic Biology-Genetics',
            'Toxicology',
            'Forensic Psychology',
        ],
    },

    'ms-mass-production': {
        season: '2026-2027',
        division: 'MS',
        name: 'Mass Production',
        theme: 'Automata Box',
    },

    'ms-mechanical-engineering': {
        season: '2026-2027',
        division: 'MS',
        name: 'Mechanical Engineering',
        resources: [
            {
                title: 'Official Problem Statement PDF',
                url: 'https://tsaweb.org/docs/default-source/competitions/themes-and-problems-2026-2027/middle-school/2027-mechanical-engineering-problem.pdf?sfvrsn=cd827ca6_1',
                type: 'pdf',
            },
        ],
    },

    'ms-medical-technology': {
        season: '2026-2027',
        division: 'MS',
        name: 'Medical Technology',
        theme: 'Pulmonological Conditions & Modern Technologies',
        description: 'Teams select a respiratory-related condition and explain it in the display. Teams then select a modern medical technology to feature in the informational pamphlet and multimedia video.',
    },

    'ms-microcontroller-design': {
        season: '2026-2027',
        division: 'MS',
        name: 'Microcontroller Design',
        theme: 'Wearable Technology',
    },

    'ms-off-the-grid': {
        season: '2026-2027',
        division: 'MS',
        name: 'Off the Grid',
        theme: 'Resilient Housing Unit in Cabo San Lucas',
        description: 'A family of six lives in an informal settlement, or colonia, on the outskirts of Cabo San Lucas, Mexico. The family consists of two parents, one grandparent, and three children. Their current home is self-built using salvaged materials. The home is single-level and crowded, with limited privacy. Reliable running water, sewage, electricity, drainage, and waste collection are unavailable.',
        challenge: 'Design a safe, affordable, resilient, single-level housing unit for this multi-generational family. The design should improve comfort, safety, dignity, and long-term livability while responding to the climate, limited infrastructure, and economic conditions.',
        requirements: [
            'Single-level structure',
            'Suitable for a multi-generational family',
            'Passive cooling and natural ventilation',
            'Heat and dust reduction',
            'Resilience against hurricanes and strong winds',
            'Flood and unstable-ground protection',
            'Water collection, storage, and conservation',
            'Sanitation, drainage, and waste management',
            'Affordable and locally available materials when possible',
            'Simple construction and repair methods',
            'Phased / incremental construction',
            'Flexible spaces: privacy, family gathering, sleeping, cooking, daily activities',
            'Scalable design',
        ],
        sections: [
            {
                heading: 'Budget',
                content: 'The budget should reflect what could realistically be afforded by a working family in Cabo San Lucas, accounting for: building materials, water storage, basic sanitation, ventilation, and flood protection.',
            },
        ],
    },

    'ms-prepared-speech': {
        season: '2026-2027',
        division: 'MS',
        name: 'Prepared Speech',
        theme: 'Forward to Fifty',
        description: 'This is the 2027 National TSA Conference theme.',
    },

    'ms-promotional-marketing': {
        season: '2026-2027',
        division: 'MS',
        name: 'Promotional Marketing',
        theme: 'Discover TSA: Open House & Recruitment Night',
        description: 'Create promotional materials to introduce prospective members and families to TSA opportunities. The event includes student demonstrations, interactive STEM activities, competitive event displays, and opportunities to meet TSA members.',
        sections: [
            {
                heading: 'Event Details',
                list: [
                    'Event Name: Discover TSA: Open House & Recruitment Night',
                    'School: Edison Middle School',
                    'Mascot: Emus',
                    'School Colors: Green and White',
                    'Date: Friday, August 1, 2027',
                    'Time: 6:00 p.m. – 8:30 p.m.',
                    'Location: Edison Middle School',
                    'Address: 1840 Innovation Parkway, Orlando, FL 32819',
                ],
            },
            {
                heading: 'Required Design Pieces',
                list: [
                    'Printable Design: A promotional graphic suitable for print and social media.',
                    'Wearable Design: A collectible lapel pin for the Edison TSA chapter.',
                    'Digital Design: An auto-advancing digital welcome presentation highlighting event activities, chapter accomplishments, and TSA opportunities.',
                ],
            },
        ],
    },

    'ms-robotics': {
        season: '2026-2027',
        division: 'MS',
        name: 'Robotics',
        resources: [
            {
                title: 'Official Theme PDF',
                url: 'https://tsaweb.org/docs/default-source/competitions/themes-and-problems-2026-2027/middle-school/2027-robotics-ms.pdf?sfvrsn=b5f63725_2',
                type: 'pdf',
            },
        ],
    },

    'ms-solar-racer': {
        season: '2026-2027',
        division: 'MS',
        name: 'Solar Racer',
        description: '2027 National TSA Conference floor surface: a model solar track placed on top of carpet.',
    },

    'ms-stem-animation': {
        season: '2026-2027',
        division: 'MS',
        name: 'STEM Animation',
        theme: 'Think. Design. Create.',
        description: 'Create an animation centered on the engineering design process.',
    },

    'ms-structural-engineering': {
        season: '2026-2027',
        division: 'MS',
        name: 'Structural Engineering',
        resources: [
            {
                title: 'Design Brief PDF',
                url: 'https://tsaweb.org/docs/default-source/competitions/themes-and-problems-2026-2027/middle-school/2027-ms-structural-engineering-design-brief.pdf?sfvrsn=24b8197d_1',
                type: 'pdf',
            },
            {
                title: 'Verification Form PDF',
                url: 'https://tsaweb.org/docs/default-source/competitions/themes-and-problems-2026-2027/middle-school/ms-structural-engineering-verification-form.pdf?sfvrsn=dcf0cd01_1',
                type: 'pdf',
            },
        ],
    },

    'ms-website-design': {
        season: '2026-2027',
        division: 'MS',
        name: 'Website Design',
        theme: 'Space Exploration Program Website',
        description: 'Design and develop an informational website for a fictitious space exploration program. The website should educate and inspire the general public, especially students of middle-school age.',
        list: [
            'Mission goals',
            'Crew',
            'Technology',
            'Importance for the future of human space exploration',
        ],
    },

    // ──────────────────────────────────────────────────────────────────────
    // HIGH SCHOOL
    // ──────────────────────────────────────────────────────────────────────

    'animatronics': {
        season: '2026-2027',
        division: 'HS',
        name: 'Animatronics',
        theme: 'Turning Classic Tales into a Mechanical Marvel',
        description: 'Bring a story to life following the Animatronics rules.',
    },

    'architectural-design': {
        season: '2026-2027',
        division: 'HS',
        name: 'Architectural Design',
        resources: [
            {
                title: 'Official Design Problem PDF',
                url: 'https://tsaweb.org/docs/default-source/competitions/themes-and-problems-2026-2027/high-school/2027-architecutral-design-problem.pdf?sfvrsn=9f840cf2_1',
                type: 'pdf',
            },
        ],
    },

    'hs-audio-podcasting': {
        season: '2026-2027',
        division: 'HS',
        name: 'Audio Podcasting',
        theme: 'The Debate Desk',
        description: 'Create an audio podcast presenting multiple perspectives on a controversial topic in STEM, society, education, health, or the environment.',
    },

    'biotechnology-design': {
        season: '2026-2027',
        division: 'HS',
        name: 'Biotechnology Design',
        theme: 'Biosensors for Disease Detection',
        description: 'Biosensors use biological molecules, cells, or enzymes to detect chemicals or disease markers.',
        requirements: [
            'Present the science behind biosensors.',
            'Describe one use of biosensor technology for detecting or monitoring disease.',
        ],
    },

    'childrens-stories': {
        season: '2026-2027',
        division: 'HS',
        name: "Children's Stories",
        theme: 'Graphic Novel / Comic Book',
        requirements: [
            'Binding cannot be stapled.',
        ],
    },

    'coding': {
        season: '2026-2027',
        division: 'HS',
        name: 'Coding',
        status: 'no-theme',
    },

    'data-science': {
        season: '2026-2027',
        division: 'HS',
        name: 'Data Science and Analytics',
        theme: 'Climate and Environmental Sustainability',
        description: 'Identify and use one AI-generated dataset related to Climate and Environmental Sustainability for analysis and research. Competitors may use an AI tool to create the dataset.',
        requirements: [
            'Dataset must be in a structured format: CSV, XLSX, or JSON.',
            'Cite the AI tool used.',
            'Cite the model, if available.',
            'Cite the prompts or queries used.',
        ],
        resources: [
            {
                title: 'Scientific Poster Template',
                url: 'https://tsaweb.org/docs/default-source/competitions/themes-and-problems-2025-2026/scientific-poster-template.pptx?sfvrsn=a92c1471_1',
                type: 'pptx',
            },
        ],
    },

    'debating-tech-issues': {
        season: '2026-2027',
        division: 'HS',
        name: 'Debating Technological Issues',
        theme: 'Artificial Intelligence in Medicine',
        description: 'Select one of the following topics for the debate:',
        list: [
            'AI diagnostic tools should be allowed to make medical decisions without final approval from a physician.',
            'The use of AI in healthcare will improve access to care more than it will increase medical bias.',
            'Patients should have the right to know when AI is involved in their diagnosis or treatment plan.',
        ],
    },

    'digital-video-production': {
        season: '2026-2027',
        division: 'HS',
        name: 'Digital Video Production',
        theme: '1990s Infomercial',
        description: 'Create an infomercial with a product and in the style of the 1990s.',
    },

    'dragster-design': {
        season: '2026-2027',
        division: 'HS',
        name: 'Dragster Design',
        theme: 'INSIDE / OUT',
        description: 'One axle, front or rear, must use internal wheels. The opposite axle must use external wheels.',
        sections: [
            {
                heading: 'Internal Wheels',
                content: 'The wheels must be enclosed by the vehicle body on the top and both sides above the axle. The bottom remains exposed.',
            },
            {
                heading: 'External Wheels',
                content: 'The wheels must be completely outside the vehicle body. No body portion may cover any part of the wheel from the top or sides.',
            },
            {
                heading: 'Axle Requirement',
                content: 'Front and rear axles must use opposite configurations. One wheel set must be external and the other internal.',
            },
        ],
    },

    'drone-challenge': {
        season: '2026-2027',
        division: 'HS',
        name: 'Drone Challenge (UAV)',
        theme: 'Humanitarian Aid and Rescue',
        resources: [
            {
                title: 'Official Theme PDF',
                url: 'https://tsaweb.org/docs/default-source/competitions/themes-and-problems-2026-2027/high-school/2027-hs-drone-challenge-theme.pdf?sfvrsn=476818b7_1',
                type: 'pdf',
            },
        ],
    },

    'engineering-design': {
        season: '2026-2027',
        division: 'HS',
        name: 'Engineering Design',
        theme: 'Engineering the Future of Energy',
        description: 'Develop engineering solutions that improve one or more of the following:',
        list: [
            'Generation of energy',
            'Storage of energy',
            'Conservation of energy',
            'Distribution of energy',
            'Use of energy',
        ],
    },

    'fashion-design': {
        season: '2026-2027',
        division: 'HS',
        name: 'Fashion Design and Technology',
        theme: 'Recycled & Repurposed Materials',
        description: 'Create fashion from recycled or repurposed materials.',
        requirements: [
            'One complete outfit.',
            'Maximum of two garments.',
            'Garment accessories are for the semifinal round only.',
        ],
    },

    'geospatial-technology': {
        season: '2026-2027',
        division: 'HS',
        name: 'Geospatial Technology',
        status: 'no-theme',
    },

    'hybrid-racer-xl': {
        season: '2026-2027',
        division: 'HS',
        name: 'Hybrid Racer XL',
        theme: 'Annual Design Requirement',
        description: 'Hybrid Racer XL provides a hands-on opportunity for participants to apply STEM concepts as they design, construct, and race a dual-powered (solar and battery) car.',
        requirements: [
            'The vehicle must hold or pull/drag one 5-ounce fishing weight supplied onsite.',
            'The design must include a hitch at the rear of the car for attaching the weight.',
            '2027 National TSA Conference track surface: a model solar track on top of carpet.',
        ],
        resources: [
            {
                title: 'Reference Weights',
                url: 'https://a.co/d/05yQLCZx',
                type: 'external',
            },
        ],
    },

    'interior-design': {
        season: '2026-2027',
        division: 'HS',
        name: 'Interior Design',
        theme: 'Tiny Living, Big Impact',
        description: 'A nonprofit organization is creating a Tiny Home Community for young adults transitioning into independent living. Students design the interior of one model home.',
        challenge: 'Maximize comfort, storage, and functionality while maintaining affordability. Use innovative space-saving solutions and create a welcoming environment.',
        requirements: [
            'Living area',
            'Kitchenette',
            'Sleeping area',
            'Bathroom',
            'Workspace',
            'Storage',
        ],
        sections: [
            {
                heading: 'Design Considerations',
                list: [
                    'Multifunctional furniture',
                    'Universal Design principles',
                    'Sustainable materials',
                    'Efficient circulation',
                    'Creative storage solutions',
                    'Residential lighting design',
                ],
            },
            {
                heading: 'Budget',
                content: 'Material budget: $28,000.',
            },
        ],
    },

    'manufacturing-prototype': {
        season: '2026-2027',
        division: 'HS',
        name: 'Manufacturing Prototype',
        theme: 'Display or Container for Small Collectible Items',
    },

    'music-production': {
        season: '2026-2027',
        division: 'HS',
        name: 'Music Production',
        theme: 'Boss Battle Soundtrack',
        description: 'Compose an original, dynamic soundtrack for a climactic boss battle in a futuristic or fantasy video game.',
        requirements: [
            'Escalating tension',
            'Creative composition',
            'Sound design',
            'Dramatic contrasts',
            'Powerful climaxes',
            'Support seamless looping during continuous gameplay',
        ],
    },

    'photographic-technology': {
        season: '2026-2027',
        division: 'HS',
        name: 'Photographic Technology',
        theme: 'Behind the Scenes',
    },

    'prepared-presentation': {
        season: '2026-2027',
        division: 'HS',
        name: 'Prepared Presentation',
        theme: 'From Science Fiction to Reality',
        description: 'Many technologies begin as science fiction before becoming reality. Choose one technology that was once considered futuristic and is now used today.',
        requirements: [
            'Describe its development.',
            'Describe its current applications.',
            'Describe how it may continue to evolve.',
        ],
    },

    'promotional-design': {
        season: '2026-2027',
        division: 'HS',
        name: 'Promotional Design',
        theme: 'Milestone Diner',
        description: 'Milestone Diner is a new retro-inspired American diner preparing for its grand opening. Students must create a cohesive visual identity inspired by 1978 while remaining appealing to modern customers.',
        sections: [
            {
                heading: 'Restaurant Details',
                list: [
                    'Restaurant Name: Milestone Diner',
                    'Address: 1978 Celebration Boulevard, Orlando, FL 32819',
                    'Phone: (407) 555-1978',
                    'General Manager: Delmar Olson',
                    'Email: manager@milestonediner.com',
                    'Grand Opening: July 1, 2027',
                ],
            },
            {
                heading: 'Required Design Pieces',
                list: [
                    'Restaurant Logo — 8.5 × 11 inch sheet',
                    'Restaurant Menu — bifold using 11 × 17 inch tabloid paper',
                    'General Manager Business Card — single-sided',
                    'Instagram Grand Opening Advertisement — static 4:5 vertical graphic',
                ],
            },
        ],
    },

    'robotics': {
        season: '2026-2027',
        division: 'HS',
        name: 'Robotics',
        resources: [
            {
                title: 'Official Theme PDF',
                url: 'https://tsaweb.org/docs/default-source/competitions/themes-and-problems-2026-2027/high-school/2027-hs-robotics.pdf?sfvrsn=6c629180_2',
                type: 'pdf',
            },
        ],
    },

    'hs-senior-solar-sprint': {
        season: '2026-2027',
        division: 'HS',
        name: 'Senior Solar Sprint',
        status: 'no-theme',
    },

    'software-development': {
        season: '2026-2027',
        division: 'HS',
        name: 'Software Development',
        theme: 'Educational Software Solution',
        description: 'Develop a software application that improves how people learn, teach, practice, or develop new skills.',
        challenge: 'Identify an educational or training challenge affecting learners of any age and create an engaging, effective, user-centered software solution.',
    },

    'stem-mass-media': {
        season: '2026-2027',
        division: 'HS',
        name: 'STEM Mass Media',
        theme: 'Scientists link human right-handedness to walking upright and brain evolution',
        description: 'Most humans favor their right hand, while other primates do not show the same strong population-wide preference. An Oxford-led study published in PLOS Biology analyzed data from 2,025 individuals across 41 species of monkeys and apes. Researchers compared possible evolutionary explanations for handedness. The findings suggest that as human ancestors became more fully bipedal and developed larger brains, right-handedness became increasingly common.',
        sections: [
            {
                heading: 'Factors Studied',
                list: [
                    'Tool use',
                    'Diet',
                    'Habitat',
                    'Body size',
                    'Social behavior',
                    'Brain size',
                    'Locomotion',
                ],
            },
            {
                heading: 'Your Broadcast Must Include',
                list: [
                    'Introduction of the headline',
                    'Summary of the news story',
                    'Explanation of potential future implications',
                ],
            },
        ],
        resources: [
            {
                title: 'Original Source Article',
                url: 'https://www.eurekalert.org/news-releases/1128472',
                type: 'external',
            },
        ],
    },

    'structural-design': {
        season: '2026-2027',
        division: 'HS',
        name: 'Structural Design and Engineering',
        resources: [
            {
                title: 'Official Problem Statement PDF',
                url: 'https://tsaweb.org/docs/default-source/competitions/themes-and-problems-2026-2027/high-school/2027-structural-design-and-engineering-problem-statement.pdf?sfvrsn=56397e65_1',
                type: 'pdf',
            },
        ],
    },

    'system-control': {
        season: '2026-2027',
        division: 'HS',
        name: 'System Control Technology',
        status: 'no-theme',
    },

    'transportation-modeling': {
        season: '2026-2027',
        division: 'HS',
        name: 'Transportation Modeling',
        theme: 'Cartoon / Comic Vehicles',
    },

    'video-game-design': {
        season: '2026-2027',
        division: 'HS',
        name: 'Video Game Design',
        theme: 'Deep Space RPG',
        description: 'Create a deep space-themed RPG where progression comes primarily from puzzle-solving rather than combat.',
        requirements: [
            'Must include RPG elements: character stats, leveling, branching dialogue.',
            'Traditional combat may not be included.',
            'Players use character skills and stats to solve environmental, logical, and social puzzles.',
            'The setting should involve surviving the dangers of deep space.',
        ],
    },

    'vr-simulation': {
        season: '2026-2027',
        division: 'HS',
        name: 'Virtual Reality Simulation (VR)',
        theme: 'High-Speed First Aid Immersive Simulation',
        description: 'Develop a VR experience that evaluates the user\'s ability to perform life-saving interventions under pressure.',
        sections: [
            {
                heading: 'Possible Emergencies',
                list: [
                    'Anaphylaxis',
                    'Obstructed airway',
                    'Traumatic hemorrhaging',
                ],
            },
            {
                heading: 'Training Mode',
                list: [
                    'Instructional support',
                    'Immediate guidance',
                    'Controlled practice setting',
                ],
            },
            {
                heading: 'Certification Mode',
                list: [
                    'Realistic emergency',
                    'Time pressure',
                    'No assistance',
                ],
            },
            {
                heading: 'Final Product',
                content: 'A performance analytics dashboard summarizing technical proficiency and response efficiency.',
            },
        ],
    },

    'hs-vlogging': {
        season: '2026-2027',
        division: 'HS',
        name: 'Vlogging',
        theme: 'The Butterfly Effect',
        description: 'Small actions can create extraordinary change. Create a connected three-episode vlog series. Maximum total runtime: 6 minutes.',
        challenge: 'The series should explore how one decision, act of kindness, innovation, challenge, or moment can trigger a chain of events that creates meaningful impact.',
        requirements: [
            'Three episodes must form one connected storyline.',
            'Maximum total runtime: 6 minutes.',
            'Include authentic experiences and reflection.',
            'Demonstrate engaging storytelling, creative videography, editing, and presentation.',
        ],
    },

    'webmaster': {
        season: '2026-2027',
        division: 'HS',
        name: 'Webmaster',
        theme: 'Artificial Intelligence (AI) Learning Portal',
        description: 'Design and develop an interactive AI learning portal for high school students in grades 9–12.',
        challenge: 'Demystify AI, teach foundational AI concepts, showcase practical AI tools, and teach effective and ethical academic AI use.',
        requirements: [
            'At least three distinct learning sections covering: fundamental AI concepts, practical AI tools/techniques, and ethical AI usage.',
            'Gamification and progress tracking: digital badges, experience points, or a progress dashboard.',
            'Interface should visually track completion of learning modules.',
        ],
    },


    // ── MISSING / GAP FILLS ──────────────────────────────────────────────

    // Chapter Team — both divisions, no published theme
    'ms-chapter-team': { season: '2026-2027', division: 'MS', name: 'Chapter Team', status: 'no-theme' },
    'chapter-team':    { season: '2026-2027', division: 'HS', name: 'Chapter Team', status: 'no-theme' },

    // MS System Control Technology — no theme
    'ms-system-control': { season: '2026-2027', division: 'MS', name: 'System Control Technology', status: 'no-theme' },

    // Technology Bowl — both divisions, no published theme
    'ms-tech-bowl':   { season: '2026-2027', division: 'MS', name: 'Tech Bowl', status: 'no-theme' },
    'technology-bowl': { season: '2026-2027', division: 'HS', name: 'Technology Bowl', status: 'no-theme' },

    // MS Video Game Design — no published theme
    'ms-video-game-design': { season: '2026-2027', division: 'MS', name: 'Video Game Design', status: 'no-theme' },

    // New HS events — no published theme yet
    'artificial-intelligence-ai': { season: '2026-2027', division: 'HS', name: 'Artificial Intelligence (AI)', status: 'no-theme' },
    'automated-manufacturing-systems': { season: '2026-2027', division: 'HS', name: 'Automated Manufacturing Systems', status: 'no-theme' },
    'hs-cybersecurity': { season: '2026-2027', division: 'HS', name: 'Cybersecurity', status: 'no-theme' },
};

export function getEventTheme(eventId) {
    return EVENT_THEMES[eventId] || null;
}

// Returns true if theme data exists AND is not status:no-theme AND has content
export function hasThemeContent(eventId) {
    const t = EVENT_THEMES[eventId];
    if (!t) return false;
    if (t.status === 'no-theme') return false;
    return !!(t.theme || t.description || t.problemStatement || t.challenge || t.topic || t.list || t.sections || t.requirements || t.resources);
}

// Returns true if the event has PDF/external resources
export function hasThemeResources(eventId) {
    const t = EVENT_THEMES[eventId];
    return !!(t?.resources?.length);
}