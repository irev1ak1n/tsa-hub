// ============================================================
// TSA HUB — event catalog from Supabase.
//
// Weighted tag fields (interests, skills, careers) are stored as
// "tag:weight;tag:weight" and parsed here into a { tag: weight }
// object, so scoring can multiply a match by how central that tag
// is to the event. Plain list fields split into arrays.
// ============================================================

import { supabase } from './supabase.js';

// "robotics:3;engineering:2" → { robotics: 3, engineering: 2 }
function parseWeighted(raw) {
    const out = {};
    if (!raw) return out;
    raw.split(';').forEach((part) => {
        const t = part.trim();
        if (!t) return;
        const [tag, w] = t.split(':');
        const key = tag.trim().toLowerCase();
        if (key) out[key] = w ? Number(w) : 1;
    });
    return out;
}

function splitList(raw) {
    if (!raw) return [];
    return raw.split(';').map((t) => t.trim().toLowerCase()).filter(Boolean);
}

function parseThemeLinks(raw) {
    if (!raw) return [];
    return raw
        .split(';')
        .map((p) => p.trim())
        .filter(Boolean)
        .map((p) => {
            const i = p.indexOf('|');
            if (i === -1) return { label: 'Document', url: p };
            return { label: p.slice(0, i).trim(), url: p.slice(i + 1).trim() };
        })
        .filter((l) => l.url);
}

function fromRow(r) {
    return {
        id: r.id,
        division: r.division,
        name: r.name,
        category: r.category || '',

        eligibility: r.eligibility_text
            ? {
                text: r.eligibility_text,
                teamSize: r.team_size || null,
                per: r.eligibility_per || null,
                individualOk: r.individual_ok === true,
            }
            : null,

        season: r.season || '',
        overview: r.overview || '',
        theme: r.theme || '',
        themeLinks: parseThemeLinks(r.theme_url),

        // weighted maps
        interests: parseWeighted(r.interests),
        skills: parseWeighted(r.skills),
        careers: parseWeighted(r.careers),

        // plain
        projectType: splitList(r.project_type),
        buildType: splitList(r.build_type),
        projectStyle: splitList(r.project_style),
        costBand: (r.cost_band || '').trim(),
        timeBand: (r.time_band || '').trim(),
        difficulty: (r.difficulty || '').trim(),
        materials: (r.materials || '').trim(),
    };
}

export async function fetchEvents() {
    const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('archived', false)
        .order('division', { ascending: true })
        .order('name', { ascending: true });

    if (error) throw error;
    return (data || []).map(fromRow);
}