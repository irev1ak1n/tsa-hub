// Content Security Policy for the bundled iOS app.
//
// Vercel's CSP header protects the website but never reaches the app, because
// the app loads its files from capacitor://localhost. The same protection can
// be added as a <meta> tag in the app's index.html. A wrong policy turns the app
// into a blank screen, and that can only be ruled out on a real device, so this
// is OFF by default. Set NATIVE_CSP=1 for a TestFlight build to try it (see
// docs/IOS_BUILD.md, "Native CSP check"), and make it the default only after
// that build passes.

const SUPABASE_HOSTS = 'https://*.supabase.co';

// apiOrigin is the deployed site the app calls for /api (VITE_API_BASE_URL).
export function buildNativeCsp({ apiOrigin } = {}) {
    let api = '';
    if (apiOrigin) {
        const url = new URL(apiOrigin);
        if (url.protocol !== 'https:') throw new Error(`NATIVE_CSP needs an https API origin, got ${url.protocol}`);
        api = url.origin;
    }
    const connect = ["'self'", SUPABASE_HOSTS, api].filter(Boolean).join(' ');
    return [
        "default-src 'self'",
        "script-src 'self'",
        // React sets inline style attributes, so inline styles stay allowed.
        "style-src 'self' 'unsafe-inline'",
        "font-src 'self' data:",
        // The app loads no remote images. data: and blob: cover generated ones.
        "img-src 'self' data: blob:",
        `connect-src ${connect}`,
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'none'",
        "frame-src 'none'",
        "worker-src 'self' blob:",
    ].join('; ');
}

const META_MARKER = 'http-equiv="Content-Security-Policy"';

// Inserts the policy as the first element in <head> so it applies to everything
// after it. Safe to call twice.
export function injectCsp(html, csp) {
    if (html.includes(META_MARKER)) return html;
    const tag = `<meta ${META_MARKER} content="${csp.replace(/"/g, '&quot;')}" />`;
    if (!/<head[^>]*>/i.test(html)) throw new Error('index.html has no <head>');
    return html.replace(/<head[^>]*>/i, (open) => `${open}\n    ${tag}`);
}
