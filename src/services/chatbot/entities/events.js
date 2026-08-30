import { getEvents } from '../dataProvider.js';
import { tokenize, editDistance } from '../language/normalize.js';
import { aliasesFor, MISSPELLINGS } from './aliases.js';

// Resolve which TSA event or events a message refers to. Never guesses when two
// events are equally plausible, it reports ambiguity so the caller can ask.

const GENERIC_WORDS = new Set([
    'design', 'technology', 'engineering', 'digital', 'video', 'production',
    'development', 'science', 'system', 'systems', 'and', 'of', 'the',
    // Domain vocabulary that happens to share a word with a specific event
    // name ("Career Prep", "Software Development") — without this, a
    // generic question like "what careers connect to this" or "what
    // software do I need" fuzzy/overlap-matches that unrelated event and
    // silently overrides the real active event from conversation context.
    'career', 'careers', 'software',
    // Negative corpus: ordinary words that must NEVER be treated as event-
    // name evidence, no matter how close an edit distance happens to land
    // them next to some event's name (e.g. "weather" is edit-distance 2 from
    // "teacher", which used to fuzzy-match "Future Technology and
    // Engineering Teacher"). No event is safer than the wrong event.
    'weather', 'rain', 'snow', 'temperature', 'forecast', 'mother', 'mom',
    'dad', 'father', 'family', 'sports', 'football', 'basketball', 'soccer',
    'baseball', 'food', 'pizza', 'movie', 'music', 'school', 'homework',
    'president', 'phone', 'computer', 'money', 'bitcoin', 'game', 'games',
    'minecraft', 'fortnite', 'vacation', 'travel', 'airline', 'hotel',
    'weekend', 'birthday', 'girlfriend', 'boyfriend', 'teacher', 'teachers',
    // Words that are ALSO the entirety (or the only distinctive part) of a
    // real event's name, but are common enough on their own that requiring
    // just this one word (word-overlap ratio 1.0 for one-word names, or the
    // "distinctive" half of a two-word name) produces real false positives:
    // "whats the best basketball team" -> "Chapter Team", "can you solve
    // this algebra problem" -> "Problem Solving", "how do i book a flight"
    // -> "Flight". These stay resolvable via an exact full-name mention
    // ("chapter team", "problem solving") — this only blocks the bare
    // single common word from being sufficient evidence on its own.
    'team', 'board', 'coming', 'storm', 'service',
    'problem', 'flight', 'website', 'leadership', 'advisor',
]);

// A single adjacent-character swap ("roboitcs" vs "robotics") is the most
// common real typo shape and lands at Levenshtein distance 2 despite being
// just as "close" as a distance-1 edit. Two arbitrary substitutions
// ("weather" vs "teacher") also land at distance 2 but are usually two
// genuinely different words that happen to collide — allowing those as
// event-name evidence is what caused real false-positive event matches.
function isAdjacentTransposition(a, b) {
    if (a.length !== b.length) return false;
    const diffs = [];
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) diffs.push(i);
    if (diffs.length !== 2) return false;
    const [i, j] = diffs;
    return j === i + 1 && a[i] === b[j] && a[j] === b[i];
}

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

    const qWords = new Set(tokenize(repaired));
    const hits = [];

    for (const rec of recs) {
        if (!rec.lower) continue;

        // 1. Exact name appears in the message. Guarded for single-word
        // names that are ALSO ordinary English words (e.g. "Flight") — the
        // word showing up anywhere in an unrelated sentence ("how do i book
        // A flight") is not real evidence, but "...for flight"/"...about
        // flight"/"what is flight"/a message that's just the word alone all
        // read as a genuine event reference. The distinguishing signal is
        // the word right before it: an article/possessive ("a", "my", "the")
        // means it's being used as an ordinary noun; "for"/"about"/"is" (or
        // nothing at all, i.e. it's the first/only word) means someone is
        // naming the event.
        const isRiskyBareWord = rec.words.length === 1 && GENERIC_WORDS.has(rec.lower);
        const safeBareWordUse = !isRiskyBareWord || (() => {
            const qWordsArr = tokenize(repaired);
            const idx = qWordsArr.indexOf(rec.lower);
            if (idx === -1) return false;
            const prev = qWordsArr[idx - 1];
            const next = qWordsArr[idx + 1];
            return !prev || ['for', 'about', 'is'].includes(prev) || next === 'work' || next === 'event';
        })();
        if (rec.lower.length >= 4 && repaired.includes(rec.lower) && safeBareWordUse) {
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
        // Checked as an EXACT match against concatenations of 1-3 adjacent
        // words only — never "is this a substring of the whole flattened
        // sentence" (qFlat), which let unrelated adjacent words accidentally
        // spell out a real event name: "...speed of light" flattens to
        // "...speedoflight", which contains "flight" spanning the boundary
        // between "of" and "light" even though neither word means Flight.
        if (rec.flat.length >= 6) {
            const qWordsArr = tokenize(repaired);
            let compactHit = false;
            for (let i = 0; i < qWordsArr.length && !compactHit; i++) {
                let acc = '';
                // Window starts at 2 adjacent words minimum — a SINGLE word
                // exactly equal to rec.flat is really step 1's job (exact
                // name match), which already has its own risky-bare-word
                // guard; without this floor, a single-word event name like
                // "Flight" would sail through here uncontested every time.
                for (let j = i; j < Math.min(i + 3, qWordsArr.length); j++) {
                    acc += qWordsArr[j];
                    if (j > i && acc === rec.flat) { compactHit = true; break; }
                    if (acc.length >= rec.flat.length) break;
                }
            }
            if (compactHit) {
                hits.push({ rec, score: 0.9, how: 'compact' });
                continue;
            }
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
        // 5. Careful fuzzy, only on long distinctive tokens. Max allowed
        // edit distance scales with word length — a distance of 2 on a
        // short-ish 6-8 letter word is a large fraction of the word (e.g.
        // "weather"/"teacher" are genuinely different words that happen to
        // be 2 edits apart) and produced real false positives; only truly
        // long words can safely absorb a distance-2 typo.
        let fuzzyHit = false;
        for (const w of qWords) {
            if (w.length < 6 || GENERIC_WORDS.has(w)) continue;
            for (const nw of rec.words) {
                if (nw.length < 6) continue;
                const dist = editDistance(w, nw, 2);
                const allowed = dist <= 1
                    || (dist === 2 && isAdjacentTransposition(w, nw))
                    || (dist === 2 && w.length >= 9);
                if (allowed) { fuzzyHit = true; break; }
            }
            if (fuzzyHit) break;
        }
        if (fuzzyHit) hits.push({ rec, score: 0.55, how: 'fuzzy' });
    }

    if (!hits.length) return { events: [], candidates: [], ambiguous: false, fuzzy: false };

    // A name that exists in BOTH divisions (e.g. "Audio Podcasting") is
    // genuinely ambiguous without division context — dedupeByName would
    // otherwise silently collapse it to whichever division sorted first
    // (DB order is alphabetical by division, so HS always won), handing back
    // confident-looking HS content to a middle schooler who never said which
    // division they meant. Ask instead, unless the caller already knows.
    if (!activeDivision) {
        const strongByName = new Map();
        let bestScore = 0;
        for (const h of hits) {
            if (h.score < 0.9) continue;
            bestScore = Math.max(bestScore, h.score);
            const key = h.rec.lower;
            if (!strongByName.has(key)) strongByName.set(key, []);
            strongByName.get(key).push(h);
        }
        for (const group of strongByName.values()) {
            const divisions = new Set(group.map((h) => h.rec.event.division));
            // Only treat this as THE division ambiguity when it's the best
            // candidate on the table — a lower-scoring name collision (e.g.
            // an alias shared with an unrelated event) must not shadow a
            // stronger, unambiguous exact match elsewhere in the same query.
            if (divisions.size >= 2 && group[0].score >= bestScore) {
                return {
                    events: [],
                    candidates: group.map((h) => h.rec.event),
                    ambiguous: true,
                    fuzzy: false,
                    divisionAmbiguous: true,
                };
            }
        }
    }

    const deduped = dedupeByName(hits, activeDivision).sort((a, b) => b.score - a.score);
    let strong = deduped.filter((h) => h.score >= 0.9);

    // A shorter event name that is a literal substring of a longer strong
    // match's name (e.g. "Biotechnology" inside "Biotechnology Design")
    // almost always means the user typed the longer name once, not two
    // events — drop the substring match. But only when the LONGER name was
    // itself matched by literal exact substring (how === 'name'), i.e. the
    // user actually typed it — not when it only got in via a curated alias
    // (e.g. "dragster" is a listed alias of "Dragster Design"). Otherwise a
    // plain "What is Dragster?" would lose its own exact match to a shorter
    // name and get incorrectly resolved as the longer, unrelated event.
    if (strong.length >= 2) {
        strong = strong.filter((h) => !strong.some((other) =>
            other !== h && other.how === 'name' && other.rec.lower.includes(h.rec.lower) && other.rec.lower !== h.rec.lower
        ));
    }

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
