// ============================================================================
// TSA Hub — AI feedback Edge Function
// One Gemini call turns the recommender's Top 10 (plus the user's answers and
// each event's score breakdown / warnings) into a personal counselor-style
// write-up. The Gemini key lives ONLY in this function's secrets, never in the
// browser. Deploy:  supabase functions deploy ai-feedback
// Set secrets:      supabase secrets set GEMINI_API_KEY=... ALLOWED_ORIGINS=https://your-domain
// Not called by the current app; deploy only if the feature is turned on.
// ============================================================================

// Origins allowed to call this function (comma-separated, e.g.
// "https://tsa-hub.vercel.app"). Requests from anywhere else, or with no
// Origin header, are rejected. Set:  supabase secrets set ALLOWED_ORIGINS=...
const ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") || "")
    .split(",").map((o) => o.trim()).filter(Boolean);

const MAX_BODY_BYTES = 24 * 1024;
const MAX_RESULTS = 10;
const IP_LIMIT = { max: 5, windowSeconds: 600 };
const DAILY_LIMIT = { max: 300, windowSeconds: 86400 };

function corsHeaders(origin: string) {
    return {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Vary": "Origin",
    };
}

function json(body: unknown, status: number, headers: Record<string, string>) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { ...headers, "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
}

function clip(value: unknown, max = 200): string {
    return typeof value === "string" ? value.replace(/[\u0000-\u001F\u007F]/g, " ").slice(0, max) : "";
}

async function sha256(value: string): Promise<string> {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Shared counter in Postgres (public.check_rate_limit). Fails closed: if the
// limiter cannot be reached, the Gemini call is not made.
async function allow(key: string, limit: number, windowSeconds: number): Promise<boolean> {
    const url = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !serviceKey) return false;
    try {
        const res = await fetch(`${url}/rest/v1/rpc/check_rate_limit`, {
            method: "POST",
            headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({ p_key: key, p_limit: limit, p_window_seconds: windowSeconds }),
        });
        return res.ok && (await res.json()) === true;
    } catch {
        return false;
    }
}

// Gemini model + endpoint. 1.5-flash is broadly available on the free tier.
const MODEL = Deno.env.get("GEMINI_MODEL") || "gemini-1.5-flash";
const GEMINI_URL =
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

// ---- helpers ---------------------------------------------------------------

// Turn one result row into a compact, readable block for the prompt. We hand the
// model the score parts and warnings so it can reason about *why* something
// ranked where it did — not just its name.
function describeResult(r: any, idx: number): string {
    const parts = r._parts || {};
    const partLines = Object.entries(parts)
        .filter(([, v]) => (v as number) > 0)
        .map(([k, v]) => `${k.replace(/Pts$/, "")}=${Math.round(v as number)}`)
        .join(", ");

    const warnings = (r.practical?.team?.notes || [])
        .slice(0, 6).map((n: any) => `${clip(n.kind, 40)}: ${clip(n.text)}`)
        .join("; ");

    const conn = r.connection
        ? `${clip(r.connection.label)}${r.connection.career ? " (" + clip(r.connection.career) + ")" : ""}`
        : "none";

    return [
        `#${idx + 1} ${clip(r.name)} — ${Math.round(Number(r.pct) || 0)}% match`,
        `   category: ${clip(r.category) || "n/a"}`,
        `   score breakdown: ${partLines || "minimal"}`,
        `   career connection: ${conn}`,
        `   team: ${clip(r.practical?.team?.requirement) || "n/a"}`,
        `   budget: ${clip(r.practical?.budget?.note) || "n/a"}`,
        warnings ? `   flags: ${warnings}` : "",
    ]
        .filter(Boolean)
        .join("\n");
}

// Describe the user's answers in plain language for the prompt.
function labels(v: unknown): string[] {
    return Array.isArray(v) ? v.slice(0, 20).map((x) => clip(x, 80)).filter(Boolean) : [];
}

function describeProfile(a: any): string {
    const lines: string[] = [];
    if (a?.division) lines.push(`Division: ${clip(a.division, 40)}`);
    if (labels(a?.interestRankingLabels).length)
        lines.push(`Interests, most to least: ${labels(a.interestRankingLabels).join(" > ")}`);
    if (labels(a?.workRankingLabels).length)
        lines.push(`Wants to work on (ranked): ${labels(a.workRankingLabels).join(", ")}`);
    if (labels(a?.careerLabels).length)
        lines.push(`Career interests: ${labels(a.careerLabels).join(", ")}`);
    if (labels(a?.preferLabels).length)
        lines.push(`Prefers: ${labels(a.preferLabels).join(", ")}`);
    if (labels(a?.avoidLabels).length)
        lines.push(`Wants to avoid: ${labels(a.avoidLabels).join(", ")}`);
    if (a?.timeLabel) lines.push(`Time commitment: ${clip(a.timeLabel, 80)}`);
    if (a?.workStyleLabel) lines.push(`Work style: ${clip(a.workStyleLabel, 80)}`);
    return lines.join("\n");
}

function buildPrompt(profile: string, results: string): string {
    return `You are a warm, knowledgeable competition counselor for TSA (Technology Student Association) students. A student just finished a questionnaire and got a ranked Top 10 list of TSA events. Write a personal analysis that adds real insight on top of the raw match percentages — like an advisor who read their answers, not a generator that restates numbers.

THE STUDENT'S ANSWERS:
${profile}

THEIR TOP 10 RESULTS (with score breakdown, career fit, team needs, and flags):
${results}

Write your response in this structure, using plain, encouraging language:

1. A short opening paragraph (2-3 sentences) summarizing the *pattern* in what this student is drawn to — the kind of work they seem to want, not a list.

2. One paragraph noting that the ten events are NOT equally good fits: the top few match the actual work they said they want, while lower ones match only parts of their interests.

3. Then go through the events. Give the strongest 3-4 their own short paragraph (2-4 sentences each) explaining *why* it fits and what trade-off to consider. Group or briefly cover the weaker matches together. Use the score breakdown and flags to be specific — e.g. if an event is a strong interest match but the student prefers digital work or plans to compete solo while the event needs a team, SAY that explicitly.

4. A final section titled "If I were narrowing your list down" that names the best 2-4 events and explains, in terms of the trade-offs, which to pick depending on what the student wants.

Rules:
- Refer to specifics from their answers ("you ranked X highly", "you said you prefer Y", "you plan to compete solo").
- Never invent facts not present above. Do not restate percentages as the main point.
- Warm and direct, not salesy. No markdown headers except the final section title. Keep the whole thing tight — quality over length.`;
}

// ---- handler ---------------------------------------------------------------

Deno.serve(async (req: Request) => {
    const origin = req.headers.get("origin") || "";
    if (!origin || !ALLOWED_ORIGINS.includes(origin)) {
        return json({ error: "forbidden" }, 403, {});
    }
    const cors = corsHeaders(origin);

    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (req.method !== "POST") return json({ error: "method not allowed" }, 405, cors);

    try {
        const apiKey = Deno.env.get("GEMINI_API_KEY");
        if (!apiKey) return json({ error: "service unavailable" }, 503, cors);

        const raw = await req.text();
        if (raw.length > MAX_BODY_BYTES) return json({ error: "payload too large" }, 413, cors);

        let body: any;
        try { body = JSON.parse(raw); } catch { return json({ error: "invalid request" }, 400, cors); }
        const { answers, results } = body || {};
        if (!Array.isArray(results) || results.length === 0 || results.length > MAX_RESULTS
            || results.some((r: unknown) => !r || typeof r !== "object")) {
            return json({ error: "invalid request" }, 400, cors);
        }

        const ip = (req.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim();
        if (!(await allow(`ai:ip:${await sha256(ip)}`, IP_LIMIT.max, IP_LIMIT.windowSeconds))
            || !(await allow("ai:daily", DAILY_LIMIT.max, DAILY_LIMIT.windowSeconds))) {
            return json({ error: "too many requests" }, 429, cors);
        }

        const prompt = buildPrompt(describeProfile(answers || {}), results.map(describeResult).join("\n\n"));

        const geminiRes = await fetch(GEMINI_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.7, maxOutputTokens: 1400 },
            }),
        });

        if (!geminiRes.ok) {
            console.error("Gemini API error", geminiRes.status);
            return json({ error: "upstream request failed" }, 502, cors);
        }

        const data = await geminiRes.json();
        const text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("") || "";
        if (!text) return json({ error: "upstream request failed" }, 502, cors);

        return json({ insight: text }, 200, cors);
    } catch (e) {
        console.error("ai-feedback error", String(e));
        return json({ error: "server error" }, 500, cors);
    }
});
