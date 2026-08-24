import { workPhrase, parseRange, fmtSize } from './events.js';
import { isMissing } from '../guards/dataGuards.js';
import { pick } from '../core/variation.js';

const TIME_ORDER = { light: 0, medium: 1, heavy: 2, project: 3 };
const COST_ORDER = { '0-25': 0, '25-75': 1, '75-150': 2, '150-300': 3, '300+': 4 };
const DIFF_ORDER = { beginner: 0, challenging: 1, competitive: 2 };

const TIME_LABEL = { light: 'a light commitment', medium: 'a moderate commitment', heavy: 'a heavy commitment', project: 'a long-running project' };
const COST_LABEL = { '0-25': 'low cost', '25-75': 'low cost', '75-150': 'moderate cost', '150-300': 'higher cost', '300+': 'expensive' };
const DIFF_LABEL = { beginner: 'beginner-friendly', challenging: 'challenging', competitive: 'highly competitive' };

function rank(map, value) { return Object.prototype.hasOwnProperty.call(map, value) ? map[value] : null; }

function compareOn(a, b, { field, order, label, noun, labelMap }) {
    const ra = rank(order, a[field]);
    const rb = rank(order, b[field]);
    if (ra == null || rb == null) return { text: `I don't have ${noun} info for both events, so I can't compare them reliably.`, sourceType: 'derived', missing: true };
    const aDesc = labelMap[a[field]];
    const bDesc = labelMap[b[field]];
    if (ra === rb) return { text: `TSA Hub classifies both as ${aDesc} on ${noun}, so they're pretty close.`, sourceType: 'derived' };
    const more = ra > rb ? a : b;
    const less = ra > rb ? b : a;
    return { text: `${more.name} is the heavier of the two on ${noun}. TSA Hub puts ${more.name} at ${labelMap[more[field]]} and ${less.name} at ${labelMap[less[field]]}.`, sourceType: 'derived' };
}

function compareTeam(a, b) {
    const line = (e) => {
        const el = e.eligibility || {};
        const range = parseRange(el.teamSize);
        if (el.individualOk && (!range || range[0] <= 1)) return `${e.name} allows individual entries`;
        if (range) return `${e.name} needs a team of ${fmtSize(el.teamSize)}`;
        if (el.individualOk) return `${e.name} allows individual entries`;
        return `${e.name} has no team info on file`;
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
    if (!wa || !wb) return { text: "I don't have work type data for both events.", sourceType: 'derived', missing: true };
    return { text: `${a.name} is more focused on ${wa}, while ${b.name} centres on ${wb}.`, sourceType: 'derived' };
}

function generalCompare(a, b) {
    const lines = [];
    const wa = workPhrase(a);
    const wb = workPhrase(b);
    if (wa && wb) lines.push(`${a.name} focuses on ${wa}, while ${b.name} focuses on ${wb}.`);
    lines.push(compareTeam(a, b).text);
    if (!isMissing(a.timeBand) && !isMissing(b.timeBand)) {
        lines.push(`Time-wise, TSA Hub puts ${a.name} at ${TIME_LABEL[a.timeBand] || 'unclassified'} and ${b.name} at ${TIME_LABEL[b.timeBand] || 'unclassified'}.`);
    }
    if (!isMissing(a.difficulty) && !isMissing(b.difficulty)) {
        lines.push(`${a.name} is ${DIFF_LABEL[a.difficulty] || 'unclassified'} and ${b.name} is ${DIFF_LABEL[b.difficulty] || 'unclassified'} on TSA Hub's scale.`);
    }
    return { text: lines.join(' '), sourceType: 'mixed' };
}

export function answerCompare(events, intent) {
    const [a, b] = events || [];
    if (!a || !b) return null;
    switch (intent) {
        case 'compare.difficulty': return compareOn(a, b, { field: 'difficulty', order: DIFF_ORDER, label: 'difficulty', noun: 'difficulty', labelMap: DIFF_LABEL });
        case 'compare.time': return compareOn(a, b, { field: 'timeBand', order: TIME_ORDER, label: 'time', noun: 'time', labelMap: TIME_LABEL });
        case 'compare.cost': return compareOn(a, b, { field: 'costBand', order: COST_ORDER, label: 'cost', noun: 'cost', labelMap: COST_LABEL });
        case 'compare.team': return compareTeam(a, b);
        case 'compare.work': return compareWork(a, b);
        default: return generalCompare(a, b);
    }
}
