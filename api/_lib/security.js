import { createHash, createHmac } from 'node:crypto';
import { isIP } from 'node:net';
import { createClient } from '@supabase/supabase-js';

const memoryHits = new Map();

export class LimiterUnavailableError extends Error {}

// Vercel sets VERCEL_ENV; outside Vercel, NODE_ENV=production counts too.
export function isProduction() {
    const vercelEnv = process.env.VERCEL_ENV;
    return vercelEnv ? vercelEnv === 'production' : process.env.NODE_ENV === 'production';
}

export function sha256(value) {
    return createHash('sha256').update(String(value)).digest('hex');
}

// Keyed hash for values stored in the rate_limits table. A plain SHA-256 of an
// IPv4 address can be reversed by hashing all 4 billion addresses, so the key is
// a server-only secret. RATE_LIMIT_SALT wins; the service-role key is a
// fallback because it never leaves the server. Without either (local dev) it
// degrades to the plain hash.
export function keyedHash(value) {
    const secret = process.env.RATE_LIMIT_SALT || process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!secret) return sha256(value);
    return createHmac('sha256', secret).update(String(value)).digest('hex');
}

// ---- Client IP -----------------------------------------------------------
//
// The rate limits are keyed on the caller's IP, so the value must be one the
// caller cannot choose. On Vercel the edge network overwrites X-Forwarded-For,
// X-Real-IP and X-Vercel-Forwarded-For with the real connecting address and
// drops any client-supplied copy (Vercel "Request headers" docs). Everywhere
// else (local dev, tests, other hosts) those headers are plain client input and
// are ignored: the socket address is used instead. A deployment behind its own
// proxy should set TRUSTED_PROXY_HEADER to the header that proxy controls.

// One IPv4 address, or an IPv6 address reduced to its /64 network, because a
// single subscriber normally owns a whole /64 and could otherwise rotate
// through 2^64 addresses to dodge the limit. Returns null for anything that is
// not a valid address.
export function normalizeIp(raw) {
    if (typeof raw !== 'string') return null;
    let value = raw.trim().toLowerCase();
    if (!value || value.length > 64) return null;
    if (value.startsWith('[')) {
        const end = value.indexOf(']');
        if (end === -1) return null;
        value = value.slice(1, end);
    } else if (/^\d{1,3}(\.\d{1,3}){3}:\d{1,5}$/.test(value)) {
        value = value.slice(0, value.lastIndexOf(':'));
    }
    const zone = value.indexOf('%');
    if (zone !== -1) value = value.slice(0, zone);

    const mapped = /^(?:::ffff:|0:0:0:0:0:ffff:)(\d{1,3}(?:\.\d{1,3}){3})$/.exec(value);
    if (mapped) value = mapped[1];

    const family = isIP(value);
    if (family === 4) return value;
    if (family !== 6) return null;

    let groups;
    const tailV4 = /^(.*:)(\d{1,3}(?:\.\d{1,3}){3})$/.exec(value);
    if (tailV4) {
        const [a, b, c, d] = tailV4[2].split('.').map(Number);
        value = `${tailV4[1]}${((a << 8) | b).toString(16)}:${((c << 8) | d).toString(16)}`;
    }
    const halves = value.split('::');
    if (halves.length > 2) return null;
    const head = halves[0] ? halves[0].split(':') : [];
    const tail = halves.length === 2 && halves[1] ? halves[1].split(':') : [];
    const missing = 8 - head.length - tail.length;
    if (halves.length === 2) {
        if (missing < 1) return null;
        groups = [...head, ...Array(missing).fill('0'), ...tail];
    } else {
        groups = head;
    }
    if (groups.length !== 8) return null;
    return `${groups.slice(0, 4).map((g) => g.replace(/^0+(?=.)/, '')).join(':')}::/64`;
}

function headerValue(req, name) {
    const value = req.headers?.[name];
    return typeof value === 'string' ? value : null;
}

export function getClientIp(req) {
    const trusted = [];
    const custom = (process.env.TRUSTED_PROXY_HEADER || '').trim().toLowerCase();
    if (custom) trusted.push(custom);
    if (process.env.VERCEL) trusted.push('x-vercel-forwarded-for', 'x-real-ip', 'x-forwarded-for');

    for (const name of trusted) {
        const raw = headerValue(req, name);
        if (!raw) continue;
        // The nearest proxy appends the address it saw, so the last entry is the
        // one a client cannot forge. Vercel sends a single value.
        const parts = raw.split(',');
        const ip = normalizeIp(parts[parts.length - 1]);
        if (ip) return ip;
    }
    return normalizeIp(req.socket?.remoteAddress) || 'unknown';
}

export function setApiHeaders(res) {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
}

function allowedHosts(req) {
    const hosts = new Set();
    if (req.headers?.host) hosts.add(req.headers.host.toLowerCase());
    for (const o of (process.env.ALLOWED_ORIGINS || '').split(',')) {
        try { if (o.trim()) hosts.add(new URL(o.trim()).host.toLowerCase()); } catch { /* ignore bad entry */ }
    }
    return hosts;
}

// The iOS app's WebView loads the bundled site from this exact origin, so its
// calls to the API are cross-origin. It is allow-listed by full origin string
// (never a wildcard) and gets CORS headers; the rate limits stay the real
// abuse control because an origin header is not authentication.
const NATIVE_APP_ORIGINS = new Set(['capacitor://localhost']);

export function isNativeAppOrigin(req) {
    const origin = req.headers?.origin;
    return typeof origin === 'string' && NATIVE_APP_ORIGINS.has(origin);
}

export function applyNativeCors(req, res) {
    if (!isNativeAppOrigin(req)) return false;
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Max-Age', '600');
    return true;
}

// Browsers always send Origin on cross-origin and same-origin POSTs; a
// request with neither a matching Origin nor Sec-Fetch-Site: same-origin
// did not come from this site's own pages.
export function isTrustedOrigin(req) {
    const origin = req.headers?.origin;
    if (origin) {
        if (NATIVE_APP_ORIGINS.has(origin)) return true;
        try { return allowedHosts(req).has(new URL(origin).host.toLowerCase()); } catch { return false; }
    }
    return req.headers?.['sec-fetch-site'] === 'same-origin';
}

export function isJsonRequest(req) {
    return String(req.headers?.['content-type'] || '').toLowerCase().startsWith('application/json');
}

export function parseBody(req) {
    let body = req.body;
    if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch { return null; }
    }
    return body && typeof body === 'object' && !Array.isArray(body) ? body : null;
}

export function getServiceClient() {
    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return null;
    return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function memoryAllow(key, limit, windowSeconds) {
    const now = Date.now();
    const windowMs = windowSeconds * 1000;
    const recent = (memoryHits.get(key) || []).filter((t) => now - t < windowMs);
    recent.push(now);
    memoryHits.set(key, recent);
    if (memoryHits.size > 5000) memoryHits.clear();
    return recent.length <= limit;
}

// Shared across serverless instances via public.check_rate_limit (see
// supabase/security). In production there is no weaker fallback: if the
// shared limiter cannot answer, the request is refused. Per-instance memory
// is used only in development, tests and non-production deployments.
export async function allowRequest(client, key, limit, windowSeconds) {
    if (client) {
        try {
            const { data, error } = await client.rpc('check_rate_limit', {
                p_key: key,
                p_limit: limit,
                p_window_seconds: windowSeconds,
            });
            if (!error && typeof data === 'boolean') return data;
            console.error('rate-limit rpc failed:', error?.code || error?.message);
        } catch (err) {
            console.error('rate-limit rpc threw:', err?.name);
        }
    }
    if (isProduction()) throw new LimiterUnavailableError('shared rate limiter unavailable');
    return memoryAllow(key, limit, windowSeconds);
}

export async function releaseRequest(client, key) {
    memoryHits.delete(key);
    if (client) await client.from('rate_limits').delete().eq('key', key);
}
