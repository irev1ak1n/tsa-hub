import { getEvents } from '../dataProvider.js';
import { tokenize, editDistance } from '../language/normalize.js';
import { aliasesFor, MISSPELLINGS } from './aliases.js';

// Resolve which TSA event or events a message refers to. Never guesses when two
// events are equally plausible, it reports ambiguity so the caller can ask.

const GENERIC_WORDS = new Set([
    'design', 'technology', 'engineering', 'digital', 'video', 'production',
    'development', 'science', 'system', 'systems', 'and', 'of', 'the',
]);

function nameWords(name) {
    return tokenize(name).filter((w) => w.length > 1);
}

function flat(text) {
    return tokenize(text).join('');
}

// Build a fresh index each call group. EVENTS loads asynchronously, so we key
// the cache on the list length and first id rather than caching forever.
let cache = { key: '', index: [] };

function index() {
    const events = getEvents();
    const key = `${events.length}:${events[0]?.id || ''}`;
    if (cache.key === key) return cache.index;
    const built = events.map((e) => {
        const lower = (e.name || '').trim().toLowerCase();
        return {
            event: e,
            lower,
            words: nameWords(e.name),
            flat: flat(e.name),
            aliases: aliasesFor(e.name),
        };
    });
    cache = { key, index: built };
    return built;
}

// Collapse the same event name across divisions into one candidate, preferring
// the active division when the conversation has one.
function dedupeByName(hits, activeDivision) {
    const byName = new Map();
    for (const hit of hits) {
        const key = hit.rec.lower;
        const existing = byName.get(key);
        if (!existing) {
            byName.set(key, hit);
            continue;
        }
        const wantsDivision = activeDivision && hit.rec.event.division === activeDivision;
        const existingMatches = activeDivision && existing.rec.event.division === activeDivision;
        if (hit.score > existing.score || (wantsDivision && !existingMatches)) {
            byName.set(key, hit);
        }
    }
    return [...byName.values()];
}

/**
 * Resolve events mentioned in a message.
 * Returns { events, candidates, ambiguous, fuzzy }.
 */
export function resolveEvents(text, { activeDivision = null } = {}) {
    const q = ` ${(text || '').toLowerCase()} `;
    const recs = index();
    if (!recs.length) return { events: [], candidates: [], ambiguous: false, fuzzy: false };

    // Repair known misspellings before matching.
    let repaired = q;
    for (const [bad, good] of Object.entries(MISSPELLINGS)) {
        if (repaired.includes(bad)) repaired = repaired.split(bad).join(good);
    }

    const qFlat = flat(repaired);
    const qWords = new Set(tokenize(repaired));
    const hits = [];

    for (const rec of recs) {
        if (!rec.lower) continue;

        // 1. Exact name appears in the message.
        if (rec.lower.length >= 4 && repaired.includes(rec.lower)) {
            hits.push({ rec, score: 1, how: 'name' });
            continue;
        }
        // 2. Curated alias appears in the message.
        const alias = rec.aliases.find((a) => repaired.includes(a));
        if (alias) {
            hits.push({ rec, score: 0.95, how: 'alias' });
            continue;
        }
        // 3. Compact form, catches "webmaster" typed as "web master".
        if (rec.flat.length >= 6 && qFlat.includes(rec.flat)) {
            hits.push({ rec, score: 0.9, how: 'compact' });
            continue;
        }
        // 4. Word overlap, needs a distinctive non generic word.
        if (rec.words.length) {
            const matched = rec.words.filter((w) => qWords.has(w));
            const distinctive = matched.filter((w) => w.length > 3 && !GENERIC_WORDS.has(w));
            const ratio = matched.length / rec.words.length;
            if (distinctive.length && ratio >= 0.5) {
                hits.push({ rec, score: 0.6 + Math.min(0.25, ratio * 0.25), how: 'overlap' });
                continue;
            }
        }
        // 5. Careful fuzzy, only on long distinctive tokens.
        let fuzzyHit = false;
        for (const w of qWords) {
            if (w.length < 6 || GENERIC_WORDS.has(w)) continue;
            for (const nw of rec.words) {
                if (nw.length < 6) continue;
                if (editDistance(w, nw, 2) <= 2) { fuzzyHit = true; break; }
            }
            if (fuzzyHit) break;
        }
        if (fuzzyHit) hits.push({ rec, score: 0.55, how: 'fuzzy' });
    }

    if (!hits.length) return { events: [], candidates: [], ambiguous: false, fuzzy: false };

    const deduped = dedupeByName(hits, activeDivision).sort((a, b) => b.score - a.score);
    const strong = deduped.filter((h) => h.score >= 0.9);

    // Two or more strong matches is a legitimate multi event message.
    if (strong.length >= 2) {
        return {
            events: strong.map((h) => h.event || h.rec.event),
            candidates: strong.map((h) => h.rec.event),
            ambiguous: false,
            fuzzy: false,
        };
    }
    if (strong.length === 1) {
        return { events: [strong[0].rec.event], candidates: [strong[0].rec.event], ambiguous: false, fuzzy: false };
    }

    // Only weak matches. If several are close together we refuse to guess.
    const top = deduped[0];
    const close = deduped.filter((h) => top.score - h.score < 0.1);
    if (close.length > 1) {
        return {
            events: [],
            candidates: close.slice(0, 3).map((h) => h.rec.event),
            ambiguous: true,
            fuzzy: top.how === 'fuzzy',
        };
    }
    return {
        events: [top.rec.event],
        candidates: [top.rec.event],
        ambiguous: false,
        fuzzy: top.how === 'fuzzy',
    };
}

export function findDivision(text) {
    const t = tokenize(text);
    if (t.includes('ms') || t.includes('middle')) return 'MS';
    if (t.includes('hs') || t.includes('high')) return 'HS';
    return null;
}
