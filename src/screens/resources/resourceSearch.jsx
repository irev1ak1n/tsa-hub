import { Link } from 'react-router-dom';
import { Icon } from '../../components/UI.jsx';
import { RowIcon } from './resourcesShared.jsx';
import { ABOUT_TSA } from '../../data/aboutTsa.js';
import { NATIONAL_CONFERENCE } from '../../data/nationalConference.js';
import { COMPETITION_RULES } from '../../data/competitionRules.js';
import { COMPETITION_REQUIREMENTS } from '../../data/competitionRequirements.js';
import { PROGRAMS } from '../../data/programs.js';
import { STATE_TSA } from '../../data/stateTsa.js';
import { detectStateInText, STATE_ABBREVIATIONS } from '../../data/stateAbbreviations.js';
import { editDistance } from '../../services/chatbot/language/normalize.js';

import instagramIcon from '../../assets/img/social-media/instagram.png';
import facebookIcon from '../../assets/img/social-media/facebook.png';
import storeIcon from '../../assets/img/store.png';
import tsaLeadership from '../../assets/img/tsa-leadership.png';

// Inline YouTube logo (red).
const YOUTUBE_SVG =
    '<path fill="#FF0000" d="M23 12s0-3.2-.4-4.7a2.5 2.5 0 0 0-1.7-1.7C19.3 5.2 12 5.2 12 5.2s-7.3 0-8.9.4A2.5 2.5 0 0 0 1.4 7.3C1 8.8 1 12 1 12s0 3.2.4 4.7a2.5 2.5 0 0 0 1.7 1.7c1.6.4 8.9.4 8.9.4s7.3 0 8.9-.4a2.5 2.5 0 0 0 1.7-1.7C23 15.2 23 12 23 12z"/>' +
    '<path fill="#fff" d="M9.8 15.3V8.7l6 3.3-6 3.3z"/>';

// National TSA — official website, socials, and store. Shared by the Resources
// page (rendered as a section) and the search index.
export const NATIONAL_TSA = [
    { icon: 'globe', iconColor: 'var(--ig-blue)', title: 'Official TSA Website', desc: 'National programs, competitions, membership, and announcements.', url: 'https://tsaweb.org/' },
    { img: instagramIcon, title: 'Official TSA Instagram', desc: 'National event highlights, news, and student stories.', url: 'https://www.instagram.com/nationaltsa' },
    { img: facebookIcon, title: 'Official TSA Facebook', desc: 'Organization updates, photos, and community news.', url: 'https://www.facebook.com/tobor.cooper' },
    { svg: YOUTUBE_SVG, title: 'Official TSA YouTube', desc: 'Videos, conference highlights, and organization content.', url: 'https://youtube.com/@national_tsa' },
];

// The two leadership navigation cards (each links to its own dedicated page).
export const LEADERSHIP_NAV = [
    { icon: 'help', title: 'Student Leadership', desc: 'Meet state and national student officers.', to: '/resources/student-leadership' },
    { img: tsaLeadership, title: 'TSA Leadership & Support', desc: 'Find advisors, national leaders, and official contacts.', to: '/resources/leadership-support' },
];

// Extra search words per item (keyed by lowercased title).
const RESOURCE_KEYWORDS = {
    'what is tsa': 'technology student association meaning overview intro about explained definition',
    'about tsa': 'mission vision motto values purpose cte career technical education',
    'history': 'founded founding origin background past established started timeline',
    'tsa competitions': 'events competitive events contests categories list of events',
    'competition divisions': 'middle school high school ms hs grades division level age',
    '2026 national conference': 'nationals natcon national conference guide schedule 2026',
    '2027 national conference': 'nationals natcon national conference guide schedule 2027 upcoming',
    'registration and badges': 'register check in check-in badge id lanyard sign up onsite',
    'dress code': 'attire clothing what to wear formal business competition attire shirt pants shoes tie outfit uniform',
    'code of conduct': 'behavior conduct discipline expectations rules honor social media policy',
    'packing checklist': 'what to bring pack luggage supplies essentials list bring items',
    'competition requirements': 'entry requirements event prep materials deadlines what you need',
    'travel, meals and budget': 'travel meals food budget money cost hotel flights transportation expenses dining per diem',
    'safety and emergencies': 'safety emergency medical health security first aid evacuation help competition rules',
    'results and awards': 'results awards winners scoring medals trophy placement ceremony ranking scores',
    'competition rules': 'guidelines regulations rulebook what am i allowed to do',
    'competition eligibility': 'eligible membership affiliation who can compete grade division team size rules',
    'entry requirements': 'entries how many events sign up register requirements limits',
    'work and content rules': 'work content plagiarism originality copyright materials submission rules',
    'schedule conflicts and emergencies': 'schedule conflict overlap timing emergency missed event rules',
    'how judging works': 'judging judges rubric scoring evaluation criteria points how scored',
    'violations and advancement': 'violation penalty disqualification dq advancement move on next round rules',
    'forward to fifty (f2f)': 'f2f growth membership growth 50 fiftieth anniversary recognition chapter',
    'awards and scholarships': 'scholarship award money financial aid nths grants college funding tuition student students',
    'leadership program': 'leadership officer skills 21st century skills voices podcast development training opportunity opportunities',
    'national service project': 'service community service red cross volunteer charity giving donate nsp',
    'tsa achievement program, pathways to excellence': 'achievement pathways excellence bronze silver gold pins recognition levels',
    'official tsa website': 'tsaweb national site homepage main website official',
    'official tsa instagram': 'social media instagram ig socials',
    'official tsa facebook': 'social media facebook fb socials',
    'official tsa youtube': 'social media youtube videos channel socials',
    'official tsa store': 'store shop merch merchandise apparel clothing gear buy purchase attire',
    'student leadership': 'officers student officers state officers national officers leadership team',
    'tsa leadership & support': 'advisor adviser support contacts board of directors staff national office help',
};

function keywordsFor(title) {
    return RESOURCE_KEYWORDS[String(title || '').trim().toLowerCase()] || '';
}

// Reusable alias groups keyed by resource TYPE rather than exact title — so
// e.g. every state's Instagram resource (50+ distinct titles like "Official
// Alabama TSA Instagram") gets the same "insta ig social" alias words without
// hand-writing 50 near-duplicate RESOURCE_KEYWORDS entries. Applied on top of
// (not instead of) the per-title keywords above.
const TYPE_KEYWORDS = {
    advisor: 'adviser contact state contact representative person in charge who to email who to contact tsa contact contact person reach out email phone who runs tsa who is in charge',
    'state-website': 'site homepage web official site online page delegation website',
    'national-website': 'site homepage web official site online page national',
    instagram: 'insta ig social social media socials follow',
    facebook: 'fb social social media socials follow page',
    'officer-team': 'officer officers leadership state officers student leaders leadership team',
};

function typeKeywordsFor(type) {
    return TYPE_KEYWORDS[type] || '';
}

// Classify a state/national link object by what it actually is, from its
// existing shape (icon/img/role) — not its title text, so this works
// identically for all 50 states' differently-worded titles.
function linkType(l, isState) {
    if (l.role === 'advisor') return 'advisor';
    if (l.role === 'officer-team') return 'officer-team';
    if (l.img === instagramIcon) return 'instagram';
    if (l.img === facebookIcon) return 'facebook';
    if (l.icon === 'globe') return isState ? 'state-website' : 'national-website';
    return 'general';
}

// stateInfo.name is a display string ("Alabama TSA"), not the canonical key
// ("Alabama") that STATE_ABBREVIATIONS and detectStateInText's state-name
// list use — recover the canonical key by identity so "AL"/"al" style
// queries can find state resources without a second parameter threading
// through every call site.
function canonicalStateName(stateInfo) {
    if (!stateInfo) return null;
    return Object.keys(STATE_TSA).find((k) => STATE_TSA[k] === stateInfo) || null;
}

// Build a flat index of everything on the Resources page.
export function buildResourceIndex(stateInfo) {
    const items = [];
    const stateName = canonicalStateName(stateInfo);

    ABOUT_TSA.forEach((p) =>
        items.push({ group: 'About TSA', title: p.title, icon: p.icon, to: `/resources/about/${p.id}` }));

    NATIONAL_CONFERENCE.items.forEach((item) => {
        if (item.type === 'link') {
            items.push({ group: NATIONAL_CONFERENCE.title, title: item.title, icon: item.icon, to: item.route });
        } else {
            (item.children || []).forEach((c) =>
                items.push({ group: item.title, title: c.title, icon: 'file-text', to: c.route }));
        }
    });

    COMPETITION_RULES.forEach((cat) => {
        items.push({ group: 'Competition Rules', title: cat.title, subtitle: cat.description, icon: cat.icon, to: `/resources/competition-rules/${cat.id}` });
        (cat.topics || []).forEach((t) =>
            items.push({ group: cat.title, title: t.title, subtitle: t.description, icon: 'file-text', to: `/resources/competition-rules/${cat.id}/${t.id}` }));
    });

    PROGRAMS.forEach((p) =>
        items.push({ group: 'Programs & Initiatives', title: p.title, icon: p.icon, to: `/resources/programs/${p.id}` }));

    COMPETITION_REQUIREMENTS.forEach((r) =>
        items.push({ group: 'Competition Requirements & Updates', title: r.title, icon: r.icon, to: `/resources/competition-requirements/${r.id}` }));

    if (stateInfo) {
        (stateInfo.links || []).filter((l) => l.url).forEach((l) =>
            items.push({ group: stateInfo.name || 'Your State', title: l.title, subtitle: l.desc, icon: l.icon, img: l.img, href: l.url, state: stateName, type: linkType(l, true) }));

        // The advisor link never has a `url` (contact info opens a modal on
        // the Leadership & Support page instead), so the filter above always
        // skipped it — meaning "State Advisor" was a true orphan resource,
        // unfindable through search no matter what you typed. Point it at
        // the page that actually renders the contact modal.
        const advisorLink = (stateInfo.links || []).find((l) => l.role === 'advisor');
        if (advisorLink) {
            items.push({ group: stateInfo.name || 'Your State', title: 'State Advisor', subtitle: advisorLink.desc, icon: advisorLink.icon, state: stateName, type: 'advisor', to: '/resources/leadership-support' });
        }
    }

    NATIONAL_TSA.forEach((r) =>
        items.push({ group: 'National TSA', title: r.title, subtitle: r.desc, icon: r.icon, img: r.img, svg: r.svg, iconColor: r.iconColor, href: r.url, type: linkType(r, false) }));

    items.push({ group: 'TSA Store', title: 'Official TSA Store', subtitle: 'Apparel, competition attire, accessories, and merchandise.', img: storeIcon, href: 'https://tsastore.mybrightsites.com/' });

    LEADERSHIP_NAV.forEach((n) =>
        items.push({ group: 'Leadership & Contacts', title: n.title, subtitle: n.desc, icon: n.icon, img: n.img, to: n.to }));

    return items;
}

// --- Search scoring ---------------------------------------------------
// Word-boundary-safe on purpose: a plain substring check would make a
// 2-letter token like "al" (Alabama) match "official"/"personal" in every
// single resource. Whole-word matching avoids that; a controlled
// prefix/fuzzy layer still gives typo tolerance and partial-word search for
// tokens long enough that a false positive is actually unlikely.

const SEARCH_STOPWORDS = new Set([
    'a', 'an', 'the', 'is', 'are', 'am', 'do', 'does', 'did', 'i', 'me', 'my',
    'you', 'your', 'it', 'this', 'that', 'to', 'of', 'for', 'in', 'on', 'at',
    'by', 'with', 'and', 'or', 'what', 'where', 'who', 'how', 'can', 'could',
    'should', 'would', 'im', 'about', 'find', 'need', 'want', 'have', 'has',
    // "tsa" and "official" describe literally every resource here — neither
    // ever helps tell two of them apart, so they're filler, not signal.
    'tsa', 'official',
]);

function haystackFor(item) {
    // Every state-scoped item's title/desc names the state ("Official
    // Alabama TSA Instagram") but never says the bare word "state" or the
    // postal abbreviation ("AL") — both are extremely common in how students
    // actually phrase a query ("state instagram", "AL tsa advisor"), so add
    // them explicitly rather than requiring every title to spell them out.
    const stateWords = item.state ? `state ${item.state} ${STATE_ABBREVIATIONS[item.state] || ''}` : '';
    const text = `${item.title} ${item.subtitle || ''} ${item.group} ${keywordsFor(item.title)} ${typeKeywordsFor(item.type)} ${stateWords}`.toLowerCase();
    return {
        text,
        words: text.split(/[^a-z0-9]+/).filter(Boolean),
        titleWords: item.title.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean),
    };
}

// Score one query token against one item's haystack. 0 = no match at all.
function tokenScore(token, hay) {
    if (!token) return 0;
    if (hay.words.includes(token)) {
        return hay.titleWords.includes(token) ? 10 : 5;
    }
    // Short tokens (state postal codes, "ig", "fb") only ever match a whole
    // word — substring/fuzzy matching at 1-2 characters is pure noise.
    if (token.length <= 2) return 0;
    const isPrefixHit = hay.words.some((w) => w.startsWith(token) || (token.startsWith(w) && w.length >= 3));
    if (isPrefixHit) {
        return hay.titleWords.some((w) => w.startsWith(token)) ? 4 : 2;
    }
    if (token.length >= 4) {
        const maxDist = token.length >= 7 ? 2 : 1;
        if (hay.words.some((w) => w.length >= 4 && editDistance(token, w, maxDist) <= maxDist)) return 1;
    }
    return 0;
}

// Score one resource against the query's tokens. 0 means "not a match".
//
// Short queries (<=2 meaningful tokens) require EVERY token to contribute —
// this is where over-matching does the most damage ("web" alone must not
// match anything without an actual "web*" word). Longer natural-language
// questions ("im trying to figure out who im supposed to email for alabama
// tsa because my advisor...") legitimately contain several words no
// resource's keyword list will ever cover, so they only need a share of
// their tokens to land — precision at the top of the list still comes from
// ranking by score, not from every word matching.
function minMatchesFor(tokenCount) {
    // Single-token queries stay fully strict — that's where over-matching
    // does the most damage ("web" alone must not match anything without an
    // actual "web*" word). From two tokens up, a real query commonly pairs
    // one strong signal word with one generic qualifier no resource's
    // keyword list covers ("wear nationals", "leadership opportunities") —
    // ranking by score, not this floor, is what keeps the top results
    // precise once partial matches are allowed through at all. Capped at 2
    // rather than scaling forever: a genuinely long natural-language
    // question ("does alabama tsa have an instagram or facebook because...")
    // often only has 2 words that actually identify a resource no matter how
    // many more words surround them — requiring more than that just returns
    // nothing for the exact kind of message this search needs to handle.
    return Math.max(1, Math.min(2, Math.round(tokenCount * 0.4)));
}

export function scoreResource(item, tokens, { stateName = null } = {}) {
    if (!tokens.length) return 0;
    const hay = haystackFor(item);
    let score = 0;
    let matched = 0;
    for (const t of tokens) {
        const s = tokenScore(t, hay);
        if (s > 0) { score += s; matched++; }
    }
    if (matched < minMatchesFor(tokens.length)) return 0;
    if (stateName && item.state === stateName) score += 6;
    else if (stateName && item.state && item.state !== stateName) score -= 4;
    return score;
}

// Normalizes a raw query, scores + ranks + de-dupes the whole index, and
// returns matching resources sorted by relevance (ties keep index order —
// i.e. the Resources page's own natural section order).
export function searchResources(index, rawQuery) {
    const q = String(rawQuery || '').trim().toLowerCase();
    if (!q) return [];

    // Punctuation-stripped the same way haystack words are, so "D.C." finds
    // "DC" and doesn't get treated as one glued-together unmatchable token.
    // Possessive "'s" is dropped first (not just space-replaced), so
    // "state's" becomes "states" — a real word the "state" haystack entry
    // still prefix-matches — instead of splitting into "state" + a stray
    // one-letter "s" that can never match anything and fails the whole query.
    const raw = q.replace(/'s\b/g, 's').replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
    const filtered = raw.filter((t) => !SEARCH_STOPWORDS.has(t) && t.length > 1);
    const tokens = filtered.length ? filtered : raw; // an all-stopword query still tries something
    const stateName = detectStateInText(q);
    const exactTitleQuery = q;

    const seen = new Set();
    const scored = [];
    index.forEach((item, i) => {
        // Identity is (destination + title), not destination alone — two
        // genuinely different resources can share a route (e.g. "State
        // Advisor" and "TSA Leadership & Support" both point to
        // /resources/leadership-support; one is a specific state's contact
        // card that happens to live on that page, the other is the page's
        // own nav entry). Keying on `to` alone silently dropped whichever
        // one scored second for any query matching both.
        const key = `${item.to || item.href || ''}|${item.title}`;
        if (seen.has(key)) return; // stable de-dupe by resource identity
        let score = scoreResource(item, tokens, { stateName });
        if (score > 0) {
            if (item.title.toLowerCase() === exactTitleQuery) score += 20;
            seen.add(key);
            scored.push({ item, score, i });
        }
    });
    scored.sort((a, b) => b.score - a.score || a.i - b.i);
    return scored.map((s) => s.item);
}

// Legacy boolean shape, kept for any direct callers.
export function matchesResource(item, tokens) {
    return scoreResource(item, tokens) > 0;
}

function ResultRow({ item, onPick }) {
    const inner = (
        <>
            <RowIcon icon={item.icon} img={item.img} svg={item.svg} color={item.iconColor} />
            <span className="rs-text">
                <span className="rs-title">{item.title}</span>
                <span className="rs-desc">{item.group}</span>
            </span>
            <Icon name="chevron-right" size={18} />
        </>
    );
    if (item.to) return <Link to={item.to} className="rs-row" onClick={onPick}>{inner}</Link>;
    if (item.href) return <a className="rs-row" href={item.href} target="_blank" rel="noreferrer" onClick={onPick}>{inner}</a>;
    return <span className="rs-row is-disabled" aria-disabled="true">{inner}</span>;
}

export function SearchResults({ results, query, onPick }) {
    return (
        <>
            <div className="rs-group-label">
                {results.length} result{results.length === 1 ? '' : 's'} for &ldquo;{query.trim()}&rdquo;
            </div>
            {results.length > 0 ? (
                <div className="rs-card">
                    {results.map((item, i) => (
                        <ResultRow key={`${item.to || item.href || item.title}-${i}`} item={item} onPick={onPick} />
                    ))}
                </div>
            ) : (
                <div className="rs-card">
                    <span className="rs-row is-disabled" aria-disabled="true">
                        <span className="rs-text">
                            <span className="rs-desc">Nothing matches your search. Try a different word.</span>
                        </span>
                    </span>
                </div>
            )}
        </>
    );
}