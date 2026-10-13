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
const MAX_NAME_LENGTH = 200;
const MAX_EMAIL_LENGTH = 200;

const TYPE_LABELS = {
    feedback: 'Feedback',
    report: 'Incorrect Information Report',
    'get-involved': 'Get Involved Submission',
};

const SUBJECTS = {
    feedback: 'TSA Hub - New Feedback',
    report: 'TSA Hub - Incorrect Information Report',
    'get-involved': 'TSA Hub - New Get Involved Submission',
};

const ROLE_OPTIONS = ['Student Member', 'Chapter Officer', 'State Officer', 'Chapter Advisor', 'Alumni', 'Other'];
const HELP_OPTIONS = ['Beta Testing', 'Suggesting Features', 'Development or Design', 'Promoting TSA Hub', 'Collaboration or Partnership', 'Other'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
    const type = ['report', 'feedback', 'get-involved'].includes(body?.type) ? body.type : null;
    if (!type) return { error: 'type must be "feedback", "report", or "get-involved"' };

    const page = clampString(body?.page, MAX_PAGE_LENGTH) || null;

    if (type === 'get-involved') {
        // Honeypot: a real visitor never fills this hidden field in. Flag it
        // rather than reject outright, so the caller still gets a success
        // response and the bot doesn't learn its submission was rejected.
        const honeypot = clampString(body?.company, 200);
        if (honeypot) return { value: { type, spam: true } };

        const fullName = clampString(body?.fullName, MAX_NAME_LENGTH);
        if (!fullName) return { error: 'fullName is required' };

        const email = clampString(body?.email, MAX_EMAIL_LENGTH);
        if (!email || !EMAIL_RE.test(email)) return { error: 'a valid email is required' };

        const role = ROLE_OPTIONS.includes(body?.role) ? body.role : null;
        const state = clampString(body?.state, 100) || null;
        const helpWith = Array.isArray(body?.helpWith)
            ? body.helpWith.filter((h) => HELP_OPTIONS.includes(h))
            : [];
        const message = clampString(body?.message, MAX_MESSAGE_LENGTH) || null;

        return { value: { type, spam: false, fullName, email, role, state, helpWith, message, page } };
    }

    const message = clampString(body?.message, MAX_MESSAGE_LENGTH);
    if (!message) return { error: 'message is required' };

    const category = clampString(body?.category, 200) || null;
    const suggestedCorrection = clampString(body?.suggestedCorrection, MAX_MESSAGE_LENGTH) || null;

    return { value: { type, message, page, category, suggestedCorrection } };
}

// The `feedback` table only has message/type columns, so a Get Involved
// submission's structured fields are folded into one readable message
// string for storage, same as the email body below.
function buildGetInvolvedSummary({ fullName, email, role, state, helpWith, message }) {
    const lines = [
        `Name: ${fullName}`,
        `Email: ${email}`,
        role && `Role: ${role}`,
        state && `State: ${state}`,
        helpWith.length > 0 && `Wants to help with: ${helpWith.join(', ')}`,
        message && '',
        message && `Message: ${message}`,
    ];
    return lines.filter((l) => l !== null && l !== undefined && l !== false).join('\n');
}

// Plain-text email body — one field per line, only including optional
// fields the caller actually provided ("if available" / "if provided").
function buildEmailText(payload) {
    const { type, message, page, category, suggestedCorrection, submittedAt } = payload;
    const lines = [`Type: ${TYPE_LABELS[type]}`];

    if (type === 'get-involved') {
        const { fullName, email, role, state, helpWith } = payload;
        lines.push(`Name: ${fullName}`, `Email: ${email}`);
        if (role) lines.push(`Role: ${role}`);
        if (state) lines.push(`State: ${state}`);
        if (helpWith.length > 0) lines.push(`Wants to help with: ${helpWith.join(', ')}`);
        if (message) lines.push('', 'Additional message:', message);
        if (page) lines.push('', `Submitted from: ${page}`);
    } else if (type === 'feedback') {
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

    // Flagged as spam by the honeypot check — report success without
    // touching Supabase or Resend, so the bot has no signal anything failed.
    if (value.spam) return res.status(200).json({ ok: true });

    const { url, anonKey } = getSupabaseConfig();
    if (!url || !anonKey) {
        console.error('submit-feedback: Supabase URL/anon key is not configured.');
        return res.status(500).json({ ok: false, error: 'server misconfigured' });
    }

    const storedMessage = value.type === 'get-involved' ? buildGetInvolvedSummary(value) : value.message;

    const supabase = createClient(url, anonKey);
    const { error: dbError } = await supabase
        .from('feedback')
        .insert({ message: storedMessage, type: value.type }, { returning: 'minimal' });

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
