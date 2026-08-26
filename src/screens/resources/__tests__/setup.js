// Shared harness for the Resources Search QA suite. Everything Resources
// Search reads is plain, synchronously-imported JS data (unlike the Coach's
// Supabase-backed event catalog), so no async setup is needed — tests build
// the real index straight from the real data modules.

import { buildResourceIndex, searchResources } from '../resourceSearch.jsx';
import { getStateTsa, STATE_TSA } from '../../../data/stateTsa.js';

// Search with a given state selected (or none). Returns the ranked results.
export function search(query, stateName = null) {
    const stateInfo = stateName ? getStateTsa(stateName) : null;
    const index = buildResourceIndex(stateInfo);
    return searchResources(index, query);
}

export function indexFor(stateName = null) {
    const stateInfo = stateName ? getStateTsa(stateName) : null;
    return buildResourceIndex(stateInfo);
}

// States with verified TSA Hub data — the ones Resources Search can actually
// be tested against (states with none render nothing in "Your State", which
// is correct behavior, not a search bug).
export function statesWithData() {
    return Object.keys(STATE_TSA);
}

// Find a result by title in a result list (case-sensitive exact — titles are
// the stable identity students actually recognize).
export function findResult(results, title) {
    return results.find((r) => r.title === title) || null;
}

export function titleIn(results, title) {
    return results.some((r) => r.title === title);
}
