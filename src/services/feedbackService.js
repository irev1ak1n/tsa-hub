// ============================================================
// TSA HUB — feedback + incorrect-info reports.
//
// The actual Supabase write and email notification both happen server-side
// (api/submit-feedback.js), so the RESEND_API_KEY never touches the
// browser. This just posts the form's message plus the current page path
// (context for the email, not stored in Supabase) to that endpoint.
// ============================================================

// Empty on the web (same-origin /api). A native build sets VITE_API_BASE_URL to
// the deployed site, where a relative path would resolve inside the app.
const ENDPOINT = `${String(import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '')}/api/submit-feedback`;

async function submit(message, type) {
    const text = String(message || '').trim();
    if (!text) return { ok: false, error: 'empty' };

    let page = null;
    try { page = window.location.pathname; } catch { /* ignore */ }

    try {
        const res = await fetch(ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, message: text, page }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.ok) return { ok: false, error: data?.error || 'failed' };
        return { ok: true };
    } catch {
        return { ok: false, error: 'network error' };
    }
}

export function submitFeedback(message) {
    return submit(message, 'feedback');
}

export function submitReport(message) {
    return submit(message, 'report');
}

// Get Involved — a richer structured payload (name, email, role, state,
// how they'd like to help, optional message) rather than a single message
// string, but posts to the same endpoint and table as feedback/report above.
export async function submitGetInvolved(fields) {
    let page = null;
    try { page = window.location.pathname; } catch { /* ignore */ }

    try {
        const res = await fetch(ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'get-involved', page, ...fields }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.ok) return { ok: false, error: data?.error || 'failed' };
        return { ok: true };
    } catch {
        return { ok: false, error: 'network error' };
    }
}
