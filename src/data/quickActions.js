// ============================================================================
// Home "Quick Actions" — action registry + default preset.
//
// The registry is the single list of everything a student can pin to Home.
// Wherever possible it's DERIVED from the exact same data the Resources page
// already renders (ABOUT_TSA, NATIONAL_CONFERENCE, COMPETITION_RULES,
// COMPETITION_REQUIREMENTS, PROGRAMS, NATIONAL_TSA, LEADERSHIP_NAV) instead
// of a hand-typed second list — add a row to any of those and it
// automatically becomes available here too, with no changes needed in this
// file. A handful of entries genuinely don't come from Resources data
// (Events/Recommender live outside Resources; Calendar, Appearance, Send
// Feedback, and Report Incorrect Information are special-behavior actions
// with their own handling) and are listed explicitly below instead.
//
// Each entry is one of:
//   kind: 'route'    -> navigate to `to` (optionally with router `state`)
//   kind: 'external' -> plain external link, `href`
//   kind: 'modal'     -> open an existing modal, `modal: 'feedback' | 'report'`
//   kind: 'theme'     -> toggle the app theme directly (no navigation)
// ============================================================================

import { ABOUT_TSA } from './aboutTsa.js';
import { NATIONAL_CONFERENCE } from './nationalConference.js';
import { COMPETITION_RULES } from './competitionRules.js';
import { COMPETITION_REQUIREMENTS } from './competitionRequirements.js';
import { PROGRAMS } from './programs.js';
import { NATIONAL_TSA, LEADERSHIP_NAV } from '../screens/resources/resourceSearch.jsx';
import storeIcon from '../assets/img/store.png';

function slug(s) {
    return String(s || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

// ---- entries with no Resources-page equivalent to derive from ----
const CORE_ACTIONS = [
    { id: 'discover-events', label: 'Discover Events', icon: 'grid', kind: 'route', to: '/events' },
    { id: 'get-recommendations', label: 'Get Recommendations', icon: 'spark', kind: 'route', to: '/recommend' },
    { id: 'calendar', label: 'Calendar', icon: 'cal', kind: 'route', to: '/calendar' },
    // Reuses Calendar's own existing add-event editor — see the small effect
    // in src/screens/Calendar.jsx that opens it on `location.state.openAdd`.
    { id: 'calendar-add-event', label: 'Add Calendar Event', icon: 'plus', kind: 'route', to: '/calendar', navState: { openAdd: true } },
    { id: 'help-center', label: 'Help Center', icon: 'help', kind: 'route', to: '/help' },
    // Reuses the exact SubmitModal already used by Settings — opened
    // directly from Home instead of navigating away.
    { id: 'send-feedback', label: 'Send Feedback', icon: 'chat', kind: 'modal', modal: 'feedback' },
    { id: 'report-info', label: 'Report Incorrect Information', icon: 'info', kind: 'modal', modal: 'report' },
    { id: 'privacy-policy', label: 'Privacy Policy', icon: 'shield', kind: 'route', to: '/privacy' },
    { id: 'terms-policies', label: 'Terms and Policies', icon: 'file-text', kind: 'route', to: '/terms' },
    // Reuses the app's existing theme state/action directly — no navigation.
    { id: 'appearance-theme', label: 'Appearance', icon: 'spark', kind: 'theme' },
    // The "Event Guide" row on Resources (also called Themes and Problems).
    { id: 'event-guide', label: 'Themes and Problems', icon: 'book', kind: 'route', to: '/resources/events/themes' },
    { id: 'official-tsa-store', label: 'Official TSA Store', img: storeIcon, mono: true, kind: 'external', href: 'https://tsastore.mybrightsites.com/' },
    // Stable anchor into Resources' own "Your State" section — real,
    // per-state content, no per-state duplication needed here.
    { id: 'your-state-tsa', label: 'Your State TSA', icon: 'globe', kind: 'route', to: '/resources#your-state' },
];

// ---- derived from the same arrays Resources.jsx renders ----
function fromAboutTsa() {
    return ABOUT_TSA.map((p) => ({
        id: `about-${p.id}`, label: p.title, icon: p.icon, kind: 'route', to: `/resources/about/${p.id}`,
    }));
}

function fromNationalConference() {
    const out = [];
    for (const item of NATIONAL_CONFERENCE.items) {
        if (item.type === 'link') {
            out.push({ id: `conf-${item.id}`, label: item.title, icon: item.icon, kind: 'route', to: item.route });
        } else if (item.children) {
            for (const child of item.children) {
                out.push({ id: `conf-${child.id}`, label: child.title, icon: 'file-text', kind: 'route', to: child.route });
            }
        }
    }
    return out;
}

function fromCompetitionRules() {
    return COMPETITION_RULES.map((c) => ({
        id: `rules-${c.id}`, label: c.title, icon: c.icon, kind: 'route', to: `/resources/competition-rules/${c.id}`,
    }));
}

function fromCompetitionRequirements() {
    return COMPETITION_REQUIREMENTS.map((c) => ({
        id: `reqs-${c.id}`, label: c.title, icon: c.icon, kind: 'route', to: `/resources/competition-requirements/${c.id}`,
    }));
}

function fromPrograms() {
    return PROGRAMS.map((p) => ({
        id: `program-${p.id}`, label: p.title, icon: p.icon, kind: 'route', to: `/resources/programs/${p.id}`,
    }));
}

function fromNationalTsa() {
    return NATIONAL_TSA.map((r) => ({
        id: `national-tsa-${slug(r.title)}`, label: r.title, icon: r.icon, img: r.img, svg: r.svg, iconColor: r.iconColor,
        kind: 'external', href: r.url,
    }));
}

function fromLeadershipNav() {
    return LEADERSHIP_NAV.map((r) => ({
        id: `leadership-${slug(r.to)}`, label: r.title, icon: r.icon, img: r.img, kind: 'route', to: r.to,
    }));
}

// The full list of everything selectable in the Quick Actions editor.
export const QUICK_ACTIONS_REGISTRY = [
    ...CORE_ACTIONS,
    ...fromAboutTsa(),
    ...fromNationalConference(),
    ...fromCompetitionRules(),
    ...fromCompetitionRequirements(),
    ...fromPrograms(),
    ...fromNationalTsa(),
    ...fromLeadershipNav(),
];

const _byId = new Map(QUICK_ACTIONS_REGISTRY.map((a) => [a.id, a]));

export function getQuickAction(id) {
    return _byId.get(id) || null;
}

// The 9 actions every user starts with until they customize Home.
export const DEFAULT_QUICK_ACTION_IDS = [
    'discover-events',
    'get-recommendations',
    'event-guide',
    'reqs-eligibility-charts',
    'reqs-preconference-submissions',
    'reqs-national-competition-requirements',
    'reqs-state-advisor-approval-events',
    'appearance-theme',
    'official-tsa-store',
];

export const MAX_QUICK_ACTIONS = 9;

// Resolves a list of ids to real registry entries, silently dropping any id
// that no longer matches something real (e.g. a resource that was removed)
// instead of crashing or showing a broken tile.
export function resolveQuickActions(ids) {
    const list = Array.isArray(ids) && ids.length ? ids : DEFAULT_QUICK_ACTION_IDS;
    return list.map(getQuickAction).filter(Boolean);
}
