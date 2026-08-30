// "Resources → Events → Event Guide" (formerly "Event Details", and before
// that "Themes and Problems" — renamed twice, same route/data/functionality
// throughout): the hub page and every event's own theme entry must be
// registered in the Resources search index, findable by the exact query
// phrases the product spec calls out, including both old names as search
// aliases. EVENTS is normally Supabase-only (empty at test load — see
// ../__tests__/setup.js), so this file seeds a small fixture via
// setEvents() itself, scoped to this test file's own module graph.

import { describe, it, expect, beforeAll } from 'vitest';
import { setEvents } from '../../../data/events.js';
import { indexFor, search, titleIn } from './setup.js';

beforeAll(() => {
    setEvents([
        { id: 'ms-animatronics', name: 'Animatronics', division: 'MS' },
        { id: 'hs-animatronics', name: 'Animatronics', division: 'HS' },
        { id: 'ms-robotics', name: 'Robotics', division: 'MS' },
        { id: 'hs-robotics', name: 'Robotics', division: 'HS' },
        { id: 'webmaster', name: 'Webmaster', division: 'HS' },
        { id: 'ms-data-science-and-analytics', name: 'Data Science and Analytics', division: 'MS' },
        { id: 'hs-data-science-and-analytics', name: 'Data Science and Analytics', division: 'HS' },
    ]);
});

describe('Resources → Events → Event Guide: search coverage', () => {
    it('the hub page itself is indexed under its new name and points at the right route', () => {
        const items = indexFor();
        const hub = items.find((i) => i.title === 'Event Guide');
        expect(hub).toBeTruthy();
        expect(hub.to).toBe('/resources/events/themes');
        expect(hub.group).toBe('Events');
        // Neither old title should still be the displayed title anywhere.
        expect(items.some((i) => i.title === 'Themes and Problems')).toBe(false);
        expect(items.some((i) => i.title === 'Event Details')).toBe(false);
    });

    it('both old names still find the renamed hub as search aliases', () => {
        expect(titleIn(search('themes and problems'), 'Event Guide')).toBe(true);
        expect(titleIn(search('event details'), 'Event Guide')).toBe(true);
    });

    it('every event gets its own theme entry pointing at its existing theme page', () => {
        const items = indexFor();
        const webmaster = items.find((i) => i.title === 'Webmaster Theme');
        expect(webmaster).toBeTruthy();
        expect(webmaster.to).toBe('/resources/events/webmaster');
    });

    it.each(['themes', 'problems', 'current theme', 'annual challenge'])('generic query "%s" surfaces the Event Guide hub', (q) => {
        const results = search(q);
        expect(titleIn(results, 'Event Guide')).toBe(true);
    });

    it('"animatronics theme" surfaces the Animatronics theme entries at the top', () => {
        const results = search('animatronics theme');
        expect(results.length).toBeGreaterThan(0);
        expect(results[0].title).toBe('Animatronics Theme');
    });

    it('"robotics problem" surfaces the Robotics theme entries at the top', () => {
        const results = search('robotics problem');
        expect(results.length).toBeGreaterThan(0);
        expect(results[0].title).toBe('Robotics Theme');
    });

    it('"webmaster theme" surfaces the Webmaster theme entry at the top', () => {
        const results = search('webmaster theme');
        expect(results[0].title).toBe('Webmaster Theme');
        expect(results[0].to).toBe('/resources/events/webmaster');
    });

    it('"data science challenge" surfaces the Data Science and Analytics theme entries at the top', () => {
        const results = search('data science challenge');
        expect(results.length).toBeGreaterThan(0);
        expect(results[0].title).toBe('Data Science and Analytics Theme');
    });

    it('MS and HS versions of the same event name are both present, distinguished by division in the subtitle', () => {
        const items = indexFor();
        const robotics = items.filter((i) => i.title === 'Robotics Theme');
        expect(robotics).toHaveLength(2);
        expect(robotics.map((r) => r.subtitle).sort()).toEqual([
            expect.stringContaining('High School'),
            expect.stringContaining('Middle School'),
        ]);
    });
});
