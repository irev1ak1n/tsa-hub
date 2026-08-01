import { useState, useEffect } from 'react';
import { BackLink } from '../resources/resourcesShared.jsx';
import { Icon } from '../../components/UI.jsx';
import { CONFERENCE_2026 as C } from '../../data/conference2026.js';

// Smooth-scroll to a section by id.
function scrollToId(id) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Section header: red number + blue title, with an anchor id.
function SectionHead({ num, id, title }) {
    return (
        <div className="cf26-head" id={id}>
            <span className="cf26-num">{num}</span>
            <h2 className="cf26-title">{title}</h2>
        </div>
    );
}

function BackToContents() {
    return (
        <button type="button" className="cf26-back-toc" onClick={() => scrollToId('toc')}>
            Back to Contents
        </button>
    );
}

// Small helper renderers -------------------------------------------------------

function TextBlocks({ items }) {
    return (items || []).map((t, i) => <p key={i} className="aw-intro">{t}</p>);
}

function BulletList({ items, className = 'rk-list' }) {
    if (!items || items.length === 0) return null;
    return (
        <ul className={className}>
            {items.map((x, i) => <li key={i} className="rk-list-item">{x}</li>)}
        </ul>
    );
}

// Floating "Contents" button + bottom sheet ------------------------------------
function ContentsFab() {
    const [show, setShow] = useState(false);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const onScroll = () => {
            const toc = document.getElementById('toc');
            if (!toc) return;
            setShow(toc.getBoundingClientRect().bottom < 0);
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    if (!show) return null;

    return (
        <>
            <button type="button" className="cf26-fab" onClick={() => setOpen(true)} aria-label="Open contents">
                <Icon name="menu" size={18} />
                <span>Contents</span>
            </button>

            {open && (
                <div className="cf26-sheet-backdrop" onClick={() => setOpen(false)}>
                    <div className="cf26-sheet" role="dialog" aria-label="Contents" onClick={(e) => e.stopPropagation()}>
                        <div className="cf26-sheet-head">
                            <h3>Contents</h3>
                            <button type="button" className="rs-modal-close" onClick={() => setOpen(false)} aria-label="Close">×</button>
                        </div>
                        <div className="cf26-sheet-body">
                            {C.toc.map((t) => (
                                <button
                                    key={t.id}
                                    type="button"
                                    className="cf26-toc-row"
                                    onClick={() => { setOpen(false); scrollToId(t.id); }}
                                >
                                    <span className="cf26-toc-num">{t.num}</span>
                                    <span className="cf26-toc-title">{t.title}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

// =============================================================================
export default function Conference2026() {
    return (
        <div className="aw-page cf26">
            <BackLink to="/resources/national-conference/guides" label="Back" />

            {/* Header */}
            <div className="section">
                <div className="rs-eyebrow">National Conference Guide</div>
                <h1>2026 National TSA Conference</h1>
                <p className="cf26-meta">
                    {C.dates.label}<br />
                    {C.venue.name}<br />
                    {C.venue.city}, {C.venue.state}
                </p>
                <div className="cf26-theme">Theme: {C.theme}</div>
                <p className="aw-intro" style={{ marginTop: 12 }}>{C.intro}</p>
            </div>

            {/* Table of Contents */}
            <div id="toc" className="cf26-toc">
                <div className="rs-group-label" style={{ marginTop: 0 }}>Contents</div>
                {C.toc.map((t) => (
                    <button key={t.id} type="button" className="cf26-toc-row" onClick={() => scrollToId(t.id)}>
                        <span className="cf26-toc-num">{t.num}</span>
                        <span className="cf26-toc-title">{t.title}</span>
                        <Icon name="chevron-right" size={16} />
                    </button>
                ))}
            </div>

            {/* 01 Overview */}
            <SectionHead num="01" id="overview" title="Conference Overview" />
            <TextBlocks items={C.overview.text} />
            <div className="rs-group-label">National TSA Officer Team</div>
            <div className="cf26-officers">
                {C.overview.officers.map((o) => (
                    <div key={o.role} className="cf26-officer">
                        <div className="cf26-officer-role">{o.role}</div>
                        <div className="cf26-officer-name">{o.name}</div>
                        <div className="cf26-officer-sub">{o.school}</div>
                        <div className="cf26-officer-sub">{o.location}</div>
                    </div>
                ))}
            </div>
            <BackToContents />

            {/* 02 Attendee Services */}
            <SectionHead num="02" id="services" title="Attendee Services" />
            <p className="aw-intro">{C.services.intro}</p>
            {C.services.items.map((s) => (
                <div key={s.name} className="rk-scholar">
                    <h3 className="rk-scholar-title">{s.name}</h3>
                    {s.text && <p className="rk-scholar-text">{s.text}</p>}
                    <BulletList items={s.hours} />
                    <BulletList items={s.list} />
                    {s.note && <p className="aw-note">{s.note}</p>}
                </div>
            ))}
            <BackToContents />

            {/* 03 Conference Activities */}
            <SectionHead num="03" id="activities" title="Conference Activities" />
            {C.activities.map((a) => (
                <div key={a.name} className="rk-scholar">
                    <h3 className="rk-scholar-title">{a.name}</h3>
                    {a.text && <p className="rk-scholar-text">{a.text}</p>}
                    <BulletList items={a.schedule} />
                    <BulletList items={a.list} />
                </div>
            ))}
            <BackToContents />

            {/* 04 Safety and Transportation */}
            <SectionHead num="04" id="safety" title="Safety and Transportation" />
            <div className="rk-scholar">
                <h3 className="rk-scholar-title">Emergency Planning</h3>
                <p className="rk-scholar-text">{C.safety.emergencyPlanning.text}</p>
                <BulletList items={C.safety.emergencyPlanning.reminders} />
            </div>
            <div className="rk-scholar">
                <h3 className="rk-scholar-title">Gaylord Emergency Contacts</h3>
                <BulletList items={C.safety.gaylordContacts} />
            </div>
            <div className="rk-scholar">
                <h3 className="rk-scholar-title">Local Services</h3>
                <BulletList items={C.safety.localServices} />
            </div>
            <div className="rk-scholar">
                <h3 className="rk-scholar-title">Complimentary TSA Shuttles</h3>
                <p className="rk-scholar-text">{C.safety.shuttles.text}</p>
                <div className="cf26-sub-label">Participating hotels</div>
                <BulletList items={C.safety.shuttles.hotels} />
                <div className="cf26-sub-label">Service hours</div>
                <BulletList items={C.safety.shuttles.hours} />
            </div>
            <div className="rk-scholar">
                <h3 className="rk-scholar-title">National Harbor Circulator</h3>
                <div className="cf26-sub-label">Stops</div>
                <BulletList items={C.safety.circulator.stops} />
                <div className="cf26-sub-label">Hours</div>
                <BulletList items={C.safety.circulator.hours} />
                <p className="rk-scholar-text" style={{ marginTop: 8 }}>{C.safety.circulator.cost}</p>
            </div>
            <div className="rk-scholar">
                <h3 className="rk-scholar-title">Other Transportation</h3>
                <BulletList items={C.safety.otherTransport} />
            </div>
            <BackToContents />

            {/* 05 General Sessions */}
            <SectionHead num="05" id="general-sessions" title="General Sessions" />
            <p className="aw-intro">{C.generalSessions.intro}</p>
            {C.generalSessions.sessions.map((s) => (
                <div key={s.name} className="rk-scholar">
                    <h3 className="rk-scholar-title">{s.name}</h3>
                    <p className="cf26-session-meta">{s.date} · {s.time}</p>
                    <p className="cf26-session-meta">{s.doors}</p>
                    <p className="rk-scholar-text" style={{ marginTop: 6 }}>{s.description}</p>
                </div>
            ))}
            <div className="rk-callout">
                <span className="rk-callout-ico"><Icon name="info" size={18} /></span>
                <span className="rk-callout-text">{C.generalSessions.notice}</span>
            </div>
            <BackToContents />

            {/* 06 Competitive Events */}
            <SectionHead num="06" id="competitions" title="Competitive Events" />
            {C.competitions.requirements.map((r) => (
                <div key={r.heading} className="rk-scholar">
                    <h3 className="rk-scholar-title">{r.heading}</h3>
                    {r.text && <p className="rk-scholar-text">{r.text}</p>}
                    <BulletList items={r.list} />
                </div>
            ))}
            {C.competitions.schedules.length === 0 && (
                <p className="aw-note">Event schedules will be added from the official program.</p>
            )}
            <BackToContents />

            {/* 07 Leadership and Elections */}
            <SectionHead num="07" id="leadership" title="Leadership and Elections" />
            <div className="rk-scholar">
                <h3 className="rk-scholar-title">Officer Elections</h3>
                <p className="rk-scholar-text">{C.leadership.elections.text}</p>
                <div className="cf26-sub-label">Voting delegates must</div>
                <BulletList items={C.leadership.elections.list} />
            </div>
            <div className="rk-scholar">
                <h3 className="rk-scholar-title">Candidate Campaign</h3>
                <p className="rk-scholar-text">{C.leadership.campaign}</p>
            </div>
            <div className="rk-scholar">
                <h3 className="rk-scholar-title">Resolutions</h3>
                <p className="rk-scholar-text">{C.leadership.resolutions}</p>
            </div>
            {C.leadership.candidates.every((c) => c.names.length === 0) && (
                <p className="aw-note">National officer candidate names will be added from the official program.</p>
            )}
            <BackToContents />

            {/* 08 Workshops and Special Sessions */}
            <SectionHead num="08" id="workshops" title="Workshops and Special Sessions" />
            {C.workshops.length === 0 && C.specialSessions.length === 0 && (
                <p className="aw-note">Workshops and special sessions will be added from the official program.</p>
            )}
            <BackToContents />

            {/* 09 Delegations and Schedules */}
            <SectionHead num="09" id="delegations" title="Delegations and Schedules" />
            {C.delegationMeetings.length === 0 && C.dailyProgram.length === 0 && (
                <p className="aw-note">Delegation meetings, photo times, and the daily program will be added from the official program.</p>
            )}
            <BackToContents />

            {/* 10 Recognition and Awards */}
            <SectionHead num="10" id="recognition" title="Recognition and Awards" />
            <p className="aw-intro">{C.recognition.intro}</p>
            <div className="rk-scholar">
                <h3 className="rk-scholar-title">Forward to Fifty Recognition</h3>
                <p className="rk-scholar-text">{C.recognition.forwardToFifty.text}</p>
                <div className="cf26-sub-label">Recognized delegations</div>
                <BulletList items={C.recognition.forwardToFifty.delegations} />
            </div>
            <div className="rk-scholar">
                <h3 className="rk-scholar-title">Chapter Membership Milestones</h3>
                <BulletList items={C.recognition.chapterMilestones} />
            </div>
            {C.recognition.groups.every((g) => g.recipients.length === 0) && (
                <p className="aw-note">Award recipient lists will be added from the official program.</p>
            )}
            <BackToContents />

            {/* 11 Maps and Navigation */}
            <SectionHead num="11" id="maps" title="Maps and Navigation" />
            {C.maps.length === 0 && (
                <p className="aw-note">Convention center maps and floorplans will be added as images.</p>
            )}
            <div className="rk-scholar">
                <h3 className="rk-scholar-title">Hotel Wayfinding</h3>
                <p className="rk-scholar-text">{C.wayfinding}</p>
            </div>
            <BackToContents />

            {/* 2027 preview */}
            <div className="cf26-preview">
                <div className="cf26-preview-eyebrow">Next year</div>
                <div className="cf26-preview-title">{C.preview2027.title}</div>
                <div className="cf26-preview-meta">Theme: {C.preview2027.theme}</div>
                <div className="cf26-preview-meta">{C.preview2027.dates}</div>
                <div className="cf26-preview-meta">{C.preview2027.location}</div>
                <p className="rk-scholar-text" style={{ marginTop: 8 }}>{C.preview2027.text}</p>
            </div>

            {/* Official Sources */}
            <div className="cf26-sources">
                <div className="cf26-sources-title">Official Sources</div>
                <p className="cf26-sources-text">{C.officialSources.text}</p>
                <div className="cf26-sources-links">
                    {C.officialSources.links.map((l) => (
                        l.url
                            ? <a key={l.title} className="aw-link" href={l.url} target="_blank" rel="noreferrer">{l.title}</a>
                            : <span key={l.title} className="cf26-sources-disabled">{l.title}</span>
                    ))}
                </div>
                <p className="cf26-sources-notice">{C.officialSources.notice}</p>
            </div>

            <ContentsFab />
        </div>
    );
}