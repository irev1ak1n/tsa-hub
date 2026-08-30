import { datesForState, NATIONALS, formatDate, formatDateRange } from '../../../data/meta.js';

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

function fmtExact(iso) {
    return `${formatDate(iso)}, ${daysLabel(daysUntil(iso))}`;
}

// Coach must never upgrade uncertain data into an exact date, and never
// expose internal status words to the user — every branch below is natural
// language a student would actually read.
function regionalsText(d, stateName) {
    if (d.status === 'exact') return `Regionals for ${stateName || 'your state'}: ${fmtExact(d.date)}.`;
    if (d.status === 'window') {
        return `${stateName || 'Your state'} regional conferences are expected during ${d.label}. Exact dates have not been officially announced yet. We'll update TSA Hub when official dates are published.`;
    }
    return `Verified regional conference dates aren't available in TSA Hub yet${stateName ? ` for ${stateName}` : ''}.`;
}

function statesText(d, stateName) {
    if (d.status === 'exact') return `State conference for ${stateName || 'your state'}: ${fmtExact(d.date)}.`;
    if (d.status === 'window') {
        return `${stateName ? `Your ${stateName}` : 'Your'} state conference is expected during ${d.label}. Exact dates have not been officially announced yet.`;
    }
    return `Your ${stateName ? `${stateName} ` : ''}state conference is expected in spring ${NATIONALS.year}. Exact dates have not been officially announced yet.`;
}

function nationalsText() {
    if (NATIONALS.startDate) {
        return `The ${NATIONALS.year} National TSA Conference is scheduled for ${formatDateRange(NATIONALS.startDate, NATIONALS.endDate)}, ${daysLabel(daysUntil(NATIONALS.startDate))}.`;
    }
    return `TSA Hub doesn't currently have verified National TSA Conference dates for ${NATIONALS.year}.`;
}

export function answerDeadline(intent, { state: userState } = {}) {
    const stateName = userState || null;
    const d = datesForState(stateName);

    switch (intent) {
        case 'deadline.regionals':
            return { text: regionalsText(d.regionals, stateName), sourceType: 'official' };
        case 'deadline.states':
            return { text: statesText(d.states, stateName), sourceType: 'official' };
        case 'deadline.nationals':
            return { text: nationalsText(), sourceType: 'official' };
        case 'deadline.all': {
            const lines = [regionalsText(d.regionals, stateName), statesText(d.states, stateName), nationalsText()];
            return { text: lines.join(' '), sourceType: 'official' };
        }
        default:
            return null;
    }
}
