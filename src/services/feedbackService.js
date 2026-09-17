// ============================================================
// TSA HUB — feedback + incorrect-info reports.
//
// The actual Supabase write and email notification both happen server-side
// (api/submit-feedback.js), so the RESEND_API_KEY never touches the
// browser. This just posts the form's message plus the current page path
// (context for the email, not stored in Supabase) to that endpoint.
// ============================================================

async function submit(message, type) {
    const text = String(message || '').trim();
    if (!text) return { ok: false, error: 'empty' };

    let page = null;
    try { page = window.location.pathname; } catch { /* ignore */ }

    try {
        const res = await fetch('/api/submit-feedback', {
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
