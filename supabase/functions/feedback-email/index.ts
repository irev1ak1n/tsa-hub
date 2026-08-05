// ============================================================================
// Supabase Edge Function: feedback-email
// Triggered by an INSERT trigger on public.feedback.
// Sends one email (via Resend) to the maintainer with the submission text.
// The `type` column ('feedback' | 'report') sets the subject line.
//
// Secrets required:
//   RESEND_API_KEY   your Resend API key
//   FEEDBACK_TO      the email that should receive submissions
//   FEEDBACK_FROM    verified sender, e.g. "TSA Hub <onboarding@resend.dev>"
//
// Deploy:  supabase functions deploy feedback-email --no-verify-jwt
// ============================================================================

const CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: CORS });
    }

    try {
        const apiKey = Deno.env.get("RESEND_API_KEY");
        const to = Deno.env.get("FEEDBACK_TO");
        const from = Deno.env.get("FEEDBACK_FROM") || "TSA Hub <onboarding@resend.dev>";

        if (!apiKey || !to) {
            return new Response(
                JSON.stringify({ error: "Missing RESEND_API_KEY or FEEDBACK_TO secret" }),
                { status: 500, headers: { ...CORS, "Content-Type": "application/json" } },
            );
        }

        const body = await req.json().catch(() => ({}));
        const record = body?.record ?? body ?? {};
        const message = String(record.message ?? "").trim();
        const type = String(record.type ?? "feedback").trim();
        const createdAt = record.created_at ?? new Date().toISOString();

        if (!message) {
            return new Response(JSON.stringify({ error: "No message in payload" }), {
                status: 400,
                headers: { ...CORS, "Content-Type": "application/json" },
            });
        }

        const isReport = type === "report";
        const label = isReport ? "Incorrect info report" : "Feedback";
        const subject = isReport
            ? "TSA Hub — incorrect info report"
            : "New TSA Hub feedback";

        const safe = message
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");

        const html =
            `<h2 style="margin:0 0 4px;font-family:system-ui,sans-serif">${label}</h2>` +
            `<p style="color:#666;font-size:12px;font-family:system-ui,sans-serif;margin:0 0 14px">${createdAt}</p>` +
            `<div style="white-space:pre-wrap;font-family:system-ui,sans-serif;font-size:15px;line-height:1.5;` +
            `padding:14px 16px;border:1px solid #eee;border-radius:10px;background:#fafafa">${safe}</div>`;

        const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ from, to: [to], subject, html }),
        });

        if (!res.ok) {
            const detail = await res.text();
            return new Response(JSON.stringify({ error: "Resend failed", detail }), {
                status: 502,
                headers: { ...CORS, "Content-Type": "application/json" },
            });
        }

        return new Response(JSON.stringify({ ok: true }), {
            headers: { ...CORS, "Content-Type": "application/json" },
        });
    } catch (e) {
        return new Response(JSON.stringify({ error: String(e) }), {
            status: 500,
            headers: { ...CORS, "Content-Type": "application/json" },
        });
    }
});