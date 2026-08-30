// ============================================================================
// Adapter layer for the canonical full event-detail page (see
// src/screens/resources/EventFullPage.jsx). Never a second copy of event
// data — everything here just reshapes fields already in data/events.js and
// data/eventThemes.js for that page (and EventInfoModal, which shares this
// so the two don't drift into two different "related events" algorithms).
// ============================================================================

// Same-division events that share interests/project style/category with
// `source` — used for both the Events modal's "Related Events" chips and the
// full event page's, so there is exactly one related-events algorithm.
// Returns [{ id, name }], not bare names, so callers can link to them.
export function getRelatedEvents(source, allEvents, { limit = 6 } = {}) {
    if (!source || !Array.isArray(allEvents)) return [];
    const srcInt = Object.keys(source.interests || {});
    const srcStyle = Array.isArray(source.projectStyle) ? source.projectStyle : [];
    const scored = allEvents
        .filter((e) => e.id !== source.id && e.division === source.division)
        .map((e) => {
            const intOverlap = Object.keys(e.interests || {}).filter((k) => srcInt.includes(k)).length;
            const styleOverlap = (Array.isArray(e.projectStyle) ? e.projectStyle : []).filter((s) => srcStyle.includes(s)).length;
            const catBonus = e.category === source.category ? 1 : 0;
            return { e, score: intOverlap * 2 + styleOverlap + catBonus };
        })
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score);
    return scored.slice(0, limit).map((x) => ({ id: x.e.id, name: x.e.name }));
}
