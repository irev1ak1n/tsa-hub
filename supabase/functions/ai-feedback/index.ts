// ============================================================================
// TSA Hub — AI feedback Edge Function
// One Gemini call turns the recommender's Top 10 (plus the user's answers and
// each event's score breakdown / warnings) into a personal counselor-style
// write-up. The Gemini key lives ONLY in this function's secrets, never in the
// browser. Deploy:  supabase functions deploy ai-feedback
// Set the key:      supabase secrets set GEMINI_API_KEY=your_key
// ============================================================================

// CORS so the browser (localhost:5173 in dev, your domain in prod) can call it.
const CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Gemini model + endpoint. 1.5-flash is broadly available on the free tier.
const MODEL = "gemini-1.5-flash";
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
        .map((n: any) => `${n.kind}: ${n.text}`)
        .join("; ");

    const conn = r.connection
        ? `${r.connection.label}${r.connection.career ? " (" + r.connection.career + ")" : ""}`
        : "none";

    return [
        `#${idx + 1} ${r.name} — ${r.pct}% match`,
        `   category: ${r.category || "n/a"}`,
        `   score breakdown: ${partLines || "minimal"}`,
        `   career connection: ${conn}`,
        `   team: ${r.practical?.team?.requirement || "n/a"}`,
        `   budget: ${r.practical?.budget?.note || "n/a"}`,
        warnings ? `   flags: ${warnings}` : "",
    ]
        .filter(Boolean)
        .join("\n");
}

// Describe the user's answers in plain language for the prompt.
function describeProfile(a: any): string {
    const lines: string[] = [];
    if (a?.division) lines.push(`Division: ${a.division}`);
    if (a?.interestRankingLabels?.length)
        lines.push(`Interests, most to least: ${a.interestRankingLabels.join(" > ")}`);
    if (a?.workRankingLabels?.length)
        lines.push(`Wants to work on (ranked): ${a.workRankingLabels.join(", ")}`);
    if (a?.careerLabels?.length)
        lines.push(`Career interests: ${a.careerLabels.join(", ")}`);
    if (a?.preferLabels?.length)
        lines.push(`Prefers: ${a.preferLabels.join(", ")}`);
    if (a?.avoidLabels?.length)
        lines.push(`Wants to avoid: ${a.avoidLabels.join(", ")}`);
    if (a?.timeLabel) lines.push(`Time commitment: ${a.timeLabel}`);
    if (a?.workStyleLabel) lines.push(`Work style: ${a.workStyleLabel}`);
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
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: CORS });
    }

    try {
        const apiKey = Deno.env.get("GEMINI_API_KEY");
        if (!apiKey) {
            return new Response(
                JSON.stringify({ error: "GEMINI_API_KEY not configured" }),
                { status: 500, headers: { ...CORS, "Content-Type": "application/json" } },
            );
        }

        const body = await req.json();
        const { answers, results } = body || {};
        if (!Array.isArray(results) || results.length === 0) {
            return new Response(
                JSON.stringify({ error: "No results provided" }),
                { status: 400, headers: { ...CORS, "Content-Type": "application/json" } },
            );
        }

        const profileText = describeProfile(answers || {});
        const resultsText = results.map(describeResult).join("\n\n");
        const prompt = buildPrompt(profileText, resultsText);

        const geminiRes = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 1400,
                },
            }),
        });

        if (!geminiRes.ok) {
            const errText = await geminiRes.text();
            console.error("Gemini API error", geminiRes.status, errText);
            return new Response(
                JSON.stringify({ error: "Gemini request failed", status: geminiRes.status, detail: errText }),
                { status: 502, headers: { ...CORS, "Content-Type": "application/json" } },
            );
        }

        const data = await geminiRes.json();
        const text =
            data?.candidates?.[0]?.content?.parts
                ?.map((p: any) => p.text)
                .join("") || "";

        if (!text) {
            return new Response(
                JSON.stringify({ error: "Empty response from Gemini" }),
                { status: 502, headers: { ...CORS, "Content-Type": "application/json" } },
            );
        }

        return new Response(
            JSON.stringify({ insight: text }),
            { headers: { ...CORS, "Content-Type": "application/json" } },
        );
    } catch (e) {
        return new Response(
            JSON.stringify({ error: "Server error", detail: String(e) }),
            { status: 500, headers: { ...CORS, "Content-Type": "application/json" } },
        );
    }
});