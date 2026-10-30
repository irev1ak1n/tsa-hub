// Official TSA dates shown (read-only) beside a student's own milestones in
// an event workspace. They come from the same sources as the Calendar screen:
// the National TSA calendar feed and the verified state conference list.

import { CALENDAR_EVENTS } from './tsaCalendar.js';
import { STATE_CONFERENCE_EVENTS } from './stateConferenceDates.js';

export const OFFICIAL_CALENDAR_URL = 'https://tsaweb.org/tsa-calendar';

const SEASON_START = '2026-08-01';
const SEASON_END = '2027-07-31';

// Conference-registration style deadlines that apply to competitors in any
// event. Meeting-room, refund, scholarship and similar dates are left out.
const COMPETITOR_DATE = /(conference registration opens|participant conference registration deadline|competition component upload platform)/i;

function toItem(row, kind) {
    return {
        id: `official-${row.id}`,
        title: row.title,
        startDate: row.startDate,
        endDate: row.endDate || row.startDate,
        kind,
        url: row.source?.url || OFFICIAL_CALENDAR_URL,
        provider: row.source?.provider || 'National TSA',
    };
}

export function officialDeadlinesFor({ stateName } = {}) {
    const inSeason = (row) => row.startDate >= SEASON_START && row.startDate <= SEASON_END;
    const items = [];

    for (const row of CALENDAR_EVENTS) {
        if (!inSeason(row)) continue;
        if (row.category === 'event' && COMPETITOR_DATE.test(row.title)) items.push(toItem(row, 'deadline'));
        else if (row.category === 'conference' && /national tsa conference/i.test(row.title)) items.push(toItem(row, 'conference'));
    }

    if (stateName) {
        const prefix = `${stateName} TSA `;
        for (const row of STATE_CONFERENCE_EVENTS) {
            if (inSeason(row) && row.title.startsWith(prefix)) items.push(toItem(row, 'state'));
        }
    }

    return items.sort((a, b) => a.startDate.localeCompare(b.startDate) || a.title.localeCompare(b.title));
}
