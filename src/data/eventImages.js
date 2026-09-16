// ============================================================================
// Event images.
// Resolves the right image for an event. Resolution order:
//   1) division+id override   (EVENT_IMAGE_MAP_BY_DIV['HS:audio-podcasting'])
//   2) id override            (EVENT_IMAGE_MAP[id])
//   3) the event id itself     (id.webp / id.png)
//   4) the slugified name      (slug(name).webp / slug(name).png)
// WebP (resized + compressed, see scripts note below) is preferred; the
// original PNG is kept on disk as a fallback for any file not yet converted.
// If nothing matches, or the resolved file fails to actually load, the
// caller (EventTile) shows its existing dark placeholder tile.
//
// Loaded LAZILY (import.meta.glob with eager: false): dev-server startup and
// every HMR pass used to eagerly pull all ~70 event images into the module
// graph via `{ eager: true }`, which was real memory/instability pressure on
// the Vite dev server. Now each image is only fetched the first time an
// EventTile actually needs it, and resolved URLs are cached so revisiting a
// tile never re-fetches the same module. Use the useEventImage() hook below
// instead of a plain synchronous imageForEvent() call — async resolution is
// unavoidable with a lazy glob, so this is a hook, not a function.
// ============================================================================

import { useEffect, useState } from 'react';

const webpLoaders = import.meta.glob('../assets/img/events/*.webp', { eager: false, import: 'default' });
const pngLoaders = import.meta.glob('../assets/img/events/*.png', { eager: false, import: 'default' });

function keyOf(globPath) {
    return globPath.split('/').pop().replace(/\.(webp|png)$/i, '');
}

// filename (without extension) -> lazy loader function. WebP registered
// second so it wins over a same-named PNG wherever both exist.
const loaders = {};
for (const path in pngLoaders) loaders[keyOf(path)] = pngLoaders[path];
for (const path in webpLoaders) loaders[keyOf(path)] = webpLoaders[path];

function slugify(s) {
    return String(s || '')
        .toLowerCase()
        .replace(/&/g, ' ')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

// ---- overrides keyed by event id (value = image filename without extension) ----
// Real ids taken from the event data. Some use ms-/hs- prefixes, some don't,
// so both divisions are covered explicitly where the same event appears twice.
export const EVENT_IMAGE_MAP = {
    // Artificial Intelligence (AI) — slug gets double dashes from parentheses
    'artificial-intelligence-ai': 'artificial-intelligence',

    // Future Technology and Engineering Teacher
    'future-tech-teacher': 'future-technology-engineering-teacher',
    'ms-future-tech-teacher': 'future-technology-engineering-teacher',

    // Structural Design / Engineering (HS = structural-design, MS = ms-structural-engineering)
    'structural-design': 'structural-engineering',
    'ms-structural-engineering': 'structural-engineering',

    // Children's Stories (HS = childrens-stories, MS = ms-childrens-stories)
    'childrens-stories': 'children-stories',
    'ms-childrens-stories': 'children-stories',

    // Computer-Aided Design (CAD) Foundations (MS) + CAD Architecture (HS)
    'ms-cad-foundations': 'cad-foundations',
    'cad-foundations': 'cad-foundations',
    'cad-architecture': 'car-architecture',

    // Drone Challenge (UAV) (HS = drone-challenge, MS = ms-drone-challenge-uav)
    'drone-challenge': 'drone-challenge',
    'ms-drone-challenge-uav': 'drone-challenge',

    // Electrical Applications
    'ms-electrical-applications': 'electrical-appliances',
    'electrical-applications': 'electrical-appliances',

    // Inventions and Innovations
    'ms-inventions': 'inventions-and-innovations',
    'inventions': 'inventions-and-innovations',

    // Leadership Strategies
    'ms-leadership-strategies': 'leadership-and-speaking',
    'leadership-strategies': 'leadership-and-speaking',

    // Software Development
    'software-development': 'software-dev',
    'software-dev': 'software-dev',

    // Technology Bowl
    'technology-bowl': 'tech-bowl',
    'tech-bowl': 'tech-bowl',

    // Biotechnology Design
    'biotechnology-design': 'biotechnology',
    'biotechnology': 'biotechnology',

    // Dragster Design
    'dragster-design': 'dragster',
    'dragster': 'dragster',
};

// ---- overrides keyed by "DIVISION:id" for same-name-different-division ----
export const EVENT_IMAGE_MAP_BY_DIV = {
    'HS:hs-audio-podcasting': 'audio-podcasting2',
    'MS:ms-audio-podcasting': 'audio-podcasting',
    // fallbacks if ids come without a division prefix
    'HS:audio-podcasting': 'audio-podcasting2',
    'MS:audio-podcasting': 'audio-podcasting',
};

const _missingLogged = new Set();

// Pure and synchronous — just resolves WHICH file (if any) matches this
// event. No I/O, so this is safe to call on every render.
export function resolveEventImageKey(event) {
    if (!event) return null;
    const divKey = `${event.division}:${event.id}`;

    // 1) division+id override
    const divOverride = EVENT_IMAGE_MAP_BY_DIV[divKey];
    if (divOverride && loaders[divOverride]) return divOverride;

    // 2) id override
    const override = EVENT_IMAGE_MAP[event.id];
    if (override && loaders[override]) return override;

    // 3) id itself
    if (event.id && loaders[event.id]) return event.id;

    // 4) slugified name
    const nameSlug = slugify(event.name);
    if (nameSlug && loaders[nameSlug]) return nameSlug;

    // TEMP: log unmatched events once so the map can be completed. Dev only.
    if (import.meta.env?.DEV && event.id && !_missingLogged.has(divKey)) {
        _missingLogged.add(divKey);
        // eslint-disable-next-line no-console
        console.warn('[event image missing]', {
            name: event.name,
            division: event.division,
            id: event.id,
            triedSlug: nameSlug,
        });
    }

    return null;
}

// Resolved-URL cache (and in-flight promises) so the same file is only ever
// dynamically imported once, no matter how many times a tile mounts.
const _urlCache = new Map();
const _pending = new Map();

function loadEventImageUrl(key) {
    if (_urlCache.has(key)) return Promise.resolve(_urlCache.get(key));
    if (_pending.has(key)) return _pending.get(key);

    const loader = loaders[key];
    if (!loader) return Promise.resolve(null);

    const promise = loader()
        .then((url) => {
            _urlCache.set(key, url);
            _pending.delete(key);
            return url;
        })
        .catch(() => {
            _pending.delete(key);
            if (import.meta.env?.DEV) {
                // eslint-disable-next-line no-console
                console.warn('[event image failed to load]', key);
            }
            return null;
        });

    _pending.set(key, promise);
    return promise;
}

// React hook: resolves an event's image URL on demand instead of eagerly
// loading the whole image set. Mirrors the old synchronous imageForEvent()
// return shape (a URL string, or null while loading / with no match / on a
// failed load) so EventTile only needed to swap a function call for a hook
// call — same "falsy means show the placeholder" contract as before.
export function useEventImage(event) {
    const key = resolveEventImageKey(event);
    const [src, setSrc] = useState(() => (key ? _urlCache.get(key) || null : null));

    useEffect(() => {
        if (!key) {
            setSrc(null);
            return undefined;
        }
        const cached = _urlCache.get(key);
        if (cached) {
            setSrc(cached);
            return undefined;
        }
        let alive = true;
        loadEventImageUrl(key).then((url) => {
            if (alive) setSrc(url);
        });
        return () => {
            alive = false;
        };
    }, [key]);

    return src;
}
