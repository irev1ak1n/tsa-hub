import { COST_BAND, TIME_BAND, DIFF_BAND, workPhrase, parseRange, fmtSize } from './events.js';
import { isMissing } from '../guards/dataGuards.js';

// Deterministic two event comparison built only from structured fields.

const TIME_ORDER = { light: 0, medium: 1, heavy: 2, project: 3 };
const COST_ORDER = { '0-25': 0, '25-75': 1, '75-150': 2, '150-300': 3, '300+': 4 };
const DIFF_ORDER = { beginner: 0, challenging: 1, competitive: 2 };

function rank(map, value) {
    return Object.prototype.hasOwnProperty.call(map, value) ? map[value] : null;
}

function compareOn(a, b, { field, order, band, label, noun }) {
    const ra = rank(order, a[field]);
    const rb = rank(order, b[field]);
    if (ra == null || rb == null) {
        return {
            text: `I don't have a ${label} classification for both events, so I can't compare them reliably.`,
            sourceType: 'derived',
            missing: true,
        };
    }
    const aDesc = band[a[field]];
    const bDesc = band[b[field]];
    if (ra === rb) {
        return {
            text: `TSA Hub classifies both ${a.name} and ${b.name} as ${aDesc}, so they are close on ${label}.`,
            sourceType: 'derived',
        };
    }
    const more = ra > rb ? a : b;
    const less = ra > rb ? b : a;
    return {
        text: `${more.name} is the heavier of the two on ${label}. TSA Hub classifies ${more.name} as ${band[more[field]]} and ${less.name} as ${band[less[field]]}.`
            .replace('heavier of the two on cost', 'more expensive of the two'),
        sourceType: 'derived',
    };
}

function compareTeam(a, b) {
    const line = (e) => {
        const el = e.eligibility || {};
        const range = parseRange(el.teamSize);
        if (el.individualOk && (!range || range[0] <= 1)) return `${e.name} allows individual entries`;
        if (range) return `${e.name} requires a team of ${fmtSize(el.teamSize)}`;
        if (el.individualOk) return `${e.name} allows individual entries`;
        return `${e.name} has no team requirement on file`;
    };
    const soloA = a.eligibility?.individualOk;
    const soloB = b.eligibility?.individualOk;
    let verdict = '';
    if (soloA && !soloB) verdict = ` If you want to compete alone, ${a.name} is the one that allows it.`;
    else if (soloB && !soloA) verdict = ` If you want to compete alone, ${b.name} is the one that allows it.`;
    else if (soloA && soloB) verdict = ' Both allow individual entries.';
    return { text: `${line(a)}, and ${line(b)}.${verdict}`, sourceType: 'official' };
}

function compareWork(a, b) {
    const wa = workPhrase(a);
    const wb = workPhrase(b);
    if (!wa || !wb) return { text: `I don't have work type data for both events.`, sourceType: 'derived', missing: true };
    return {
        text: `Based on TSA Hub's work type tags, ${a.name} focuses on ${wa}, while ${b.name} focuses on ${wb}.`,
        sourceType: 'derived',
    };
}

function generalCompare(a, b) {
    const lines = [];
    const wa = workPhrase(a);
    const wb = workPhrase(b);
    if (wa && wb) lines.push(`${a.name} centres on ${wa}, ${b.name} centres on ${wb}.`);
    lines.push(compareTeam(a, b).text);
    if (!isMissing(a.timeBand) && !isMissing(b.timeBand)) {
        lines.push(`Time, TSA Hub rates ${a.name} as ${TIME_BAND[a.timeBand] || 'unclassified'} and ${b.name} as ${TIME_BAND[b.timeBand] || 'unclassified'}.`);
    }
    if (!isMissing(a.difficulty) && !isMissing(b.difficulty)) {
        lines.push(`Difficulty, ${a.name} is ${DIFF_BAND[a.difficulty] || 'unclassified'} and ${b.name} is ${DIFF_BAND[b.difficulty] || 'unclassified'} on TSA Hub's scale.`);
    }
    return { text: lines.join(' '), sourceType: 'mixed' };
}

/**
 * Compare exactly two events on an intent such as compare.time.
 */
export function answerCompare(events, intent) {
    const [a, b] = events || [];
    if (!a || !b) return null;
    switch (intent) {
        case 'compare.difficulty':
            return compareOn(a, b, { field: 'difficulty', order: DIFF_ORDER, band: DIFF_BAND, label: 'difficulty' });
        case 'compare.time':
            return compareOn(a, b, { field: 'timeBand', order: TIME_ORDER, band: TIME_BAND, label: 'time' });
        case 'compare.cost':
            return compareOn(a, b, { field: 'costBand', order: COST_ORDER, band: COST_BAND, label: 'cost' });
        case 'compare.team':
            return compareTeam(a, b);
        case 'compare.work':
            return compareWork(a, b);
        default:
            return generalCompare(a, b);
    }
}
