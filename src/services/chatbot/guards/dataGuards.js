// Safety guards. These prevent confident wrong answers when data is missing,
// stale, or internally inconsistent.

export function isMissing(value) {
    return value === null || value === undefined || value === '' ||
        (Array.isArray(value) && value.length === 0);
}

// Pull digits out of the official eligibility sentence, e.g. "two to three (2-3)".
function teamNumbersFromText(text) {
    if (!text) return null;
    const paren = String(text).match(/\((\d+)\s*[-–]\s*(\d+)\)/);
    if (paren) return [Number(paren[1]), Number(paren[2])];
    const single = String(text).match(/\((\d+)\)\s*(team member|member|student)/);
    if (single) return [Number(single[1]), Number(single[1])];
    return null;
}

function teamNumbersFromField(teamSize) {
    if (teamSize == null) return null;
    const s = String(teamSize);
    const range = s.match(/^(\d+)\s*[-–]\s*(\d+)$/);
    if (range) return [Number(range[1]), Number(range[2])];
    const n = Number(s);
    if (Number.isFinite(n)) return [Math.round(n), Math.round(n)];
    return null;
}

/**
 * Check the structured team size against the official eligibility sentence.
 * Returns { conflict: boolean, detail } so the caller can refuse to answer.
 */
export function checkTeamSizeConsistency(event) {
    const el = event?.eligibility;
    if (!el) return { conflict: false };
    const fromField = teamNumbersFromField(el.teamSize);
    const fromText = teamNumbersFromText(el.text);
    if (!fromField || !fromText) return { conflict: false };
    if (fromField[0] !== fromText[0] || fromField[1] !== fromText[1]) {
        return {
            conflict: true,
            detail: `structured ${fromField.join('-')} vs eligibility text ${fromText.join('-')}`,
        };
    }
    return { conflict: false };
}

// A season mentioned by the user, e.g. "2026-2027" or "2026 27".
export function seasonInQuestion(text) {
    const m = String(text || '').match(/\b(20\d{2})\s*[-–/ ]\s*(20\d{2}|\d{2})\b/);
    if (!m) return null;
    const start = m[1];
    const end = m[2].length === 2 ? `20${m[2]}` : m[2];
    return `${start}-${String(end).slice(2)}`;
}

/**
 * Compare the season the user asked about with the season on the data.
 * Returns null when fine, or a warning sentence when the data is older.
 */
export function freshnessWarning(askedSeason, dataSeason) {
    if (!askedSeason || !dataSeason) return null;
    const norm = (s) => String(s).replace(/\s/g, '');
    if (norm(askedSeason) === norm(dataSeason)) return null;
    return `I only have the ${dataSeason} version of this information, so I can't confirm it is still current for ${askedSeason}.`;
}

export const CONFLICT_MESSAGE =
    "I found conflicting information for this requirement, so I don't want to give you the wrong answer. Please check the current official event guide.";
