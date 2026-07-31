export const PROGRAMS = [
    { id: 'forward-to-fifty', icon: 'spark', title: 'Forward to Fifty (F2F)', officialUrl: 'https://tsaweb.org/forward-to-fifty' },
    { id: 'awards-scholarships', icon: 'trophy', title: 'Awards and Scholarships', officialUrl: 'https://tsaweb.org/programs/awards-and-scholarships' },
    { id: 'leadership-program', icon: 'users', title: 'Leadership Program', officialUrl: 'https://tsaweb.org/students/leadership' },
    { id: 'national-service-project', icon: 'globe', title: 'National Service Project', officialUrl: 'https://tsaweb.org/programs/national-service-project' },
    { id: 'achievement-program', icon: 'book', title: 'TSA Achievement Program, Pathways to Excellence', officialUrl: 'https://tsaweb.org/programs/tsa-achievement-program' },
];

export function getProgram(id) {
    return PROGRAMS.find((p) => p.id === id) || null;
}