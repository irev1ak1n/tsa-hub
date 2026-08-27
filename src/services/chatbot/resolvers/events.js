import { COMPETITION_REQUIREMENTS } from '../../../data/competitionRequirements.js';
import { pick, hash } from '../core/variation.js';
import { isMissing, checkTeamSizeConsistency, CONFLICT_MESSAGE } from '../guards/dataGuards.js';

const DERIVED = 'derived';
const OFFICIAL = 'official';

function ok(text, sourceType, extra = {}) { return { text, sourceType, ...extra }; }

function fmtSize(ts) {
    if (ts == null) return null;
    const n = Number(ts);
    if (Number.isFinite(n) && String(ts).indexOf('-') === -1) return String(Math.round(n));
    return String(ts);
}

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
        return 'the specific materials or equipment the challenge calls for, since this one is flagged as needing some beyond the basics';
    }
    if (wp && /coding|designing/.test(wp) && !/building/.test(wp)) {
        return 'what software, hosting, or equipment your team already has access to';
    }
    return "what supplies, software, or equipment your team already has versus what you'd still need";
}

const COST_NATURAL = {
    '0-25': ['one of the lower cost events', "generally affordable since most of the work is digital"],
    '25-75': ['relatively affordable', "not too expensive, though you may need a few supplies"],
    '75-150': ['a moderate investment', "likely to need some budget for materials or equipment"],
    '150-300': ['on the pricier side', "going to need a real budget for materials and supplies"],
    '300+': ['one of the more expensive events', "a bigger investment, especially if you need physical materials or equipment"],
};

const TIME_NATURAL = {
    light: ['a lighter commitment compared with more build-heavy events', "one of the quicker events to prepare for"],
    medium: ['a moderate amount of preparation', "not the lightest event, but it usually doesn't require an extreme weekly commitment"],
    heavy: ['a fair amount of preparation, so it is worth starting early', "going to take consistent work over several weeks"],
    project: ['a long-running project that needs early planning', "a significant time investment, so start as soon as you can"],
};

const DIFF_NATURAL = {
    beginner: ['very approachable, especially for first-time competitors', "a solid starting point if you are new to TSA events"],
    challenging: ['challenging, especially if you are new to the skills involved', "a step up, but very manageable if you start early and practice"],
    competitive: ['one of the more competitive options, so strong preparation matters', "highly competitive, so plan to put in real effort"],
};

const WORK_LABEL = { build: 'building', code: 'coding', design: 'designing', present: 'presenting' };

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
            const variants = COST_NATURAL[event.costBand];
            if (!variants) return { text: pick(["I don't have cost info for " + name + " yet.", "No cost classification is available for " + name + " right now."], s), sourceType: DERIVED, missing: true };
            const desc = pick(variants, s);
            // What actually drives real-world cost for this kind of event —
            // makes the classification useful instead of just a label.
            const costFactors = costFactorsFor(event);
            const tail = style === 'short' ? '' : ` Your actual cost really depends on ${costFactors}. Tell me what your team already has, and I can help you figure out what you'd still need to cover.`;
            if (intent === 'cost.isExpensive') {
                return ok(pick([
                    `${name} is ${desc}. TSA doesn't publish a fixed price, but TSA Hub places it in that range based on typical materials.${tail}`,
                    `Budget-wise, ${name} is ${desc}. That's TSA Hub's classification, not an official TSA number.${tail}`,
                ], s), DERIVED);
            }
            return ok(pick([
                `TSA doesn't publish a single project price for ${name}. Based on typical materials, TSA Hub classifies it as ${desc}.${tail}`,
                `${name} is ${desc}. That's a TSA Hub estimate, not an official TSA figure.${tail}`,
            ], s), DERIVED);
        }

        case 'time.general': {
            const variants = TIME_NATURAL[event.timeBand];
            if (!variants) return { text: "I don't have time commitment info for " + name + ".", sourceType: DERIVED, missing: true };
            return ok(pick([
                `Expect ${pick(variants, s)}. That's TSA Hub's classification based on the typical workload.`,
                `${name} is ${pick(variants, s + '2')}. TSA Hub's estimate, not an official number.`,
            ], s), DERIVED);
        }

        case 'difficulty.general': {
            const variants = DIFF_NATURAL[event.difficulty];
            if (!variants) return { text: "I don't have a difficulty classification for " + name + " yet.", sourceType: DERIVED, missing: true };
            const wp = workPhrase(event);
            const context = wp
                ? ` A lot of that comes down to your own experience with ${wp} — TSA doesn't publish an official difficulty rating, "hard" is relative to what you've done before.`
                : ` TSA doesn't publish an official difficulty rating, so how hard it feels really depends on your own experience with the skills it involves.`;
            return ok(pick([
                `${name} is ${pick(variants, s)}.${context} That's TSA Hub's assessment, not an official TSA rating.`,
                `On TSA Hub's scale, ${name} is ${pick(variants, s + '2')}.${context}`,
            ], s), DERIVED);
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
                    `No verified materials info is on file for ${name} yet. Rather than guess, I'd point you to the current official rules — want me to look for the submission requirements instead?`,
                ], s), sourceType: OFFICIAL, missing: true };
            }
            const flagged = String(event.materials).trim().toLowerCase() === 'yes';
            if (!flagged) {
                return ok(pick([
                    `TSA Hub doesn't flag ${name} as needing materials or equipment beyond what the challenge itself calls for. That's TSA Hub's read on it, not a line from the official rules — check the current-year guide if you want the official wording.`,
                    `${name} isn't marked as needing extra materials or equipment on TSA Hub's side. That's our classification, not an official TSA statement, so the current rules are the real source if you need to be sure.`,
                ], s), DERIVED);
            }
            return ok(pick([
                `TSA Hub flags ${name} as needing materials or equipment beyond the basics, but I don't have the specific list. Want me to check the current official rules for exactly what's required?`,
                `${name} is marked as needing some materials or equipment, though I don't have the exact list on file — the current-year rules would have the specifics.`,
            ], s), DERIVED);
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
