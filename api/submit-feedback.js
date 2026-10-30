// ============================================================================
// TSA HUB — server-side handler for Send Feedback / Report Incorrect
// Information / Get Involved.
//
// Runs as a Vercel serverless function and is the only place that holds
// RESEND_API_KEY and SUPABASE_SERVICE_ROLE_KEY. Per request: same-origin
// check, rate limits (shared via Supabase), validation, insert into
// `feedback`, then one best-effort notification email. This is the only
// sender of notification emails; the old database trigger is retired by the
// supabase/migrations files.
// ============================================================================

import { createClient } from '@supabase/supabase-js';
import {
    sha256, getClientIp, setApiHeaders, isTrustedOrigin, isJsonRequest, parseBody, getServiceClient, allowRequest, releaseRequest, isProduction, LimiterUnavailableError,
} from './_lib/security.js';

export const config = { api: { bodyParser: { sizeLimit: '32kb' } } };

const MAX_BODY_BYTES = 32 * 1024;
const MAX_MESSAGE_LENGTH = 5000;
const MAX_PAGE_LENGTH = 300;
const MAX_NAME_LENGTH = 100;
const MIN_NAME_LENGTH = 2;
const MAX_EMAIL_LENGTH = 200;

// A human reading and filling in this form takes at least this long. A
// submission that arrives faster almost certainly wasn't typed by a person.
const MIN_FORM_FILL_MS = 1200;

// Duplicated rather than imported from src/data/stateTsa.js — that module
// also imports PNG assets for the state icon grid, which Vite can resolve
// but this plain Node serverless function cannot.
const US_STATES = [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
    'Delaware', 'District of Columbia', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois',
    'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts',
    'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada',
    'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota',
    'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Puerto Rico', 'Rhode Island', 'South Carolina',
    'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington',
    'West Virginia', 'Wisconsin', 'Wyoming',
];

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
const NAME_HAS_LETTER_RE = /\p{L}/u;

const IP_LIMIT = { max: 8, windowSeconds: 600 };
const EMAIL_LIMIT = { max: 3, windowSeconds: 3600 };
const GLOBAL_LIMIT = { max: 120, windowSeconds: 3600 };
const DUPLICATE_WINDOW_SECONDS = 600;

// Production writes always use the service-role client. The anon-key
// fallback exists only for local development and non-production deployments.
function getWriteClient(serviceClient) {
    if (serviceClient) return serviceClient;
    if (isProduction()) return null;
    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    return url && anonKey ? createClient(url, anonKey, { auth: { persistSession: false } }) : null;
}

function clampString(value, maxLength) {
    if (typeof value !== 'string') return '';
    // eslint-disable-next-line no-control-regex
    const trimmed = value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim();
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
        // A submission that arrives faster than a human could plausibly have
        // read the form and typed into it is spam too, flagged the same way.
        const loadedAt = Number(body?.loadedAt);
        const tooFast = Number.isFinite(loadedAt) && Date.now() - loadedAt < MIN_FORM_FILL_MS;
        if (honeypot || tooFast) return { value: { type, spam: true } };

        const fullNameRaw = clampString(body?.fullName, MAX_NAME_LENGTH + 1);
        if (!fullNameRaw) return { error: 'fullName is required' };
        if (fullNameRaw.length < MIN_NAME_LENGTH) return { error: 'fullName is too short' };
        if (fullNameRaw.length > MAX_NAME_LENGTH) return { error: 'fullName is too long' };
        if (!NAME_HAS_LETTER_RE.test(fullNameRaw)) return { error: 'fullName must contain letters' };
        const fullName = fullNameRaw;

        const email = clampString(body?.email, MAX_EMAIL_LENGTH);
        if (!email || !EMAIL_RE.test(email)) return { error: 'a valid email is required' };

        const role = ROLE_OPTIONS.includes(body?.role) ? body.role : null;
        const stateRaw = clampString(body?.state, 100);
        if (stateRaw && !US_STATES.includes(stateRaw)) return { error: 'state is not a recognized US state' };
        const state = stateRaw || null;
        const helpWith = Array.isArray(body?.helpWith)
            ? body.helpWith.filter((h) => HELP_OPTIONS.includes(h))
            : [];
        if (helpWith.length === 0) return { error: 'select at least one way to help' };
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
            console.error('submit-feedback: Resend responded with an error', res.status);
            return { sent: false };
        }
        return { sent: true };
    } catch (err) {
        console.error('submit-feedback: failed to reach Resend', err?.name);
        return { sent: false };
    }
}

async function handle(req, res) {
    setApiHeaders(res);

    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ ok: false, error: 'method not allowed' });
    }
    if (!isTrustedOrigin(req)) return res.status(403).json({ ok: false, error: 'forbidden' });
    if (!isJsonRequest(req)) return res.status(415).json({ ok: false, error: 'unsupported content type' });
    if (Number(req.headers['content-length']) > MAX_BODY_BYTES) return res.status(413).json({ ok: false, error: 'payload too large' });

    const serviceClient = getServiceClient();
    if (isProduction() && !serviceClient) {
        console.error('submit-feedback: SUPABASE_SERVICE_ROLE_KEY is not configured in production.');
        return res.status(503).json({ ok: false, error: 'service temporarily unavailable' });
    }

    if (!(await allowRequest(serviceClient, `feedback:ip:${sha256(getClientIp(req))}`, IP_LIMIT.max, IP_LIMIT.windowSeconds))) {
        return res.status(429).json({ ok: false, error: 'too many submissions, please try again later' });
    }

    const body = parseBody(req);
    if (body && JSON.stringify(body).length > MAX_BODY_BYTES) return res.status(413).json({ ok: false, error: 'payload too large' });

    const { value, error } = validatePayload(body || {});
    if (error) return res.status(400).json({ ok: false, error });

    // Honeypot / too-fast submissions get a success response so the sender
    // learns nothing, but nothing is stored or emailed.
    if (value.spam) return res.status(200).json({ ok: true });

    if (!(await allowRequest(serviceClient, 'feedback:global', GLOBAL_LIMIT.max, GLOBAL_LIMIT.windowSeconds))) {
        return res.status(429).json({ ok: false, error: 'too many submissions, please try again later' });
    }

    if (value.type === 'get-involved'
        && !(await allowRequest(serviceClient, `feedback:email:${sha256(value.email.toLowerCase())}`, EMAIL_LIMIT.max, EMAIL_LIMIT.windowSeconds))) {
        return res.status(429).json({ ok: false, error: 'too many submissions from this email, please try again later' });
    }

    const storedMessage = value.type === 'get-involved' ? buildGetInvolvedSummary(value) : value.message;

    // Identical resubmissions (double taps, replays) are acknowledged once.
    const dedupeKey = `feedback:dup:${sha256(`${value.type}
${storedMessage}`)}`;
    if (!(await allowRequest(serviceClient, dedupeKey, 1, DUPLICATE_WINDOW_SECONDS))) {
        return res.status(200).json({ ok: true });
    }

    const supabase = getWriteClient(serviceClient);
    if (!supabase) {
        console.error('submit-feedback: Supabase is not configured.');
        return res.status(500).json({ ok: false, error: 'server misconfigured' });
    }

    const { error: dbError } = await supabase.from('feedback').insert({ message: storedMessage, type: value.type });
    if (dbError) {
        console.error('submit-feedback: Supabase insert failed', dbError.code);
        await releaseRequest(serviceClient, dedupeKey).catch(() => {});
        return res.status(500).json({ ok: false, error: 'failed to save submission' });
    }

    const { sent } = await sendNotificationEmail(value);
    if (!sent) {
        console.error(`submit-feedback: submission saved but notification email was not sent (type=${value.type}).`);
    }

    return res.status(200).json({ ok: true });
}

export default async function handler(req, res) {
    try {
        return await handle(req, res);
    } catch (err) {
        if (err instanceof LimiterUnavailableError) {
            return res.status(503).json({ ok: false, error: 'service temporarily unavailable' });
        }
        console.error('submit-feedback: unexpected error', err?.name);
        return res.status(500).json({ ok: false, error: 'server error' });
    }
}
