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
            'x-forwarded-for': ip,
            ...headers,
        },
    };
}

function makeRes() {
    const res = { statusCode: 200, headers: {}, body: undefined };
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

describe('validation', () => {
    it.each([
        [{ type: 'nope', message: 'x' }],
        [{ type: 'feedback' }],
        [{ type: 'feedback', message: '   ' }],
        [{ type: 'get-involved', fullName: 'A', email: 'bad', helpWith: ['Beta Testing'] }],
        [{ type: 'get-involved', fullName: 'Pat Doe', email: 'pat@example.com', helpWith: ['Hack the planet'] }],
        [{ type: 'get-involved', fullName: 'Pat Doe', email: 'pat@example.com', state: 'Atlantis', helpWith: ['Beta Testing'] }],
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

    it('treats a filled honeypot as success without storing or emailing', async () => {
        const res = await call({ body: { type: 'get-involved', company: 'bot', fullName: 'Pat Doe', email: 'pat@example.com', helpWith: ['Beta Testing'] } });
        expect(res.statusCode).toBe(200);
        expect(insert).not.toHaveBeenCalled();
        expect(emailFetch).not.toHaveBeenCalled();
    });

    it('treats an instant submission as success without storing', async () => {
        const res = await call({ body: { type: 'get-involved', loadedAt: Date.now(), fullName: 'Pat Doe', email: 'pat@example.com', helpWith: ['Beta Testing'] } });
        expect(res.statusCode).toBe(200);
        expect(insert).not.toHaveBeenCalled();
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

    it('handles a Get Involved submission', async () => {
        const res = await call({
            body: {
                type: 'get-involved', loadedAt: Date.now() - 60000, fullName: 'Pat Doe', email: 'pat@example.com',
                role: 'Student Member', state: 'North Carolina', helpWith: ['Beta Testing'], message: 'Happy to help',
            },
        });
        expect(res.statusCode).toBe(200);
        expect(insert.mock.calls[0][0].type).toBe('get-involved');
        expect(insert.mock.calls[0][0].message).toContain('Email: pat@example.com');
        expect(emailFetch).toHaveBeenCalledTimes(1);
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

    it('limits one email address to 3 Get Involved submissions per hour', async () => {
        const base = { type: 'get-involved', loadedAt: Date.now() - 60000, fullName: 'Pat Doe', email: 'limit@example.com', helpWith: ['Beta Testing'] };
        const statuses = [];
        for (let i = 0; i < 5; i += 1) {
            statuses.push((await call({ body: { ...base, message: `note ${i}` } })).statusCode);
        }
        expect(statuses).toEqual([200, 200, 200, 429, 429]);
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
