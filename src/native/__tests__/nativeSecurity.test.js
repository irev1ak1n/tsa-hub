import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { buildNativeCsp, injectCsp } from '../../../scripts/nativeCsp.mjs';

const root = join(import.meta.dirname, '..', '..', '..');
const read = (p) => readFileSync(join(root, p), 'utf8');

describe('native CSP policy', () => {
    const csp = buildNativeCsp({ apiOrigin: 'https://tsa-hub.vercel.app/some/path' });
    const directive = (name) => csp.split('; ').find((d) => d.startsWith(`${name} `));

    it('allows only same-origin scripts and no eval', () => {
        expect(directive('script-src')).toBe("script-src 'self'");
        expect(csp).not.toMatch(/unsafe-eval|unsafe-hashes/);
    });

    it('limits network calls to the app, Supabase and the API origin', () => {
        expect(directive('connect-src')).toBe("connect-src 'self' https://*.supabase.co https://tsa-hub.vercel.app");
    });

    it('blocks plugins, frames, form posts and base-tag tricks', () => {
        for (const d of ["object-src 'none'", "frame-src 'none'", "form-action 'none'", "base-uri 'self'"]) expect(csp).toContain(d);
    });

    it('allows no remote images and no plain http', () => {
        expect(directive('img-src')).toBe("img-src 'self' data: blob:");
        expect(csp).not.toMatch(/http:/);
    });

    it('refuses a non-https API origin', () => {
        expect(() => buildNativeCsp({ apiOrigin: 'http://example.com' })).toThrow(/https/);
    });

    it('works without an API origin', () => {
        expect(buildNativeCsp()).toContain("connect-src 'self' https://*.supabase.co");
    });
});

describe('injectCsp', () => {
    const html = '<!doctype html><html><head>\n<meta charset="UTF-8" />\n<script type="module" src="/a.js"></script></head><body></body></html>';

    it('puts the policy first in head and is idempotent', () => {
        const once = injectCsp(html, "default-src 'self'");
        expect(once.indexOf('Content-Security-Policy')).toBeLessThan(once.indexOf('charset'));
        expect(injectCsp(once, "default-src 'self'")).toBe(once);
    });

    it('escapes quotes so the policy cannot break out of the attribute', () => {
        expect(injectCsp(html, 'a"b')).toContain('content="a&quot;b"');
    });

    it('rejects a document without a head', () => {
        expect(() => injectCsp('<html></html>', "default-src 'self'")).toThrow();
    });
});

// The policy blocks inline scripts, so a build that needs one would show a blank
// screen. These checks run against the real production build when it exists.
const dist = join(root, 'dist');
const hasBuild = existsSync(join(dist, 'index.html'));

describe.skipIf(!hasBuild)('real build is compatible with the native CSP', () => {
    const html = hasBuild ? readFileSync(join(dist, 'index.html'), 'utf8') : '';
    const bundles = () => readdirSync(join(dist, 'assets')).filter((f) => f.endsWith('.js'));

    it('has no inline script, inline handler or javascript: URL', () => {
        const inline = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].filter(([, attrs, body]) => !/\bsrc=/.test(attrs) || body.trim());
        expect(inline).toEqual([]);
        expect(html).not.toMatch(/\son[a-z]+\s*=|javascript:/i);
    });

    it('loads every script and stylesheet from its own origin', () => {
        const refs = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map((m) => m[1]);
        for (const ref of refs) expect(ref, ref).toMatch(/^\//);
    });

    it('has no eval or Function constructor in the app bundle', () => {
        expect(bundles().length).toBeGreaterThan(0);
        for (const file of bundles()) {
            const code = readFileSync(join(dist, 'assets', file), 'utf8');
            expect(code, file).not.toMatch(/\beval\s*\(/);
            expect(code, file).not.toMatch(/\bnew Function\s*\(/);
        }
    });

    it('contains no server-side credential, only the public anon JWT', () => {
        for (const file of bundles()) {
            const code = readFileSync(join(dist, 'assets', file), 'utf8');
            for (const token of code.match(/eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g) || []) {
                const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'));
                expect(payload.role, file).toBe('anon');
            }
            expect(code).not.toMatch(/re_[A-Za-z0-9]{24,}/);
            expect(code).not.toMatch(/SUPABASE_SERVICE_ROLE_KEY|RESEND_API_KEY/);
        }
    });
});

describe('native CSP stays off until it has been tested on a device', () => {
    it('is only added when NATIVE_CSP is exactly "1"', () => {
        const script = read('scripts/buildNative.mjs');
        expect(script).toContain("process.env.NATIVE_CSP === '1'");
    });

    it('is not switched on in the Codemagic config', () => {
        expect(read('codemagic.yaml')).not.toMatch(/NATIVE_CSP\s*:/);
    });
});

describe('iOS project settings stay locked down', () => {
    const plist = read('ios/App/App/Info.plist');
    const config = JSON.parse(read('capacitor.config.json'));

    it('has no App Transport Security exceptions and registers no URL schemes', () => {
        expect(plist).not.toMatch(/NSAppTransportSecurity|NSAllowsArbitraryLoads|NSExceptionDomains/);
        expect(plist).not.toMatch(/CFBundleURLTypes|CFBundleURLSchemes/);
    });

    it('asks for no privacy-sensitive permission', () => {
        expect(plist).not.toMatch(/NS[A-Za-z]+UsageDescription/);
    });

    it('loads the bundled files only, with no remote server or cleartext', () => {
        expect(config.server).toBeUndefined();
        expect(JSON.stringify(config)).not.toMatch(/cleartext|allowNavigation|http:\/\//i);
        expect(config.webDir).toBe('dist');
    });

    it('does not embed credentials in the native build files', () => {
        const text = `${JSON.stringify(config)}\n${read('scripts/buildNative.mjs')}\n${read('codemagic.yaml')}`;
        expect(text).not.toMatch(/eyJ[A-Za-z0-9_-]{20,}\./);
        expect(text).not.toMatch(/SERVICE_ROLE_KEY|RESEND_API_KEY|re_[A-Za-z0-9]{24,}/);
    });
});
