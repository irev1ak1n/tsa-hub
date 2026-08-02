// ============================================================================
// Event search.
// Builds a rich, lowercased "haystack" per event so search matches more than
// the title: category, division, recommender-derived terms (interests, skills,
// careers, work types, formats), and a manual synonym dictionary.
//
// Robust to id mismatches between Supabase EVENTS and the recommender dataset:
// enrichment is looked up by id first, then falls back to the normalized name.
// The synonym dictionary is keyed by normalized name (names are stable).
// ============================================================================

import { EVENT_REC_DATA } from './eventRecommendationData.js';

const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const decamel = (s) => String(s).replace(/([a-z])([A-Z])/g, '$1 $2');

// Turn an object's keys, an array, or a scalar into space-separated search words.
function wordsFrom(v) {
    if (!v) return '';
    let parts = [];
    if (Array.isArray(v)) parts = v.map((x) => decamel(String(x)));
    else if (typeof v === 'object') parts = Object.keys(v).map((k) => decamel(k));
    else parts = [decamel(String(v))];
    return parts.map(norm).filter(Boolean).join(' ');
}

// ---- build recommender lookups (by id and by normalized name, merged) ----
const recById = {};
const recByName = {};
for (const e of EVENT_REC_DATA || []) {
    const terms = [
        wordsFrom(e.interests),
        wordsFrom(e.skills),
        wordsFrom(e.careers),
        wordsFrom(e.workTypes),
        wordsFrom(e.formats),
        norm(e.category),
    ].filter(Boolean).join(' ');

    recById[e.id] = recById[e.id] ? `${recById[e.id]} ${terms}` : terms;
    const nk = norm(e.name);
    recByName[nk] = recByName[nk] ? `${recByName[nk]} ${terms}` : terms;
}

// ---- manual synonyms, keyed by normalized event name ----
// Add extra words people might type that aren't already in the data.
export const SEARCH_KEYWORDS = {
    'software development': ['coding', 'programming', 'python', 'javascript', 'app', 'developer', 'software', 'web'],
    'video game design': ['gaming', 'game', 'unity', 'godot', 'game dev'],
    'webmaster': ['web', 'website', 'html', 'css', 'frontend'],
    'website design': ['web', 'website', 'html', 'css', 'frontend', 'ui'],
    'coding': ['programming', 'python', 'software', 'developer'],
    'cybersecurity': ['security', 'hacking', 'network', 'infosec'],
    'robotics': ['robot', 'vex', 'automation'],
    'drone challenge uav': ['drone', 'uav', 'quadcopter', 'flight'],
    'digital video production': ['video', 'film', 'editing', 'movie'],
    'on demand video': ['video', 'film', 'editing'],
    'audio podcasting': ['podcast', 'audio', 'sound', 'recording'],
    'music production': ['music', 'audio', 'beats', 'sound'],
    'digital photography': ['photo', 'photography', 'camera'],
    'photographic technology': ['photo', 'photography', 'camera'],
    'flight': ['aviation', 'airplane', 'aircraft', 'fly'],
    'flight endurance': ['aviation', 'airplane', 'glider', 'fly'],
    'dragster': ['car', 'racing', 'co2', 'speed'],
    'structural engineering': ['bridge', 'structure', 'civil', 'building'],
    'architectural design': ['architecture', 'building', 'blueprint'],
    'fashion design and technology': ['fashion', 'clothing', 'textile', 'apparel'],
    'forensic science': ['csi', 'crime', 'investigation'],
    'forensic technology': ['csi', 'crime', 'investigation'],
    'medical technology': ['medicine', 'health', 'biomed'],
    'biotechnology': ['biotech', 'biology', 'genetics', 'lab'],
    'data science and analytics': ['data', 'analytics', 'statistics', 'ml', 'ai'],
    'geospatial technology': ['gis', 'mapping', 'maps', 'geography'],
    'engineering design': ['engineering', 'cad', 'design'],
    'technology bowl': ['quiz', 'trivia', 'knowledge', 'test'],
    'promotional marketing': ['marketing', 'advertising', 'branding'],
    'promotional design': ['marketing', 'graphic', 'branding'],
    'prepared presentation': ['presentation', 'speech', 'public speaking'],
    'prepared speech': ['speech', 'public speaking'],
    'extemporaneous speech': ['speech', 'impromptu', 'public speaking'],
    'debating technological issues': ['debate', 'argument', 'discussion'],
    'children s stories': ['children', 'story', 'writing', 'kids', 'book'],
    'inventions and innovations': ['invention', 'innovation', 'patent', 'design'],
    'manufacturing prototype': ['manufacturing', 'production', 'factory'],
    'transportation modeling': ['transport', 'vehicle', 'car', 'model'],
    'chapter team': ['leadership', 'teamwork', 'parliamentary'],
    'career prep': ['career', 'resume', 'interview', 'job'],
};

function synonyms(name) {
    return (SEARCH_KEYWORDS[norm(name)] || []).join(' ');
}

// Full lowercased haystack for an event.
export function eventSearchText(event) {
    if (!event) return '';
    const nameN = norm(event.name);
    const rec = recById[event.id] || recByName[nameN] || '';
    return [nameN, norm(event.category), norm(event.division), rec, synonyms(event.name)]
        .filter(Boolean)
        .join(' ');
}

// Every whitespace-separated query token must appear (AND). Empty query -> true.
// Short tokens (<= 3 chars, e.g. "ai", "ml") match on word boundaries so they
// don't hit substrings inside longer words; longer tokens match as substrings
// (so "robot" still finds "robotics").
export function matchesQuery(event, query) {
    const q = norm(query);
    if (!q) return true;
    const hay = ` ${eventSearchText(event)} `;
    return q.split(' ').every((tok) => {
        if (!tok) return true;
        if (tok.length <= 3) return hay.includes(` ${tok} `);
        return hay.includes(tok);
    });
}