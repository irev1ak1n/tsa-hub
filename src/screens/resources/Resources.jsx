import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext.jsx';
import { Icon } from '../../components/UI.jsx';
import { getStateTsa } from '../../data/stateTsa.js';
import { Row, StateLinkRow, LEADERSHIP_ROLES } from './resourcesShared.jsx';

import facebookIcon from '../../assets/img/social-media/facebook.png';
import instagramIcon from '../../assets/img/social-media/instagram.png';
import storeIcon from '../../assets/img/store.png';
import tsaLeadership from '../../assets/img/tsa-leadership.png';


// ---------------------------------------------------------------------------
// Static config. Fill any null URLs with real TSA sources later — every row on
// the page reads from these arrays, nothing is hardcoded inside the JSX.
// ---------------------------------------------------------------------------

// Inline YouTube logo (red) so we don't need a separate downloaded asset.
const YOUTUBE_SVG =
    '<path fill="#FF0000" d="M23 12s0-3.2-.4-4.7a2.5 2.5 0 0 0-1.7-1.7C19.3 5.2 12 5.2 12 5.2s-7.3 0-8.9.4A2.5 2.5 0 0 0 1.4 7.3C1 8.8 1 12 1 12s0 3.2.4 4.7a2.5 2.5 0 0 0 1.7 1.7c1.6.4 8.9.4 8.9.4s7.3 0 8.9-.4a2.5 2.5 0 0 0 1.7-1.7C23 15.2 23 12 23 12z"/>' +
    '<path fill="#fff" d="M9.8 15.3V8.7l6 3.3-6 3.3z"/>';

// Official TSA documents. Add real URLs later — kept here in one place.
const OFFICIAL_DOCS = [
    { icon: 'file-text', title: 'Competitive Events Guide', desc: 'Official event rules and requirements', url: null },
    { icon: 'book', title: 'General Competition Rules', desc: 'Rules that apply across all competitive events', url: null },
    { icon: 'calendar', title: 'Conference Information', desc: 'Conference policies, schedules, and official updates', url: null },
];

// National TSA — official website, socials, and store.
const NATIONAL_TSA = [
    { icon: 'globe', iconColor: 'var(--ig-blue)', title: 'Official TSA Website', desc: 'National programs, competitions, membership, and announcements.', url: 'https://tsaweb.org/' },
    { img: instagramIcon, title: 'Official TSA Instagram', desc: 'National event highlights, news, and student stories.', url: 'https://www.instagram.com/nationaltsa' },
    { img: facebookIcon, title: 'Official TSA Facebook', desc: 'Organization updates, photos, and community news.', url: 'https://www.facebook.com/tobor.cooper' },
    { svg: YOUTUBE_SVG, title: 'Official TSA YouTube', desc: 'Videos, conference highlights, and organization content.', url: 'https://youtube.com/@national_tsa' },
];

// The two leadership navigation cards (each links to its own dedicated page).
const LEADERSHIP_NAV = [
    {
        icon: 'help',
        title: 'Student Leadership',
        desc: 'Meet state and national student officers.',
        to: '/resources/student-leadership',
    },
    {
        img: tsaLeadership,
        title: 'TSA Leadership & Support',
        desc: 'Find advisors, national leaders, and official contacts.',
        to: '/resources/leadership-support',
    },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function Resources() {
    const { profile } = useApp();
    const state = profile?.state;
    const stateInfo = getStateTsa(state);

    // State section shows only the plain (non-leadership) links: website + socials.
    const stateSectionLinks = (stateInfo?.links || []).filter((l) => !LEADERSHIP_ROLES.has(l.role));

    return (
        <>
            <div className="section">
                <h1>TSA Guide</h1>
                <p className="muted small" style={{ margin: 0 }}>
                    Get quick answers, understand the rules, and find official TSA information.
                </p>
            </div>

            {/* OFFICIAL DOCUMENTS --------------------------------------------- */}
            <div className="rs-group-label">Official documents</div>
            <div className="rs-card">
                {OFFICIAL_DOCS.map((doc) => (
                    <Row key={doc.title} icon={doc.icon} title={doc.title} desc={doc.desc} href={doc.url} />
                ))}
            </div>

            {/* {STATE} TSA ---------------------------------------------------- */}
            {stateSectionLinks.length > 0 && (
                <>
                    <div className="rs-group-label">{stateInfo?.name || 'Your state'}</div>
                    <div className="rs-card">
                        {stateSectionLinks.map((link) => (
                            <StateLinkRow key={link.title} link={link} onOpenContact={() => {}} />
                        ))}
                    </div>
                </>
            )}

            {/* NATIONAL TSA --------------------------------------------------- */}
            <div className="rs-group-label">National TSA</div>
            <div className="rs-card">
                {NATIONAL_TSA.map((row) => (
                    <Row
                        key={row.title}
                        icon={row.icon}
                        img={row.img}
                        svg={row.svg}
                        iconColor={row.iconColor}
                        title={row.title}
                        desc={row.desc}
                        href={row.url}
                    />
                ))}
            </div>

            {/* TSA STORE ------------------------------------------------------ */}
            <div className="rs-group-label">TSA Store</div>
            <div className="rs-card">
                <Row
                    img={storeIcon}
                    title="Official TSA Store"
                    desc="Shop official TSA apparel, competition attire, accessories, and merchandise."
                    href="https://tsastore.mybrightsites.com/"
                />
            </div>

            {/* LEADERSHIP & CONTACTS (two nav cards -> dedicated pages) ------- */}
            <div className="rs-group-label">Leadership &amp; Contacts</div>
            <div className="rs-card">
                {LEADERSHIP_NAV.map((item) => (
                    <Link key={item.to} to={item.to} className="rs-row">
                        <span className="rs-ico">
                            {item.img
                                ? <img src={item.img} alt="" width={20} height={20} className="rs-ico-img" />
                                : <Icon name={item.icon} size={20} />}
                        </span>
                        <span className="rs-text">
                            <span className="rs-title">{item.title}</span>
                            <span className="rs-desc">{item.desc}</span>
                        </span>
                        <Icon name="chevron-right" size={18} />
                    </Link>
                ))}
            </div>
        </>
    );
}