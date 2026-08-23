import { COMPETITION_REQUIREMENTS } from '../../../data/competitionRequirements.js';
import { pick } from '../core/variation.js';
import { isMissing, checkTeamSizeConsistency, CONFLICT_MESSAGE } from '../guards/dataGuards.js';

// Answers about a single event. Official rule fields are stated plainly, TSA Hub
// classifications are always attributed to TSA Hub so they are never mistaken
// for official TSA judgments.

const DERIVED = 'derived';
const OFFICIAL = 'official';

function ok(text, sourceType, extra = {}) {
    return { text, sourceType, ...extra };
}

// Strip a trailing .0 that Supabase numeric columns add.
function fmtSize(ts) {
    if (ts == null) return null;
    const n = Number(ts);
    if (Number.isFinite(n) && String(ts).indexOf('-') === -1) return String(Math.round(n));
    return String(ts);
}

function parseRange(teamSize) {
    const s = fmtSize(teamSize);
    if (!s) return null;
    const range = s.match(/^(\d+)\s*[-–]\s*(\d+)$/);
    if (range) return [Number(range[1]), Number(range[2])];
    const n = Number(s);
    return Number.isFinite(n) ? [n, n] : null;
}

const CAREER_LABELS = {
    software: 'Software & App Development', 'data-science': 'AI, Data & Analytics',
    cybersecurity: 'Cybersecurity & IT', robotics: 'Robotics & Automation',
    aerospace: 'Aerospace & Aviation', 'mechanical-eng': 'Mechanical & Electrical Engineering',
    'civil-eng': 'Civil Engineering & Architecture', manufacturing: 'Manufacturing & Product Design',
    transportation: 'Transportation & Automotive', 'game-dev': 'Game Development & Interactive Media',
    design: 'Web & Graphic Design', 'media-film': 'Film, Video & Audio Production',
    fashion: 'Fashion & Apparel Design', marketing: 'Marketing & Advertising',
    business: 'Business & Leadership', education: 'Education & Communications',
    medicine: 'Medicine & Healthcare', biotech: 'Biotechnology & Life Sciences',
    'research-science': 'Science & Research', government: 'Government & Public Safety',
    ai: 'AI, Data & Analytics', 'electrical-eng': 'Mechanical & Electrical Engineering',
    architecture: 'Civil Engineering & Architecture', 'web-dev': 'Web & Graphic Design',
    'product-design': 'Manufacturing & Product Design',
};

const COST_BAND = {
    '0-25': 'a low cost event', '25-75': 'a low cost event',
    '75-150': 'a moderate cost event', '150-300': 'a higher cost event',
    '300+': 'one of the more expensive events',
};

const TIME_BAND = {
    light: 'a light time commitment', medium: 'a medium time commitment',
    heavy: 'a heavy time commitment', project: 'a long running project',
};

const DIFF_BAND = {
    beginner: 'beginner friendly', challenging: 'challenging', competitive: 'highly competitive',
};

const WORK_LABEL = {
    build: 'building', code: 'coding', design: 'designing', present: 'presenting',
};

function normName(s) {
    return (s || '').replace(/\*+$/, '').trim().toLowerCase();
}

function requirementsTable(pageId, division) {
    const page = (COMPETITION_REQUIREMENTS || []).find((r) => r.id === pageId);
    if (!page || !Array.isArray(page.tables)) return null;
    const heading = division === 'HS' ? 'High School' : 'Middle School';
    return page.tables.find((t) => t.heading === heading) || null;
}

export function preconferenceFor(event) {
    const table = requirementsTable('preconference-submissions', event?.division);
    if (!table || !Array.isArray(table.rows)) return { known: false };
    const row = table.rows.find((r) => normName(r[0]) === normName(event?.name));
    if (!row) return { known: true, items: [] };
    const items = [];
    if ((row[1] || '').trim()) items.push(`${row[1].trim()} (PDF)`);
    if ((row[3] || '').trim()) items.push(`${row[3].trim()} (link)`);
    return { known: true, items };
}

export function advisorApprovalFor(event) {
    const table = requirementsTable('state-advisor-approval-events', event?.division);
    if (!table || !Array.isArray(table.rows)) return { known: false };
    return { known: true, required: table.rows.some((r) => normName(r[0]) === normName(event?.name)) };
}

function teamSentence(event) {
    const el = event?.eligibility || {};
    const range = parseRange(el.teamSize);
    if (el.individualOk && (!range || range[0] <= 1)) {
        return range && range[1] > 1
            ? `allows individual entries, or a team of up to ${range[1]}`
            : 'allows individual entries';
    }
    if (range && el.individualOk) return `is normally a team of ${fmtSize(el.teamSize)}, and individual entries are also permitted`;
    if (range && range[0] === range[1]) return `requires a team of ${range[0]}`;
    if (range) return `requires a team of ${range[0]} to ${range[1]}`;
    if (el.individualOk) return 'allows individual entries';
    return null;
}

function detailLine(event, style) {
    if (style !== 'detailed') return '';
    const bits = [];
    if (event.category) bits.push(`It sits in the ${event.category} category`);
    if (DIFF_BAND[event.difficulty]) bits.push(`TSA Hub classifies it as ${DIFF_BAND[event.difficulty]}`);
    return bits.length ? ` ${bits.join(', ')}.` : '';
}

/**
 * Answer one intent about one event.
 * Returns { text, sourceType, source, missing } or null when unsupported.
 */
export function answerEventIntent(event, intent, { style = 'normal', seed = '' } = {}) {
    if (!event) return null;
    const name = event.name || 'This event';
    const el = event.eligibility || {};

    switch (intent) {
        case 'team.individual': {
            if (isMissing(el.individualOk) && isMissing(el.teamSize)) {
                return { text: `I don't have an official team requirement on file for ${name}.`, sourceType: OFFICIAL, missing: true };
            }
            const conflict = checkTeamSizeConsistency(event);
            if (conflict.conflict) return { text: CONFLICT_MESSAGE, sourceType: OFFICIAL, conflict: true };
            if (el.individualOk) {
                const range = parseRange(el.teamSize);
                const tail = range && range[1] > 1 ? ` You can also enter as a team of ${fmtSize(el.teamSize)}.` : '';
                return ok(pick([
                    `Yes. ${name} allows individual entries.${tail}`,
                    `Yes, you can compete in ${name} on your own.${tail}`,
                    `${name} permits individual competitors, so you can enter alone.${tail}`,
                ], seed + intent), OFFICIAL);
            }
            const range = parseRange(el.teamSize);
            const need = range ? ` It requires a team of ${fmtSize(el.teamSize)}.` : '';
            return ok(pick([
                `No. ${name} does not allow individual entries.${need}`,
                `${name} is a team event, so you cannot enter alone.${need}`,
            ], seed + intent), OFFICIAL);
        }

        case 'team.minimum':
        case 'team.maximum':
        case 'team.exact':
        case 'team.general': {
            const conflict = checkTeamSizeConsistency(event);
            if (conflict.conflict) return { text: CONFLICT_MESSAGE, sourceType: OFFICIAL, conflict: true };
            const sentence = teamSentence(event);
            if (!sentence) return { text: `I don't have an official team size on file for ${name}.`, sourceType: OFFICIAL, missing: true };
            const range = parseRange(el.teamSize);
            if (intent === 'team.minimum' && range) return ok(`${name} needs at least ${range[0]}${range[0] === 1 ? ' competitor' : ' team members'}.`, OFFICIAL);
            if (intent === 'team.maximum' && range) return ok(`${name} allows up to ${range[1]} team members.`, OFFICIAL);
            const extra = style === 'short' ? '' : el.text ? ` Official wording: ${el.text}.` : '';
            return ok(`${name} ${sentence}.${extra}`, OFFICIAL);
        }

        case 'cost.isExpensive':
        case 'cost.general': {
            const band = COST_BAND[event.costBand];
            if (!band) return { text: `I don't have a cost classification for ${name} yet.`, sourceType: DERIVED, missing: true };
            const lead = intent === 'cost.isExpensive'
                ? pick([`${name} is not one of the expensive events.`, `${name} sits on the affordable side.`], seed)
                : '';
            const body = `TSA does not publish a single fixed project price for ${name}. TSA Hub classifies it as ${band} based on typical materials and entry costs.`;
            const cheap = ['0-25', '25-75'].includes(event.costBand);
            if (intent === 'cost.isExpensive' && !cheap) {
                return ok(`TSA Hub classifies ${name} as ${band}, so budget for it early. TSA does not publish one fixed project price.`, DERIVED);
            }
            return ok(intent === 'cost.isExpensive' ? `${lead} ${body}` : body, DERIVED);
        }

        case 'time.general': {
            const band = TIME_BAND[event.timeBand];
            if (!band) return { text: `I don't have a time commitment on file for ${name}.`, sourceType: DERIVED, missing: true };
            return ok(pick([
                `TSA Hub classifies ${name} as ${band}.`,
                `Based on the work involved, TSA Hub rates ${name} as ${band}.`,
            ], seed + intent) + detailLine(event, style), DERIVED);
        }

        case 'difficulty.general': {
            const band = DIFF_BAND[event.difficulty];
            if (!band) return { text: `I don't have a difficulty classification for ${name} yet.`, sourceType: DERIVED, missing: true };
            return ok(pick([
                `TSA Hub classifies ${name} as ${band} based on the work involved.`,
                `On TSA Hub's scale, ${name} is ${band}.`,
            ], seed + intent) + detailLine(event, style), DERIVED);
        }

        case 'overview.general': {
            if (isMissing(event.overview)) {
                const fallback = event.category
                    ? `${name} is a ${event.division === 'HS' ? 'High School' : 'Middle School'} event in the ${event.category} category. I don't have a full description on file yet.`
                    : `I don't have a description on file for ${name} yet.`;
                return { text: fallback, sourceType: OFFICIAL, missing: true };
            }
            if (style === 'short') {
                const first = String(event.overview).split(/(?<=\.)\s/)[0];
                return ok(first, OFFICIAL);
            }
            const head = `${name} is a ${event.division === 'HS' ? 'High School' : 'Middle School'} event in the ${event.category || 'TSA'} category.`;
            const team = teamSentence(event);
            const tail = style === 'detailed' && team ? ` It ${team}.` : '';
            return ok(`${head} ${event.overview}${tail}`, OFFICIAL);
        }

        case 'theme.general': {
            if (isMissing(event.theme)) return { text: `No annual theme is listed for ${name} in my data.`, sourceType: OFFICIAL, missing: true };
            return ok(`This season's theme for ${name}: ${event.theme}`, OFFICIAL, { season: event.season });
        }

        case 'category.general':
            if (isMissing(event.category)) return { text: `I don't have a category on file for ${name}.`, sourceType: OFFICIAL, missing: true };
            return ok(`${name} is in the ${event.category} category.`, OFFICIAL);

        case 'division.general':
            return ok(`${name} is offered in the ${event.division === 'HS' ? 'High School' : 'Middle School'} division.`, OFFICIAL);

        case 'career.general': {
            const careers = [...new Set(Object.entries(event.careers || {})
                .sort((a, b) => b[1] - a[1])
                .map(([k]) => CAREER_LABELS[k] || k))];
            if (!careers.length) return { text: `I don't have career tags for ${name} yet.`, sourceType: DERIVED, missing: true };
            const list = careers.slice(0, style === 'short' ? 2 : 4).join(', ');
            return ok(`TSA Hub links ${name} to careers in ${list}.`, DERIVED);
        }

        case 'eligibility.general':
            if (isMissing(el.text)) return { text: `I don't have the official eligibility wording for ${name}.`, sourceType: OFFICIAL, missing: true };
            return ok(`Official eligibility for ${name}: ${el.text}.`, OFFICIAL);

        case 'preconference.general': {
            const pre = preconferenceFor(event);
            if (!pre.known) return { text: `I don't have preconference submission data loaded for ${name}.`, sourceType: OFFICIAL, missing: true };
            if (!pre.items.length) return ok(`${name} has no preconference submission listed.`, OFFICIAL);
            return ok(`${name} preconference submission: ${pre.items.join(' + ')}.`, OFFICIAL);
        }

        case 'advisor.general': {
            const adv = advisorApprovalFor(event);
            if (!adv.known) return { text: `I don't have state advisor approval data loaded for ${name}.`, sourceType: OFFICIAL, missing: true };
            return ok(adv.required
                ? `${name} requires state advisor approval before you register.`
                : `${name} does not require state advisor approval.`, OFFICIAL);
        }

        case 'material.general':
            if (isMissing(event.materials)) return { text: `I don't have a materials list for ${name}.`, sourceType: OFFICIAL, missing: true };
            return ok(`${name} materials: ${event.materials}.`, OFFICIAL);

        default:
            return null;
    }
}

// Short phrase describing what a student actually does, from projectType.
export function workPhrase(event) {
    const types = Array.isArray(event?.projectType) ? event.projectType : [];
    const labels = types.map((t) => WORK_LABEL[t]).filter(Boolean);
    if (!labels.length) return null;
    if (labels.length === 1) return labels[0];
    return `${labels.slice(0, -1).join(', ')} and ${labels[labels.length - 1]}`;
}

export { CAREER_LABELS, COST_BAND, TIME_BAND, DIFF_BAND, fmtSize, parseRange };
