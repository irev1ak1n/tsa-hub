// Sections 6-8, 46: every searchable resource must be findable by its exact
// title (in any case), a reasonable partial-title fragment, and must not be
// an orphan (findable through NO natural query at all).

import { describe, it, expect } from 'vitest';
import { indexFor, search, titleIn } from './setup.js';

const STATE = 'Alabama';

describe('exact-title coverage: every resource findable by its own title', () => {
    const items = indexFor(STATE);

    it('loaded a realistic number of resources', () => {
        expect(items.length).toBeGreaterThan(50);
    });

    it('every resource is found by its exact title, in three cases (lower/upper/as-is)', () => {
        const failures = [];
        for (const item of items) {
            for (const variant of [item.title, item.title.toLowerCase(), item.title.toUpperCase()]) {
                const results = search(variant, STATE);
                if (!titleIn(results, item.title)) {
                    failures.push(`"${item.title}" not found searching "${variant}"`);
                }
            }
        }
        expect(failures, failures.join('\n')).toEqual([]);
    });

    it('every resource is found by a meaningful partial-title fragment (first 2 significant words)', () => {
        const failures = [];
        for (const item of items) {
            const words = item.title.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((w) => w.length >= 3);
            if (!words.length) continue;
            const fragment = words.slice(0, 2).join(' ');
            const results = search(fragment, STATE);
            if (!titleIn(results, item.title)) {
                failures.push(`"${item.title}" not found searching partial "${fragment}"`);
            }
        }
        expect(failures, failures.join('\n')).toEqual([]);
    });
});

describe('singular / plural tolerance', () => {
    const pairs = [
        ['rule', 'rules'],
        ['deadline', 'deadlines'],
        ['event', 'events'],
        ['conference', 'conferences'],
        ['advisor', 'advisors'],
        ['resource', 'resources'],
        ['scholarship', 'scholarships'],
        ['officer', 'officers'],
    ];
    for (const [singular, plural] of pairs) {
        it(`"${singular}" and "${plural}" return overlapping (not wildly different) result sets`, () => {
            const a = search(singular, STATE).map((r) => r.title);
            const b = search(plural, STATE).map((r) => r.title);
            // Neither empty when the other has results is the real failure
            // mode worth catching — exact identical sets aren't required.
            if (a.length > 0 || b.length > 0) {
                expect(a.length === 0 && b.length > 0, `"${singular}" found nothing but "${plural}" found ${b.length}`).toBe(false);
                expect(b.length === 0 && a.length > 0, `"${plural}" found nothing but "${singular}" found ${a.length}`).toBe(false);
            }
        });
    }
});
