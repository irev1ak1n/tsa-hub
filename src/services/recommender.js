// ============================================================================
// TSA Hub — Recommender adapter
// ----------------------------------------------------------------------------
// Thin layer between the survey UI (Recommender.jsx) and the pure scoring
// engine. Re-exports the question config the UI renders from, so every option
// list lives in ONE place.
//
// TEMPORARY: reads event metadata from src/data/eventRecommendationData.js
// (in-code) instead of Supabase/Excel while we validate the algorithm.
// Once results are locked, swap EVENT_REC_DATA for the live events feed.
//
// TWO OUTPUT CONCEPTS per result:
//   pct        -> Match % (personal fit: workType/interest/style/format/
//                 difficulty/career, minus a tiny time/budget display penalty)
//   practical  -> Participation block (team requirement + warnings, time note,
//                 budget note, entry limits). NEVER folded into the match.
// ============================================================================

import { EVENT_REC_DATA } from "../data/eventRecommendationData.js";
import {
  recommend as engineRecommend,
  INTEREST_KEYS,
  INTEREST_LABELS,
  WORKTYPE_OPTIONS,
  STYLE_OPTIONS,
  FORMAT_OPTIONS,
  DIFFICULTY_OPTIONS,
  CAREER_CONNECTION_LABEL,
  CAREER_LABELS,
} from "./recommenderEngine.js";

// ---- Step 1: the 8 broad interests (default display order) ------------------
export const STEP1_INTERESTS = INTEREST_KEYS.map((key) => ({
  key,
  label: INTEREST_LABELS[key],
}));

// ---- Step 2: the 16 "what would you love to work on?" options ---------------
export const STEP2_WORK_OPTIONS = WORKTYPE_OPTIONS.map((o) => ({
  id: o.id,
  label: o.label,
}));

// ---- Prefer / Avoid vocabularies (all three feed a small ranking signal) ----
export const STYLE_CHOICES = STYLE_OPTIONS;        // digital / hands-on / creative / research / present
export const FORMAT_CHOICES = FORMAT_OPTIONS;      // prepared-project / live-challenge / presentation / interview / written-test / performance
export const DIFFICULTY_CHOICES = DIFFICULTY_OPTIONS; // beginner / challenging / competitive

// ---- Time / budget ----------------------------------------------------------
export const TIME_CHOICES = [
  { id: "light", label: "1–3 hours a week" },
  { id: "medium", label: "3–5 hours a week" },
  { id: "heavy", label: "5–10+ hours a week" },
  { id: "any", label: "I'm open to any commitment" },
];

export const BUDGET_CHOICES = [
  { id: "0-25", label: "Under $25" },
  { id: "25-75", label: "$25–75" },
  { id: "75-150", label: "$75–150" },
  { id: "150-300", label: "$150–300" },
  { id: "300+", label: "$300+ is fine" },
];

// ---- Work style (compared against official eligibility) ---------------------
// Used ONLY to flag team requirements — never changes the Match %.
export const TEAM_AVAILABILITY_CHOICES = [
  { id: "solo", label: "Work Independently", desc: "Solo projects where you have full creative control" },
  { id: "two-three", label: "Small Team", desc: "Collaborate with a close-knit group of 2-4" },
  { id: "four-plus", label: "Large Team", desc: "Work with a bigger team of 5+ on complex projects" },
  { id: "unsure", label: "Anything works for me", desc: "I’m comfortable competing solo or with a team" },
];

export { CAREER_CONNECTION_LABEL, CAREER_LABELS };

// ----------------------------------------------------------------------------
// recommend(answers) -> array of result objects for the UI.
//
// answers shape (from the survey):
//   division:         "HS" | "MS"           (from profile, not asked)
//   interestRanking:  [interestKey, ...]    (all 8, most -> least)
//   workRanking:      [optionId, ...]       (up to 5, most -> least)
//   careers:          [careerKey, ...]      (small set, low weight)
//   prefer:           [id, ...]             (mix of style/format/difficulty ids)
//   avoid:            [id, ...]             (mix of style/format/difficulty ids)
//   time:             timeId | null
//   cost:             budgetId | null
//   teamAvailability: "solo"|"one"|"two-three"|"four-plus"|"unsure" | null
//
// each result:
//   { id, name, category, division,
//     pct,                 // Match % (fit minus tiny time/budget adjustment)
//     baseMatch,           // pure fit before that adjustment
//     connection: { level, label, career },
//     explanation,         // WHY it fits (no practical limits mixed in)
//     practical: {
//       team:   { requirement, notes: [{kind:'ok'|'warn'|'info', text}] },
//       time:   { note, level, penalty },
//       budget: { note, level, penalty },
//     } }
// ----------------------------------------------------------------------------
export function recommend(answers, opts = {}) {
  const scored = engineRecommend(EVENT_REC_DATA, answers, {
    topN: opts.topN ?? 10,
  });
  return scored.map((s) => ({
    id: s.ev.id,
    name: s.ev.name,
    category: s.ev.category,
    division: s.ev.division,
    pct: s.pct,
    baseMatch: s.baseMatch,
    connection: {
      level: s.connection.level,
      label: CAREER_CONNECTION_LABEL[s.connection.level],
      career: s.connection.label || null,
    },
    explanation: s.explanation,
    practical: s.practical,
    _parts: s.parts, // debug only; UI can ignore
  }));
}

export const ALL_INTEREST_KEYS = INTEREST_KEYS;