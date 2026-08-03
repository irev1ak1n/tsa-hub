import { useLayoutEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext.jsx';
import { Icon } from '../../components/UI.jsx';
import { getStateTsa, US_STATES, STATE_DIRECTORY_URL } from '../../data/stateTsa.js';
import { COMPETITION_RULES } from '../../data/competitionRules.js';
import { ABOUT_TSA } from '../../data/aboutTsa.js';
import { NATIONAL_CONFERENCE } from '../../data/nationalConference.js';
import { PROGRAMS } from '../../data/programs.js';
import { Row, StateLinkRow, ContactModal, LEADERSHIP_ROLES } from './resourcesShared.jsx';

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

// National Conference section: a normal link row + an accordion (Conference
// Essentials) whose children reveal nested topic rows. Data-driven from
// NATIONAL_CONFERENCE.items.
function NationalConferenceSection() {
    // Persist which dropdown is open across navigation (and tab reloads), so it
    // stays open when the user returns from a topic page until they close it.
    const [openId, setOpenId] = useState(() => {
        try {
            return sessionStorage.getItem('rs-conf-open') || null;
        } catch {
            return null;
        }
    });

    const toggle = (id) => {
        setOpenId((cur) => {
            const next = cur === id ? null : id;
            try {
                if (next) sessionStorage.setItem('rs-conf-open', next);
                else sessionStorage.removeItem('rs-conf-open');
            } catch {
                // ignore storage errors
            }
            return next;
        });
    };

    return (
        <>
            <div className="rs-group-label">{NATIONAL_CONFERENCE.title}</div>
            <div className="rs-card">
                {NATIONAL_CONFERENCE.items.map((item) => {
                    if (item.type === 'link') {
                        return (
                            <Link key={item.id} to={item.route} className="rs-row">
                                <span className="rs-ico"><Icon name={item.icon} size={20} /></span>
                                <span className="rs-text">
                                    <span className="rs-title">{item.title}</span>
                                </span>
                                <Icon name="chevron-right" size={18} />
                            </Link>
                        );
                    }

                    // dropdown / accordion
                    const isOpen = openId === item.id;
                    const panelId = `acc-panel-${item.id}`;
                    return (
                        <div key={item.id}>
                            <button
                                type="button"
                                className="rs-acc-btn"
                                aria-expanded={isOpen}
                                aria-controls={panelId}
                                onClick={() => toggle(item.id)}
                            >
                                <span className="rs-ico"><Icon name={item.icon} size={20} /></span>
                                <span className="rs-text">
                                    <span className="rs-title">{item.title}</span>
                                </span>
                                <span className="rs-acc-chevron"><Icon name="chevron-right" size={18} /></span>
                            </button>

                            <div id={panelId} className={`rs-acc-panel${isOpen ? ' is-open' : ''}`} role="region">
                                <div className="rs-acc-inner">
                                    {item.children.map((child) => (
                                        <Link key={child.id} to={child.route} className="rs-subrow">
                                            <span className="rs-sub-ico"><Icon name="file-text" size={17} /></span>
                                            <span className="rs-sub-title">{child.title}</span>
                                            {child.status && <span className="rs-status-badge">{child.status}</span>}
                                            <Icon name="chevron-right" size={16} />
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </>
    );
}

export default function Resources() {
    const { prefs, setStatePref } = useApp();
    const state = prefs?.state;
    const stateInfo = getStateTsa(state);

    const [query, setQuery] = useState('');
    const [showPicker, setShowPicker] = useState(false);
    const [contact, setContact] = useState(null); // { title, contact }
    const q = query.trim().toLowerCase();

    // Remember where the user was on this page. When they open a sub-page and
    // come back, restore the scroll position instead of jumping to the top.
    useLayoutEffect(() => {
        let saved = 0;
        try { saved = parseInt(sessionStorage.getItem('rs-scroll') || '0', 10) || 0; } catch { /* ignore */ }
        if (saved) window.scrollTo(0, saved);

        const onScroll = () => {
            try { sessionStorage.setItem('rs-scroll', String(Math.round(window.scrollY))); } catch { /* ignore */ }
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const openContact = (title, c) => setContact({ title, contact: c });

    // State section: plain links (website + socials) shown under "Your State".
    // Advisor and officer-team links live on their dedicated leadership pages.
    const stateSocials = (stateInfo?.links || []).filter((l) => !LEADERSHIP_ROLES.has(l.role));

    // Filter competition-rule categories by title/description + their topic titles.
    const rules = q
        ? COMPETITION_RULES.filter((cat) => {
            const inCat = `${cat.title} ${cat.description || ''}`.toLowerCase().includes(q);
            const inTopics = (cat.topics || []).some((t) =>
                `${t.title} ${t.description || ''}`.toLowerCase().includes(q)
            );
            return inCat || inTopics;
        })
        : COMPETITION_RULES;

    return (
        <>
            <div className="section">
                <div className="rs-eyebrow">TSA Guide</div>
                <h1 className="rs-h1">Resources</h1>
                <p className="rs-sub">Get quick answers, understand the rules, and find official TSA information.</p>
            </div>

            {/* SEARCH --------------------------------------------------------- */}
            <div className="rs-search">
                <Icon name="search" size={18} />
                <input
                    type="text"
                    className="rs-search-input"
                    placeholder="Search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    aria-label="Search resources"
                />
                {query && (
                    <button type="button" className="rs-search-clear" onClick={() => setQuery('')} aria-label="Clear search">
                        <Icon name="x" size={16} />
                    </button>
                )}
            </div>

            {/* ABOUT TSA ------------------------------------------------------ */}
            <div className="rs-group-label">About TSA</div>
            <div className="rs-card">
                {ABOUT_TSA.map((p) => (
                    <Link key={p.id} to={`/resources/about/${p.id}`} className="rs-row">
                        <span className="rs-ico"><Icon name={p.icon} size={20} /></span>
                        <span className="rs-text">
                            <span className="rs-title">{p.title}</span>
                        </span>
                        <Icon name="chevron-right" size={18} />
                    </Link>
                ))}
            </div>

            {/* NATIONAL CONFERENCE -------------------------------------------- */}
            <NationalConferenceSection />

            {/* COMPETITION RULES & PREPARATION -------------------------------- */}
            <div className="rs-group-label">Competition Rules &amp; Preparation</div>
            {rules.length > 0 ? (
                <div className="rs-card">
                    {rules.map((cat) => (
                        <Link key={cat.id} to={`/resources/competition-rules/${cat.id}`} className="rs-row">
                            <span className="rs-ico"><Icon name={cat.icon} size={20} /></span>
                            <span className="rs-text">
                                <span className="rs-title">{cat.title}</span>
                            </span>
                            <Icon name="chevron-right" size={18} />
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="rs-card">
                    <span className="rs-row is-disabled" aria-disabled="true">
                        <span className="rs-text">
                            <span className="rs-desc">No rules match "{query}".</span>
                        </span>
                    </span>
                </div>
            )}

            {/* PROGRAMS & INITIATIVES ----------------------------------------- */}
            <div className="rs-group-label">Programs &amp; Initiatives</div>
            <div className="rs-card">
                {PROGRAMS.map((p) => (
                    <Link key={p.id} to={`/resources/programs/${p.id}`} className="rs-row">
                        <span className="rs-ico"><Icon name={p.icon} size={20} /></span>
                        <span className="rs-text">
                            <span className="rs-title">{p.title}</span>
                        </span>
                        <Icon name="chevron-right" size={18} />
                    </Link>
                ))}
            </div>

            {/* YOUR STATE ---------------------------------------------------- */}
            <div className="rs-group-label">{state ? (stateInfo?.name || `${state} TSA`) : 'Your State'}</div>
            <div className="rs-card">
                {!state ? (
                    <div className="rs-state-prompt">
                        <p className="rs-state-prompt-text">
                            Want to see more content for your state? Set your state and get access to more resources.
                        </p>
                        <button type="button" className="rs-state-btn" onClick={() => setShowPicker(true)}>
                            <Icon name="globe" size={18} />
                            Set your state
                        </button>
                    </div>
                ) : (
                    <>
                        {stateSocials.length > 0 ? (
                            stateSocials.map((link) => (
                                <StateLinkRow key={link.title} link={link} onOpenContact={openContact} />
                            ))
                        ) : (
                            <div className="rs-state-prompt">
                                <p className="rs-state-prompt-text">
                                    We don&rsquo;t have {state} resources yet. In the meantime, browse the national
                                    directory of state delegations.
                                </p>
                                <a className="rs-row" href={STATE_DIRECTORY_URL} target="_blank" rel="noreferrer">
                                    <span className="rs-ico"><Icon name="globe" size={20} /></span>
                                    <span className="rs-text"><span className="rs-title">State Delegations Directory</span></span>
                                    <Icon name="chevron-right" size={18} />
                                </a>
                            </div>
                        )}
                        <button type="button" className="rs-change-state" onClick={() => setShowPicker(true)}>
                            Change state
                        </button>
                    </>
                )}
            </div>

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

            {showPicker && (
                <StatePicker
                    current={state}
                    onPick={(s) => { setStatePref(s); setShowPicker(false); }}
                    onClose={() => setShowPicker(false)}
                />
            )}
            {contact && (
                <ContactModal title={contact.title} contact={contact.contact} onClose={() => setContact(null)} />
            )}
        </>
    );
}

// Modal state picker: a searchable list of states (not a native dropdown).
function StatePicker({ current, onPick, onClose }) {
    const [q, setQ] = useState('');
    const needle = q.trim().toLowerCase();
    const list = needle ? US_STATES.filter((s) => s.toLowerCase().includes(needle)) : US_STATES;

    return (
        <div className="rs-modal-backdrop" onClick={onClose}>
            <div
                className="rs-modal rs-state-modal"
                role="dialog"
                aria-modal="true"
                aria-label="Choose your state"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="rs-modal-head">
                    <h3>Choose your state</h3>
                    <button type="button" className="rs-modal-close" onClick={onClose} aria-label="Close">×</button>
                </div>

                <div className="rs-state-search">
                    <Icon name="search" size={16} />
                    <input
                        className="rs-state-search-input"
                        placeholder="Search states"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        aria-label="Search states"
                        autoFocus
                    />
                </div>

                <div className="rs-state-list">
                    {list.map((s) => (
                        <button
                            key={s}
                            type="button"
                            className={`rs-state-option ${s === current ? 'is-current' : ''}`}
                            onClick={() => onPick(s)}
                        >
                            <span className="rs-state-option-name">{s}</span>
                            {getStateTsa(s) && <span className="rs-state-has">Content</span>}
                            {s === current && <Icon name="check" size={16} />}
                        </button>
                    ))}
                    {list.length === 0 && <p className="rs-state-empty">No states match &ldquo;{q}&rdquo;.</p>}
                </div>
            </div>
        </div>
    );
}