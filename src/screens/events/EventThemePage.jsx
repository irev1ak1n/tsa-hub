import { useParams, Navigate } from 'react-router-dom';
import { Icon } from '../../components/UI.jsx';
import { BackLink } from '../resources/resourcesShared.jsx';
import { getEventTheme } from '../../data/eventThemes.js';

// Icon per resource type
function ResourceIcon({ type }) {
    if (type === 'pdf') return <Icon name="file-text" size={16} />;
    if (type === 'csv') return <Icon name="table" size={16} />;
    if (type === 'pptx') return <Icon name="layout" size={16} />;
    return <Icon name="external-link" size={16} />;
}

function ResourceLabel({ type }) {
    if (type === 'pdf') return 'PDF Document';
    if (type === 'csv') return 'Data File (CSV)';
    if (type === 'pptx') return 'Template (PPTX)';
    return 'External Link';
}

export default function EventThemePage() {
    const { eventId } = useParams();
    const theme = getEventTheme(eventId);

    if (!theme) return <Navigate to="/events" replace />;

    const noTheme = theme.status === 'no-theme';

    return (
        <>
            <BackLink to="/events" label="Back" />

            <div className="section">
                <div className="eyebrow">{theme.division} · {theme.season}</div>
                <h1>{theme.name}</h1>
                <p className="muted small" style={{ margin: 0 }}>Theme &amp; Problem</p>
            </div>

            {noTheme ? (
                <div className="eth-no-theme">
                    <Icon name="calendar" size={22} />
                    <span>No theme or problem has been published by National TSA for the 2026–2027 season.</span>
                </div>
            ) : (
                <div className="eth-body">
                    {/* Theme headline */}
                    {theme.theme && (
                        <div className="eth-theme-badge">{theme.theme}</div>
                    )}

                    {/* Top-level description */}
                    {theme.description && (
                        <p className="eth-desc">{theme.description}</p>
                    )}

                    {/* Topic (Data Science style) */}
                    {theme.topic && (
                        <div className="eth-section">
                            <div className="eth-section-title">Topic</div>
                            <p className="eth-section-body">{theme.topic}</p>
                        </div>
                    )}

                    {/* Problem statement (Cybersecurity style) */}
                    {theme.problemStatement && (
                        <div className="eth-section">
                            <div className="eth-section-title">Problem Statement</div>
                            <p className="eth-section-body">{theme.problemStatement}</p>
                        </div>
                    )}

                    {/* Challenge brief */}
                    {theme.challenge && (
                        <div className="eth-section">
                            <div className="eth-section-title">Challenge</div>
                            <p className="eth-section-body">{theme.challenge}</p>
                        </div>
                    )}

                    {/* Top-level list (topics, colours, etc.) */}
                    {theme.list && theme.list.length > 0 && (
                        <ul className="eth-list">
                            {theme.list.map((item, i) => (
                                <li key={i} className="eth-list-item">{item}</li>
                            ))}
                        </ul>
                    )}

                    {/* Requirements */}
                    {theme.requirements && theme.requirements.length > 0 && (
                        <div className="eth-section">
                            <div className="eth-section-title">Requirements</div>
                            <ul className="eth-list">
                                {theme.requirements.map((r, i) => (
                                    <li key={i} className="eth-list-item">{r}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Named subsections */}
                    {theme.sections && theme.sections.map((s, i) => (
                        <div key={i} className="eth-section">
                            <div className="eth-section-title">{s.heading}</div>
                            {s.content && <p className="eth-section-body">{s.content}</p>}
                            {s.list && s.list.length > 0 && (
                                <ul className="eth-list">
                                    {s.list.map((item, j) => (
                                        <li key={j} className="eth-list-item">{item}</li>
                                    ))}
                                </ul>
                            )}
                            {/* Resources inside a section (e.g. Coding → Scratch downloads) */}
                            {s.resources && s.resources.length > 0 && (
                                <div className="eth-resources">
                                    {s.resources.map((r, k) => (
                                        <a
                                            key={k}
                                            href={r.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="eth-resource-row"
                                        >
                                            <span className="eth-resource-ico"><ResourceIcon type={r.type} /></span>
                                            <span className="eth-resource-text">
                                                <span className="eth-resource-title">{r.title}</span>
                                                <span className="eth-resource-label"><ResourceLabel type={r.type} /></span>
                                            </span>
                                            <Icon name="external-link" size={14} />
                                        </a>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Top-level resources */}
                    {theme.resources && theme.resources.length > 0 && (
                        <div className="eth-section">
                            <div className="eth-section-title">Official Resources</div>
                            <div className="eth-resources">
                                {theme.resources.map((r, i) => (
                                    <a
                                        key={i}
                                        href={r.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="eth-resource-row"
                                    >
                                        <span className="eth-resource-ico"><ResourceIcon type={r.type} /></span>
                                        <span className="eth-resource-text">
                                            <span className="eth-resource-title">{r.title}</span>
                                            <span className="eth-resource-label"><ResourceLabel type={r.type} /></span>
                                        </span>
                                        <Icon name="external-link" size={14} />
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </>
    );
}