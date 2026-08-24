import { ABOUT_TSA_CONTENT } from '../../../data/aboutTsa.js';
import { ACHIEVEMENT_PROGRAM } from '../../../data/achievementProgram.js';
import { AWARDS_SCHOLARSHIPS } from '../../../data/awardsScholarships.js';
import { LEADERSHIP_PROGRAM } from '../../../data/leadershipProgram.js';
import { pick } from '../core/variation.js';

function lower(s) { return (s || '').toLowerCase(); }

function firstParagraph(page) {
    if (page?.paragraphs?.length) return page.paragraphs[0];
    if (page?.sections?.length && page.sections[0].paragraphs?.length) return page.sections[0].paragraphs[0];
    return null;
}

export function answerGeneral(intent, tokens, seed) {
    switch (intent) {
        case 'general.what-is-tsa': {
            const p = ABOUT_TSA_CONTENT?.['what-is-tsa'];
            if (!p) return null;
            return { text: p.paragraphs.join(' '), sourceType: 'official' };
        }
        case 'general.mission': {
            const p = ABOUT_TSA_CONTENT?.['who-we-are'];
            if (!p) return null;
            const mission = p.sections?.find((s) => lower(s.heading) === 'mission');
            return mission ? { text: 'TSA mission: ' + mission.paragraphs[0], sourceType: 'official' } : null;
        }
        case 'general.divisions': {
            const p = ABOUT_TSA_CONTENT?.['competition-divisions'];
            if (!p) return null;
            return { text: 'TSA has two competition divisions. The Middle School division covers grades 5 through 9. The High School division covers grades 9 through 12. Ninth graders compete in whichever division their school is affiliated with.', sourceType: 'official' };
        }
        case 'general.competitions': {
            const p = ABOUT_TSA_CONTENT?.['tsa-competitions'];
            if (!p) return null;
            return { text: p.paragraphs[0] + (p.sections?.[0]?.list ? ' Categories include ' + p.sections[0].list.slice(0, 4).join(', ') + ', and more.' : ''), sourceType: 'official' };
        }
        case 'general.history': {
            const p = ABOUT_TSA_CONTENT?.['history'];
            if (!p) return null;
            return { text: p.paragraphs[0], sourceType: 'official' };
        }
        case 'general.achievement': {
            if (!ACHIEVEMENT_PROGRAM) return null;
            return { text: ACHIEVEMENT_PROGRAM.description[0] + ' ' + ACHIEVEMENT_PROGRAM.description[1], sourceType: 'official' };
        }
        case 'general.scholarships': {
            if (!AWARDS_SCHOLARSHIPS?.scholarships) return null;
            const names = AWARDS_SCHOLARSHIPS.scholarships.map((s) => s.title).join(', ');
            return { text: `TSA offers these scholarships: ${names}. Check the TSA Student Member Site for applications and deadlines.`, sourceType: 'official' };
        }
        case 'general.awards': {
            if (!AWARDS_SCHOLARSHIPS?.awards) return null;
            const names = AWARDS_SCHOLARSHIPS.awards.items.slice(0, 4).map((a) => a.title).join(', ');
            return { text: `TSA awards include ${names}, and more. ${AWARDS_SCHOLARSHIPS.awards.note || ''}`.trim(), sourceType: 'official' };
        }
        case 'general.leadership': {
            if (!LEADERSHIP_PROGRAM) return null;
            return { text: LEADERSHIP_PROGRAM.description[0], sourceType: 'official' };
        }
        case 'general.how-to-start':
            return { text: pick([
                'Start by talking to your school\'s TSA advisor. They can help you join a chapter and pick your first event. If your school doesn\'t have a chapter, check tsaweb.org for how to start one.',
                'Find out if your school has a TSA chapter. If it does, talk to the advisor about joining and choosing events. If not, visit tsaweb.org to learn how to start one.',
            ], seed), sourceType: 'official' };
        case 'general.how-competitions-work':
            return { text: 'TSA competitions happen at three levels: regional, state, and national. You compete in your chosen events, and top performers advance to the next level. Most events involve either a preconference submission, an on-site challenge, or both.', sourceType: 'official' };
        default:
            return null;
    }
}
