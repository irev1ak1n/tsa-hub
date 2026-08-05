import { useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { BackLink } from '../resources/resourcesShared.jsx';
import { getConference2026Topic } from '../../data/conference2026.js';

// National officer photos: src/screens/resources/conference/ -> assets/img/...
const OFFICER_IMAGES = import.meta.glob('../../assets/img/national-officers-2026/*.png', { eager: true });
const officerImg = {};
for (const path in OFFICER_IMAGES) {
    const file = path.split('/').pop().replace(/\.png$/i, '');
    officerImg[file] = OFFICER_IMAGES[path].default || OFFICER_IMAGES[path];
}

// Strip non-digits for a tel: href.
function telHref(v) {
    return 'tel:' + String(v).replace(/[^\d]/g, '');
}

// A phone/contact value: clickable tel link when `tel` is set.
function ContactValue({ value, tel }) {
    if (tel) return <a className="aw-link" href={telHref(value)}>{value}</a>;
    return <span>{value}</span>;
}

// A collapsible list (show/hide) — used for long lists like overflow hotels.
function Collapsible({ items }) {
    const [open, setOpen] = useState(false);
    const preview = 3;
    const shown = open ? items : items.slice(0, preview);
    return (
        <>
            <ul className="rk-list" style={{ marginTop: 4 }}>
                {shown.map((x, i) => <li key={i} className="rk-list-item">{x}</li>)}
            </ul>
            {items.length > preview && (
                <button type="button" className="cf26-back-toc" onClick={() => setOpen(!open)}>
                    {open ? 'Show less' : `Show all (${items.length})`}
                </button>
            )}
        </>
    );
}

function Section({ sec }) {
    return (
        <div className="cf2026-sec">
            {sec.heading && <h3 className="rk-scholar-title">{sec.heading}</h3>}

            {(sec.paragraphs || []).map((p, i) => <p key={i} className="rk-scholar-text">{p}</p>)}

            {/* plain labelled lines (schedules / hours) */}
            {sec.lines && sec.lines.length > 0 && (
                <div className="cf2026-lines">
                    {sec.lines.map((l, i) => <div key={i} className="cf2026-line">{l}</div>)}
                </div>
            )}

            {/* bullet list (or collapsible) */}
            {sec.list && sec.list.length > 0 && (
                sec.collapsible
                    ? <Collapsible items={sec.list} />
                    : <ul className="rk-list" style={{ marginTop: 6 }}>
                        {sec.list.map((x, i) => <li key={i} className="rk-list-item">{x}</li>)}
                    </ul>
            )}

            {/* contact rows */}
            {sec.contacts && sec.contacts.length > 0 && (
                <div className="cf2026-contacts">
                    {sec.contacts.map((c, i) => (
                        <div key={i} className="cf2026-contact">
                            <span className="cf2026-contact-label">{c.label}</span>
                            <span className="cf2026-contact-val"><ContactValue value={c.value} tel={c.tel} /></span>
                        </div>
                    ))}
                </div>
            )}

            {/* labelled sub-blocks (officers, sessions, addresses) */}
            {sec.items && sec.items.length > 0 && (
                <div className="cf2026-items">
                    {sec.items.map((it, i) => (
                        <div key={i} className="cf2026-item">
                            <div className="cf2026-item-label">{it.label}</div>
                            {(it.meta || []).map((m, j) => <div key={j} className="cf2026-item-meta">{m}</div>)}
                            {it.text && <div className="cf2026-item-text">{it.text}</div>}
                            {it.list && (
                                <ul className="rk-list" style={{ marginTop: 4 }}>
                                    {it.list.map((x, j) => <li key={j} className="rk-list-item">{x}</li>)}
                                </ul>
                            )}
                            {it.contact && (
                                <div className="cf2026-item-contact">
                                    {it.contact.note && <span className="cf2026-contact-label">{it.contact.note}: </span>}
                                    <ContactValue value={it.contact.value} tel={it.contact.tel} />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* national officer team: photo + name + role, 3 across */}
            {sec.officers && sec.officers.length > 0 && (
                <div className="officer-grid">
                    {sec.officers.map((o, i) => (
                        <div key={i} className="officer">
                            {officerImg[o.img] ? (
                                <img className="officer-photo" src={officerImg[o.img]} alt={o.name} />
                            ) : (
                                <div className="officer-photo" aria-hidden="true" />
                            )}
                            <div className="officer-name">{o.name}</div>
                            <div className="officer-role">{o.role}</div>
                        </div>
                    ))}
                </div>
            )}

            {sec.attribution && (
                <div className="cf2026-attrib">
                    <div className="cf2026-attrib-name">{sec.attribution.name}</div>
                    <div className="cf2026-attrib-role">{sec.attribution.role}</div>
                </div>
            )}

            {sec.note && <p className="aw-note">{sec.note}</p>}
        </div>
    );
}

// Shared layout for all eight 2026 topic pages.
export default function ConferenceTopicPage() {
    const { topic } = useParams();
    const data = getConference2026Topic(topic);

    if (!data) return <Navigate to="/resources/national-conference/2026" replace />;

    return (
        <div className="aw-page">
            <BackLink to="/resources/national-conference/2026" label="Back" />

            <div className="section">
                <h1>{data.title}</h1>
            </div>

            {(data.intro || []).map((p, i) => <p key={i} className="aw-intro">{p}</p>)}

            {data.sections.map((sec, i) => <Section key={i} sec={sec} />)}
        </div>
    );
}