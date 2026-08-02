// ============================================================================
// Event images.
// Loads every PNG in src/assets/img/events/ and resolves the right one for an
// event. Resolution order:
//   1) division+id override   (EVENT_IMAGE_MAP_BY_DIV['HS:audio-podcasting'])
//   2) id override            (EVENT_IMAGE_MAP[id])
//   3) the event id itself     (id.png)
//   4) the slugified name      (slug(name).png)
// If nothing matches, returns null and the tile shows a dark placeholder.
//
// TEMP DEBUG: any event with no match is logged once (name / division / id).
// Send me that console output and I'll finalize the map, then remove the log.
// ============================================================================

const modules = import.meta.glob('../assets/img/events/*.png', { eager: true });

// filename (without dir + extension) -> image url
const byFile = {};
for (const path in modules) {
    const file = path.split('/').pop().replace(/\.png$/i, '');
    byFile[file] = modules[path].default || modules[path];
}

function slugify(s) {
    return String(s || '')
        .toLowerCase()
        .replace(/&/g, ' ')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

// ---- overrides keyed by event id (value = image filename without .png) ----
// Real ids taken from the event data. Some use ms-/hs- prefixes, some don't,
// so both divisions are covered explicitly where the same event appears twice.
export const EVENT_IMAGE_MAP = {
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

    // Software Development (reported earlier)
    'software-development': 'software-dev',
    'software-dev': 'software-dev',

    // Technology Bowl (reported earlier)
    'technology-bowl': 'tech-bowl',
    'tech-bowl': 'tech-bowl',

    // Biotechnology Design (reported earlier)
    'biotechnology-design': 'biotechnology',
    'biotechnology': 'biotechnology',

    // Dragster Design (reported earlier)
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

export function imageForEvent(event) {
    if (!event) return null;

    // 1) division+id override
    const divKey = `${event.division}:${event.id}`;
    const divOverride = EVENT_IMAGE_MAP_BY_DIV[divKey];
    if (divOverride && byFile[divOverride]) return byFile[divOverride];

    // 2) id override
    const override = EVENT_IMAGE_MAP[event.id];
    if (override && byFile[override]) return byFile[override];

    // 3) id itself
    if (event.id && byFile[event.id]) return byFile[event.id];

    // 4) slugified name
    const nameSlug = slugify(event.name);
    if (nameSlug && byFile[nameSlug]) return byFile[nameSlug];

    // TEMP: log unmatched events once so the map can be completed.
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