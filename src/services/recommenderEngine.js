export const INTEREST_RANK_WEIGHTS = [18, 14, 10, 7, 4, 2, 1, 0];

export const INTEREST_KEYS = [
    "codingSoftware", "creativeDesign", "roboticsEngineering", "buildingConstruction",
    "mediaProduction", "leadershipSpeaking", "scienceResearch", "gamesHandsOn",
];
export const INTEREST_LABELS = {
    codingSoftware: "Coding & Software",
    creativeDesign: "Creative & Design",
    roboticsEngineering: "Robotics & Engineering",
    buildingConstruction: "Building & Construction",
    mediaProduction: "Media & Production",
    leadershipSpeaking: "Leadership & Speaking",
    scienceResearch: "Science & Research",
    gamesHandsOn: "Games & Hands-on Making",
};

export const WORKTYPE_RANK_WEIGHTS = [30, 22, 15, 9, 5];
const WORKTYPE_MATCH_FRACTION = { 3: 1.0, 2: 0.45, 1: 0.2 };

export const WORKTYPE_OPTIONS = [
    { id: "website", label: "Build a Website", types: ["website"] },
    { id: "app-software", label: "Create an App or Software", types: ["app-software"] },
    { id: "robot", label: "Build a Robot", types: ["robot"] },
    { id: "drone", label: "Design or Fly a Drone", types: ["drone"] },
    { id: "vehicle", label: "Build a Vehicle", types: ["vehicle"] },
    { id: "structure-model", label: "Create a Structure or Model", types: ["structure-model"] },
    { id: "game", label: "Create a Game", types: ["video-game", "board-game", "vr-simulation"] },
    { id: "cad", label: "Make CAD / Technical Designs", types: ["cad"] },
    { id: "graphic-design", label: "Create a Graphic Design", types: ["graphic-design", "photography"] },
    { id: "video", label: "Produce a Video", types: ["video", "animation"] },
    { id: "podcast", label: "Create a Podcast", types: ["podcast", "audio-production"] },
    { id: "creative", label: "Design Something Creative", types: ["creative-product", "wearable-design"] },
    { id: "research", label: "Research a Problem", types: ["research", "data-analysis"] },
    { id: "presentation", label: "Present or Speak", types: ["presentation"] },
    { id: "knowledge-challenge", label: "Take on a Knowledge Challenge", types: ["knowledge-challenge", "ai-solution"] },
    { id: "product-prototype", label: "Build a Product / Prototype", types: ["product-prototype"] },
];

export const STYLE_OPTIONS = [
    { id: "digital", label: "Digital / on-screen work" },
    { id: "hands-on", label: "Hands-on building" },
    { id: "creative", label: "Creative / artistic" },
    { id: "research", label: "Research / analysis" },
    { id: "present", label: "Presenting / speaking" },
];

// Competition Experience, event format tags a student can Prefer / Avoid.
export const FORMAT_OPTIONS = [
    { id: "prepared-project", label: "Prepare a project in advance" },
    { id: "live-challenge", label: "Live / onsite challenge" },
    { id: "presentation", label: "Present to judges" },
    { id: "interview", label: "Judge interview / Q&A" },
    { id: "written-test", label: "Written test" },
    { id: "performance", label: "Performance-based" },
];

// Challenge level, difficulty a student can Prefer / Avoid.
export const DIFFICULTY_OPTIONS = [
    { id: "beginner", label: "Beginner-friendly" },
    { id: "challenging", label: "Challenging" },
    { id: "competitive", label: "Highly competitive" },
];
const STYLE_OF_WORKTYPE = {
    website: ["digital"], "app-software": ["digital"], "video-game": ["digital"],
    "vr-simulation": ["digital"], "data-analysis": ["digital", "research"],
    "graphic-design": ["digital", "creative"], photography: ["creative"],
    video: ["digital", "creative"], animation: ["digital", "creative"],
    podcast: ["creative"], "audio-production": ["creative"], cad: ["digital"],
    robot: ["hands-on"], drone: ["hands-on"], vehicle: ["hands-on"],
    "structure-model": ["hands-on"], "product-prototype": ["hands-on"],
    "board-game": ["hands-on", "creative"], "wearable-design": ["hands-on", "creative"],
    "creative-product": ["creative"], research: ["research"],
    presentation: ["present"], "knowledge-challenge": ["research"],
};

const TIME_ORDER = ["light", "medium", "heavy", "project"];
const COST_ORDER = ["0-25", "25-75", "75-150", "150-300", "300+"];


// Match weights, summing to 100 across the six scored factors.
// Budget is not scored, it stays a display note only, so its weight is 0.
const MATCH = { workType: 50, interest: 27, style: 8, format: 5, difficulty: 5, budget: 0, career: 5 };

function styleForEvent(ev) {
    const s = new Set();
    for (const wt of Object.keys(ev.workTypes || {})) {
        (STYLE_OF_WORKTYPE[wt] || []).forEach((x) => s.add(x));
    }
    return s;
}

function scoreWorkType(ev, workRanking, interestRanking) {
    const contributions = [];
    (workRanking || []).slice(0, 5).forEach((optId, rank) => {
        const opt = WORKTYPE_OPTIONS.find((o) => o.id === optId);
        if (!opt) return;
        let bestW = 0;
        for (const t of opt.types) {
            const w = ev.workTypes?.[t] || 0;
            if (w > bestW) bestW = w;
        }
        if (bestW === 0) return;
        const frac = WORKTYPE_MATCH_FRACTION[bestW] || 0;
        contributions.push({
            optionId: optId, rank, wtWeight: bestW, frac,
            points: WORKTYPE_RANK_WEIGHTS[rank] * frac,
        });
    });

    if (contributions.length) {
        contributions.sort((a, b) => b.points - a.points);
        let raw = contributions[0].points;
        if (contributions[1]) raw += contributions[1].points * 0.35;
        return { raw, best: contributions[0] };
    }

    if (interestRanking?.length) {
        const topInterest = interestRanking[0];
        const evInterestW = ev.interests?.[topInterest] || 0; // 0..3
        if (evInterestW > 0) {
            // up to ~35% of a rank-1 exact hit, scaled by how core the interest is
            const soft = WORKTYPE_RANK_WEIGHTS[0] * 0.35 * (evInterestW / 3);
            return { raw: soft, best: null, soft: true };
        }
    }
    return { raw: 0, best: null };
}

function scoreInterest(ev, interestRanking) {
    let raw = 0, best = null;
    (interestRanking || []).forEach((key, idx) => {
        const evW = ev.interests?.[key] || 0;
        if (!evW) return;
        const contrib = evW * INTEREST_RANK_WEIGHTS[idx];
        raw += contrib;
        if (!best || contrib > best.contrib) best = { key, rank: idx, evW, contrib };
    });
    return { raw, best };
}

// id vocabularies, so a flat prefer/avoid list routes each id to the right axis
const STYLE_IDS = new Set(STYLE_OPTIONS.map((o) => o.id));
const FORMAT_IDS = new Set(FORMAT_OPTIONS.map((o) => o.id));
const DIFFICULTY_IDS = new Set(DIFFICULTY_OPTIONS.map((o) => o.id));
const BUDGET_IDS = new Set(["budget-free", "budget-low", "budget-high"]);

// Map an event's cost band to a coarse budget category used as a prefer/avoid
// criterion. 0-25 = free, 25-150 = low-cost, 150+ = high-cost.
function budgetCategoryOf(ev) {
    const c = ev.cost;
    if (c === "0-25") return "budget-free";
    if (c === "25-75" || c === "75-150") return "budget-low";
    if (c === "150-300" || c === "300+") return "budget-high";
    return null;
}

function splitPrefs(list) {
    const out = { style: [], format: [], difficulty: [], budget: [] };
    (list || []).forEach((id) => {
        if (STYLE_IDS.has(id)) out.style.push(id);
        else if (FORMAT_IDS.has(id)) out.format.push(id);
        else if (DIFFICULTY_IDS.has(id)) out.difficulty.push(id);
        else if (BUDGET_IDS.has(id)) out.budget.push(id);
    });
    return out;
}

// generic prefer/avoid scorer over a membership test, raw in roughly [-1..+1]
// avoid weighted 1.6x so avoiding matters more than preferring
function scoreAxis(preferIds, avoidIds, has) {
    let raw = 0;
    const hitPrefer = [], hitAvoid = [];
    preferIds.forEach((id) => { if (has(id)) { raw += 1; hitPrefer.push(id); } });
    avoidIds.forEach((id) => { if (has(id)) { raw -= 1.6; hitAvoid.push(id); } });
    return { raw: Math.max(-1, Math.min(1, raw)), hitPrefer, hitAvoid };
}

function scoreStyle(ev, pref, avoid) {
    const styles = styleForEvent(ev);
    return scoreAxis(pref, avoid, (id) => styles.has(id));
}
function scoreFormat(ev, pref, avoid) {
    const fmts = new Set(ev.formats || []);
    return scoreAxis(pref, avoid, (id) => fmts.has(id));
}
function scoreDifficulty(ev, pref, avoid) {
    return scoreAxis(pref, avoid, (id) => ev.difficulty === id);
}
function scoreBudget(ev, pref, avoid) {
    const cat = budgetCategoryOf(ev);
    return scoreAxis(pref, avoid, (id) => id === cat);
}

function scoreCareerForMatch(ev, careers) {
    if (!careers?.length) return 0;
    let best = 0;
    careers.forEach((c) => { best = Math.max(best, ev.careers?.[c] || 0); });
    return best / 3;
}

function personalMax(answers) {
    // Ceiling = a realistic strong event that nails the #1 project choice exactly.
    // Requiring only the #1 exact lets a true bullseye earn the full workType
    // weight, while events that ALSO hit #2 still score higher via the raw
    // secondary contribution.
    const wtMax = WORKTYPE_RANK_WEIGHTS[0];
    const intMax = 3 * INTEREST_RANK_WEIGHTS[0] + 2 * INTEREST_RANK_WEIGHTS[1];
    return { wtMax, intMax };
}

export function matchScore(ev, answers, norm) {
    const wt = scoreWorkType(ev, answers.workRanking, answers.interestRanking);
    const it = scoreInterest(ev, answers.interestRanking);
    const pr = splitPrefs(answers.prefer);
    const av = splitPrefs(answers.avoid);
    const st = scoreStyle(ev, pr.style, av.style);
    const fm = scoreFormat(ev, pr.format, av.format);
    const df = scoreDifficulty(ev, pr.difficulty, av.difficulty);
    const bg = scoreBudget(ev, pr.budget, av.budget);
    const cr = scoreCareerForMatch(ev, answers.careers);

    const wtNorm = norm.wtMax > 0 ? Math.min(1, wt.raw / norm.wtMax) : 0;
    const itNorm = norm.intMax > 0 ? Math.min(1, it.raw / norm.intMax) : 0;

    const usedStyle = (pr.style.length + av.style.length) > 0;
    const usedFormat = (pr.format.length + av.format.length) > 0;
    const usedDiff = (pr.difficulty.length + av.difficulty.length) > 0;
    const usedBudget = (pr.budget.length + av.budget.length) > 0;

    let reclaimed = 0;
    if (!usedStyle) reclaimed += MATCH.style;
    if (!usedFormat) reclaimed += MATCH.format;
    if (!usedDiff) reclaimed += MATCH.difficulty;

    // Split the reclaimed weight between workType and interest in their existing
    // proportion, so their relative importance stays the same.
    const wiTotal = MATCH.workType + MATCH.interest;
    const wWork = MATCH.workType + reclaimed * (MATCH.workType / wiTotal);
    const wInterest = MATCH.interest + reclaimed * (MATCH.interest / wiTotal);

    const workPts = wtNorm * wWork;
    const interestPts = itNorm * wInterest;
    const stylePts = usedStyle ? st.raw * MATCH.style : 0;
    const formatPts = usedFormat ? fm.raw * MATCH.format : 0;
    const difficultyPts = usedDiff ? df.raw * MATCH.difficulty : 0;
    const budgetPts = usedBudget ? bg.raw * MATCH.budget : 0;
    const careerPts = cr * MATCH.career;

    let total = workPts + interestPts + stylePts + formatPts + difficultyPts + budgetPts + careerPts;
    total = Math.max(0, Math.min(100, total));
    return {
        total,
        parts: { workPts, interestPts, stylePts, formatPts, difficultyPts, budgetPts, careerPts },
        detail: { wt, it, st, fm, df, bg, cr },
    };
}

export function careerConnection(ev, careers) {
    if (!careers?.length) return { level: "none", key: null, weight: 0 };
    let best = 0, key = null;
    careers.forEach((c) => { const w = ev.careers?.[c] || 0; if (w > best) { best = w; key = c; } });
    let level = "none";
    if (best >= 3) level = "strong";
    else if (best === 2) level = "related";
    else if (best === 1) level = "some";
    return { level, key, label: key ? (CAREER_LABELS[key] || key) : null, weight: best };
}
export const CAREER_CONNECTION_LABEL = {
    strong: "Strong Connection",
    related: "Related",
    some: "Some Connection",
    none: "Little / No Direct Connection",
};

function timeNote(ev, time) {
    if (!time)
        return { penalty: 0, level: "unknown", note: null };

    const ui = TIME_ORDER.indexOf(time);
    const ei = TIME_ORDER.indexOf(ev.time);

    if (ui < 0 || ei < 0)
        return { penalty: 0, level: "unknown", note: null };
    const over = ei - ui;

    if (over <= 0)
        return { penalty: 0, level: "within", note: "Within your preference" };

    return {
        penalty: Math.min(6, over * 2),
        level: over === 1 ? "slightly" : "above",
        note: over === 1 ? "Slightly above your preference" : "Above your preference",
    };
}

function budgetNote(ev) {
    // Budget is a prefer/avoid criterion, not a threshold. On the results card
    // we just show the event's own cost band as an informational note.
    const c = ev.cost;

    if (c === "0-25")
        return { penalty: 0, level: "free", note: "Free / no-cost" };
    if (c === "25-75" || c === "75-150")
        return { penalty: 0, level: "low", note: "Low-cost" };
    if (c === "150-300" || c === "300+")
        return { penalty: 0, level: "high", note: "Higher-cost" };

    return { penalty: 0, level: "unknown", note: null };
}

const TEAM_AVAIL = { solo: 1, one: 2, "two-three": 3, "four-plus": 5, unsure: null };

function teamNotes(ev, teamAvailId) {
    const el = ev.eligibility || {};
    const notes = [];
    let requirement;

    if (el.individualAllowed && (el.minTeamSize == null || el.minTeamSize <= 1)) {
        requirement = el.maxTeamSize && el.maxTeamSize > 1 ? `Solo or up to ${el.maxTeamSize}` : "Solo OK";
    } else if (el.minTeamSize && el.maxTeamSize && el.minTeamSize === el.maxTeamSize) {
        requirement = `${el.minTeamSize} required`;
    } else if (el.minTeamSize && el.maxTeamSize) {
        requirement = `${el.minTeamSize}\u2013${el.maxTeamSize} members`;
    } else if (el.minTeamSize) {
        requirement = `${el.minTeamSize}+ required`;
    } else {
        requirement = "Team event";
    }

    const have = teamAvailId ? TEAM_AVAIL[teamAvailId] : undefined;
    const min = el.minTeamSize;

    if (el.individualAllowed && (min == null || min <= 1)) {
        notes.push({ kind: "ok", text: "Solo participation allowed" });
    }

    if (have != null && min != null && min > 1 && have < min && !el.individualAllowed) {
        const need = min - have;
        notes.push({
            kind: "warn",
            text: need === 1
                ? "You'll need at least one more teammate before registration."
                : `You'll need at least ${need} more teammates before registration.`,
        });
    } else if (have === 1 && min != null && min > 1 && !el.individualAllowed) {
        notes.push({
            kind: "warn",
            text: `This event requires ${el.maxTeamSize ? `${min}\u2013${el.maxTeamSize}` : `${min}+`} members. You'll need teammates before registration.`,
        });
    }

    if (el.entryLimit && el.entryScope) {
        const unit = el.entryLimitType === "team"
            ? (el.entryLimit === 1 ? "team" : "teams")
            : (el.entryLimit === 1 ? "entry" : "entries");
        const scope = el.entryScope === "chapter" ? "Chapter" : "State";
        notes.push({ kind: "info", text: `${scope} limit: ${el.entryLimit} ${unit}` });
    }

    return { requirement, notes };
}

export function recommend(events, answers, { topN = 10 } = {}) {
    const pool = events.filter((e) => e.division === answers.division);
    const norm = personalMax(answers);

    const scored = pool.map((ev) => {
        const m = matchScore(ev, answers, norm);
        const baseMatch = m.total;

        const time = timeNote(ev, answers.time);
        const budget = budgetNote(ev);
        const team = teamNotes(ev, answers.teamAvailability);
        const connection = careerConnection(ev, answers.careers);

        const displayMatch = Math.max(0, Math.round(baseMatch - time.penalty - budget.penalty));

        return {
            ev,
            baseMatch: Math.round(baseMatch),
            pct: displayMatch,
            parts: m.parts,
            detail: m.detail,
            connection,
            practical: {
                team: { requirement: team.requirement, notes: team.notes },
                time: { note: time.note, level: time.level, penalty: time.penalty },
                budget: { note: budget.note, level: budget.level, penalty: budget.penalty },
            },
        };
    });

    // Rank primarily by PURE fit so a great match is never demoted by team/time/
    // budget. But because the DISPLAYED number is the penalized pct, sort by pct
    // first to keep the visible list monotonic (no lower % sitting above a higher
    // one), then fall back to baseMatch. The practical penalties are tiny so this
    // preserves fit-based ordering while keeping the numbers readable.
    scored.sort((a, b) => b.pct - a.pct || b.baseMatch - a.baseMatch);
    const top = scored.slice(0, topN);
    // Now that order and shown pct are final, generate position-aware explanations.
    top.forEach((row, i) => {
        row.explanation = explain(row.ev, row.detail, row.connection, answers, i, row.pct);
    });
    return top;
}


// interest key to prose phrase (fits after "you're into ___" / "your love of ___")
const INTEREST_PHRASE = {
    codingSoftware: "coding and building software",
    creativeDesign: "creative and design work",
    roboticsEngineering: "robotics and engineering",
    buildingConstruction: "hands-on building and construction",
    mediaProduction: "media and video production",
    leadershipSpeaking: "leadership and public speaking",
    scienceResearch: "science and research",
    gamesHandsOn: "games and hands-on making",
};

// work-choice id to prose phrase (fits after "you want to ___")
const WORKTYPE_PHRASE = {
    website: "build websites",
    "app-software": "create apps and software",
    robot: "build robots",
    drone: "design and fly drones",
    vehicle: "build vehicles",
    "structure-model": "design structures and models",
    game: "make games",
    cad: "do CAD and technical design",
    "graphic-design": "create graphic designs",
    video: "produce videos",
    podcast: "make podcasts and audio",
    creative: "design creative things",
    research: "dig into research problems",
    presentation: "present and speak",
    "knowledge-challenge": "take on knowledge challenges",
    "product-prototype": "build products and prototypes",
};

// style/format preference id to prose phrase (fits after "you like ___")
const PREF_PHRASE = {
    // styles
    digital: "working digitally, on-screen",
    "hands-on": "hands-on building",
    creative: "creative, artistic work",
    research: "research and analysis",
    present: "presenting and speaking",
    // formats
    "prepared-project": "projects you prepare ahead of time",
    "live-challenge": "live, on-the-spot challenges",
    presentation: "presenting to judges",
    interview: "judge interviews",
    "written-test": "written tests",
    performance: "live performance",
};
function interestPhrase(key) { return INTEREST_PHRASE[key] || (INTEREST_LABELS[key] || "").toLowerCase(); }
function workPhrase(id) {
    if (WORKTYPE_PHRASE[id]) return WORKTYPE_PHRASE[id];
    const o = WORKTYPE_OPTIONS.find((x) => x.id === id);
    return o ? o.label.toLowerCase() : id;
}

// What each competition format actually has you DO, used to describe the
// experience ("you'll build a project ahead of time and present it to judges").
const FORMAT_ACTIVITY = {
    "prepared-project": "build a project ahead of time",
    "presentation": "present your work to judges",
    "interview": "talk through your work in a judge interview",
    "live-challenge": "solve a challenge on-site during the event",
    "written-test": "take a written test on the subject",
    "performance": "perform or demonstrate live",
};
// Human labels for the skills an event develops.
const SKILL_LABEL = {
    programming: "programming", "ux-design": "UX and interface design", design: "design",
    "technical-writing": "technical writing", "data-analysis": "data analysis", engineering: "engineering",
    cad: "CAD and 3D modeling", electronics: "electronics", robotics: "robotics", video: "video production",
    "game-design": "game design", animation: "animation", science: "scientific research",
    "public-speaking": "public speaking", leadership: "leadership", business: "business",
    writing: "writing", medicine: "medical knowledge", soldering: "soldering", cybersecurity: "cybersecurity",
};

const ORD = ["#1", "#2", "#3", "#4", "#5"];
function ordinal(n) { return ORD[n] || `#${n + 1}`; }
function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
function joinList(a) {
    if (a.length === 1) return a[0];
    if (a.length === 2) return `${a[0]} and ${a[1]}`;
    return a.slice(0, -1).join(", ") + ", and " + a[a.length - 1];
}

// Gather the concrete matched factors as short phrases for one event, plus a
// couple of structured flags the templates use to pick tone.
function collectFactors(ev, detail, connection, answers) {
    const { wt, it, st, fm, df, bg } = detail;
    const f = {
        exactWork: null,       // label of an exact (:3) work match
        strongWork: null,      // label of a :2 work match
        partialWork: null,     // label of a :1 work match
        softWork: !!wt.soft,   // only matched via interest-family soft credit
        topInterest: null,     // label of a top-ranked interest hit
        secondInterest: null,  // a second interest this event also hits
        career: null,          // career area label if connected
        careerStrong: false,
        prefStyle: null,       // matched prefer style label
        prefFormat: null,      // matched prefer format label
        avoidedHit: null,      // an avoided thing this event includes
        category: ev?.category || null, // event's own category, for extra colour
    };

    if (wt.best) {
        const opt = WORKTYPE_OPTIONS.find((o) => o.id === wt.best.optionId);
        const label = opt ? opt.label.toLowerCase() : wt.best.optionId;

        if (wt.best.wtWeight === 3) f.exactWork = { id: wt.best.optionId, label, rank: wt.best.rank };
        else if (wt.best.wtWeight === 2) f.strongWork = { id: wt.best.optionId, label, rank: wt.best.rank };
        else f.partialWork = { id: wt.best.optionId, label, rank: wt.best.rank };
    }

    const hitInterests = [];
    (answers.interestRanking || []).forEach((key, idx) => {
        const evW = ev?.interests?.[key] || 0;
        if (evW >= 2 && idx <= 4) hitInterests.push({ key, idx, evW });
    });
    if (hitInterests.length) f.topInterest = hitInterests[0].key;
    if (hitInterests.length > 1) f.secondInterest = hitInterests[1].key;

    if (connection && connection.level && connection.level !== "none" && connection.career) {
        f.career = connection.career;
        f.careerStrong = connection.level === "strong";
    }
    if (st.hitPrefer && st.hitPrefer.length) {
        const s0 = STYLE_OPTIONS.find((o) => o.id === st.hitPrefer[0]);
        if (s0) f.prefStyle = s0.label.toLowerCase();
    }
    if (fm.hitPrefer && fm.hitPrefer.length) {
        const f0 = FORMAT_OPTIONS.find((o) => o.id === fm.hitPrefer[0]);
        if (f0) f.prefFormat = f0.label.toLowerCase();
    }

    const avoidStyle = st.hitAvoid && st.hitAvoid.length ? STYLE_OPTIONS.find((o) => o.id === st.hitAvoid[0]) : null;
    const avoidFmt = fm.hitAvoid && fm.hitAvoid.length ? FORMAT_OPTIONS.find((o) => o.id === fm.hitAvoid[0]) : null;
    if (avoidStyle) f.avoidedHit = avoidStyle.label.toLowerCase();
    else if (avoidFmt) f.avoidedHit = avoidFmt.label.toLowerCase();

    f.activities = (ev?.formats || [])
        .map((fmt) => FORMAT_ACTIVITY[fmt])
        .filter(Boolean);

    // the skills it builds, ranked by the event's own skill weights
    f.skills = Object.entries(ev?.skills || {})
        .sort((a, b) => b[1] - a[1])
        .map(([k]) => SKILL_LABEL[k])
        .filter(Boolean)
        .slice(0, 3);

    // difficulty descriptor
    f.difficulty = ev?.difficulty || null; // beginner, intermediate, competitive

    // is this a long build vs a quick/live thing
    f.isProject = (ev?.formats || []).includes("prepared-project");
    f.isLive = (ev?.formats || []).includes("live-challenge");

    return f;
}

// Deterministic pick from a list of phrasings, keyed by position so adjacent
// cards read differently but the same profile always yields the same text.
function pick(variants, seed) {
    return variants[((seed % variants.length) + variants.length) % variants.length];
}

// Converts phrases such as
// "build a website" to "building a website"
// "create an app" to "creating an app"
function toGerundPhrase(phrase = "") {
    const transformations = [
        [/^build\b/i, "building"],
        [/^create\b/i, "creating"],
        [/^make\b/i, "making"],
        [/^produce\b/i, "producing"],
        [/^design\b/i, "designing"],
        [/^develop\b/i, "developing"],
        [/^write\b/i, "writing"],
        [/^code\b/i, "coding"],
        [/^program\b/i, "programming"],
        [/^research\b/i, "researching"],
        [/^analyze\b/i, "analyzing"],
        [/^solve\b/i, "solving"],
        [/^present\b/i, "presenting"],
        [/^perform\b/i, "performing"],
        [/^record\b/i, "recording"],
        [/^film\b/i, "filming"],
        [/^test\b/i, "testing"],
        [/^fly\b/i, "flying"],
        [/^take\b/i, "taking"],
        [/^do\b/i, "doing"],
        [/^dig\b/i, "digging"],
    ];

    for (const [pattern, replacement] of transformations) {
        if (pattern.test(phrase)) {
            return phrase.replace(pattern, replacement);
        }
    }

    return phrase;
}


// Creates a personalized explanation using four layers.
//
// 1. How the event connects to the user's answers
// 2. What the student will actually do
// 3. Skills or portfolio payoff
// 4. Final verdict, trade-off, or who the event suits
//
// Each layer has multiple deterministic phrasings.
// Rank-based seed offsets keep adjacent cards varied while keeping
// the same result stable after reloading.
function explain(ev, detail, connection, answers, rank = 0, pct = 0) {
    const f = collectFactors(ev, detail, connection, answers);
    const seed = Number.isFinite(rank) ? rank : 0;

    const tier =
        rank === 0
            ? "best"
            : rank <= 3 && pct >= 55
                ? "strong"
                : pct >= 45
                    ? "solid"
                    : pct >= 33
                        ? "mixed"
                        : "stretch";

    const parts = [];

    // ============================================================
    // LAYER 1: HOW IT CONNECTS TO THE USER'S ANSWERS
    // ============================================================

    if (f.exactWork) {
        const work = workPhrase(f.exactWork.id);
        const workGerund = toGerundPhrase(work);

        parts.push(
            pick(
                [
                    `You said you want to ${work}, and that is exactly what this event is built around.`,

                    `${workGerund.charAt(0).toUpperCase() + workGerund.slice(1)} was one of your top choices, and it sits at the center of this event.`,

                    `This lines up directly with your interest in ${workGerund}.`,

                    `Wanting to ${work} was near the top of your list, so this event lands right on target.`,

                    `The main focus here closely matches what you said you would most enjoy working on: ${workGerund}.`,

                    `This gives you a direct opportunity to ${work}, one of the activities you ranked highest.`,

                    `Few events connect as clearly to your interest in ${workGerund} as this one does.`,

                    `Your preference for ${workGerund} makes this an especially natural match.`,

                    `This event puts one of your strongest project choices front and center: ${workGerund}.`,

                    `Because you ranked ${workGerund} so highly, this event starts with a strong advantage for your profile.`,

                    `The kind of work you said you wanted most is also the main focus of this event.`,

                    `This is one of the clearest matches for the type of project you told us you would enjoy.`,
                ],
                seed + 1
            )
        );
    } else if (f.strongWork) {
        const work = workPhrase(f.strongWork.id);
        const workGerund = toGerundPhrase(work);

        parts.push(
            pick(
                [
                    `This is a close match for your interest in ${workGerund}.`,

                    `A large part of this event overlaps with your desire to ${work}.`,

                    `While it is not an exact match, it gives you a similar way to explore ${workGerund}.`,

                    `This event is closely related to one of the activities you ranked highly: ${workGerund}.`,

                    `You will find a lot of the same thinking and skills involved in ${workGerund}.`,

                    `This takes your interest in ${workGerund} in a slightly different direction.`,

                    `The work here shares a lot with ${workGerund}, which was one of your stronger choices.`,

                    `This is a natural neighboring option to ${workGerund}.`,

                    `It is not centered entirely on ${workGerund}, but there is enough overlap to make it relevant.`,

                    `Your interest in ${workGerund} carries over well into this event.`,
                ],
                seed + 5
            )
        );
    } else if (f.partialWork) {
        const work = workPhrase(f.partialWork.id);
        const workGerund = toGerundPhrase(work);

        parts.push(
            pick(
                [
                    `Part of this event lets you ${work}, which connects to one of your selected activities.`,

                    `There is some ${workGerund} woven into this event, even though it is not the main focus.`,

                    `This touches on your interest in ${workGerund}, but only as one part of the overall experience.`,

                    `You would get to use some of the same skills involved in ${workGerund}.`,

                    `This offers a smaller connection to ${workGerund}, one of the things you showed interest in.`,

                    `Your interest in ${workGerund} appears here, although the event ultimately focuses on something broader.`,

                    `There is a partial match with your preference for ${workGerund}.`,

                    `This gives you some exposure to ${workGerund}, without making it the entire project.`,
                ],
                seed + 9
            )
        );
    } else if (f.topInterest && f.secondInterest) {
        const firstInterest = interestPhrase(f.topInterest);
        const secondInterest = interestPhrase(f.secondInterest);

        parts.push(
            pick(
                [
                    `This event brings together two areas you ranked highly: ${firstInterest} and ${secondInterest}.`,

                    `It sits at the intersection of ${firstInterest} and ${secondInterest}, two of your stronger interests.`,

                    `You would get to draw on both ${firstInterest} and ${secondInterest} here.`,

                    `This is a good crossover between your interest in ${firstInterest} and your interest in ${secondInterest}.`,

                    `The event combines ${firstInterest} with ${secondInterest} in a way that fits your broader profile.`,

                    `Two of your strongest interest areas show up here: ${firstInterest} and ${secondInterest}.`,

                    `This gives you a chance to connect ${firstInterest} with ${secondInterest} in one competition.`,

                    `Your answers suggest that you enjoy both ${firstInterest} and ${secondInterest}, and this event makes use of each.`,

                    `This match comes largely from the overlap between ${firstInterest} and ${secondInterest}.`,

                    `The event reflects more than one side of your profile, especially ${firstInterest} and ${secondInterest}.`,
                ],
                seed + 13
            )
        );
    } else if (f.topInterest) {
        const interest = interestPhrase(f.topInterest);

        parts.push(
            pick(
                [
                    `This event connects strongly to your interest in ${interest}.`,

                    `If you enjoy ${interest}, this gives you another way to explore it.`,

                    `Your interest in ${interest} runs throughout this event.`,

                    `A major reason this appeared in your results is its connection to ${interest}.`,

                    `This gives you a practical outlet for your interest in ${interest}.`,

                    `The event draws on ${interest}, one of the areas you ranked most highly.`,

                    `Your enthusiasm for ${interest} makes this a relevant option.`,

                    `This match is driven mainly by your interest in ${interest}.`,

                    `You would get to apply your interest in ${interest} in a competitive setting.`,

                    `This fits one of the clearest patterns in your answers: an interest in ${interest}.`,
                ],
                seed + 17
            )
        );
    } else {
        parts.push(
            pick(
                [
                    `This event connects to your answers in a lighter way.`,

                    `There is some overlap here with what you told us, although it is not one of your most direct matches.`,

                    `This appeared because parts of the event still relate to your broader preferences.`,

                    `The connection is less direct, but the event shares a few qualities with your selected interests.`,

                    `This sits a little farther from your top choices, though it still has some relevant elements.`,

                    `Your profile has a small amount of overlap with this event.`,
                ],
                seed + 21
            )
        );
    }


    // ============================================================
    // LAYER 2: WHAT THE STUDENT WILL ACTUALLY DO
    // ============================================================

    if (f.activities.length) {
        const activities =
            f.activities.length >= 2
                ? `${f.activities[0]} and ${f.activities[1]}`
                : f.activities[0];

        parts.push(
            pick(
                [
                    `You will ${activities}.`,

                    `In this event, you will ${activities}.`,

                    `Expect to ${activities}.`,

                    `Most of your work will involve ${activities}.`,

                    `The experience centers on ${activities}.`,

                    `Your main responsibilities will be to ${activities}.`,

                    `During the event, you will spend much of your time ${activities}.`,

                    `The actual competition work includes ${activities}.`,

                    `This is a hands-on opportunity to ${activities}.`,

                    `Rather than only studying the topic, you will ${activities}.`,

                    `Day to day, the project will have you ${activities}.`,

                    `You can expect a mix of planning, problem-solving, and ${activities}.`,
                ],
                seed + 25
            )
        );
    }


    // ============================================================
    // LAYER 3: SKILLS AND PORTFOLIO PAYOFF
    // ============================================================

    if (f.skills.length) {
        const skillPhrase = joinList(
            f.skills.slice(0, tier === "best" ? 3 : 2)
        );

        const portfolioBit = f.isProject
            ? pick(
                [
                    `, while giving you a finished project you can add to a portfolio`,
                    `, and you will leave with something tangible to show for your work`,
                    `, with a final product you can present later`,
                    `, while creating a concrete example of what you can build`,
                    `, and the finished result could become a strong portfolio piece`,
                    `, leaving you with work you can continue improving after the competition`,
                    `, while producing something you can demonstrate to others`,
                    `, and you will have a real project to reflect on, improve, or showcase`,
                ],
                seed + 29
            )
            : "";

        parts.push(
            pick(
                [
                    `It helps you strengthen your skills in ${skillPhrase}${portfolioBit}.`,

                    `Along the way, you will develop practical experience in ${skillPhrase}${portfolioBit}.`,

                    `This is a useful way to grow your abilities in ${skillPhrase}${portfolioBit}.`,

                    `You will get meaningful practice with ${skillPhrase}${portfolioBit}.`,

                    `The event can sharpen your ${skillPhrase}${portfolioBit}.`,

                    `It gives you a reason to apply and improve ${skillPhrase}${portfolioBit}.`,

                    `You will build experience in ${skillPhrase} through a real competitive challenge${portfolioBit}.`,

                    `This can help turn your interest in the subject into stronger skills in ${skillPhrase}${portfolioBit}.`,

                    `The biggest payoff is practical growth in ${skillPhrase}${portfolioBit}.`,

                    `You will come away with more confidence in ${skillPhrase}${portfolioBit}.`,

                    `This event rewards steady improvement in ${skillPhrase}${portfolioBit}.`,

                    `It is especially valuable for students hoping to build stronger experience in ${skillPhrase}${portfolioBit}.`,
                ],
                seed + 33
            )
        );
    }


    // ============================================================
    // LAYER 4: FINAL VERDICT, TRADE-OFF, OR WHO IT SUITS
    // ============================================================

    const difficultyWord =
        f.difficulty === "beginner"
            ? "beginner"
            : f.difficulty === "competitive"
                ? "competitive"
                : null;

    if (tier === "best") {
        let verdict = pick(
            [
                `This is the strongest overall fit in your results and a great place to focus your effort.`,

                `Based on your answers, this is your clearest match.`,

                `This stands out as the event that best reflects what you said you want to do.`,

                `Among your results, this one brings together the most important parts of your profile.`,

                `This is your most complete match, combining the work, interests, and skills you prioritized.`,

                `This event lands closest to the center of what you described.`,

                `If you are narrowing your options, this is the most natural event to examine first.`,

                `This is the clearest all-around fit for the kind of experience you said you wanted.`,

                `Your answers point to this as the strongest starting point.`,

                `Few compromises are needed here; the event lines up closely with your highest priorities.`,
            ],
            seed + 37
        );

        if (f.avoidedHit) {
            verdict += ` The main trade-off is that it also involves ${f.avoidedHit}, which you said you would rather avoid.`;
        } else if (difficultyWord === "competitive") {
            verdict += ` It is still a competitive event, so strong preparation will matter.`;
        } else if (difficultyWord === "beginner") {
            verdict += ` It is also approachable if you are still gaining competition experience.`;
        }

        parts.push(verdict);
    } else if (tier === "strong") {
        let verdict = pick(
            [
                `This is one of your stronger options and deserves a serious look`,

                `It is a strong fit, sitting just below your very top result`,

                `This belongs near the top of your shortlist`,

                `There is enough direct overlap here to make this one of your better choices`,

                `This is a well-rounded match for your profile`,

                `It may not be your number-one result, but it aligns with several things you value`,

                `This is one of the more convincing alternatives in your results`,

                `You have several good reasons to consider this event seriously`,

                `This offers a strong balance between what interests you and what the event actually requires`,

                `For the right student, this could compete closely with the very top match`,
            ],
            seed + 41
        );

        if (f.avoidedHit) {
            verdict += `, although it also involves ${f.avoidedHit}, which you said you would rather avoid`;
        } else if (difficultyWord === "beginner") {
            verdict += `, and it should be approachable if you are newer to TSA competitions`;
        } else if (difficultyWord === "competitive") {
            verdict += `, though you should expect serious competition and prepare accordingly`;
        } else {
            verdict += `, especially if the day-to-day work sounds enjoyable to you`;
        }

        parts.push(`${verdict}.`);
    } else if (tier === "solid") {
        let verdict = pick(
            [
                `This is a solid option, even though it is not your most exact match`,

                `It is a reasonable choice with several meaningful connections to your profile`,

                `This is worth considering after you review your strongest matches`,

                `The fit is real, but it depends more on which parts of the event appeal to you personally`,

                `This sits comfortably in the middle of your results`,

                `It has enough overlap to be relevant without being an obvious first choice`,

                `This could work well if its specific format catches your attention`,

                `It is a balanced secondary option rather than a direct bullseye`,

                `There are good reasons to consider it, but also stronger matches above it`,

                `This may suit you better in practice than the score suggests if you enjoy its competition format`,
            ],
            seed + 45
        );

        if (f.avoidedHit) {
            verdict += `, but it includes ${f.avoidedHit}, which could make it less enjoyable for you`;
        } else if (f.topInterest) {
            const interest = interestPhrase(f.topInterest);

            verdict += pick(
                [
                    `, especially if your interest in ${interest} matters more than getting an exact project-type match`,
                    `, and it becomes more appealing if ${interest} is what excites you most`,
                    `, particularly for someone who wants another way to explore ${interest}`,
                    `, with its strongest appeal coming from its connection to ${interest}`,
                ],
                seed + 49
            );
        } else {
            verdict += `, particularly if you are open to trying something a little different`;
        }

        parts.push(`${verdict}.`);
    } else if (tier === "mixed") {
        let verdict = pick(
            [
                `This is more of a partial match than a direct recommendation`,

                `It overlaps with your profile in a few places, but misses some of your highest priorities`,

                `Think of this as a side option rather than one of your central choices`,

                `The event has some relevant qualities, though the overall fit is mixed`,

                `This may interest one part of you without matching the full picture`,

                `There is enough overlap to keep it in the results, but not enough to make it a leading recommendation`,

                `This works better as an exploration option than as a clear first choice`,

                `The match depends on whether its specific activities appeal to you more than your answers suggest`,

                `It connects to some of your interests, but the core experience points in a different direction`,

                `This is worth checking only after you have considered the stronger matches above it`,
            ],
            seed + 53
        );

        if (f.avoidedHit) {
            verdict += `, and it also relies on ${f.avoidedHit}, which you said you would rather avoid`;
        } else {
            verdict += pick(
                [
                    `; it makes the most sense if you are open to branching out`,
                    `; consider it if you want to test a less familiar area`,
                    `; it could work if the event description itself sparks your curiosity`,
                    `; it is better suited to someone willing to trade direct fit for variety`,
                    `; keep it in mind only if your higher matches do not feel right`,
                ],
                seed + 57
            );
        }

        parts.push(`${verdict}.`);
    } else {
        const category = f.category
            ? f.category.toLowerCase()
            : "a different area";

        let verdict = pick(
            [
                `This is one of your more distant matches and leans more toward ${category}`,

                `This sits near the edge of your results, with most of its focus in ${category}`,

                `The connection is fairly limited because the event points more toward ${category}`,

                `This is a stretch compared with the interests and activities you ranked highest`,

                `Only a small part of this event overlaps with your current profile`,

                `This appears mainly as an exploration option rather than a core recommendation`,

                `The event is more closely aligned with ${category} than with your strongest choices`,

                `This would require you to step outside the areas you emphasized most`,

                `It is included because of a few minor connections, not because it closely matches your top priorities`,

                `This is best viewed as a wildcard option`,
            ],
            seed + 61
        );

        verdict += pick(
            [
                `. Consider it mainly if you want to explore beyond your usual interests`,
                `. Choose it only if the actual event description sounds more exciting than the score suggests`,
                `. It may be worthwhile if you deliberately want to try something unfamiliar`,
                `. This is more appropriate for curiosity and experimentation than for following your strongest interests`,
                `. Keep it as a backup rather than a leading choice`,
                `. It could surprise you, but your answers point more strongly toward other events`,
                `. Give it a closer look only if you are interested in moving outside your current comfort zone`,
                `. The higher-ranked events are likely to feel more natural based on what you told us`,
            ],
            seed + 65
        );

        if (f.avoidedHit) {
            verdict += ` It also involves ${f.avoidedHit}, which you specifically said you would rather avoid.`;
        }

        parts.push(`${verdict}.`);
    }

    return parts.join(" ");
}

export const CAREER_LABELS = {
    software: "Software & App Development",
    "data-science": "AI, Data & Analytics",
    cybersecurity: "Cybersecurity & IT",
    robotics: "Robotics & Automation",
    aerospace: "Aerospace & Aviation",
    "mechanical-eng": "Mechanical & Electrical Engineering",
    "civil-eng": "Civil Engineering & Architecture",
    manufacturing: "Manufacturing & Product Design",
    transportation: "Transportation & Automotive",
    "game-dev": "Game Development & Interactive Media",
    design: "Web & Graphic Design",
    "media-film": "Film, Video & Audio Production",
    fashion: "Fashion & Apparel Design",
    marketing: "Marketing & Advertising",
    business: "Business & Leadership",
    education: "Education & Communications",
    medicine: "Medicine & Healthcare",
    biotech: "Biotechnology & Life Sciences",
    "research-science": "Science & Research",
    government: "Government & Public Safety",
    // legacy/merged keys still tagged on events, fold into their umbrella label
    // so Career Connection keeps working without re-tagging every event.
    ai: "AI, Data & Analytics",
    "electrical-eng": "Mechanical & Electrical Engineering",
    architecture: "Civil Engineering & Architecture",
    "web-dev": "Web & Graphic Design",
    "product-design": "Manufacturing & Product Design",
};