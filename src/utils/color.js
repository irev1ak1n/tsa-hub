// ============================================================================
// Calendar color system.
//
// Official TSA events get a small deterministic palette by category (never
// user-editable). Personal events get a user-chosen background (any hex);
// personal reminders always render purple. Whatever the background, we pick
// a readable foreground (white or near-black) via WCAG relative luminance
// so arbitrary user colors stay legible.
// ============================================================================

export const OFFICIAL_COLORS = {
    'important-date': '#ce1126', // TSA red — deadlines / critical dates
    event: '#ce1126',            // untagged official items read the same way
    conference: '#3457e6',       // blue — conferences / organizational events
    'constant-contact': '#1f9d55', // green — announcements / opportunities
};
const OFFICIAL_DEFAULT = '#3457e6';

export const REMINDER_COLOR = '#8b5cf6';

export const PRESET_EVENT_COLORS = [
    { label: 'TSA red', value: '#ce1126' },
    { label: 'Blue', value: '#3457e6' },
    { label: 'Green', value: '#1f9d55' },
    { label: 'Purple', value: '#8b5cf6' },
    { label: 'Orange', value: '#e8833a' },
    { label: 'Gold', value: '#d4a017' },
    { label: 'Pink', value: '#e05a8a' },
    { label: 'Teal', value: '#0f9b8e' },
    { label: 'Cyan', value: '#2aa9c4' },
    { label: 'Neutral', value: '#5b6270' },
];
export const DEFAULT_PERSONAL_COLOR = '#e8833a';

function hexToRgb(hex) {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '');
    if (!m) return null;
    return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
}

function relativeLuminance(hex) {
    const rgb = hexToRgb(hex);
    if (!rgb) return 1; // unknown color — default to treating it as light (dark text)
    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((v) => {
        const c = v / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// White text unless the background is light enough that it would fail contrast.
export function contrastTextColor(hex) {
    return relativeLuminance(hex) > 0.55 ? '#161616' : '#ffffff';
}

export function officialColor(category) {
    return OFFICIAL_COLORS[category] || OFFICIAL_DEFAULT;
}

// Resolves the {bg, fg} pair for any normalized calendar item (see calendarItems.js).
export function resolveItemColor(item) {
    let bg;
    if (item.kind === 'official') bg = officialColor(item.category);
    else if (item.kind === 'personal-reminder') bg = REMINDER_COLOR;
    else bg = item.raw?.color || DEFAULT_PERSONAL_COLOR;
    return { bg, fg: contrastTextColor(bg) };
}
