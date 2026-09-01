import { useLayoutEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext.jsx';
import { Icon } from '../../components/UI.jsx';
import { getStateTsa, US_STATES, STATE_DIRECTORY_URL } from '../../data/stateTsa.js';
import { COMPETITION_RULES } from '../../data/competitionRules.js';
import { COMPETITION_REQUIREMENTS } from '../../data/competitionRequirements.js';
import { ABOUT_TSA } from '../../data/aboutTsa.js';
import { NATIONAL_CONFERENCE } from '../../data/nationalConference.js';
import { PROGRAMS } from '../../data/programs.js';
import { Row, StateLinkRow, ContactModal, LEADERSHIP_ROLES } from './resourcesShared.jsx';
import { NATIONAL_TSA, LEADERSHIP_NAV } from './resourceSearch.jsx';
import storeIcon from '../../assets/img/store.png';


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

    const [showPicker, setShowPicker] = useState(false);
    const [contact, setContact] = useState(null); // { title, contact }

    // Remember where the user was on this page. When they open a sub-page and
    // come back, restore the scroll position instead of jumping to the top.
    // An explicit navigation target (e.g. /resources#your-state, used by
    // Coach's "View [State] TSA Information" action) must always win over
    // this — arriving with a hash should never get silently overridden by
    // wherever the user happened to be scrolled to last time.
    useLayoutEffect(() => {
        if (window.location.hash) {
            const id = window.location.hash.slice(1);
            const scrollToTarget = () => document.getElementById(id)?.scrollIntoView({ block: 'center' });
            scrollToTarget();
            // A second pass after paint settles (fonts/icons can shift layout
            // slightly right after the initial synchronous scroll) so the
            // section reliably lands on-screen instead of just below the fold.
            requestAnimationFrame(scrollToTarget);
        } else {
            let saved = 0;
            try { saved = parseInt(sessionStorage.getItem('rs-scroll') || '0', 10) || 0; } catch { /* ignore */ }
            if (saved) window.scrollTo(0, saved);
        }

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

    const rules = COMPETITION_RULES;

    return (
        <>
            <div className="section">
                <div className="rs-eyebrow">TSA Guide</div>
                <h1 className="rs-h1">Resources</h1>
                <p className="rs-sub">Get quick answers, understand the rules, and find official TSA information.</p>
            </div>

            {/* SEARCH (opens the dedicated search page) ----------------------- */}
            <Link to="/resources/search" className="rs-search rs-search-trigger" aria-label="Search resources">
                <Icon name="search" size={18} />
                <span className="rs-search-placeholder">Search</span>
            </Link>

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

            {/* EVENTS ----------------------------------------------------------- */}
            <div className="rs-group-label">Events</div>
            <div className="rs-card">
                <Link to="/resources/events/themes" className="rs-row">
                    <span className="rs-ico"><Icon name="file-text" size={20} /></span>
                    <span className="rs-text">
                        <span className="rs-title">Event Guide</span>
                    </span>
                    <Icon name="chevron-right" size={18} />
                </Link>
            </div>

            {/* NATIONAL CONFERENCE -------------------------------------------- */}
            <NationalConferenceSection />

            {/* COMPETITION RULES & PREPARATION -------------------------------- */}
            <div className="rs-group-label">Competition Rules &amp; Preparation</div>
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

            {/* COMPETITION REQUIREMENTS & UPDATES ----------------------------- */}
            <div className="rs-group-label">Competition Requirements &amp; Updates</div>
            <div className="rs-card">
                {COMPETITION_REQUIREMENTS.map((item) => (
                    <Link key={item.id} to={`/resources/competition-requirements/${item.id}`} className="rs-row">
                        <span className="rs-ico"><Icon name={item.icon} size={20} /></span>
                        <span className="rs-text">
                            <span className="rs-title">{item.title}</span>
                        </span>
                        <Icon name="chevron-right" size={18} />
                    </Link>
                ))}
            </div>

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
            <div id="your-state" className="rs-group-label">{state ? (stateInfo?.name || `${state} TSA`) : 'Your State'}</div>
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
                    mono
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
                                ? <img src={item.img} alt="" width={20} height={20} className="rs-ico-img rs-ico-img--mono" />
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
                            {/*{getStateTsa(s) && <span className="rs-state-has">Content</span>}*/}
                            {s === current && <Icon name="check" size={16} />}
                        </button>
                    ))}
                    {list.length === 0 && <p className="rs-state-empty">No states match &ldquo;{q}&rdquo;.</p>}
                </div>
            </div>
        </div>
    );
}