import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

async function loadService() {
    vi.resetModules();
    return import('../feedbackService.js');
}

describe('feedback endpoint', () => {
    beforeEach(() => {
        vi.stubGlobal('window', { location: { pathname: '/events' } });
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) }));
    });
    afterEach(() => {
        vi.unstubAllEnvs();
        vi.unstubAllGlobals();
    });

    it('uses the same-origin path by default', async () => {
        vi.stubEnv('VITE_API_BASE_URL', '');
        const { submitFeedback } = await loadService();
        await submitFeedback('hello');
        expect(fetch.mock.calls[0][0]).toBe('/api/submit-feedback');
    });

    it('prefixes the configured base URL for native builds, ignoring trailing slashes', async () => {
        vi.stubEnv('VITE_API_BASE_URL', 'https://tsa-hub.vercel.app/');
        const { submitReport, submitGetInvolved } = await loadService();
        await submitReport('wrong date');
        await submitGetInvolved({ fullName: 'Pat Doe' });
        expect(fetch.mock.calls.map((c) => c[0])).toEqual([
            'https://tsa-hub.vercel.app/api/submit-feedback',
            'https://tsa-hub.vercel.app/api/submit-feedback',
        ]);
    });
});
