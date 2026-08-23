// Deterministic phrasing variation. Same seed always yields the same variant,
// so tests stay reliable and facts never change between runs.

export function hash(str) {
    let h = 5381;
    for (let i = 0; i < (str || '').length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
    return h;
}

export function pick(variants, seed) {
    if (!variants || !variants.length) return '';
    return variants[hash(String(seed)) % variants.length];
}
