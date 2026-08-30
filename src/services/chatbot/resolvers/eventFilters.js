// Cross-event filters — "what events can I do solo", "low cost events",
// "events for coding". These describe a KIND of event across the whole
// catalog, not one specific event, so they answer from the full event list
// instead of resolving (or failing to resolve) a single event name.
//
// Every classification here is TSA Hub's own read of its data (cost band,
// difficulty band, project-type tags, the materials yes/no flag, eligibility
// individualOk), never an invented or official-sounding rating. Where TSA
// doesn't publish an official version of the thing being asked about
// (a "beginner friendly" label, a per-event equipment list), the response
// says so before offering TSA Hub's own classification instead.

import { pick } from '../core/variation.js';
import { preconferenceFor, CAREER_LABELS } from './events.js';

const DERIVED = 'derived';
const OFFICIAL = 'official';

const LOW_COST_BANDS = ['0-25', '25-75'];

const INTEREST_LABELS = {
    code: 'coding and programming',
    build: 'building and fabrication',
    design: 'design work',
    video: 'video and digital media',
};

function nameList(events, max = 8) {
    const names = [...new Set(events.map((e) => e.name).filter(Boolean))];
    if (!names.length) return null;
    if (names.length <= max) return names.join(', ');
    return `${names.slice(0, max).join(', ')}, and ${names.length - max} more`;
}

function seedFor(kind, events) {
    return kind + events.length;
}

export function answerEventFilter(kind, allEvents, opts = {}) {
    const events = Array.isArray(allEvents) ? allEvents.filter(Boolean) : [];

    switch (kind) {
        case 'solo': {
            const matches = events.filter((e) => e.eligibility?.individualOk === true);
            if (!matches.length) return { text: "I don't have any events on file marked for individual entry right now, so I can't give you a confident list.", sourceType: DERIVED, missing: true };
            const list = nameList(matches, 10);
            return {
                text: pick([
                    `Based on TSA Hub's eligibility data, these events allow you to compete on your own: ${list}. Individual entry can still be capped even where it's allowed, so it's worth double-checking the specific event's eligibility rules before you commit.`,
                    `These events let you enter individually, no team required: ${list}. That's from TSA Hub's own eligibility data, so check the exact event page for any caps on solo entries.`,
                ], seedFor(kind, matches)),
                sourceType: OFFICIAL,
                events: matches,
            };
        }

        case 'team': {
            const matches = events.filter((e) => e.eligibility && e.eligibility.individualOk !== true && (e.eligibility.teamSize || e.eligibility.text));
            if (!matches.length) return { text: "I don't have enough team-eligibility data on file to give you a confident list of team-only events.", sourceType: DERIVED, missing: true };
            const list = nameList(matches, 10);
            return {
                text: pick([
                    `These events require a team, individual entries aren't allowed: ${list}. That's based on TSA Hub's eligibility data.`,
                    `Based on TSA Hub's data, these events need a team rather than allowing solo entries: ${list}.`,
                ], seedFor(kind, matches)),
                sourceType: OFFICIAL,
                events: matches,
            };
        }

        case 'costLow': {
            const matches = events.filter((e) => LOW_COST_BANDS.includes(e.costBand));
            if (!matches.length) return { text: "I don't have cost classifications on file to confidently pull together a lower-cost list right now.", sourceType: DERIVED, missing: true };
            const list = nameList(matches, 10);
            return {
                text: pick([
                    `TSA doesn't publish an official cost rating, but based on typical materials, TSA Hub classifies these as lower-cost events: ${list}. Actual cost still depends on what your team already has versus what you'd need to buy.`,
                    `Here's TSA Hub's own lower-cost classification, not an official TSA number: ${list}. Your real cost will still come down to what materials or equipment your team already has access to.`,
                ], seedFor(kind, matches)),
                sourceType: DERIVED,
                events: matches,
            };
        }

        case 'beginner': {
            const matches = events.filter((e) => e.difficulty === 'beginner');
            const intro = "TSA doesn't officially label any event as \"beginner friendly\" — that's TSA Hub's own read based on typical workload, difficulty, and how approachable the event tends to be for first-time competitors.";
            if (!matches.length) return { text: `${intro} I don't have enough difficulty data on file right now to point to specific events, though — want to tell me what you enjoy (coding, building, design, presenting) so I can narrow it down another way?`, sourceType: DERIVED, missing: true };
            const list = nameList(matches, 10);
            return {
                text: `${intro} Based on that classification, events like ${list} tend to be the most approachable for someone just starting out. Want to narrow it down further? Tell me what you enjoy, or whether you'd rather work solo or with a team.`,
                sourceType: DERIVED,
                events: matches,
            };
        }

        case 'lowEquipment': {
            const matches = events.filter((e) => e.materials === 'no');
            const intro = "TSA Hub doesn't track a detailed equipment list, only whether an event is flagged as needing materials or equipment beyond the basics.";
            if (!matches.length) return { text: `${intro} I don't have enough of that flag set on file right now to give you a confident list.`, sourceType: DERIVED, missing: true };
            const list = nameList(matches, 10);
            return {
                text: `${intro} Based on that flag, these events aren't marked as needing extra materials or equipment: ${list}. That's TSA Hub's classification, not an official rule, so check the current-year requirements to be sure.`,
                sourceType: DERIVED,
                events: matches,
            };
        }

        case 'noPresent': {
            const matches = events.filter((e) => e.projectType.length && !e.projectType.includes('present'));
            if (!matches.length) return { text: "I don't have enough project-type data on file to confidently rule presenting in or out across events right now.", sourceType: DERIVED, missing: true };
            const list = nameList(matches, 10);
            return {
                text: `Based on TSA Hub's project-type tags, these events aren't flagged as involving a judged presentation: ${list}. Plenty of events still involve some kind of interview or explanation to judges even without a formal presentation, so this isn't a guarantee of zero judge interaction, just what TSA Hub has tagged.`,
                sourceType: DERIVED,
                events: matches,
            };
        }

        case 'noPreconference': {
            const matches = events.filter((e) => {
                const pre = preconferenceFor(e);
                return pre.known && pre.items.length === 0;
            });
            if (!matches.length) return { text: "I don't have enough preconference submission data on file to confidently list events without one.", sourceType: OFFICIAL, missing: true };
            const list = nameList(matches, 10);
            return {
                text: `Based on TSA Hub's preconference submission data, these events don't have a preconference item due before competition: ${list}.`,
                sourceType: OFFICIAL,
                events: matches,
            };
        }

        case 'materialsNeeded': {
            const matches = events.filter((e) => e.materials === 'yes');
            const intro = "TSA Hub doesn't track a detailed supplies list, only whether an event is flagged as needing materials or equipment beyond the basics.";
            if (!matches.length) return { text: `${intro} I don't have enough of that flag set on file right now to give you a confident list.`, sourceType: DERIVED, missing: true };
            const list = nameList(matches, 10);
            return {
                text: `${intro} Based on that flag, these events are marked as needing extra materials or equipment: ${list}. Check each event's current-year rules for the specific list.`,
                sourceType: DERIVED,
                events: matches,
            };
        }

        case 'career': {
            const keys = opts.careers || [];
            const matches = events.filter((e) => keys.some((k) => (e.careers || {})[k]));
            const label = [...new Set(keys.map((k) => CAREER_LABELS[k] || k))].join(', ');
            if (!matches.length) return { text: `I don't have events tagged toward ${label} careers on file right now, so I can't give you a confident list.`, sourceType: DERIVED, missing: true };
            const list = nameList(matches, 10);
            return {
                text: pick([
                    `Events on TSA Hub connected to ${label}: ${list}.`,
                    `Based on TSA Hub's career tags, these events connect to ${label}: ${list}.`,
                ], seedFor('career' + label, matches)),
                sourceType: DERIVED,
                events: matches,
            };
        }

        case 'interest': {
            const key = opts.interest;
            const label = INTEREST_LABELS[key] || key;
            let matches;
            if (key === 'video') {
                matches = events.filter((e) => e.category === 'Digital Media');
            } else {
                matches = events.filter((e) => e.projectType.includes(key));
            }
            if (!matches.length) return { text: `I don't have enough events tagged around ${label} on file to give you a confident list right now.`, sourceType: DERIVED, missing: true };
            const list = nameList(matches, 10);
            return {
                text: pick([
                    `Events on TSA Hub tagged around ${label}: ${list}.`,
                    `Based on TSA Hub's project tags, these events involve ${label}: ${list}.`,
                ], seedFor(kind + key, matches)),
                sourceType: DERIVED,
                events: matches,
            };
        }

        default:
            return null;
    }
}
