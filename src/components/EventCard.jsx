import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { teamSizeLabel } from '../data/events.js';
import { Icon } from './UI.jsx';

export default function EventCard({ event: e, added, onAdd, onRemove }) {
    const [expanded, setExpanded] = useState(false);
    const [overflows, setOverflows] = useState(false);
    const textRef = useRef(null);

    useEffect(() => {
        const el = textRef.current;
        if (!el) return;
        setOverflows(el.scrollHeight - el.clientHeight > 2);
    }, [e.overview]);

    return (
        <div className="event-card">
            <div className="top">
                <h3>
                    <Link to={`/events/${e.id}`}>{e.name}</Link>
                </h3>
                <span className="tag">{e.category.split(' ')[0]}</span>
            </div>
            <div className="meta">
                <span>{e.category}</span>
                {teamSizeLabel(e) && (
                    <>
                        <span>·</span>
                        <span>{teamSizeLabel(e)}</span>
                    </>
                )}
            </div>

            {e.overview && (
                <>
                    <p ref={textRef} className={`event-overview ${expanded ? 'open' : ''}`}>
                        {e.overview}
                    </p>
                    {(overflows || expanded) && (
                        <button className="event-more" onClick={() => setExpanded((v) => !v)}>
                            {expanded ? 'Show less' : 'Show more'}
                        </button>
                    )}
                </>
            )}

            <div className="foot">
                <Link to={`/events/${e.id}`} className="btn ghost small">
                    Details
                </Link>
                {added ? (
                    <button className="btn navy small" onClick={onRemove}>
                        ✓ Added — remove
                    </button>
                ) : (
                    <button className="btn primary small" onClick={onAdd}>
                        <Icon name="plus" size={14} /> My events
                    </button>
                )}
            </div>
        </div>
    );
}