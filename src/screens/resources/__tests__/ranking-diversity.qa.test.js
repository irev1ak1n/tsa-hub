// Sections 34-40, 54: ranking order, result diversity, and negative
// (over-matching) tests.

import { describe, it, expect } from 'vitest';
import { search } from './setup.js';

const STATE = 'Alabama';

describe('ranking: high-intent queries put the right resource at Top 1', () => {
    it('"alabama advisor" -> State Advisor is Top 1', () => {
        const results = search('alabama advisor', STATE);
        expect(results[0]?.title).toBe('State Advisor');
    });

    it('"instagram alabama" -> Alabama\'s Instagram ranks above the generic National one', () => {
        const results = search('instagram alabama', STATE);
        const alIdx = results.findIndex((r) => r.title === 'Official Alabama TSA Instagram');
        const natIdx = results.findIndex((r) => r.title === 'Official TSA Instagram');
        expect(alIdx).toBeGreaterThanOrEqual(0);
        if (natIdx >= 0) expect(alIdx).toBeLessThan(natIdx);
    });

    it('exact full-title query ranks that resource first even among partial matches of other resources', () => {
        const results = search('state advisor', STATE);
        expect(results[0]?.title).toBe('State Advisor');
    });
});

describe('result diversity: a state-name query surfaces distinct resource types, not near-duplicates', () => {
    it('"Alabama TSA" surfaces multiple DISTINCT resource types (website/instagram/facebook/advisor/officers)', () => {
        const results = search('Alabama TSA', STATE);
        const titles = new Set(results.map((r) => r.title));
        expect(titles.size).toBeGreaterThanOrEqual(3);
        // Diversity must come from genuinely different resources, not one
        // resource appearing multiple times under different result rows.
        expect(titles.size).toBe(results.length);
    });
});

describe('negative tests: broad tokens do not over-match', () => {
    it('"advisor" alone does not flood results with unrelated resources', () => {
        const results = search('advisor', STATE);
        // Every result must genuinely be advisor-related (title/group/type),
        // not just something that happens to mention "advisor" once in a
        // long unrelated description.
        for (const r of results) {
            const relevant = /advisor/i.test(r.title) || r.type === 'advisor' || /advisor/i.test(r.subtitle || '');
            expect(relevant, `"advisor" matched unrelated resource "${r.title}"`).toBe(true);
        }
    });

    it('"web" does not make every URL-bearing resource look equally relevant', () => {
        const results = search('web', STATE);
        for (const r of results) {
            const hasWebWord = `${r.title} ${r.subtitle || ''} ${r.group}`.toLowerCase().split(/[^a-z]+/).some((w) => w.startsWith('web'));
            expect(hasWebWord, `"web" matched "${r.title}" with no "web*" word anywhere in its visible text`).toBe(true);
        }
    });

    it('"state" does not return every single item in the (one-state) index without discrimination', () => {
        const all = search('Alabama', STATE).length; // rough upper bound of state-scoped items
        const results = search('state', STATE);
        expect(results.length).toBeLessThan(all + 5); // sanity: not literally "everything"
    });
});

describe('route-collision regression: distinct resources sharing a destination must not suppress each other', () => {
    // "State Advisor" and "TSA Leadership & Support" both point to
    // /resources/leadership-support (one IS a specific state's contact card
    // that lives there, the other is the page's own nav entry) — deduping
    // by route alone silently dropped whichever scored second.
    it('a query matching both surfaces both, not just whichever comes first in the index', () => {
        const results = search('advisor', STATE);
        const titles = results.map((r) => r.title);
        expect(titles).toContain('State Advisor');
        expect(titles).toContain('TSA Leadership & Support');
    });
});

describe('no duplicate results', () => {
    it('a query matching a resource via both title and alias still returns it exactly once', () => {
        const results = search('official alabama tsa instagram', STATE);
        const count = results.filter((r) => r.title === 'Official Alabama TSA Instagram').length;
        expect(count).toBe(1);
    });

    it('every result set is free of duplicate titles for a broad query', () => {
        const results = search('alabama tsa', STATE);
        const titles = results.map((r) => r.title);
        expect(new Set(titles).size).toBe(titles.length);
    });
});
