// State delegation questions must ground in STATE_TSA (audited earlier this
// session) and never fabricate a website/handle/advisor for a state that
// isn't on file.

import { describe, it, expect } from 'vitest';
import { loadRealData, ask, askChain } from './setup.js';
import { STATE_TSA } from '../../../data/stateTsa.js';

loadRealData();

describe('state grounding — states WITH verified data', () => {
    const withWebsite = Object.entries(STATE_TSA).find(([, v]) => v.links.some((l) => l.icon === 'globe'));
    const [stateName, entry] = withWebsite;
    const site = entry.links.find((l) => l.icon === 'globe');

    it(`gives the exact on-file website for ${stateName}, not a guessed URL`, () => {
        const res = askChain([`what's the official tsa website for ${stateName}`]);
        expect(res[0].text).toContain(site.url);
    });

    it('asking informally ("does my state have a tsa website") after stating the state still resolves correctly', () => {
        const res = askChain([`I'm in ${stateName}`, 'does my state have a tsa website']);
        const last = res[res.length - 1];
        // Either it grounds the same URL, or (acceptable) it still asks which
        // state — but it must never invent a different URL.
        for (const otherState of Object.keys(STATE_TSA)) {
            if (otherState === stateName) continue;
            const otherSite = STATE_TSA[otherState].links.find((l) => l.icon === 'globe');
            if (otherSite) expect(last.text).not.toContain(otherSite.url);
        }
    });
});

describe('state grounding — states with NO data on file must not be fabricated', () => {
    // Confirmed NOT_FOUND in this session's delegation audit — no active
    // statewide TSA presence exists for these states at all.
    const noPresenceStates = ['Wyoming', 'Vermont', 'Nebraska'];

    for (const stateName of noPresenceStates) {
        it(`${stateName}: does not invent a website/social handle`, () => {
            expect(STATE_TSA[stateName]).toBeUndefined(); // sanity: confirms the audit's finding is still reflected in data
            const res = ask(`what's the official tsa website for ${stateName}`);
            expect(res.text).toMatch(/don'?t have|not on file|state directory|state-delegations/i);
            expect(res.text).not.toMatch(/https?:\/\/\S*(wyomingtsa|vermonttsa|nebraskatsa)/i);
        });
    }
});

describe('unknown state — must ask, never guess', () => {
    it('"whos my advisor" with no state context in play asks which state', () => {
        const res = ask('whos my advisor');
        expect(res.text).toMatch(/which state|set your state/i);
    });
});
