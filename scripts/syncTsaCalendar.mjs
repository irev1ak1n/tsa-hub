#!/usr/bin/env node
// ============================================================================
// Sync TSA Hub's checked-in calendar dataset (src/data/tsaCalendar.js) from
// the official National TSA calendar (https://tsaweb.org/tsa-calendar).
//
// Run with:  npm run sync:tsa-calendar
//
// What it does:
//   1. Explicitly traverses every CALENDAR MONTH in SUPPORTED_RANGE (below),
//      one request per month, calling the same official Sitefinity
//      "web-interface/events" JSON endpoint the tsaweb.org calendar page
//      itself uses when a visitor clicks Previous/Next. This does NOT rely
//      on a single wide-range request "probably" covering everything, or on
//      the currently-visible browser month — every month in the configured
//      range gets its own request and its own explicit FETCHED_WITH_EVENTS /
//      FETCHED_EMPTY / FETCH_FAILED status (see runAudit() and the printed
//      coverage report). A month that errors is retried once before being
//      recorded as failed — it is never silently treated as empty.
//   2. Normalizes each record: strips the emoji category marker into a
//      `category` field, converts the ASP.NET "/Date(ms)/" timestamp into a
//      timezone-safe calendar date (TSA HQ is Eastern time; converting via
//      UTC date parts gives the correct local calendar day without a
//      separate timezone library), and fixes the official EventUrl (the API
//      omits the "/events" path segment that the live site actually serves).
//   3. Deduplicates by the source GUID (stable across runs, and across the
//      unavoidable overlap where a multi-day event or a recurring item shows
//      up in more than one month's request).
//   4. Merges a very small number of manually-sourced entries for gaps the
//      structured endpoint doesn't cover (see MANUAL_ENTRIES below) — each
//      one cites exactly where it was confirmed. Nothing is invented, and no
//      future year/month is ever assumed to be empty without a request that
//      actually returned zero records for it.
//   5. Writes a deterministic, sorted, checked-in data module and prints a
//      full year/month coverage audit plus a before/after comparison against
//      whatever was previously checked in.
//
// Re-running this script with no upstream changes produces no diff (besides
// lastSyncAt).
// ============================================================================

import { readFile, writeFile } from 'node:fs/promises';

// ----------------------------------------------------------------------------
// Centralized range configuration. Extending coverage (e.g. adding 2031)
// means changing this one value — nothing else in the script, the importer,
// or the audit format needs to change.
// ----------------------------------------------------------------------------
const SUPPORTED_RANGE = { start: '2025-01-01', end: '2030-12-31' };
const START_YEAR = Number(SUPPORTED_RANGE.start.slice(0, 4));
const END_YEAR = Number(SUPPORTED_RANGE.end.slice(0, 4));

const WIDGET_ID = '138c9d56-a704-437b-b573-563b51e3a4f9';
const CURRENT_PAGE_ID = 'ae101819-7468-4148-ae70-608d03e174e2';
const SF_SITE = 'e41339d4-9ec3-41c3-84e1-d25d7686af06';
const CALENDAR_SOURCE_URL = 'https://tsaweb.org/tsa-calendar';
const EVENTS_ENDPOINT = 'https://tsaweb.org/web-interface/events';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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

// ----------------------------------------------------------------------------
// Month traversal — one request per calendar month across the whole range.
// ----------------------------------------------------------------------------
function monthRange(year, month /* 0-11 */) {
    const start = new Date(Date.UTC(year, month, 1));
    const end = new Date(Date.UTC(year, month + 1, 1));
    return { start, end };
}

function* eachMonth(startYear, endYear) {
    for (let y = startYear; y <= endYear; y++) {
        for (let m = 0; m < 12; m++) yield { year: y, month: m };
    }
}

async function fetchMonthOnce(year, month) {
    const { start, end } = monthRange(year, month);
    const url = new URL(EVENTS_ENDPOINT);
    url.searchParams.set('StartDate', start.toISOString());
    url.searchParams.set('EndDate', end.toISOString());
    url.searchParams.set('EventSchedulerViewMode', 'month');
    url.searchParams.set('UICulture', '');
    url.searchParams.set('Id', WIDGET_ID);
    url.searchParams.set('CurrentPageId', CURRENT_PAGE_ID);
    url.searchParams.set('sf_site', SF_SITE);
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (TSA-Hub sync script)' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = await res.json();
    if (!Array.isArray(body)) throw new Error('Unexpected non-array response');
    return body;
}

// Fetches every month in the range, retrying a single failure once before
// recording it as FETCH_FAILED. Never treats a failed request as empty.
async function runMonthlyAudit() {
    const months = [];
    const rawByMonth = [];

    for (const { year, month } of eachMonth(START_YEAR, END_YEAR)) {
        let records = null;
        let attempts = 0;
        let lastError = null;
        while (attempts < 2 && records === null) {
            attempts++;
            try {
                records = await fetchMonthOnce(year, month);
            } catch (err) {
                lastError = err;
            }
        }

        if (records === null) {
            months.push({ year, month, status: 'FETCH_FAILED', count: 0, error: String(lastError) });
        } else {
            months.push({ year, month, status: records.length > 0 ? 'FETCHED_WITH_EVENTS' : 'FETCHED_EMPTY', count: records.length });
            rawByMonth.push(...records);
        }
    }

    return { months, rawRecords: rawByMonth };
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
// by a populated RecurrenceID) whose EventUrl still points at the single
// year TSA originally published a detail page for (e.g. "/2026/05/01/...")
// even when the feed is queried for a later year — the Start date is
// mechanically advanced by the widget's own recurrence projection while the
// linked detail page stays put.
//
// An earlier version of this script excluded these on the theory that an
// EventUrl/Start year mismatch meant the *tool* was extrapolating rather
// than National TSA actually publishing the date. That was verified wrong
// during this range-completeness pass: navigating the live
// https://tsaweb.org/tsa-calendar UI to May 2028 (and confirmed again via
// direct API query for May 2029 and May 2030) shows these exact two
// recurring entries rendered on the calendar every year checked — i.e. the
// live official calendar itself displays them, so excluding them from TSA
// Hub would make TSA Hub *disagree* with the source it's supposed to
// mirror. The EventUrl simply never got a fresh per-year detail page;
// that's a static-content gap on National TSA's side, not evidence the
// date itself isn't genuinely on their public calendar. Every occurrence
// the API returns for a month in the configured range is trusted as-is.
function isGenuinelyPublishedOccurrence() {
    return true;
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

    // A handful of items (see isGenuinelyPublishedOccurrence's comment) are
    // annually-recurring content that the API returns under the SAME raw Id
    // for every year's occurrence, with only the Start date advancing. Each
    // year is a genuinely distinct calendar entry the live site displays —
    // composing the id with its own date for JUST this class of item keeps
    // them as separate local events instead of collapsing several years of
    // one recurring deadline into a single record, while every ordinary
    // (non-recurring) event keeps its plain, stable raw id across syncs.
    // This also correctly re-collapses the one real duplicate case: the
    // same occurrence showing up in two adjacent months' queries when
    // TSA's server treats a month boundary as date-inclusive rather than
    // instant-exclusive (e.g. May 1's record is returned by both April's
    // and May's request) — same id, same date, so it still dedupes to one.
    const id = raw.RecurrenceID ? `${raw.Id}:${start}` : raw.Id;

    return {
        id,
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

async function loadPreviousDataset() {
    try {
        const outPath = new URL('../src/data/tsaCalendar.js', import.meta.url);
        const mod = await import(`${outPath.href}?t=${Date.now()}`);
        return mod.CALENDAR_EVENTS || [];
    } catch {
        return [];
    }
}

function latestDate(events) {
    if (events.length === 0) return null;
    return events.reduce((max, e) => (e.startDate > max ? e.startDate : max), events[0].startDate);
}

async function main() {
    console.log(`Syncing TSA calendar for ${SUPPORTED_RANGE.start} .. ${SUPPORTED_RANGE.end}`);
    console.log(`Traversing ${(END_YEAR - START_YEAR + 1) * 12} months, one official request per month...\n`);

    const previousEvents = await loadPreviousDataset();
    const oldTotal = previousEvents.length;
    const oldLatest = latestDate(previousEvents);

    const { months, rawRecords } = await runMonthlyAudit();

    const droppedProjections = rawRecords.filter((r) => !isGenuinelyPublishedOccurrence(r));
    const genuineRaw = rawRecords.filter(isGenuinelyPublishedOccurrence);

    const normalized = genuineRaw.map(normalize).filter(Boolean).filter(inRange);
    const withManual = dedupe([...normalized, ...MANUAL_ENTRIES]);
    const finalEvents = sortEvents(withManual);

    const previousIds = new Set(previousEvents.map((e) => e.id));
    const newlyAdded = finalEvents.filter((e) => !previousIds.has(e.id)).length;
    const retained = finalEvents.length - newlyAdded;
    // "Duplicates prevented" = raw records collapsed by id dedupe (the same
    // official event appearing in more than one month's overlapping window,
    // or projected recurrences already filtered above).
    const duplicatesPrevented = genuineRaw.length + MANUAL_ENTRIES.length - finalEvents.length;

    const perYearFinal = {};
    for (let y = START_YEAR; y <= END_YEAR; y++) perYearFinal[y] = finalEvents.filter((e) => e.startDate.startsWith(String(y))).length;

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
    await writeFile(outPath, fileBody, 'utf8');

    // ------------------------------------------------------------------------
    // Coverage audit — every month explicitly accounted for.
    // ------------------------------------------------------------------------
    console.log('Coverage audit');
    console.log('--------------');
    let expected = 0;
    let fetched = 0;
    let withEvents = 0;
    let confirmedEmpty = 0;
    let failed = 0;
    for (let y = START_YEAR; y <= END_YEAR; y++) {
        console.log(`\n${y}`);
        for (let m = 0; m < 12; m++) {
            const rec = months.find((x) => x.year === y && x.month === m);
            expected++;
            if (rec.status === 'FETCH_FAILED') {
                failed++;
                console.log(`  ${MONTH_NAMES[m]}: FAILED (${rec.error})`);
            } else {
                fetched++;
                if (rec.status === 'FETCHED_WITH_EVENTS') withEvents++;
                else confirmedEmpty++;
                console.log(`  ${MONTH_NAMES[m]}: fetched, ${rec.count} record(s)`);
            }
        }
    }

    console.log('\nTotals');
    console.log('------');
    console.log(`Months expected: ${expected}`);
    console.log(`Months fetched successfully: ${fetched}`);
    console.log(`Months with events: ${withEvents}`);
    console.log(`Months confirmed empty: ${confirmedEmpty}`);
    console.log(`Months failed: ${failed}`);
    console.log(`\nOfficial events discovered (raw, before dedupe): ${rawRecords.length}`);
    console.log(`Dropped mechanically-projected recurrence occurrences: ${droppedProjections.length}`);
    console.log(`New events added locally: ${newlyAdded}`);
    console.log(`Existing events retained/merged: ${retained}`);
    console.log(`Duplicates prevented: ${duplicatesPrevented}`);

    console.log('\nBefore / after');
    console.log('---------------');
    console.log(`Old official event count: ${oldTotal}`);
    console.log(`New official event count: ${finalEvents.length}`);
    console.log(`Old latest official event date: ${oldLatest || 'n/a'}`);
    console.log(`New latest official event date: ${latestDate(finalEvents) || 'n/a'}`);

    console.log('\nBy year');
    console.log('-------');
    for (let y = START_YEAR; y <= END_YEAR; y++) console.log(`  ${y}: ${perYearFinal[y]} event(s)`);

    if (failed > 0) {
        console.log(`\n⚠ ${failed} month(s) failed to fetch — re-run the sync to retry them.`);
        process.exitCode = 1;
    }

    console.log(`\nWrote ${outPath.pathname.replace(/^\//, '')}`);
}

main().catch((err) => {
    console.error('Sync failed:', err);
    process.exit(1);
});
