// Link and markup guards for values that come from data rather than from code.
//
// Almost every link in the app is a constant in src/data. The exceptions are
// fields read from the events table (for example an event's source URL). Only
// an admin can write that table today, but a link must never be able to run
// script, so these helpers refuse anything that is not plain http or https.

// Returns the normalized URL when it is an absolute http(s) URL, else null.
export function safeHttpUrl(value) {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    if (!trimmed || trimmed.length > 2048) return null;
    try {
        const url = new URL(trimmed);
        if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
        if (url.username || url.password) return null;
        return url.toString();
    } catch {
        return null;
    }
}

// The inline icons in resourceSearch.jsx are SVG fragments rendered with
// dangerouslySetInnerHTML. They are constants today. This accepts only a flat
// list of self-closing shape elements with a small attribute allow-list, so even
// if one ever came from data it could not carry script, event handlers, links
// or foreign content.
const SVG_TAG = /<(path|circle|rect|ellipse|line|polygon|polyline)((?:\s+[a-zA-Z-]+="[^"<>&]*")*)\s*\/>/y;
const SVG_ATTRS = new Set([
    'd', 'fill', 'fill-rule', 'clip-rule', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin',
    'opacity', 'transform', 'cx', 'cy', 'r', 'rx', 'ry', 'x', 'y', 'x1', 'y1', 'x2', 'y2', 'width', 'height', 'points',
]);

export function isSafeSvgFragment(fragment) {
    if (typeof fragment !== 'string' || !fragment || fragment.length > 4000) return false;
    let index = 0;
    while (index < fragment.length) {
        SVG_TAG.lastIndex = index;
        const match = SVG_TAG.exec(fragment);
        if (!match) return false;
        for (const attr of match[2].matchAll(/([a-zA-Z-]+)="/g)) {
            if (!SVG_ATTRS.has(attr[1])) return false;
        }
        index = SVG_TAG.lastIndex;
    }
    return true;
}
