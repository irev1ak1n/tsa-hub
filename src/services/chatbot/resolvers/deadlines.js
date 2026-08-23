import { datesForState, NATIONALS } from '../../../data/meta.js';

function fmt(iso) {
    return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function daysUntil(iso) {
    const now = new Date(); now.setHours(0,0,0,0);
    return Math.ceil((new Date(iso + 'T00:00:00') - now) / 86400000);
}

function daysLabel(n) {
    if (n < 0) return `${Math.abs(n)} days ago`;
    if (n === 0) return 'today';
    if (n === 1) return 'tomorrow';
    return `${n} days away`;
}

export function answerDeadline(intent, { state: userState } = {}) {
    const stateName = userState || null;
    const d = datesForState(stateName);

    switch (intent) {
        case 'deadline.regionals': {
            const label = stateName || 'your state (default dates)';
            return { text: `Regionals for ${label}: ${fmt(d.regionals)}, ${daysLabel(daysUntil(d.regionals))}.`, sourceType: 'official' };
        }
        case 'deadline.states': {
            const label = stateName || 'your state (default dates)';
            return { text: `State conference for ${label}: ${fmt(d.states)}, ${daysLabel(daysUntil(d.states))}.${!stateName ? ' Set your state in Settings for exact dates.' : ''}`, sourceType: 'official' };
        }
        case 'deadline.nationals':
            return { text: `${NATIONALS.name}: ${fmt(NATIONALS.date)}, ${daysLabel(daysUntil(NATIONALS.date))}. ${NATIONALS.note || ''}`.trim(), sourceType: 'official' };
        case 'deadline.all': {
            const label = stateName || 'default';
            const lines = [
                `Regionals (${label}): ${fmt(d.regionals)}, ${daysLabel(daysUntil(d.regionals))}`,
                `State conference (${label}): ${fmt(d.states)}, ${daysLabel(daysUntil(d.states))}`,
                `${NATIONALS.name}: ${fmt(NATIONALS.date)}, ${daysLabel(daysUntil(NATIONALS.date))}`,
            ];
            return { text: lines.join('. ') + '.', sourceType: 'official' };
        }
        default:
            return null;
    }
}
