import { CALENDAR_EVENTS } from './tsaCalendar.js';
import { STATE_CONFERENCE_EVENTS } from './stateConferenceDates.js';

export const STATES = [
  'Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware',
  'Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky',
  'Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi',
  'Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico',
  'New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania',
  'Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont',
  'Virginia','Washington','West Virginia','Wisconsin','Wyoming','Other / International',
];

// Nationals is sourced from the same feed the Calendar screen already reads
// (tsaCalendar.js, kept current by scripts/syncTsaCalendar.mjs) instead of a
// separately hand-maintained guess — this is what keeps Coach and Calendar
// in agreement, and means a future calendar sync is the only touch point
// needed to update Coach's Nationals answer.
function findNationals2027() {
  return CALENDAR_EVENTS.find((e) => e.category === 'conference' && /national tsa conference/i.test(e.title || '') && (e.startDate || '').startsWith('2027'));
}
const nationalsEvent = findNationals2027();
export const NATIONALS = nationalsEvent
  ? { name: 'National TSA Conference', year: 2027, startDate: nationalsEvent.startDate, endDate: nationalsEvent.endDate, location: nationalsEvent.location || null }
  : { name: 'National TSA Conference', year: 2027, startDate: null, endDate: null, location: null };

export function formatDate(iso) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export function formatDateRange(startIso, endIso) {
  const start = new Date(startIso + 'T00:00:00');
  const end = new Date(endIso + 'T00:00:00');
  const startStr = start.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  const endStr = end.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  return `${startStr} through ${endStr}`;
}

// Every regionals/state-conference value has an explicit status:
//   'exact'       — a specific, officially-sourced date (optionally with
//                   `parts` when a state holds separate conferences)
//   'window'      — a general month/season range, not an exact date
//   'unannounced' — TSA Hub has no verified information yet
// State conference dates come from stateConferenceDates.js, the same source
// the Calendar uses, so Coach and Calendar cannot disagree. Regionals are
// listed here only where a state has published them.
export const STATE_DATES = {
  'North Carolina': {
    regionals: {
      status: 'exact',
      date: '2027-02-12',
      parts: [
        { label: 'the Eastern Region', date: '2027-02-12' },
        { label: 'the Western Region', date: '2027-02-19' },
      ],
    },
  },
};

function stateConference(state) {
  const prefix = `${state} TSA `;
  const parts = STATE_CONFERENCE_EVENTS
    .filter((e) => e.title.startsWith(prefix))
    .map((e) => ({ label: `the ${e.title.slice(prefix.length).replace(/ ?State Conference$/, '')}`.replace(/^the $/, 'the state conference'), date: e.startDate, endDate: e.endDate }));
  if (!parts.length) return { status: 'unannounced' };
  return { status: 'exact', date: parts[0].date, endDate: parts[0].endDate, parts: parts.length > 1 ? parts : undefined };
}

export function datesForState(state) {
  const entry = STATE_DATES[state];
  return {
    regionals: entry?.regionals || { status: 'unannounced' },
    states: stateConference(state),
    nationals: NATIONALS,
  };
}

export const ANNOUNCEMENTS = [
  {
    id: 'a1',
    date: '2026-09-02',
    title: 'Welcome to the 2026–27 season',
    body: 'New competition guides are out. Read your event rules before you build anything — rules change every year.',
  },
  {
    id: 'a2',
    date: '2026-09-15',
    title: 'Chapter dues reminder',
    body: 'You must be a dues-paid member to compete. See your advisor to confirm your affiliation status.',
  },
  {
    id: 'a3',
    date: '2026-10-01',
    title: 'Theme releases posted',
    body: 'Annual themes and problem statements for themed events are now available in the Event Explorer pages.',
  },
  {
    id: 'a4',
    date: '2026-10-20',
    title: 'Team registration window',
    body: 'Lock in your event choices with your advisor before regional registration closes.',
  },
];

export const RULE_UPDATES = [
  {
    id: 'r1',
    date: '2026-09-10',
    cite: 'G-5',
    title: 'AI disclosure clarified',
    body: 'AI tool usage must now be documented with tool name and usage description in the portfolio.',
  },
  {
    id: 'r2',
    date: '2026-10-05',
    cite: 'VG-4.1',
    title: 'Gameplay video length',
    body: 'Video Game Design gameplay video limit confirmed for this season — check the event page.',
  },
  {
    id: 'r3',
    date: '2026-10-18',
    cite: 'DV-2.4',
    title: 'Video runtime window updated',
    body: 'Digital Video Production runtime window adjusted in the current-year guide.',
  },
];

export const BADGES = [
  { id: 'profile',   ico: '\u{1F9ED}', name: 'Signed In',        desc: 'Completed your profile' },
  { id: 'first-event', ico: '\u{1F3AF}', name: 'Event Locked',   desc: 'Added your first event' },
  { id: 'three-events', ico: '\u{1F525}', name: 'Triple Threat', desc: 'Competing in 3+ events' },
  { id: 'first-task', ico: '✅',     name: 'On the Board',   desc: 'Completed your first task' },
  { id: 'ten-tasks',  ico: '\u{1F4AA}',  name: 'Grinder',        desc: 'Completed 10 tasks' },
  { id: 'checklist',  ico: '\u{1F4E6}',  name: 'Ship It',        desc: 'Finished a full deliverables checklist' },
  { id: 'coach-3',    ico: '\u{1F4AC}',  name: 'Rule Lawyer',    desc: 'Asked the coach 3 questions' },
  { id: 'team-3',     ico: '\u{1F91D}',  name: 'Squad Up',       desc: 'Added 3 teammates' },
];
