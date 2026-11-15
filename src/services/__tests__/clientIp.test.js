import { describe, it, expect, vi, afterEach } from 'vitest';
import { normalizeIp, getClientIp } from '../../../api/_lib/security.js';

afterEach(() => vi.unstubAllEnvs());

const req = (headers = {}, remoteAddress) => ({ headers, socket: remoteAddress ? { remoteAddress } : undefined });

describe('normalizeIp', () => {
    it('accepts IPv4 and strips a port, whitespace and IPv4-mapped IPv6 wrapping', () => {
        expect(normalizeIp('203.0.113.7')).toBe('203.0.113.7');
        expect(normalizeIp(' 203.0.113.7 ')).toBe('203.0.113.7');
        expect(normalizeIp('203.0.113.7:51234')).toBe('203.0.113.7');
        expect(normalizeIp('::ffff:203.0.113.7')).toBe('203.0.113.7');
    });

    it('reduces IPv6 to its /64 so one subscriber cannot rotate addresses', () => {
        const a = normalizeIp('2001:db8:1:2:aaaa:bbbb:cccc:dddd');
        const b = normalizeIp('2001:DB8:1:2::1');
        const c = normalizeIp('[2001:db8:1:2:ffff::9]:443');
        expect(a).toBe('2001:db8:1:2::/64');
        expect(b).toBe(a);
        expect(c).toBe(a);
        expect(normalizeIp('2001:db8:1:3::1')).not.toBe(a);
    });

    it('rejects malformed values instead of using them as keys', () => {
        for (const bad of ['', 'evil', '1.2.3', '999.1.1.1', '1.2.3.4.5', '::g', ':::', '1::2::3', 'a'.repeat(100), null, undefined, 42, {}, ['1.2.3.4']]) {
            expect(normalizeIp(bad)).toBeNull();
        }
    });
});

describe('getClientIp on Vercel', () => {
    it('uses the Vercel-controlled header, not a client-supplied one', () => {
        vi.stubEnv('VERCEL', '1');
        const ip = getClientIp(req({ 'x-vercel-forwarded-for': '198.51.100.9', 'x-forwarded-for': '1.1.1.1' }, '10.0.0.1'));
        expect(ip).toBe('198.51.100.9');
    });

    it('takes the last X-Forwarded-For entry, the one a proxy appended', () => {
        vi.stubEnv('VERCEL', '1');
        expect(getClientIp(req({ 'x-forwarded-for': '6.6.6.6, 7.7.7.7, 198.51.100.9' }))).toBe('198.51.100.9');
    });

    it('cannot be steered by a forged leading address', () => {
        vi.stubEnv('VERCEL', '1');
        const seen = new Set();
        for (let i = 0; i < 20; i += 1) seen.add(getClientIp(req({ 'x-forwarded-for': `10.9.8.${i}, 198.51.100.9` })));
        expect(seen).toEqual(new Set(['198.51.100.9']));
    });

    it('skips an invalid trusted header and falls through to the next one', () => {
        vi.stubEnv('VERCEL', '1');
        expect(getClientIp(req({ 'x-vercel-forwarded-for': 'not-an-ip', 'x-real-ip': '198.51.100.9' }))).toBe('198.51.100.9');
    });

    it('collapses missing or garbage headers into one shared bucket', () => {
        vi.stubEnv('VERCEL', '1');
        expect(getClientIp(req({}))).toBe('unknown');
        expect(getClientIp(req({ 'x-forwarded-for': '<script>' }))).toBe('unknown');
        expect(getClientIp(req({ 'x-forwarded-for': ['1.2.3.4'] }))).toBe('unknown');
    });
});

describe('getClientIp off Vercel', () => {
    it('ignores every forwarding header and uses the connection address', () => {
        vi.stubEnv('VERCEL', '');
        const ip = getClientIp(req({ 'x-forwarded-for': '1.1.1.1', 'x-real-ip': '2.2.2.2', 'x-vercel-forwarded-for': '3.3.3.3' }, '192.0.2.50'));
        expect(ip).toBe('192.0.2.50');
    });

    it('honours only the header named by TRUSTED_PROXY_HEADER', () => {
        vi.stubEnv('VERCEL', '');
        vi.stubEnv('TRUSTED_PROXY_HEADER', 'CF-Connecting-IP');
        const ip = getClientIp(req({ 'cf-connecting-ip': '198.51.100.9', 'x-forwarded-for': '1.1.1.1' }, '192.0.2.50'));
        expect(ip).toBe('198.51.100.9');
    });

    it('returns the shared bucket when there is no usable address at all', () => {
        vi.stubEnv('VERCEL', '');
        expect(getClientIp(req({}))).toBe('unknown');
    });
});

describe('keyedHash', () => {
    it('is not the plain SHA-256 once a server secret exists, so stored IP hashes cannot be brute-forced', async () => {
        const { keyedHash, sha256 } = await import('../../../api/_lib/security.js');
        vi.stubEnv('RATE_LIMIT_SALT', '');
        vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '');
        expect(keyedHash('203.0.113.7')).toBe(sha256('203.0.113.7'));
        vi.stubEnv('RATE_LIMIT_SALT', 'secret-one');
        const one = keyedHash('203.0.113.7');
        expect(one).not.toBe(sha256('203.0.113.7'));
        expect(one).toMatch(/^[0-9a-f]{64}$/);
        vi.stubEnv('RATE_LIMIT_SALT', 'secret-two');
        expect(keyedHash('203.0.113.7')).not.toBe(one);
    });
});
