// Team size is the single highest-traffic real-student question in the
// mission brief ("me and like 3 of my friends wanna do webmaster..."), so it
// gets its own file: one canonical fact per event, many paraphrases, and a
// contradiction check across them.
//
// Coding, Robotics, System Control Technology, Chapter Team, and Drone
// Challenge (UAV) all exist in BOTH divisions under the identical name, so
// the Coach correctly refuses to guess team size for them without division
// context (see events-coverage.qa.test.js for that behavior itself) — these
// tests establish "I'm in high school" first, the same way a real student's
// conversation would, before asking the team-size question.

import { describe, it, expect } from 'vitest';
import { loadRealData, ask, askChain, findEventByName } from './setup.js';

loadRealData();

function numbersIn(text) {
    return (text.match(/\b\d+\b/g) || []).map(Number);
}

function askHS(question) {
    return askChain(['im in high school', question]).at(-1);
}

describe('WEBMASTER_TEAM_SIZE (HS Webmaster — only offered in HS, no MS namesake: solo OR team of up to 6)', () => {
    const paraphrases = [
        'What is the maximum team size for Webmaster?',
        'how many people can i team up with for webmaster',
        'me and like 3 of my friends wanna do webmaster together can all 4 of us do it',
        'would a group of four work for webmaster',
        'max ppl webmaster',
        'how many ppl for webmater', // typo + abbreviation
        'can i do webmaster by myself or is it one of those events where you have to have a team',
    ];

    it('every real Webmaster team-size paraphrase agrees: solo is allowed, team can go up to 6, never "exactly 6"', () => {
        const failures = [];
        for (const q of paraphrases) {
            const text = ask(q).text;
            const bad = /you'?ll need 6\b|need exactly 6|requires 6 people|must have 6/i.test(text);
            if (bad) failures.push(`"${q}" implies Webmaster REQUIRES exactly 6 — got: ${text}`);
        }
        expect(failures, failures.join('\n')).toEqual([]);
    });

    it('a context-carried follow-up ("im doing webmaster" then "how many ppl can i have") still gets the right number', () => {
        const [, t2] = askChain(['im doing webmaster', 'how many ppl can i have']);
        expect(numbersIn(t2.text)).toContain(6);
    });

    it('solo entry for Webmaster is never denied', () => {
        const res = ask('can i do webmaster by myself or is it one of those events where you have to have a team');
        expect(res.text).not.toMatch(/you'?ll need a team|team-based, so you can'?t enter alone|can'?t enter webmaster by yourself/i);
    });
});

describe('CODING_TEAM_SIZE (HS Coding: exact team of 2, no solo)', () => {
    it('with HS context established, a false claim of 3 people is not confirmed — the real max (2) is stated', () => {
        const res = askHS('can 3 ppl do coding');
        expect(numbersIn(res.text)).toContain(2);
        expect(res.text).not.toMatch(/yes,? (that|3|three) works|3 (people|members) (can|is allowed)/i);
    });

    it('with HS context established, "is it solo or with somebody" correctly says Coding is NOT individual', () => {
        const res = askHS('is coding like just one person or can i do it with somebody');
        expect(res.text).toMatch(/team|can'?t enter .* (by yourself|alone)|need a team/i);
        expect(res.text).not.toMatch(/yes, you can compete in coding on your own/i);
    });

    it('WITHOUT division context, Coding correctly asks MS or HS instead of silently guessing', () => {
        const res = ask('can 3 ppl do coding');
        expect(res.text).toMatch(/middle school|high school/i);
    });
});

describe('ROBOTICS_TEAM_SIZE (HS Robotics: team of 2-6, no solo)', () => {
    it('with HS context established, two people (the stated minimum) is confirmed as enough, not rejected', () => {
        const res = askHS('for robotics can me and my friend just do it together or do we need more people');
        expect(res.text).not.toMatch(/need (more|at least 3|at least four)/i);
    });

    it('with HS context established, solo entry for Robotics is correctly denied (no individual entries on file)', () => {
        const res = askHS('can i do robotics by myself or is it one of those events where you have to have a team');
        expect(res.text).toMatch(/team|can'?t enter .* (by yourself|alone)|need a team/i);
    });
});

describe('division-ambiguous same-name events ask instead of silently picking HS', () => {
    // This was a real bug: DB order sorts divisions alphabetically (HS before
    // MS), so every dual-named event silently answered as if it were the HS
    // one, even for someone who never said "high school".
    const dualNamed = ['Coding', 'Robotics', 'System Control Technology', 'Chapter Team', 'Drone Challenge (UAV)'];

    for (const name of dualNamed) {
        it(`"What is the theme for ${name}?" with no division context asks MS or HS`, () => {
            const res = ask(`What is the theme for ${name}?`);
            expect(res.text).toMatch(/middle school.*high school|high school.*middle school/i);
        });
    }
});

describe('team-size numeric grounding: every event with a real team-size fact is answered with a number that traces to the data', () => {
    it('the maximum team size the Coach states, WITH division context, matches the real max on file', () => {
        const samples = ['Animatronics', 'System Control Technology', 'Chapter Team', 'Drone Challenge (UAV)'];
        const failures = [];
        for (const name of samples) {
            const e = findEventByName(name, 'HS');
            if (!e || !e.eligibility?.teamSize) continue;
            const raw = String(e.eligibility.teamSize);
            const max = raw.includes('-') ? Number(raw.split('-')[1]) : Math.round(Number(raw));
            const res = askHS(`What is the maximum team size for ${name}?`);
            const nums = numbersIn(res.text);
            if (!nums.includes(max)) {
                failures.push(`${name}: expected max ${max} to appear in "${res.text}"`);
            }
        }
        expect(failures, failures.join('\n')).toEqual([]);
    });
});
