// Sections 9-13, 17-18, 45, 53: state advisor/website/instagram/facebook
// search, across the WHOLE real state dataset, with full-name, abbreviation,
// and natural-language variants. Only tests a state's own resource types
// that actually exist for it (per this session's earlier delegation audit —
// e.g. California has no verified Facebook, so no query should surface one).

import { describe, it, expect } from 'vitest';
import { search, statesWithData, titleIn } from './setup.js';
import { STATE_TSA } from '../../../data/stateTsa.js';
import { STATE_ABBREVIATIONS } from '../../../data/stateAbbreviations.js';

const states = statesWithData();

describe('state advisor search — whole dataset', () => {
    const informalAdvisorQueries = [
        'advisor', 'state advisor', 'tsa advisor', 'my advisor', 'who is my advisor',
        'who do i contact', 'state contact', 'tsa contact', 'advisor email', 'advisor phone',
    ];

    it('every state that HAS an advisor on file surfaces "State Advisor" for every informal advisor query', () => {
        const failures = [];
        let statesWithAdvisor = 0;
        for (const state of states) {
            const hasAdvisor = STATE_TSA[state].links.some((l) => l.role === 'advisor');
            if (!hasAdvisor) continue;
            statesWithAdvisor++;
            for (const q of informalAdvisorQueries) {
                const results = search(q, state);
                if (!titleIn(results, 'State Advisor')) {
                    failures.push(`${state}: "${q}" did not find State Advisor`);
                }
            }
        }
        expect(statesWithAdvisor).toBeGreaterThan(30);
        expect(failures, failures.join('\n')).toEqual([]);
    });

    it('state-name-qualified advisor queries (full name + postal abbreviation) find that state\'s advisor', () => {
        const sample = ['Alabama', 'Texas', 'North Carolina', 'New Jersey', 'District of Columbia'].filter((s) => STATE_TSA[s]?.links.some((l) => l.role === 'advisor'));
        const failures = [];
        for (const state of sample) {
            const abbr = STATE_ABBREVIATIONS[state];
            for (const q of [`${state} advisor`, `${state} tsa advisor`, `who runs ${state} tsa`, `${state} tsa contact`, `${abbr} tsa advisor`]) {
                const results = search(q, state);
                if (!titleIn(results, 'State Advisor')) failures.push(`${state}: "${q}" did not find State Advisor`);
            }
        }
        expect(failures, failures.join('\n')).toEqual([]);
    });

    it('State Advisor ranks in the top 3 for a direct "[state] advisor" query', () => {
        const failures = [];
        for (const state of ['Alabama', 'Texas', 'Georgia']) {
            const results = search(`${state} advisor`, state);
            const idx = results.findIndex((r) => r.title === 'State Advisor');
            if (idx === -1 || idx > 2) failures.push(`${state}: State Advisor rank ${idx} (expected top 3)`);
        }
        expect(failures, failures.join('\n')).toEqual([]);
    });
});

describe('state website search — whole dataset', () => {
    const queries = ['state website', 'tsa website', 'official state tsa site', 'state delegation website', "my state's tsa website", 'state tsa homepage'];

    it('every state with a verified website surfaces it for every informal website query', () => {
        const failures = [];
        for (const state of states) {
            const site = STATE_TSA[state].links.find((l) => l.icon === 'globe');
            if (!site) continue;
            for (const q of queries) {
                const results = search(q, state);
                if (!titleIn(results, site.title)) failures.push(`${state}: "${q}" did not find "${site.title}"`);
            }
        }
        expect(failures, failures.join('\n')).toEqual([]);
    });

    it('state-qualified website queries (full name + abbreviation) work', () => {
        const failures = [];
        for (const state of ['Alabama', 'Texas']) {
            const site = STATE_TSA[state].links.find((l) => l.icon === 'globe');
            const abbr = STATE_ABBREVIATIONS[state];
            for (const q of [`${state} tsa website`, `${abbr} tsa website`, `official website for tsa in ${state.toLowerCase()}`, `where is ${state.toLowerCase()} tsa online`]) {
                const results = search(q, state);
                if (!titleIn(results, site.title)) failures.push(`${state}: "${q}" did not find "${site.title}"`);
            }
        }
        expect(failures, failures.join('\n')).toEqual([]);
    });
});

describe('instagram search — whole dataset, verified only', () => {
    const queries = ['instagram', 'insta', 'ig', 'tsa instagram', 'state instagram', 'social media', 'tsa social', 'state tsa socials', 'does my state have instagram'];

    it('every state with a verified Instagram surfaces it for every informal instagram query', () => {
        const failures = [];
        let statesWithIG = 0;
        for (const state of states) {
            const ig = STATE_TSA[state].links.find((l) => /instagram/i.test(l.title));
            if (!ig) continue;
            statesWithIG++;
            for (const q of queries) {
                const results = search(q, state);
                if (!titleIn(results, ig.title)) failures.push(`${state}: "${q}" did not find "${ig.title}"`);
            }
        }
        expect(statesWithIG).toBeGreaterThan(20);
        expect(failures, failures.join('\n')).toEqual([]);
    });

    it('a state with NO verified Instagram never fabricates a STATE one (the generic National Instagram is a legitimate fallback result)', () => {
        const noIG = states.find((s) => !STATE_TSA[s].links.some((l) => /instagram/i.test(l.title)));
        expect(noIG, 'expected at least one state with no verified Instagram for this test to mean anything').toBeTruthy();
        const results = search('instagram', noIG);
        expect(results.some((r) => r.state === noIG && /instagram/i.test(r.title))).toBe(false);
    });

    it('"ig" (2-char abbreviation) does not false-positive match unrelated resources', () => {
        // "ig" must not substring-match inside unrelated words — this is the
        // exact class of bug word-boundary matching exists to prevent.
        const results = search('ig', 'Alabama');
        for (const r of results) {
            expect(/instagram|social/i.test(r.title + ' ' + (r.subtitle || ''))).toBe(true);
        }
    });
});

describe('facebook search — whole dataset, verified only', () => {
    const queries = ['facebook', 'fb', 'tsa facebook', 'state facebook', 'social page', 'state tsa social media'];

    it('every state with a verified Facebook surfaces it for every informal facebook query', () => {
        const failures = [];
        let statesWithFB = 0;
        for (const state of states) {
            const fb = STATE_TSA[state].links.find((l) => /facebook/i.test(l.title));
            if (!fb) continue;
            statesWithFB++;
            for (const q of queries) {
                const results = search(q, state);
                if (!titleIn(results, fb.title)) failures.push(`${state}: "${q}" did not find "${fb.title}"`);
            }
        }
        expect(statesWithFB).toBeGreaterThan(10);
        expect(failures, failures.join('\n')).toEqual([]);
    });

    it('a state with NO verified Facebook never fabricates a STATE one (the generic National Facebook is a legitimate fallback result)', () => {
        const noFB = states.find((s) => !STATE_TSA[s].links.some((l) => /facebook/i.test(l.title)));
        expect(noFB, 'expected at least one state with no verified Facebook for this test to mean anything').toBeTruthy();
        const results = search('facebook', noFB);
        expect(results.some((r) => r.state === noFB && /facebook/i.test(r.title))).toBe(false);
    });
});

describe('national vs state intent — must not blend', () => {
    it('"national tsa instagram" surfaces the National Instagram, not the selected state\'s', () => {
        const results = search('national tsa instagram', 'Alabama');
        expect(titleIn(results, 'Official TSA Instagram')).toBe(true);
        const top = results[0];
        expect(top?.title).not.toMatch(/^Official Alabama/);
    });

    it('"alabama tsa instagram" surfaces Alabama\'s, ranked above the generic National one', () => {
        const results = search('alabama tsa instagram', 'Alabama');
        const alIdx = results.findIndex((r) => r.title === 'Official Alabama TSA Instagram');
        const natIdx = results.findIndex((r) => r.title === 'Official TSA Instagram');
        expect(alIdx).toBeGreaterThanOrEqual(0);
        if (natIdx >= 0) expect(alIdx).toBeLessThan(natIdx);
    });
});

describe('state name normalization', () => {
    it('case-insensitive full state names all resolve the same way', () => {
        const variants = ['new york', 'New York', 'NEW YORK'];
        const titles = variants.map((v) => search(`${v} tsa website`, 'New York').map((r) => r.title).sort());
        expect(titles[0]).toEqual(titles[1]);
        expect(titles[1]).toEqual(titles[2]);
    });

    it('District of Columbia is reachable via "DC" and "D.C."', () => {
        if (!STATE_TSA['District of Columbia']) return; // skip if no longer in dataset
        for (const q of ['DC tsa website', 'D.C. tsa website']) {
            const results = search(q, 'District of Columbia');
            expect(results.length, `"${q}" found nothing for DC`).toBeGreaterThan(0);
        }
    });

    it('"TX TSA website" resolves to Texas, not confused with unrelated text', () => {
        const results = search('TX TSA website', 'Texas');
        expect(titleIn(results, 'Official Texas TSA Website')).toBe(true);
    });
});
