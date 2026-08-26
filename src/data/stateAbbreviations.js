// USPS-style state/territory abbreviations, keyed by the canonical state name
// used elsewhere in TSA Hub (src/data/stateTsa.js's US_STATES / STATE_TSA
// keys). Used by Resources Search so "TX tsa website" or "AL advisor"
// resolves to the right state without guessing.

export const STATE_ABBREVIATIONS = {
    'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR',
    'California': 'CA', 'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE',
    'District of Columbia': 'DC', 'Florida': 'FL', 'Georgia': 'GA', 'Hawaii': 'HI',
    'Idaho': 'ID', 'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA', 'Kansas': 'KS',
    'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
    'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS',
    'Missouri': 'MO', 'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV',
    'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY',
    'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH', 'Oklahoma': 'OK',
    'Oregon': 'OR', 'Pennsylvania': 'PA', 'Puerto Rico': 'PR', 'Rhode Island': 'RI',
    'South Carolina': 'SC', 'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX',
    'Utah': 'UT', 'Vermont': 'VT', 'Virginia': 'VA', 'Washington': 'WA',
    'West Virginia': 'WV', 'Wisconsin': 'WI', 'Wyoming': 'WY',
};

// Reverse lookup: 'tx' -> 'Texas'. Includes a couple of informal DC variants
// since "DC"/"D.C." are both common and neither matches the abbreviation
// table's punctuation-free form on its own.
export const ABBREVIATION_TO_STATE = (() => {
    const out = {};
    for (const [name, abbr] of Object.entries(STATE_ABBREVIATIONS)) {
        out[abbr.toLowerCase()] = name;
    }
    out['dc'] = 'District of Columbia';
    return out;
})();

// Detect a state mentioned in free text by full name OR standalone
// abbreviation (word-boundary matched, so "AL" never fires on "official").
// Returns the canonical state name, or null.
export function detectStateInText(text) {
    const t = ` ${String(text || '').toLowerCase().replace(/\./g, '')} `;
    for (const name of Object.keys(STATE_ABBREVIATIONS)) {
        if (t.includes(` ${name.toLowerCase()} `)) return name;
    }
    const words = t.trim().split(/\s+/);
    for (const w of words) {
        if (ABBREVIATION_TO_STATE[w]) return ABBREVIATION_TO_STATE[w];
    }
    return null;
}
