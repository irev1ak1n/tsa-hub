// ============================================================================
// TSA HUB — server-side handler for Send Feedback / Report Incorrect
// Information.
//
// Runs as a Vercel serverless function (Node.js runtime), never in the
// browser, so it's the only place allowed to hold RESEND_API_KEY. The React
// form (src/services/feedbackService.js) POSTs here instead of talking to
// Supabase or Resend directly.
//
// Flow per request:
//   1. Validate the payload.
//   2. Insert the Supabase `feedback` row — the exact same shape the client
//      used to insert directly (message, type). This is the row of record;
//      once it's saved, the submission has "succeeded" from the user's
//      point of view.
//   3. Best-effort send a notification email via Resend. A failure here is
//      logged but never turns a successful Supabase save into a failure
//      response — the report already exists and is not lost.
// ============================================================================

import { createClient } from '@supabase/supabase-js';

const MAX_MESSAGE_LENGTH = 5000;
const MAX_PAGE_LENGTH = 300;

const TYPE_LABELS = {
    feedback: 'Feedback',
    report: 'Incorrect Information Report',
};

const SUBJECTS = {
    feedback: 'TSA Hub - New Feedback',
    report: 'TSA Hub - Incorrect Information Report',
};

function getSupabaseConfig() {
    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    return { url, anonKey };
}

function clampString(value, maxLength) {
    if (typeof value !== 'string') return '';
    const trimmed = value.trim();
    return trimmed.length > maxLength ? trimmed.slice(0, maxLength) : trimmed;
}

function validatePayload(body) {
    const type = body?.type === 'report' ? 'report' : body?.type === 'feedback' ? 'feedback' : null;
    if (!type) return { error: 'type must be "feedback" or "report"' };

    const message = clampString(body?.message, MAX_MESSAGE_LENGTH);
    if (!message) return { error: 'message is required' };

    const page = clampString(body?.page, MAX_PAGE_LENGTH) || null;
    const category = clampString(body?.category, 200) || null;
    const suggestedCorrection = clampString(body?.suggestedCorrection, MAX_MESSAGE_LENGTH) || null;

    return { value: { type, message, page, category, suggestedCorrection } };
}

// Plain-text email body — one field per line, only including optional
// fields the caller actually provided ("if available" / "if provided").
function buildEmailText({ type, message, page, category, suggestedCorrection, submittedAt }) {
    const lines = [`Type: ${TYPE_LABELS[type]}`];

    if (type === 'feedback') {
        if (category) lines.push(`Feedback category: ${category}`);
        lines.push('', 'Message:', message);
        if (page) lines.push('', `Page/source: ${page}`);
    } else {
        if (page) lines.push(`Page/resource being reported: ${page}`);
        lines.push('', 'Description of what is incorrect:', message);
        if (suggestedCorrection) lines.push('', 'Suggested correction:', suggestedCorrection);
    }

    lines.push('', `Submission time: ${submittedAt}`);
    return lines.join('\n');
}

async function sendNotificationEmail(payload) {
    const apiKey = process.env.RESEND_API_KEY;
    const to = process.env.FEEDBACK_TO_EMAIL;
    if (!apiKey || !to) {
        console.error('submit-feedback: RESEND_API_KEY or FEEDBACK_TO_EMAIL is not configured; skipping email.');
        return { sent: false };
    }

    const from = process.env.RESEND_FROM_EMAIL || 'TSA Hub <onboarding@resend.dev>';
    const submittedAt = new Date().toISOString();

    try {
        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from,
                to,
                subject: SUBJECTS[payload.type],
                text: buildEmailText({ ...payload, submittedAt }),
            }),
        });

        if (!res.ok) {
            const body = await res.text().catch(() => '');
            console.error('submit-feedback: Resend responded with an error', res.status, body);
            return { sent: false };
        }
        return { sent: true };
    } catch (err) {
        console.error('submit-feedback: failed to reach Resend', err);
        return { sent: false };
    }
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ ok: false, error: 'method not allowed' });
    }

    let body = req.body;
    if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch { body = null; }
    }

    const { value, error } = validatePayload(body || {});
    if (error) return res.status(400).json({ ok: false, error });

    const { url, anonKey } = getSupabaseConfig();
    if (!url || !anonKey) {
        console.error('submit-feedback: Supabase URL/anon key is not configured.');
        return res.status(500).json({ ok: false, error: 'server misconfigured' });
    }

    const supabase = createClient(url, anonKey);
    const { error: dbError } = await supabase
        .from('feedback')
        .insert({ message: value.message, type: value.type }, { returning: 'minimal' });

    if (dbError) {
        console.error('submit-feedback: Supabase insert failed', dbError.message);
        return res.status(500).json({ ok: false, error: 'failed to save submission' });
    }

    // The record is saved — this is now a successful submission no matter
    // what happens with email delivery below.
    const { sent } = await sendNotificationEmail(value);
    if (!sent) {
        console.error(`submit-feedback: submission saved but notification email was not sent (type=${value.type}).`);
    }

    return res.status(200).json({ ok: true });
}
