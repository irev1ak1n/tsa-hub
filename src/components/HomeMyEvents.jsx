import { useEffect, useRef, useState } from 'react';
import { Icon } from './UI.jsx';
import { useApp } from '../context/AppContext.jsx';
import { getEvent } from '../data/events.js';
import { useEventImage } from '../data/eventImages.js';
import AddMyEventModal from './AddMyEventModal.jsx';
import EventInfoModal from '../screens/events/EventInfoModal.jsx';

// One saved event's card — reuses the same event data/image resolution as
// the rest of the app (getEvent + useEventImage). Clicking it opens the
// exact same EventInfoModal the Events page uses (via onOpen, passed down
// from HomeMyEvents), never a navigation and never a second modal.
// Removal lives behind a small ••• menu, never a large delete button
// directly on the card.
function MyEventCard({ event, onOpen, onRemove }) {
    const img = useEventImage(event);
    const [broken, setBroken] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    useEffect(() => setBroken(false), [img]);
    const showImage = Boolean(img) && !broken;

    return (
        <div className="myev-card">
            <button type="button" className="myev-card-media" onClick={onOpen}>
                {showImage ? (
                    <img className="myev-card-img" src={img} alt="" loading="lazy" onError={() => setBroken(true)} />
                ) : (
                    <div className="myev-card-img myev-card-fallback" aria-hidden="true" />
                )}
                <span className="ev-tile-badge">{event.division}</span>
                <span className="ev-tile-name myev-card-name">
                    {event.name}
                    {event.category && <span className="myev-card-category">{event.category}</span>}
                </span>
            </button>

            <button
                type="button"
                className="myev-card-menu-btn"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMenuOpen((m) => !m); }}
                aria-label={`Options for ${event.name}`}
                aria-expanded={menuOpen}
            >
                •••
            </button>

            {menuOpen && (
                <>
                    <div className="myev-card-menu-backdrop" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMenuOpen(false); }} />
                    <div className="myev-card-menu" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                        <button type="button" onClick={() => { setMenuOpen(false); onRemove(); }}>
                            Remove
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}

// Bootstrap-style centered carousel — one card active/large at a time, its
// immediate neighbors peeking in smaller on either side. Slide order is
// simply [...savedEvents, AddCard], which already gives the required
// layouts for free from myEvents' own natural append order:
//   0 saved  -> [Add]                          (Add alone, centered)
//   1 saved  -> [Event, Add]                   (Event active, Add to its right)
//   2 saved  -> [Older, Newest, Add]            (Newest active, Older to its left)
//   3+ saved -> [..., Previous, Newest, Add]    (same pattern, just longer)
// The only behavior that needs explicit code (rather than falling out of
// that ordering) is: after adding an event, jump the carousel to that new
// event so it becomes active immediately, instead of leaving Add focused.
export default function HomeMyEvents() {
    const { myEvents, removeEvent } = useApp();
    const [addOpen, setAddOpen] = useState(false);
    const [openEvent, setOpenEvent] = useState(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const trackRef = useRef(null);
    const prevEventCountRef = useRef(null);

    const events = myEvents.map(getEvent).filter(Boolean);
    const slides = [...events.map((e) => ({ kind: 'event', event: e })), { kind: 'add' }];

    function scrollToIndex(i) {
        const track = trackRef.current;
        const el = track?.querySelector(`[data-index="${i}"]`);
        // No explicit `behavior` here — the track's own `scroll-behavior:
        // smooth` (dashboard.css) drives the animation for this 'auto'
        // scroll, which is more reliably honored across browsers than
        // passing `behavior: 'smooth'` directly to scrollIntoView.
        el?.scrollIntoView({ inline: 'center', block: 'nearest' });
    }

    // Tracks which slide is nearest the track's horizontal center — geometry
    // based rather than IntersectionObserver thresholds, which read oddly
    // here because the track's own side padding (used to center a lone
    // slide) counts as "visible" root area. Runs on every scroll frame, so
    // it stays correct for both the arrow buttons, a manual swipe, and the
    // auto-focus-newest-event scroll below.
    useEffect(() => {
        const track = trackRef.current;
        if (!track) return;

        function updateActive() {
            const trackRect = track.getBoundingClientRect();
            const centerX = trackRect.left + trackRect.width / 2;
            let closestIndex = 0;
            let closestDist = Infinity;
            track.querySelectorAll('.myev-slide').forEach((el) => {
                const r = el.getBoundingClientRect();
                const dist = Math.abs(r.left + r.width / 2 - centerX);
                if (dist < closestDist) {
                    closestDist = dist;
                    closestIndex = Number(el.dataset.index);
                }
            });
            setActiveIndex(closestIndex);
        }

        updateActive();
        let raf = null;
        function onScroll() {
            if (raf) cancelAnimationFrame(raf);
            raf = requestAnimationFrame(updateActive);
        }
        track.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', updateActive);
        return () => {
            track.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', updateActive);
            if (raf) cancelAnimationFrame(raf);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [slides.length]);

    // The newest saved event should become the active card the moment it's
    // added — never leave the Add card sitting as "active" afterward. A
    // real net increase in saved-event count (not the initial mount) is
    // exactly "an event was just added": its slide is always the one right
    // before the trailing Add card, at index `events.length - 1`.
    useEffect(() => {
        const prevCount = prevEventCountRef.current;
        prevEventCountRef.current = events.length;
        if (prevCount !== null && events.length > prevCount) {
            const newIndex = events.length - 1;
            // Flip the active class immediately — don't wait on the scroll
            // listener to catch up, since that only happens once the
            // animated scroll actually finishes (and scroll animations can
            // be delayed or skipped entirely by the browser, e.g. for a
            // backgrounded tab). Still kick off the scroll for the visual
            // "slide into place" motion.
            setActiveIndex(newIndex);
            scrollToIndex(newIndex);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [events.length]);

    return (
        <div className="section">
            <div className="section-head">
                <h2>My Events</h2>
            </div>

            <div className={`myev-carousel${events.length === 0 ? ' myev-carousel--empty' : ''}`}>
                <button
                    type="button"
                    className="myev-arrow myev-arrow-left"
                    onClick={() => scrollToIndex(activeIndex - 1)}
                    disabled={activeIndex === 0}
                    aria-label="Previous event"
                >
                    <span style={{ display: 'inline-flex', transform: 'rotate(180deg)' }}>
                        <Icon name="chevron-right" size={18} />
                    </span>
                </button>

                <div className="myev-track" ref={trackRef}>
                    {slides.map((s, i) => (
                        <div
                            key={s.kind === 'add' ? 'add' : s.event.id}
                            data-index={i}
                            className={`myev-slide${i === activeIndex ? ' is-active' : ''}`}
                        >
                            {s.kind === 'add' ? (
                                <button type="button" className="myev-add-card" onClick={() => setAddOpen(true)}>
                                    <span className="myev-add-circle"><Icon name="plus" size={28} /></span>
                                    <span className="myev-add-label">Add Event</span>
                                </button>
                            ) : (
                                <MyEventCard
                                    event={s.event}
                                    onOpen={() => setOpenEvent(s.event)}
                                    onRemove={() => removeEvent(s.event.id)}
                                />
                            )}
                        </div>
                    ))}
                </div>

                <button
                    type="button"
                    className="myev-arrow myev-arrow-right"
                    onClick={() => scrollToIndex(activeIndex + 1)}
                    disabled={activeIndex === slides.length - 1}
                    aria-label="Next event"
                >
                    <Icon name="chevron-right" size={18} />
                </button>
            </div>

            {addOpen && <AddMyEventModal onClose={() => setAddOpen(false)} />}
            {openEvent && <EventInfoModal event={openEvent} onClose={() => setOpenEvent(null)} />}
        </div>
    );
}
