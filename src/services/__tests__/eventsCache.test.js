import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../supabase.js', () => ({ supabase: {} }));

const { readCachedEvents, writeCachedEvents } = await import('../eventsService.js');

function memoryStorage() {
    const data = new Map();
    return {
        getItem: (k) => (data.has(k) ? data.get(k) : null),
        setItem: (k, v) => { data.set(k, String(v)); },
        removeItem: (k) => { data.delete(k); },
    };
}

beforeEach(() => {
    vi.stubGlobal('localStorage', memoryStorage());
});

describe('events cache', () => {
    it('round-trips the last good list', () => {
        const rows = [{ id: 'a', name: 'Animatronics' }, { id: 'b', name: 'Coding' }];
        writeCachedEvents(rows);
        expect(readCachedEvents()).toEqual(rows);
    });

    it('returns null when nothing is cached or the data is bad', () => {
        expect(readCachedEvents()).toBeNull();
        localStorage.setItem('tsa-hub-events-cache-v1', '{not json');
        expect(readCachedEvents()).toBeNull();
        localStorage.setItem('tsa-hub-events-cache-v1', '[]');
        expect(readCachedEvents()).toBeNull();
    });

    it('never overwrites a good cache with an empty list', () => {
        writeCachedEvents([{ id: 'a' }]);
        writeCachedEvents([]);
        expect(readCachedEvents()).toEqual([{ id: 'a' }]);
    });

    it('survives storage that throws', () => {
        vi.stubGlobal('localStorage', {
            getItem: () => { throw new Error('denied'); },
            setItem: () => { throw new Error('full'); },
        });
        expect(() => writeCachedEvents([{ id: 'a' }])).not.toThrow();
        expect(readCachedEvents()).toBeNull();
    });
});
