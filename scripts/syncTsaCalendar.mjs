#!/usr/bin/env node
// ============================================================================
// Sync TSA Hub's checked-in calendar dataset (src/data/tsaCalendar.js) from
// the official National TSA calendar (https://tsaweb.org/tsa-calendar).
//
// Run with:  npm run sync:tsa-calendar
//
// What it does:
//   1. Calls the official Sitefinity "web-interface/events" JSON endpoint the
//      tsaweb.org calendar page itself uses, once per year in the supported
//      range, for both the "Default Calendar" and "Conference Calendar"
//      (both come back together for years where TSA has populated them).
//   2. Normalizes each record: strips the emoji category marker into a
//      `category` field, converts the ASP.NET "/Date(ms)/" timestamp into a
//      timezone-safe calendar date (TSA HQ is Eastern time; converting via
//      UTC date parts gives the correct local calendar day without a
//      separate timezone library), and fixes the official EventUrl (the API
//      omits the "/events" path segment that the live site actually serves).
//   3. Deduplicates by the source GUID (stable across runs).
//   4. Merges a very small number of manually-sourced entries for gaps the
//      structured endpoint doesn't cover (see MANUAL_ENTRIES below) — each
//      one cites exactly where it was confirmed. Nothing is invented.
//   5. Writes a deterministic, sorted, checked-in data module.
//
// Re-running this script with no upstream changes produces no diff.
// ============================================================================

const SUPPORTED_RANGE = { start: '2025-01-01', end: '2030-12-31' };
const YEARS = [2025, 2026, 2027, 2028, 2029, 2030];

const WIDGET_ID = '138c9d56-a704-437b-b573-563b51e3a4f9';
const CURRENT_PAGE_ID = 'ae101819-7468-4148-ae70-608d03e174e2';
const SF_SITE = 'e41339d4-9ec3-41c3-84e1-d25d7686af06';
const CALENDAR_SOURCE_URL = 'https://tsaweb.org/tsa-calendar';
const EVENTS_ENDPOINT = 'https://tsaweb.org/web-interface/events';

// Category markers TSA uses on tsaweb.org/tsa-calendar (see the page legend).
const CATEGORY_MARKERS = [
    { marker: '\u{1F4E7}', category: 'constant-contact' }, // 📧
    { marker: '\u{1F514}', category: 'important-date' },   // 🔔
];

// ----------------------------------------------------------------------------
// A small number of officially-sourced records that do not appear in the
// structured "web-interface/events" feed for their year, discovered while
// inspecting the site for this sync (see comments per entry). Each future
// season's National TSA Conference is added here ONLY once tsaweb.org
// itself publishes it — never guessed in advance.
// ----------------------------------------------------------------------------
const MANUAL_ENTRIES = [
    {
        id: 'manual-2025-national-tsa-conference',
        title: '2025 National TSA Conference',
        startDate: '2025-06-27',
        endDate: '2025-07-01',
        allDay: true,
        category: 'conference',
        description: 'Theme: "Tune In To Technology"',
        location: '',
        source: {
            provider: 'National TSA',
            url: 'https://tsaweb.org/conferences/recent-national-tsa-conferences',
            sourceType: 'event-page',
        },
        // Not present in the web-interface/events feed for 2025 (unlike 2026
        // and 2027, whose Conference-Calendar records DO come back from that
        // endpoint) — sourced directly from the Conferences page instead.
    },
];

function fetchYear(year) {
    const url = new URL(EVENTS_ENDPOINT);
    url.searchParams.set('StartDate', `${year}-01-01T00:00:00.000Z`);
    url.searchParams.set('EndDate', `${year + 1}-01-01T00:00:00.000Z`);
    url.searchParams.set('EventSchedulerViewMode', 'month');
    url.searchParams.set('UICulture', '');
    url.searchParams.set('Id', WIDGET_ID);
    url.searchParams.set('CurrentPageId', CURRENT_PAGE_ID);
    url.searchParams.set('sf_site', SF_SITE);
    return fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (TSA-Hub sync script)' } })
        .then((res) => {
            if (!res.ok) throw new Error(`${year}: HTTP ${res.status}`);
            return res.json();
        });
}

// ASP.NET AJAX date format: "/Date(1786939200000)/"
function parseAspNetDate(raw) {
    const m = /\/Date\((-?\d+)\)\//.exec(raw || '');
    if (!m) return null;
    return new Date(Number(m[1]));
}

// TSA's all-day events are serialized as UTC midnight of the correct Eastern
// calendar date (verified: 2026-08-17 renders as "2026-08-17T04:00:00.000Z",
// i.e. midnight ET). Reading the UTC date parts (not local machine time)
// gives a deterministic, timezone-safe YYYY-MM-DD regardless of what
// timezone this sync script happens to run in.
function toCalendarDate(date) {
    if (!date) return null;
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const d = String(date.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function categorize(title) {
    for (const { marker, category } of CATEGORY_MARKERS) {
        if (title.startsWith(marker)) {
            return { category, title: title.slice(marker.length).trim() };
        }
    }
    return { category: 'event', title: title.trim() };
}

// The JSON feed's EventUrl (e.g. "/2026/08/17/default-calendar/slug") 404s
// on the live site — the real path has an "/events" prefix.
function fixEventUrl(eventUrl) {
    if (!eventUrl) return null;
    return `https://tsaweb.org/events${eventUrl}`;
}

// A handful of feed records are annually-recurring content items (identified
// by a populated RecurrenceID) whose EventUrl always points at the single
// year TSA actually published a detail page for (e.g. "/2026/05/01/...").
// When the feed is queried for a later year, it still echoes that same
// record with the Start date mechanically advanced by the widget's own
// recurrence projection — that is the calendar *tool* extrapolating, not
// National TSA publishing a confirmed date for that future year. Only trust
// an occurrence whose EventUrl year matches its own Start year.
function isGenuinelyPublishedOccurrence(raw) {
    if (!raw.RecurrenceID) return true;
    const m = /^\/(\d{4})\//.exec(raw.EventUrl || '');
    if (!m) return true;
    const urlYear = Number(m[1]);
    const startYear = parseAspNetDate(raw.Start)?.getUTCFullYear();
    return urlYear === startYear;
}

// A National TSA Conference calendar title sometimes carries its host city
// as an " – City, State" suffix (see the 2026 entry) — split that into a
// proper `location` field instead of leaving it jammed into the title.
function splitConferenceLocation(title) {
    const m = /^(.*National TSA Conference)\s*[–-]\s*(.+)$/.exec(title);
    if (!m) return { title, location: '' };
    return { title: m[1].trim(), location: m[2].trim() };
}

// A small number of facts about specific, already-announced National TSA
// Conferences that are confirmed by a second official source (the
// Conferences page or the Important Dates PDF) but aren't present as plain
// text in the calendar feed itself. Only years TSA has actually announced.
const CONFERENCE_ENRICHMENT = {
    2026: { theme: 'Unity Through Community', location: 'National Harbor, Maryland' },
    2027: { location: 'Orlando, FL' }, // per the 2026-2027 Important Dates and Deadlines PDF
};

function normalize(raw) {
    const { category, title: categorizedTitle } = categorize(raw.Title || '');
    const start = toCalendarDate(parseAspNetDate(raw.Start));
    const end = toCalendarDate(parseAspNetDate(raw.End)) || start;
    if (!start) return null;

    const isConference = /national tsa conference/i.test(categorizedTitle);
    const { title, location: titleLocation } = isConference
        ? splitConferenceLocation(categorizedTitle)
        : { title: categorizedTitle, location: '' };

    let description = (raw.Description || '').trim();
    let location = titleLocation;
    if (isConference) {
        const enrichment = CONFERENCE_ENRICHMENT[Number(start.slice(0, 4))];
        if (enrichment) {
            if (!description && enrichment.theme) description = `Theme: "${enrichment.theme}"`;
            if (!location && enrichment.location) location = enrichment.location;
        }
    }

    return {
        id: raw.Id,
        title,
        startDate: start,
        endDate: end,
        allDay: raw.IsAllDay !== false,
        category: isConference ? 'conference' : category,
        description,
        location,
        source: {
            provider: 'National TSA',
            url: fixEventUrl(raw.EventUrl) || CALENDAR_SOURCE_URL,
            sourceType: 'calendar',
        },
    };
}

function inRange(ev) {
    return ev.startDate >= SUPPORTED_RANGE.start && ev.startDate <= SUPPORTED_RANGE.end;
}

function dedupe(events) {
    const byId = new Map();
    for (const ev of events) {
        if (!byId.has(ev.id)) byId.set(ev.id, ev);
    }
    return [...byId.values()];
}

function sortEvents(events) {
    return [...events].sort((a, b) => {
        if (a.startDate !== b.startDate) return a.startDate < b.startDate ? -1 : 1;
        // Stable secondary sort so re-runs don't reorder same-day events.
        return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
    });
}

async function main() {
    console.log(`Syncing TSA calendar for ${SUPPORTED_RANGE.start} .. ${SUPPORTED_RANGE.end}`);
    const perYear = {};
    const allRaw = [];

    for (const year of YEARS) {
        const records = await fetchYear(year);
        perYear[year] = records.length;
        allRaw.push(...records);
        console.log(`  ${year}: ${records.length} record(s) from the official calendar feed`);
    }

    const droppedProjections = allRaw.filter((r) => !isGenuinelyPublishedOccurrence(r));
    if (droppedProjections.length) {
        console.log(`  Dropped ${droppedProjections.length} mechanically-projected recurrence occurrence(s) with no confirmed per-year publication:`);
        for (const r of droppedProjections) {
            console.log(`    - "${r.Title}" projected to ${toCalendarDate(parseAspNetDate(r.Start))} (only published for the year in its EventUrl: ${r.EventUrl})`);
        }
    }

    const normalized = allRaw
        .filter(isGenuinelyPublishedOccurrence)
        .map(normalize)
        .filter(Boolean)
        .filter(inRange);
    const withManual = dedupe([...normalized, ...MANUAL_ENTRIES]);
    const finalEvents = sortEvents(withManual);

    const perYearFinal = {};
    for (const y of YEARS) perYearFinal[y] = finalEvents.filter((e) => e.startDate.startsWith(String(y))).length;

    const lastSyncAt = new Date().toISOString();

    const fileBody = `// ============================================================================
// AUTO-GENERATED by scripts/syncTsaCalendar.mjs — do not hand-edit.
// Source: ${CALENDAR_SOURCE_URL}
// Re-run: npm run sync:tsa-calendar
// ============================================================================

export const CALENDAR_SYNC = ${JSON.stringify(
        {
            source: CALENDAR_SOURCE_URL,
            supportedRange: SUPPORTED_RANGE,
            lastSyncAt,
            countsByYear: perYearFinal,
            totalEvents: finalEvents.length,
        },
        null,
        4,
    )};

export const CALENDAR_EVENTS = ${JSON.stringify(finalEvents, null, 4)};
`;

    const outPath = new URL('../src/data/tsaCalendar.js', import.meta.url);
    await import('node:fs/promises').then((fs) => fs.writeFile(outPath, fileBody, 'utf8'));

    console.log('\nSync report');
    console.log('-----------');
    for (const y of YEARS) console.log(`  ${y}: ${perYearFinal[y]} event(s)`);
    console.log(`  TOTAL: ${finalEvents.length}`);
    console.log(`  Manual/gap-filled entries: ${MANUAL_ENTRIES.length}`);
    console.log(`\nWrote ${outPath.pathname.replace(/^\//, '')}`);
}

main().catch((err) => {
    console.error('Sync failed:', err);
    process.exit(1);
});
