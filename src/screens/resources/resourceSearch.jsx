import { Link } from 'react-router-dom';
import { Icon } from '../../components/UI.jsx';
import { RowIcon } from './resourcesShared.jsx';
import { ABOUT_TSA } from '../../data/aboutTsa.js';
import { NATIONAL_CONFERENCE } from '../../data/nationalConference.js';
import { COMPETITION_RULES } from '../../data/competitionRules.js';
import { COMPETITION_REQUIREMENTS } from '../../data/competitionRequirements.js';
import { PROGRAMS } from '../../data/programs.js';

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
    'who we are': 'mission vision motto values purpose cte career technical education',
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
    'safety and emergencies': 'safety emergency medical health security first aid evacuation help',
    'results and awards': 'results awards winners scoring medals trophy placement ceremony ranking scores',
    'competition eligibility': 'eligible membership affiliation who can compete grade division team size rules',
    'entry requirements': 'entries how many events sign up register requirements limits',
    'work and content rules': 'work content plagiarism originality copyright materials submission rules',
    'schedule conflicts and emergencies': 'schedule conflict overlap timing emergency missed event rules',
    'how judging works': 'judging judges rubric scoring evaluation criteria points how scored',
    'violations and advancement': 'violation penalty disqualification dq advancement move on next round rules',
    'forward to fifty (f2f)': 'f2f growth membership growth 50 fiftieth anniversary recognition chapter',
    'awards and scholarships': 'scholarship award money financial aid nths grants college funding tuition',
    'leadership program': 'leadership officer skills 21st century skills voices podcast development training',
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

// Build a flat index of everything on the Resources page.
export function buildResourceIndex(stateInfo) {
    const items = [];

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
            items.push({ group: stateInfo.name || 'Your State', title: l.title, subtitle: l.desc, icon: l.icon, img: l.img, href: l.url }));
    }

    NATIONAL_TSA.forEach((r) =>
        items.push({ group: 'National TSA', title: r.title, subtitle: r.desc, icon: r.icon, img: r.img, svg: r.svg, iconColor: r.iconColor, href: r.url }));

    items.push({ group: 'TSA Store', title: 'Official TSA Store', subtitle: 'Apparel, competition attire, accessories, and merchandise.', img: storeIcon, href: 'https://tsastore.mybrightsites.com/' });

    LEADERSHIP_NAV.forEach((n) =>
        items.push({ group: 'Leadership & Contacts', title: n.title, subtitle: n.desc, icon: n.icon, img: n.img, to: n.to }));

    return items;
}

export function matchesResource(item, tokens) {
    const hay = `${item.title} ${item.subtitle || ''} ${item.group} ${keywordsFor(item.title)}`.toLowerCase();
    return tokens.every((t) => hay.includes(t));
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