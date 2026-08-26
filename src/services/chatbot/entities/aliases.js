// Event aliases, kept separate from generic language synonyms on purpose.
// Keys are event ids where known, plus a name based fallback map so events
// loaded from Supabase still get aliases without hardcoding all 77 rows.

// Curated aliases by canonical event name, lowercased.
export const NAME_ALIASES = {
    'webmaster': ['web master', 'website event', 'web dev event'],
    'software development': ['software dev', 'app development', 'app dev', 'softdev'],
    'coding': ['code event', 'programming event'],
    // NOTE: deliberately no bare "game design" alias — it collides with any
    // other "___ Game Design" event (e.g. Board Game Design).
    'video game design': ['video game', 'game dev event'],
    'audio podcasting': ['podcast', 'podcasting', 'audio podcast'],
    'architectural design': ['architecture event', 'arch design'],
    'animatronics': ['animatronic'],
    'digital video production': ['digital video', 'video production'],
    'structural engineering': ['structures', 'structure event'],
    // NOTE: no "tech bowl" alias here — Tech Bowl (MS) is a distinct real
    // event with its own name, not an abbreviation of Technology Bowl (HS);
    // aliasing it caused "what is tech bowl" to be treated as a two-event
    // comparison between the two instead of resolving to the MS event asked.
    // NOTE: no bare "flight"/"dragster" aliases here — Flight and Dragster
    // are each real, distinct MS events with their own names, not
    // abbreviations of the HS Flight Endurance / Dragster Design events;
    // aliasing them the same way "tech bowl" was caused a plain "what is
    // dragster" to be treated as a two-event comparison instead of
    // resolving to the MS event actually asked about.
    'cybersecurity': ['cyber security', 'cyber'],
    'data science and analytics': ['data science', 'data analytics', 'analytics'],
    'promotional design': ['promo design'],
    'music production': ['music prod'],
    'photographic technology': ['photography event', 'photo tech'],
    'stem mass media': ['mass media'],
    'virtual reality simulation (vr)': ['vr', 'virtual reality', 'vr simulation'],
    'children\'s stories': ['childrens stories', 'kids stories'],
};

// Common misspellings mapped to the correct canonical name.
export const MISSPELLINGS = {
    'webmater': 'webmaster',
    'webmasetr': 'webmaster',
    'webmastr': 'webmaster',
    'animatronix': 'animatronics',
    'animatroncis': 'animatronics',
    'sofware development': 'software development',
    'softwear development': 'software development',
    'architechtural design': 'architectural design',
    'podcasing': 'audio podcasting',
    'cybersecuirty': 'cybersecurity',
};

export function aliasesFor(name) {
    return NAME_ALIASES[(name || '').trim().toLowerCase()] || [];
}
