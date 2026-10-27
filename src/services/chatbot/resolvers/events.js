import { COMPETITION_REQUIREMENTS } from '../../../data/competitionRequirements.js';
import { getEventGuidance } from '../../../data/eventGuidance.js';
import { fmtSize } from '../../../data/events.js';
import { pick, hash } from '../core/variation.js';
import { isMissing, checkTeamSizeConsistency, CONFLICT_MESSAGE } from '../guards/dataGuards.js';

const DERIVED = 'derived';
const OFFICIAL = 'official';

function ok(text, sourceType, extra = {}) { return { text, sourceType, ...extra }; }

function parseRange(teamSize) {
    const s = fmtSize(teamSize);
    if (!s) return null;
    const range = s.match(/^(\d+)\s*[-–]\s*(\d+)$/);
    if (range) return [Number(range[1]), Number(range[2])];
    const n = Number(s);
    return Number.isFinite(n) ? [n, n] : null;
}

function parseEligibilityText(text) {
    if (!text) return null;
    const t = String(text);
    const atLeast = t.match(/at least (\w+) \((\d+)\)/);
    if (atLeast) {
        const min = Number(atLeast[2]);
        const maxMatch = t.match(/maximum of (\w+) \((\d+)\)/);
        const max = maxMatch ? Number(maxMatch[2]) : null;
        return { min, max, individual: /individual entries? (are|is) permitted/i.test(t) };
    }
    const range = t.match(/(\w+) to (\w+) \((\d+)[-\u2013](\d+)\)/);
    if (range) return { min: Number(range[3]), max: Number(range[4]), individual: /individual/i.test(t) };
    const exact = t.match(/team of (\w+) \((\d+)\)/);
    if (exact) return { min: Number(exact[2]), max: Number(exact[2]), individual: /individual/i.test(t) };
    // "maximum of six (6) individuals; individual entries are permitted" is an
    // upper bound with solo entry allowed, not an exact size — treating it as
    // exact would tell a group of 2-5 they need exactly 6. Only special-case
    // this when individual entries are explicitly permitted, since that is
    // the only shape confirmed in the data; otherwise fall through unchanged.
    const maxOnly = t.match(/maximum of (\w+) \((\d+)\)/);
    if (maxOnly && /individual entries? (are|is) permitted/i.test(t)) {
        return { min: 1, max: Number(maxOnly[2]), individual: true };
    }
    const simple = t.match(/\((\d+)\) (individuals?|members?|team members?)/);
    if (simple) return { min: Number(simple[1]), max: Number(simple[1]), individual: /individual/i.test(t) };
    return null;
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

// What actually drives real cost for this kind of event, in plain terms —
// used to turn a bare "low/high cost" label into something actionable.
function costFactorsFor(event) {
    const wp = workPhrase(event);
    if (String(event.materials || '').toLowerCase() === 'yes') {
        return 'the specific materials or equipment the challenge calls for, since this one needs some beyond the basics';
    }
    if (wp && /coding|designing/.test(wp) && !/building/.test(wp)) {
        return 'what software, hosting, or equipment your team already has access to';
    }
    return "what supplies, software, or equipment your team already has versus what you'd still need";
}

const COST_LABEL = {
    '0-25': 'Very low',
    '25-75': 'Low',
    '75-150': 'Moderate',
    '150-300': 'Moderate to higher',
    '300+': 'Higher',
};

const COST_NATURAL = {
    '0-25': ['one of the lower cost events', "generally affordable since most of the work is digital"],
    '25-75': ['relatively affordable', "not too expensive, though you may need a few supplies"],
    '75-150': ['a moderate investment', "likely to need some budget for materials or equipment"],
    '150-300': ['on the pricier side', "going to need a real budget for materials and supplies"],
    '300+': ['one of the more expensive events', "a bigger investment, especially if you need physical materials or equipment"],
};

const TIME_NATURAL = {
    light: ['a lighter commitment compared with more build-heavy events', "one of the quicker events to prepare for"],
    medium: ['a moderate amount of preparation', "more than the lightest events, but it usually doesn't require an extreme weekly commitment"],
    heavy: ['a fair amount of preparation, so it is worth starting early', "consistent work over several weeks"],
    project: ['a long-running project that needs early planning', "a significant time investment, so start as soon as you can"],
};

const DIFF_NATURAL = {
    beginner: ['very approachable, especially for first-time competitors', "a solid starting point if you are new to TSA events"],
    challenging: ['challenging, especially if you are new to the skills involved', "a step up, but very manageable if you start early and practice"],
    competitive: ['one of the more competitive options, so strong preparation matters', "highly competitive, so plan to put in real effort"],
};

const WORK_LABEL = { build: 'building', code: 'coding', design: 'designing', present: 'presenting' };

// What "challenging" or "competitive" actually means for this kind of event
// — the skill/prep axis that makes a difficulty label useful instead of a
// bare word. Falls back to a generic line when no project type is on file.
const DIFF_REASON = {
    build: 'how much hands-on building and troubleshooting it takes to get a working result',
    code: 'how much programming or technical problem-solving the challenge requires',
    design: 'how polished and well-planned the design work needs to be',
    present: 'how strong the presentation and interview component needs to be',
};

// Realistic "what you'll actually need" for each build_type, used by
// materialsText() below. Keep these short and factual (no brand names or
// dollar amounts) — the official event guide always has the exact specs.
const BUILD_MATERIALS = {
    robot: 'a robot or robotics platform, sensors, motors, and a microcontroller or programmable kit',
    vehicle: 'a vehicle body or chassis, wheels or axles, and a motor or propulsion system',
    drone: 'a drone or UAV platform along with its flight components',
    structure: 'building materials and basic construction or modeling supplies',
    wearable: 'fabric or wearable materials along with basic electronics',
    product: 'prototyping materials, basic tools, and supplies for building a physical product',
};

// Event-specific materials notes for the events where build_type doesn't
// capture what's actually needed (mainly media production, where the real
// requirement is a camera or microphone rather than a physical build).
// Keyed by normalized event name so both HS and MS versions match.
const MATERIALS_OVERRIDES = {
    'audio podcasting': 'a computer, audio recording equipment (a smartphone or a basic USB microphone works for most teams), and audio editing software',
    'music production': 'a computer, audio production software, and a way to record or source original audio',
    'digital video production': 'a video camera or smartphone, basic lighting, and video editing software',
    'on demand video': 'a video camera or smartphone and video editing software, since the whole video is shot and edited onsite',
    'vlogging': 'a camera or smartphone, basic lighting, and video editing software',
    'community service video': 'a video camera or smartphone and video editing software',
    'stem mass media': 'a camera, basic lighting, and video editing software for a news-style segment',
    'photographic technology': 'a digital camera and photo editing software',
    'digital photography': 'a digital camera and photo editing software',
    'stem animation': 'a computer and animation or video editing software',
    "children's stories": 'paper and bookbinding materials for the physical storybook, plus basic art or design supplies',
    'promotional design': 'a computer with design software, plus printing materials if your team produces physical print pieces',
    'promotional marketing': 'a computer with design software, plus printing materials for any physical pieces in your campaign',
};

// Natural-language labels for the raw interest/skill tag keys stored per
// event (see eventsService.js parseWeighted) — used only by bestSuitedFor()
// below. Real per-event weighted data, not invented.
const INTEREST_PHRASE = {
    architecture: 'architecture and the built environment',
    business: 'business and marketing',
    coding: 'programming and software',
    design: 'design',
    engineering: 'engineering and how things are built',
    games: 'games and interactive media',
    leadership: 'leadership',
    media: 'media production and storytelling',
    robotics: 'robotics and automation',
    science: 'science and research',
};

const SKILL_PHRASE = {
    '3d-modeling': '3D modeling',
    animation: 'animation',
    business: 'business skills',
    cad: 'CAD software',
    cybersecurity: 'cybersecurity concepts',
    'data-analysis': 'data analysis',
    design: 'design tools',
    electronics: 'electronics',
    engineering: 'engineering fundamentals',
    'game-design': 'game design',
    leadership: 'leadership and teamwork',
    medicine: 'medical or health topics',
    programming: 'programming',
    'public-speaking': 'public speaking',
    robotics: 'robotics',
    science: 'science',
    soldering: 'soldering and hands-on electronics work',
    'technical-writing': 'technical writing',
    'ux-design': 'UX design',
    video: 'video production and editing',
    writing: 'writing',
};

function topKeys(weighted, n) {
    return Object.entries(weighted || {})
        .sort((a, b) => b[1] - a[1])
        .slice(0, n)
        .map(([k]) => k);
}

const COST_LEVEL_WORDS = /\b(low|modest|inexpensive|moderate|minimal|capped|cheap|affordable)\b/i;

// Per-event written guidance (src/data/eventGuidance.js) for one topic, or
// null when the event has none. A cost note that doesn't already say how
// expensive the event is gets the cost category as a lead-in.
export function guidanceFor(event, topic) {
    const text = getEventGuidance(event)?.[topic];
    if (!text) return null;
    if (topic !== 'cost') return text;
    const label = COST_LABEL[event.costBand];
    const firstSentence = text.split(/(?<=\.)\s/)[0];
    return label && !COST_LEVEL_WORDS.test(firstSentence) ? `${label} cost. ${text}` : text;
}

// "Best suited for" — the event's written guidance when it has any,
// otherwise grounded in the event's own real interest/skill weights, never
// invented. Returns null when there's nothing on file.
export function bestSuitedFor(event) {
    const written = guidanceFor(event, 'bestFor');
    if (written) return written;
    const interests = topKeys(event?.interests, 2).map((k) => INTEREST_PHRASE[k]).filter(Boolean);
    if (!interests.length) return null;
    const interestText = interests.length > 1 ? `${interests[0]} and ${interests[1]}` : interests[0];
    // Skip the skill clause if it would just restate an interest already
    // named above (e.g. "robotics" as both top interest and top skill).
    const skill = topKeys(event?.skills, 2)
        .map((k) => SKILL_PHRASE[k])
        .filter(Boolean)
        .find((phrase) => !interests.some((i) => i.includes(phrase) || phrase.includes(i)));
    const skillTail = skill ? `, especially if you're comfortable with ${skill}` : '';
    return `Best for students who enjoy ${interestText}${skillTail}.`;
}

// Materials / Equipment — a real, useful answer instead of "no equipment
// identified." Specific event notes win first, then build_type, then a
// style-based fallback for events with no physical build at all.
export function materialsText(event) {
    if (!event) return null;
    const written = guidanceFor(event, 'materials');
    if (written) return written;
    const override = MATERIALS_OVERRIDES[normName(event.name)];
    if (override) return `Teams should expect to need ${override}.`;

    const flagged = String(event.materials || '').toLowerCase() === 'yes';
    if (flagged && event.buildType && BUILD_MATERIALS[event.buildType]) {
        return `Teams should expect to need ${BUILD_MATERIALS[event.buildType]}. Check the official event guide for exact specifications.`;
    }
    if (flagged) {
        return "Teams should expect to need some physical materials or supplies for their display or final product, along with a computer for the design and written components. Check the official event guide for the specifics.";
    }

    const types = Array.isArray(event.projectType) ? event.projectType : [];
    if (types.includes('code')) {
        return 'Most of the work can be done with a computer and the relevant programming or development environment. No special physical equipment is typically needed.';
    }
    if (types.includes('design')) {
        return 'Most of the work can be done with a computer and the required design or CAD software. No physical materials are typically needed for the submission itself.';
    }
    if (types.every((t) => t === 'present' || t === 'research' || t === 'test')) {
        return 'This event is mostly about preparation and practice. No special equipment or materials are typically needed beyond notes and research.';
    }
    return 'Most of the work can be completed with a computer and the required software. No major physical equipment is typically needed.';
}

function normName(s) { return (s || '').replace(/\*+$/, '').trim().toLowerCase(); }

function requirementsTable(pageId, division) {
    const page = (COMPETITION_REQUIREMENTS || []).find((r) => r.id === pageId);
    if (!page || !Array.isArray(page.tables)) return null;
    const heading = division === 'HS' ? 'High School' : 'Middle School';
    return page.tables.find((t) => t.heading === heading || t.heading?.includes(division === 'HS' ? 'High School' : 'Middle School')) || null;
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

function getRange(event) {
    const el = event?.eligibility || {};
    let range = parseRange(el.teamSize);
    if (!range && el.text) {
        const parsed = parseEligibilityText(el.text);
        if (parsed) {
            range = [parsed.min, parsed.max || parsed.min];
            if (parsed.individual && el.individualOk == null) el.individualOk = true;
        }
    }
    return range;
}

function seed(event, intent) { return (event?.id || '') + intent; }

export function answerEventIntent(event, intent, { style = 'normal', seed: extraSeed = '' } = {}) {
    if (!event) return null;
    const name = event.name || 'This event';
    const el = event.eligibility || {};
    const s = seed(event, intent) + extraSeed;

    switch (intent) {
        case 'team.individual': {
            if (isMissing(el.individualOk) && isMissing(el.teamSize) && !el.text) {
                return { text: pick(["I don't have a team requirement on file for " + name + " yet.", "I couldn't find official team info for " + name + "."], s), sourceType: OFFICIAL, missing: true };
            }
            const conflict = checkTeamSizeConsistency(event);
            if (conflict.conflict) return { text: CONFLICT_MESSAGE, sourceType: OFFICIAL, conflict: true };
            const range = getRange(event);
            if (el.individualOk) {
                const tail = range && range[1] > 1 ? ` You can also enter as a team of up to ${range[1]}.` : '';
                return ok(pick([
                    `Yes, you can compete in ${name} on your own.${tail}`,
                    `You don't need a team for ${name}. Individual entries are allowed.${tail}`,
                    `${name} can be entered individually, so you can compete without teammates.${tail}`,
                ], s), OFFICIAL);
            }
            const need = range ? ` You'll need ${range[0] === range[1] ? range[0] + ' members' : range[0] + ' to ' + range[1] + ' members'}.` : '';
            return ok(pick([
                `You'll need a team for ${name}. Individual entries aren't allowed.${need}`,
                `${name} is team-based, so you can't enter alone.${need}`,
                `You can't enter ${name} by yourself.${need} Check the team size before choosing your group.`,
            ], s), OFFICIAL);
        }

        case 'team.minimum':
        case 'team.maximum':
        case 'team.exact':
        case 'team.general': {
            const conflict = checkTeamSizeConsistency(event);
            if (conflict.conflict) return { text: CONFLICT_MESSAGE, sourceType: OFFICIAL, conflict: true };
            const range = getRange(event);
            if (!range && !el.text) return { text: pick(["I don't have an official team size on file for " + name + ".", "No team size info is available for " + name + " yet."], s), sourceType: OFFICIAL, missing: true };
            if (intent === 'team.minimum' && range) return ok(pick([`${name} needs at least ${range[0]} ${range[0] === 1 ? 'person' : 'members'}.`, `The minimum for ${name} is ${range[0]}.`], s), OFFICIAL);
            if (intent === 'team.maximum' && range) return ok(pick([`${name} allows up to ${range[1]} members.`, `The max team size for ${name} is ${range[1]}.`], s), OFFICIAL);
            if (range) {
                const size = range[0] === range[1] ? `${range[0]}` : `${range[0]} to ${range[1]}`;
                const solo = el.individualOk ? ' Individual entries are also allowed.' : '';
                return ok(pick([
                    `Teams for ${name} can have ${size} members.${solo}`,
                    `You'll need ${size} people for ${name}.${solo}`,
                    `${name} is designed for teams of ${size}.${solo}`,
                ], s) + (style !== 'short' && el.text ? ` Official wording: ${el.text}.` : ''), OFFICIAL);
            }
            if (el.text) return ok(`${name} has this eligibility requirement: ${el.text}`, OFFICIAL);
            return { text: "I don't have team size info for " + name + ".", sourceType: OFFICIAL, missing: true };
        }

        case 'cost.isExpensive':
        case 'cost.general': {
            const writtenCost = style === 'short' ? null : guidanceFor(event, 'cost');
            if (writtenCost) return ok(writtenCost, DERIVED);
            const label = COST_LABEL[event.costBand];
            const variants = COST_NATURAL[event.costBand];
            if (!label || !variants) return { text: pick(["I don't have cost info for " + name + " yet.", "No cost classification is available for " + name + " right now."], s), sourceType: DERIVED, missing: true };
            const desc = pick(variants, s);
            // What actually drives real-world cost for this kind of event —
            // makes the label useful instead of just a word.
            const costFactors = costFactorsFor(event);
            const tail = style === 'short' ? '' : ` Your actual cost mostly comes down to ${costFactors}.`;
            return ok(`${label} cost. ${name} is ${desc}.${tail}`, DERIVED);
        }

        case 'time.general': {
            const writtenTime = guidanceFor(event, 'time');
            if (writtenTime) return ok(writtenTime, DERIVED);
            const variants = TIME_NATURAL[event.timeBand];
            if (!variants) return { text: "I don't have time commitment info for " + name + ".", sourceType: DERIVED, missing: true };
            return ok(`Expect ${pick(variants, s)}.`, DERIVED);
        }

        case 'difficulty.general': {
            const writtenDifficulty = guidanceFor(event, 'difficulty');
            if (writtenDifficulty) return ok(writtenDifficulty, DERIVED);
            const variants = DIFF_NATURAL[event.difficulty];
            if (!variants) return { text: "I don't have a difficulty classification for " + name + " yet.", sourceType: DERIVED, missing: true };
            const types = Array.isArray(event.projectType) ? event.projectType : [];
            const reasonKey = types.find((t) => DIFF_REASON[t]);
            const reason = reasonKey
                ? ` A lot of that comes down to ${DIFF_REASON[reasonKey]}, and prior experience with it goes a long way.`
                : ' A lot of that comes down to how much prior experience you have with the skills the event involves.';
            return ok(`${name} is ${pick(variants, s)}.${reason}`, DERIVED);
        }

        case 'overview.general': {
            if (isMissing(event.overview)) {
                const div = event.division === 'HS' ? 'High School' : 'Middle School';
                return { text: event.category ? `${name} is a ${div} event in the ${event.category} category. I don't have a full description yet.` : `I don't have a description for ${name} yet.`, sourceType: OFFICIAL, missing: true };
            }
            if (style === 'short') return ok(String(event.overview).split(/(?<=\.)\s/)[0], OFFICIAL);
            const div = event.division === 'HS' ? 'High School' : 'Middle School';
            return ok(`${name} is a ${div} event in the ${event.category || 'TSA'} category. ${event.overview}`, OFFICIAL);
        }

        case 'theme.general':
            if (isMissing(event.theme)) return { text: pick(["No annual theme is listed for " + name + " in my data.", name + " doesn't have an annual theme listed right now."], s), sourceType: OFFICIAL, missing: true };
            return ok(`This season's theme for ${name}: ${event.theme}.`, OFFICIAL, { season: event.season });

        case 'category.general':
            if (isMissing(event.category)) return { text: "I don't have a category on file for " + name + ".", sourceType: OFFICIAL, missing: true };
            return ok(`${name} is in the ${event.category} category.`, OFFICIAL);

        case 'division.general':
            return ok(`${name} is offered in the ${event.division === 'HS' ? 'High School' : 'Middle School'} division.`, OFFICIAL);

        case 'career.general': {
            const careers = [...new Set(Object.entries(event.careers || {}).sort((a, b) => b[1] - a[1]).map(([k]) => CAREER_LABELS[k] || k))];
            if (!careers.length) return { text: "I don't have career tags for " + name + " yet.", sourceType: DERIVED, missing: true };
            const list = careers.slice(0, style === 'short' ? 2 : 4).join(', ');
            return ok(pick([
                `${name} connects well with careers in ${list}.`,
                `The skills in ${name} are especially relevant if you're interested in ${list}.`,
                `TSA Hub links ${name} to career areas like ${list}.`,
            ], s), DERIVED);
        }

        case 'eligibility.general':
            if (isMissing(el.text)) return { text: "I don't have the official eligibility wording for " + name + ".", sourceType: OFFICIAL, missing: true };
            return ok(`Official eligibility for ${name}: ${el.text}.`, OFFICIAL);

        case 'preconference.general': {
            const pre = preconferenceFor(event);
            if (!pre.known) return { text: "I don't have preconference submission data for " + name + ".", sourceType: OFFICIAL, missing: true };
            if (!pre.items.length) return ok(pick([name + " has no preconference submission listed.", name + " doesn't require a preconference submission."], s), OFFICIAL);
            return ok(`${name} preconference submission: ${pre.items.join(' + ')}.`, OFFICIAL);
        }

        case 'advisor.general': {
            const adv = advisorApprovalFor(event);
            if (!adv.known) return { text: "I don't have state advisor approval data for " + name + ".", sourceType: OFFICIAL, missing: true };
            return ok(adv.required
                ? pick([`Yes, ${name} requires state advisor approval before you register.`, `You'll need your state advisor's approval for ${name}.`], s)
                : pick([`${name} doesn't require state advisor approval.`, `No advisor approval needed for ${name}.`], s), OFFICIAL);
        }

        case 'material.general': {
            // The `materials` field is a yes/no flag ("does this event need
            // materials beyond the basics"), not an actual materials list —
            // rendering it as literal text produced "Webmaster materials: no."
            // Missing data must never collapse into "no materials required":
            // null means unknown, "no" means TSA Hub's own read that nothing
            // extra is flagged, and neither is an official TSA statement.
            if (isMissing(event.materials)) {
                return { text: pick([
                    `I don't have a verified materials list for ${name}. I don't want to guess at an official requirement, but I can check the current-year rules for exactly what to bring or submit if that would help.`,
                    `No verified materials info is on file for ${name} yet. Rather than guess, I'd point you to the current official rules. Want me to look for the submission requirements instead?`,
                ], s), sourceType: OFFICIAL, missing: true };
            }
            return ok(materialsText(event), DERIVED);
        }

        default:
            return null;
    }
}

export function workPhrase(event) {
    const types = Array.isArray(event?.projectType) ? event.projectType : [];
    const labels = types.map((t) => WORK_LABEL[t]).filter(Boolean);
    if (!labels.length) return null;
    if (labels.length === 1) return labels[0];
    return `${labels.slice(0, -1).join(', ')} and ${labels[labels.length - 1]}`;
}

export { CAREER_LABELS, fmtSize, parseRange };
