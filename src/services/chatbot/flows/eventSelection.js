// ============================================================================
// Reusable, deterministic event-selection helper for Coach's guided flows.
// No randomness (testable, repeatable) — diversity comes from balancing
// across each event's real `category` field, never from an invented
// category/interest mapping. Used by both the recommendation results step
// and the curated branch previews (Browse / Themes / Rules) in
// coachFlows.js, so those previews stop sharing one hardcoded list.
// ============================================================================

function balancedTake(pool, n) {
    // Deterministic (name-sorted, no Math.random), category-balanced
    // round-robin selection of up to n events from `pool`.
    const sorted = [...pool].sort((a, b) => a.name.localeCompare(b.name));
    const byCategory = new Map();
    for (const e of sorted) {
        const key = e.category || 'Other';
        if (!byCategory.has(key)) byCategory.set(key, []);
        byCategory.get(key).push(e);
    }
    const categories = [...byCategory.keys()];
    const result = [];
    let i = 0;
    while (result.length < n && result.length < pool.length) {
        const bucket = byCategory.get(categories[i % categories.length]);
        if (bucket?.length) result.push(bucket.shift());
        i++;
    }
    return result;
}

// preferPredicate is a HARD filter, resolved in two passes so a fallback
// (non-qualified) event can never displace an available qualified one:
// first take as many qualified events as exist (category-balanced among
// themselves), THEN — only if slots remain — top up from the rest.
function selectFrom(pool, count, preferPredicate) {
    if (!preferPredicate) return balancedTake(pool, count);
    const preferredIds = new Set(pool.filter(preferPredicate).map((e) => e.id));
    const chosen = balancedTake(pool.filter((e) => preferredIds.has(e.id)), count);
    if (chosen.length < count) {
        const rest = pool.filter((e) => !preferredIds.has(e.id));
        chosen.push(...balancedTake(rest, count - chosen.length));
    }
    return chosen;
}

// events: the already-valid/filtered candidate pool (e.g. events already
// matching an interest/team preference, or a division). count: how many to
// return. excludeIds: ids to prefer skipping (e.g. already shown this
// session) — resolved the same two-pass way as preferPredicate: as many
// unseen events as exist first, only topping up from previously-shown ones
// when there genuinely aren't enough unseen matches to fill count. This is
// what makes "Show different events" actually differ instead of silently
// shrinking the result set once fewer than `count` unseen matches remain.
export function pickDiverse(events, count, { excludeIds = [], preferPredicate = null } = {}) {
    const excluded = new Set(excludeIds);
    const unseen = events.filter((e) => !excluded.has(e.id));
    const chosen = selectFrom(unseen, count, preferPredicate);
    if (chosen.length < count) {
        const chosenIds = new Set(chosen.map((e) => e.id));
        const seenRest = events.filter((e) => !chosenIds.has(e.id));
        chosen.push(...selectFrom(seenRest, count - chosen.length, preferPredicate));
    }
    return chosen;
}
