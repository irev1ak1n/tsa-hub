import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const insert = vi.fn();
const rpc = vi.fn();
const del = vi.fn();
const createClient = vi.fn();

vi.mock('@supabase/supabase-js', () => ({ createClient: (...args) => createClient(...args) }));

const { default: handler } = await import('../../../api/submit-feedback.js');

let ipCounter = 0;
const nextIp = () => `203.0.113.${(ipCounter += 1)}`;

function makeReq({ method = 'POST', body, headers = {}, ip = nextIp() } = {}) {
    return {
        method,
        body,
        headers: {
            host: 'tsa-hub.example',
            origin: 'https://tsa-hub.example',
            'content-type': 'application/json',
            'x-vercel-forwarded-for': ip,
            ...headers,
        },
    };
}

function makeRes() {
    const res = { statusCode: 200, headers: {}, body: undefined };
    res.end = () => res;
    res.setHeader = (k, v) => { res.headers[k.toLowerCase()] = v; };
    res.status = (code) => { res.statusCode = code; return res; };
    res.json = (payload) => { res.body = payload; return res; };
    return res;
}

async function call(opts) {
    const res = makeRes();
    await handler(makeReq(opts), res);
    return res;
}

let emailFetch;

beforeEach(() => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'anon-key');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '');
    vi.stubEnv('VERCEL_ENV', '');
    vi.stubEnv('VERCEL', '1');
    vi.stubEnv('RESEND_API_KEY', 'resend-key');
    vi.stubEnv('FEEDBACK_TO_EMAIL', 'owner@example.com');
    insert.mockReset().mockResolvedValue({ error: null });
    rpc.mockReset();
    del.mockReset().mockResolvedValue({ error: null });
    createClient.mockReset().mockImplementation(() => ({
        from: () => ({ insert, delete: () => ({ eq: del }) }),
        rpc,
    }));
    emailFetch = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', emailFetch);
    vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
});

describe('request gating', () => {
    it('rejects non-POST methods', async () => {
        expect((await call({ method: 'GET' })).statusCode).toBe(405);
    });

    it('rejects a cross-origin request', async () => {
        const res = await call({ headers: { origin: 'https://evil.example' }, body: { type: 'feedback', message: 'hi' } });
        expect(res.statusCode).toBe(403);
        expect(insert).not.toHaveBeenCalled();
    });

    it('rejects a request with no Origin and no same-origin fetch metadata', async () => {
        const res = await call({ headers: { origin: undefined }, body: { type: 'feedback', message: 'hi' } });
        expect(res.statusCode).toBe(403);
    });

    it('accepts same-origin fetch metadata when Origin is absent', async () => {
        const res = await call({ headers: { origin: undefined, 'sec-fetch-site': 'same-origin' }, body: { type: 'feedback', message: 'hello there' } });
        expect(res.statusCode).toBe(200);
    });

    it('accepts an origin listed in ALLOWED_ORIGINS', async () => {
        vi.stubEnv('ALLOWED_ORIGINS', 'https://other.example');
        const res = await call({ headers: { origin: 'https://other.example' }, body: { type: 'feedback', message: 'from allowed origin' } });
        expect(res.statusCode).toBe(200);
    });

    it('rejects non-JSON content types', async () => {
        expect((await call({ headers: { 'content-type': 'text/plain' }, body: '{}' })).statusCode).toBe(415);
    });

    it('rejects oversized payloads', async () => {
        const res = await call({ headers: { 'content-length': '999999' }, body: { type: 'feedback', message: 'x' } });
        expect(res.statusCode).toBe(413);
        const parsed = await call({ body: { type: 'feedback', message: 'x', junk: 'y'.repeat(40000) } });
        expect(parsed.statusCode).toBe(413);
        expect(insert).not.toHaveBeenCalled();
    });

    it('sets no-store and nosniff headers', async () => {
        const res = await call({ body: { type: 'feedback', message: 'headers check' } });
        expect(res.headers['cache-control']).toBe('no-store');
        expect(res.headers['x-content-type-options']).toBe('nosniff');
        expect(res.headers['access-control-allow-origin']).toBeUndefined();
    });
});

describe('iOS app origin', () => {
    const native = { origin: 'capacitor://localhost' };

    it('answers the preflight for the app origin only', async () => {
        const ok = await call({ method: 'OPTIONS', headers: native });
        expect(ok.statusCode).toBe(204);
        expect(ok.headers['access-control-allow-origin']).toBe('capacitor://localhost');
        expect(ok.headers['access-control-allow-headers']).toBe('Content-Type');
        const other = await call({ method: 'OPTIONS', headers: { origin: 'https://evil.example' } });
        expect(other.statusCode).toBe(405);
        expect(other.headers['access-control-allow-origin']).toBeUndefined();
    });

    it('accepts a submission from the app and echoes only its origin', async () => {
        const res = await call({ headers: native, body: { type: 'feedback', message: 'from the iOS app' } });
        expect(res.statusCode).toBe(200);
        expect(res.headers['access-control-allow-origin']).toBe('capacitor://localhost');
    });

    it('never sends CORS headers to other origins', async () => {
        const res = await call({ headers: { origin: 'https://evil.example' }, body: { type: 'feedback', message: 'hi' } });
        expect(res.statusCode).toBe(403);
        expect(res.headers['access-control-allow-origin']).toBeUndefined();
    });
});

describe('validation', () => {
    it.each([
        [{ type: 'nope', message: 'x' }],
        [{ type: 'feedback' }],
        [{ type: 'feedback', message: '   ' }],
        [{ type: 'get-involved', fullName: 'Pat Doe', email: 'pat@example.com', helpWith: ['Beta Testing'] }],
    ])('returns 400 for %j', async (body) => {
        const res = await call({ body });
        expect(res.statusCode).toBe(400);
        expect(insert).not.toHaveBeenCalled();
    });

    it('truncates over-long messages and strips control characters', async () => {
        await call({ body: { type: 'feedback', message: `a\u0000b${'z'.repeat(9000)}` } });
        const stored = insert.mock.calls[0][0].message;
        expect(stored.length).toBe(5000);
        expect(stored.startsWith('ab')).toBe(true);
    });

    it('no longer accepts the retired Get Involved type and never stores it', async () => {
        const res = await call({ body: { type: 'get-involved', fullName: 'Pat Doe', email: 'pat@example.com' } });
        expect(res.statusCode).toBe(400);
        expect(insert).not.toHaveBeenCalled();
        expect(emailFetch).not.toHaveBeenCalled();
    });

});

describe('successful submissions', () => {
    it('stores a feedback row and sends exactly one email', async () => {
        const res = await call({ body: { type: 'feedback', message: 'Love the recommender', page: '/events' } });
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ ok: true });
        expect(insert).toHaveBeenCalledTimes(1);
        expect(insert).toHaveBeenCalledWith({ message: 'Love the recommender', type: 'feedback' });
        expect(emailFetch).toHaveBeenCalledTimes(1);
        expect(emailFetch.mock.calls[0][0]).toBe('https://api.resend.com/emails');
    });

    it('handles an incorrect-information report', async () => {
        const res = await call({ body: { type: 'report', message: 'Wrong date on the calendar', suggestedCorrection: 'June 23' } });
        expect(res.statusCode).toBe(200);
        expect(insert.mock.calls[0][0].type).toBe('report');
    });

    it('still succeeds when the notification email fails, without leaking details', async () => {
        emailFetch.mockResolvedValue({ ok: false, status: 500, text: async () => 'secret-body' });
        const res = await call({ body: { type: 'feedback', message: 'email will fail' } });
        expect(res.statusCode).toBe(200);
        expect(JSON.stringify(console.error.mock.calls)).not.toContain('secret-body');
    });

    it('acknowledges an identical resubmission once, storing a single row', async () => {
        const ip = nextIp();
        await call({ ip, body: { type: 'feedback', message: 'double tap' } });
        const second = await call({ ip, body: { type: 'feedback', message: 'double tap' } });
        expect(second.statusCode).toBe(200);
        expect(insert).toHaveBeenCalledTimes(1);
        expect(emailFetch).toHaveBeenCalledTimes(1);
    });

    it('does not leak internals when the database insert fails, and allows a retry', async () => {
        insert.mockResolvedValueOnce({ error: { code: '42501', message: 'permission denied for table feedback' } });
        const ip = nextIp();
        const failed = await call({ ip, body: { type: 'feedback', message: 'retry me' } });
        expect(failed.statusCode).toBe(500);
        expect(JSON.stringify(failed.body)).not.toMatch(/permission|feedback|42501/);
        const retry = await call({ ip, body: { type: 'feedback', message: 'retry me' } });
        expect(retry.statusCode).toBe(200);
        expect(insert).toHaveBeenCalledTimes(2);
    });
});

describe('rate limiting', () => {
    it('blocks a single IP after 8 submissions in the window', async () => {
        const ip = nextIp();
        const statuses = [];
        for (let i = 0; i < 10; i += 1) {
            statuses.push((await call({ ip, body: { type: 'feedback', message: `message number ${i}` } })).statusCode);
        }
        expect(statuses.slice(0, 8).every((s) => s === 200)).toBe(true);
        expect(statuses.slice(8)).toEqual([429, 429]);
    });

    it('uses the shared Supabase limiter and service-role insert when the service key is set', async () => {
        vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-key');
        rpc.mockResolvedValue({ data: true, error: null });
        const res = await call({ body: { type: 'feedback', message: 'through service client' } });
        expect(res.statusCode).toBe(200);
        expect(createClient.mock.calls.every(([, key]) => key === 'service-key')).toBe(true);
        expect(rpc).toHaveBeenCalledWith('check_rate_limit', expect.objectContaining({ p_limit: expect.any(Number) }));
        expect(insert).toHaveBeenCalledTimes(1);
    });

    it('rejects when the shared limiter says the limit is exceeded', async () => {
        vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-key');
        rpc.mockResolvedValue({ data: false, error: null });
        const res = await call({ body: { type: 'feedback', message: 'blocked by shared limiter' } });
        expect(res.statusCode).toBe(429);
        expect(insert).not.toHaveBeenCalled();
    });

    it('falls back to the in-memory limiter if the shared limiter errors', async () => {
        vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-key');
        rpc.mockResolvedValue({ data: null, error: { message: 'function does not exist' } });
        const res = await call({ body: { type: 'feedback', message: 'limiter not migrated yet' } });
        expect(res.statusCode).toBe(200);
    });
});

describe('production failure modes', () => {
    beforeEach(() => vi.stubEnv('VERCEL_ENV', 'production'));

    it('refuses submissions when the service-role key is missing, with no anon write', async () => {
        const res = await call({ body: { type: 'feedback', message: 'no service key' } });
        expect(res.statusCode).toBe(503);
        expect(JSON.stringify(res.body)).not.toMatch(/key|service_role|supabase/i);
        expect(insert).not.toHaveBeenCalled();
        expect(createClient.mock.calls.every(([, key]) => key !== 'anon-key')).toBe(true);
    });

    it('refuses when the shared limiter errors instead of using a weaker limit', async () => {
        vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-key');
        rpc.mockResolvedValue({ data: null, error: { code: 'PGRST202', message: 'function not found' } });
        const res = await call({ body: { type: 'feedback', message: 'limiter missing' } });
        expect(res.statusCode).toBe(503);
        expect(insert).not.toHaveBeenCalled();
        expect(emailFetch).not.toHaveBeenCalled();
    });

    it('refuses when the limiter call throws', async () => {
        vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-key');
        rpc.mockRejectedValue(new Error('network down'));
        const res = await call({ body: { type: 'feedback', message: 'limiter throws' } });
        expect(res.statusCode).toBe(503);
        expect(insert).not.toHaveBeenCalled();
    });

    it('works normally with the service key and a healthy limiter', async () => {
        vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-key');
        rpc.mockResolvedValue({ data: true, error: null });
        const res = await call({ body: { type: 'feedback', message: 'all healthy' } });
        expect(res.statusCode).toBe(200);
        expect(insert).toHaveBeenCalledTimes(1);
        expect(emailFetch).toHaveBeenCalledTimes(1);
    });

    it('treats NODE_ENV=production outside Vercel as production', async () => {
        vi.stubEnv('VERCEL_ENV', '');
        vi.stubEnv('NODE_ENV', 'production');
        const res = await call({ body: { type: 'feedback', message: 'node env production' } });
        expect(res.statusCode).toBe(503);
    });
});

describe('rate limits cannot be bypassed with forged IPs', () => {
    it('a client-supplied X-Forwarded-For does not create a fresh bucket', async () => {
        const real = nextIp();
        const statuses = [];
        for (let i = 0; i < 10; i += 1) {
            statuses.push((await call({
                ip: real,
                headers: { 'x-forwarded-for': `198.18.0.${i}, ${real}` },
                body: { type: 'feedback', message: `spoof attempt ${i}` },
            })).statusCode);
        }
        expect(statuses.slice(8)).toEqual([429, 429]);
    });

    it('requests from one IPv6 /64 share a bucket', async () => {
        const statuses = [];
        for (let i = 0; i < 10; i += 1) {
            statuses.push((await call({ ip: `2001:db8:55:66:${i}::${i + 1}`, body: { type: 'feedback', message: `v6 rotation ${i}` } })).statusCode);
        }
        expect(statuses.slice(8)).toEqual([429, 429]);
    });

    it('malformed bodies still count against the IP limit', async () => {
        const ip = nextIp();
        const statuses = [];
        for (let i = 0; i < 10; i += 1) statuses.push((await call({ ip, body: { type: 'nope' } })).statusCode);
        expect(statuses.slice(0, 8).every((s) => s === 400)).toBe(true);
        expect(statuses.slice(8)).toEqual([429, 429]);
    });

    it('concurrent requests cannot exceed the limit', async () => {
        const ip = nextIp();
        const results = await Promise.all(Array.from({ length: 30 }, (_, i) => call({ ip, body: { type: 'feedback', message: `parallel ${i}` } })));
        expect(results.filter((r) => r.statusCode === 200)).toHaveLength(8);
        expect(results.filter((r) => r.statusCode === 429)).toHaveLength(22);
        expect(insert).toHaveBeenCalledTimes(8);
    });
});

describe('malformed and hostile input', () => {
    it('replaces unpaired surrogates so the database insert cannot fail', async () => {
        const res = await call({ body: { type: 'feedback', message: 'bad \ud800 pair \udc00 ok 😀' } });
        expect(res.statusCode).toBe(200);
        const stored = insert.mock.calls[0][0].message;
        expect(stored).toBe('bad � pair � ok 😀');
        expect(() => encodeURIComponent(stored)).not.toThrow();
    });

    it.each([
        [null],
        [[]],
        [['feedback']],
        ['{"type":"feedback"'],
        [42],
        ['not json'],
    ])('rejects a non-object or unparsable body %j without crashing', async (body) => {
        const res = await call({ body });
        expect(res.statusCode).toBe(400);
        expect(insert).not.toHaveBeenCalled();
    });

    it('ignores unexpected and nested fields and never stores them', async () => {
        const res = await call({ body: { type: 'feedback', message: 'hi', __proto__: { admin: true }, constructor: { x: 1 }, extra: { deep: { deeper: [1, 2, 3] } }, role: 'admin' } });
        expect(res.statusCode).toBe(200);
        expect(insert).toHaveBeenCalledWith({ message: 'hi', type: 'feedback' });
        expect({}.admin).toBeUndefined();
    });

    it('rejects non-string field types instead of coercing them', async () => {
        for (const body of [{ type: ['feedback'], message: 'x' }, { type: 'feedback', message: { a: 1 } }, { type: 'feedback', message: 12345 }]) {
            expect((await call({ body })).statusCode).toBe(400);
        }
        expect(insert).not.toHaveBeenCalled();
    });

    it('only keeps a plain in-app path as the page used in the email', async () => {
        await call({ body: { type: 'feedback', message: 'a', page: '/events/robotics' } });
        await call({ body: { type: 'feedback', message: 'b', page: 'https://evil.example/\nBcc: x@evil.example' } });
        await call({ body: { type: 'feedback', message: 'c', page: '/ok\r\nSubject: spoof' } });
        const bodies = emailFetch.mock.calls.map(([, init]) => JSON.parse(init.body));
        expect(bodies[0].text).toContain('Page/source: /events/robotics');
        expect(bodies[1].text).not.toContain('Page/source');
        expect(bodies[2].text).not.toContain('Page/source');
        for (const b of bodies) {
            expect(b.subject).toBe('TSA Hub - New Feedback');
            expect(b.to).toBe('owner@example.com');
        }
    });

    it('sends the message only as plain text, never as HTML', async () => {
        await call({ body: { type: 'feedback', message: '<img src=x onerror=alert(1)><script>alert(1)</script>' } });
        const payload = JSON.parse(emailFetch.mock.calls[0][1].body);
        expect(payload.html).toBeUndefined();
        expect(typeof payload.text).toBe('string');
    });

    it('returns only a generic error when the email provider or database misbehaves', async () => {
        insert.mockRejectedValueOnce(new Error('connect ECONNREFUSED 10.1.2.3:5432 password=hunter2'));
        const res = await call({ body: { type: 'feedback', message: 'boom' } });
        expect(res.statusCode).toBe(500);
        expect(JSON.stringify(res.body)).toBe('{"ok":false,"error":"server error"}');
    });
});

