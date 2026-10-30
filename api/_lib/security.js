import { createHash } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const memoryHits = new Map();

export function sha256(value) {
    return createHash('sha256').update(String(value)).digest('hex');
}

export function getClientIp(req) {
    const forwarded = req.headers?.['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.length > 0) return forwarded.split(',')[0].trim();
    return req.socket?.remoteAddress || 'unknown';
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

// Browsers always send Origin on cross-origin and same-origin POSTs; a
// request with neither a matching Origin nor Sec-Fetch-Site: same-origin
// did not come from this site's own pages.
export function isTrustedOrigin(req) {
    const origin = req.headers?.origin;
    if (origin) {
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
// supabase/migrations). Falls back to per-instance memory when the service
// key or the function is not available yet, so requests are never blocked
// by a limiter outage.
export async function allowRequest(client, key, limit, windowSeconds) {
    if (client) {
        const { data, error } = await client.rpc('check_rate_limit', {
            p_key: key,
            p_limit: limit,
            p_window_seconds: windowSeconds,
        });
        if (!error && typeof data === 'boolean') return data;
        console.error('rate-limit rpc failed, using in-memory fallback:', error?.message);
    }
    return memoryAllow(key, limit, windowSeconds);
}

export async function releaseRequest(client, key) {
    memoryHits.delete(key);
    if (client) await client.from('rate_limits').delete().eq('key', key);
}
