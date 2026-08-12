import { imageForEvent } from '../../data/eventImages.js';

// Combined division badge, MS before HS (e.g. "MS/HS").
export function divisionLabel(divs) {
    return ['MS', 'HS'].filter((d) => divs.includes(d)).join('/');
}

// Some events are the same across divisions but have slightly different names
// (e.g. "Dragster" vs "Dragster Design"). Map those variants to one canonical
// group so they merge into a single MS/HS tile. `name` is what the tile shows.
export const MERGE_GROUPS = [
    { key: 'structural', name: 'Structural Engineering', variants: ['structural engineering', 'structural design and engineering'] },
    { key: 'dragster', name: 'Dragster', variants: ['dragster', 'dragster design'] },
    { key: 'tech-bowl', name: 'Technology Bowl', variants: ['tech bowl', 'technology bowl'] },
    { key: 'biotechnology', name: 'Biotechnology', variants: ['biotechnology', 'biotechnology design'] },
];

const _variantToGroup = {};
for (const g of MERGE_GROUPS) {
    for (const v of g.variants) _variantToGroup[v] = g;
}

export function canonicalName(name) {
    const n = (name || '').trim().toLowerCase();
    return _variantToGroup[n] ? _variantToGroup[n].key : n;
}
export function displayName(rep) {
    const n = (rep.name || '').trim().toLowerCase();
    return _variantToGroup[n] ? _variantToGroup[n].name : rep.name;
}

// Collapse events that are the same across divisions into one tile.
export function mergeByName(events) {
    const groups = new Map();
    for (const e of events) {
        const key = canonicalName(e.name);
        const g = groups.get(key);
        if (g) {
            if (!g.divisions.includes(e.division)) g.divisions.push(e.division);
        } else {
            groups.set(key, { rep: e, divisions: [e.division] });
        }
    }
    return [...groups.values()].map((g) => ({
        ...g.rep,
        name: displayName(g.rep),
        _divisions: g.divisions,
    }));
}

// One explore tile (image + name + MS/HS badge). Clickable when onSelect is
// given, otherwise it renders as a plain non-interactive figure.
export function EventTile({ event, onSelect }) {
    const img = imageForEvent(event);
    const badge = divisionLabel(event._divisions || [event.division]);

    const inner = (
        <>
            {badge && <span className="ev-tile-badge">{badge}</span>}
            {img ? (
                <img className="ev-tile-img" src={img} alt="" loading="lazy" />
            ) : (
                <div className="ev-tile-img ev-tile-fallback" aria-hidden="true" />
            )}
            <figcaption className="ev-tile-name">{event.name}</figcaption>
        </>
    );

    if (onSelect) {
        return (
            <button
                type="button"
                className="ev-tile ev-tile-btn"
                onClick={() => onSelect(event)}
                aria-label={event.name}
            >
                {inner}
            </button>
        );
    }

    return <figure className="ev-tile">{inner}</figure>;
}

// Render a merged grid from a plain event list, with a key that re-animates
// tiles whenever `animKey` changes. Pass onSelect to make tiles open a modal.
export function EventGrid({ events, animKey = '', onSelect }) {
    return (
        <div className="ev-grid" key={animKey}>
            {mergeByName(events).map((e) => (
                <EventTile key={e.id} event={e} onSelect={onSelect} />
            ))}
        </div>
    );
}