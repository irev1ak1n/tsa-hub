// A01-style coverage: every TSA Hub event gets a recognition + division +
// theme test. Deterministic — checked against the real event record, not
// against a second LLM's opinion of the answer.
//
// Some event names exist in BOTH divisions (Coding, Robotics, System Control
// Technology, Chapter Team, Drone Challenge (UAV), Dragster/Dragster Design,
// Flight/Flight Endurance, Tech Bowl/Technology Bowl, Audio Podcasting,
// Children's Stories, Video Game Design, Biotechnology/Biotechnology
// Design, Board Game Design). For those, the Coach correctly asks which
// division before answering (see the dedicated test below) instead of
// silently guessing — so their event/theme queries need division context
// established first, the same way a real student's conversation would.

import { describe, it, expect } from 'vitest';
import { loadRealData, ask, askChain, events } from './setup.js';

loadRealData();

function divisionAmbiguousNames() {
    const byName = new Map();
    for (const e of events()) {
        const key = e.name.toLowerCase();
        if (!byName.has(key)) byName.set(key, []);
        byName.get(key).push(e);
    }
    return new Set(
        [...byName.entries()]
            .filter(([, list]) => new Set(list.map((e) => e.division)).size >= 2)
            .map(([key]) => key)
    );
}

function askForEvent(question, event, ambiguousNames) {
    if (ambiguousNames.has(event.name.toLowerCase())) {
        const divPhrase = event.division === 'HS' ? "I'm in high school." : "I'm in middle school.";
        return askChain([divPhrase, question]).at(-1);
    }
    return ask(question);
}

describe('event-wide coverage: "What is X?"', () => {
    it('loaded the real catalog', () => {
        expect(events().length).toBeGreaterThan(50);
    });

    it('every event resolves to itself and states the correct division, with no crash', () => {
        const ambiguousNames = divisionAmbiguousNames();
        const failures = [];
        for (const e of events()) {
            let res;
            try {
                res = askForEvent(`What is ${e.name}?`, e, ambiguousNames);
            } catch (err) {
                failures.push(`${e.id}: threw ${err.message}`);
                continue;
            }
            const divWord = e.division === 'HS' ? 'High School' : 'Middle School';
            if (!res.text.includes(divWord)) {
                failures.push(`${e.id} (${e.division}): overview missing "${divWord}" — got: ${res.text.slice(0, 100)}`);
            }
            // The overview must not silently answer as a DIFFERENT event —
            // but a longer event's own overview often legitimately contains
            // a shorter, unrelated event's name as a plain substring (e.g.
            // "Dragster" inside "Dragster Design", "Coding" inside the
            // "Computing & Coding" category label), so only flag it when the
            // answer does NOT also contain this event's own name.
            const otherEventNamed = events().find((o) => o.id !== e.id && o.name !== e.name && res.text.includes(o.name) && !res.text.includes(e.name));
            if (otherEventNamed) {
                failures.push(`${e.id}: answer names a different event "${otherEventNamed.name}" and not "${e.name}" — got: ${res.text.slice(0, 120)}`);
            }
        }
        expect(failures, failures.join('\n')).toEqual([]);
    });
});

describe('theme coverage: current-season theme is surfaced, never invented', () => {
    it('every event with a real theme on file returns that exact theme text (with division context where the name is shared); events with none say so honestly', () => {
        const ambiguousNames = divisionAmbiguousNames();
        const failures = [];
        for (const e of events()) {
            const res = askForEvent(`What is the theme for ${e.name}?`, e, ambiguousNames);
            const hasRealTheme = e.theme && !/no theme available/i.test(e.theme);
            if (hasRealTheme) {
                if (!res.text.includes(e.theme)) {
                    failures.push(`${e.id}: theme answer doesn't contain the on-file theme text — got: ${res.text.slice(0, 140)}`);
                }
            } else {
                // No theme on file (either literally absent, or the row says
                // "No theme available for this season") — the Coach must say
                // so, not invent one.
                const honest = /no (annual )?theme|don'?t have a theme|not listed/i.test(res.text);
                if (!honest) {
                    failures.push(`${e.id}: has no real theme on file but answer doesn't admit it — got: ${res.text.slice(0, 140)}`);
                }
            }
        }
        expect(failures, failures.join('\n')).toEqual([]);
    });
});

describe('MS vs HS: same-named events never cross-contaminate', () => {
    it('every event name that exists in both divisions gives division-correct answers when the division is stated', () => {
        const byName = new Map();
        for (const e of events()) {
            const key = e.name.toLowerCase();
            if (!byName.has(key)) byName.set(key, []);
            byName.get(key).push(e);
        }
        const dual = [...byName.values()].filter((list) => list.length >= 2 && new Set(list.map((e) => e.division)).size >= 2);
        expect(dual.length, 'expected at least some events to exist in both MS and HS for this test to mean anything').toBeGreaterThan(3);

        const failures = [];
        for (const list of dual) {
            const hs = list.find((e) => e.division === 'HS');
            const ms = list.find((e) => e.division === 'MS');
            if (!hs || !ms) continue;
            const hsRes = askChain(["I'm in high school", `what's the theme for ${hs.name}?`]).at(-1);
            const msRes = askChain(["I'm in middle school", `what's the theme for ${ms.name}?`]).at(-1);
            if (hs.theme && !/no theme available/i.test(hs.theme) && ms.theme && !/no theme available/i.test(ms.theme) && hs.theme !== ms.theme) {
                if (hsRes.text.includes(ms.theme)) failures.push(`${hs.id}: HS query returned the MS theme instead`);
                if (msRes.text.includes(hs.theme)) failures.push(`${ms.id}: MS query returned the HS theme instead`);
            }
        }
        expect(failures, failures.join('\n')).toEqual([]);
    });

    it('WITHOUT division context, a shared event name asks which division instead of silently defaulting to HS', () => {
        const failures = [];
        for (const name of ['Coding', 'Robotics', 'System Control Technology', 'Chapter Team', 'Drone Challenge (UAV)']) {
            const res = ask(`What is the theme for ${name}?`);
            const asksBoth = /middle school/i.test(res.text) && /high school/i.test(res.text);
            if (!asksBoth) failures.push(`${name}: expected a division-clarifying question, got: ${res.text}`);
        }
        expect(failures, failures.join('\n')).toEqual([]);
    });
});
