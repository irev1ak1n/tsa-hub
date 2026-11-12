import { useEffect, useLayoutEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

// Scroll handling on route changes.
//
// - Opening a new page (link click, navigate) starts at the very top, because
//   React Router never resets scroll on its own.
// - Going Back or Forward returns to the exact position the page was left at.
//   Positions are remembered per history entry (location.key), so the same
//   page opened twice keeps separate positions. They are kept for the browser
//   session only.
// - A URL with a hash is an explicit anchor target (for example
//   /resources#your-state) and is handled by the page itself, so it is left
//   alone.
//
// Mounted once in Layout.jsx above <Outlet>.

const STORAGE_KEY = 'tsa-hub-scroll-positions-v1';
const MAX_ENTRIES = 80;

const positions = new Map();
try {
    const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '[]');
    for (const [k, v] of saved) positions.set(k, v);
} catch { /* storage unavailable, memory only */ }

function remember(key, y) {
    positions.delete(key);
    positions.set(key, y);
    while (positions.size > MAX_ENTRIES) positions.delete(positions.keys().next().value);
}

function persist() {
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...positions])); } catch { /* ignore */ }
}

try { window.history.scrollRestoration = 'manual'; } catch { /* ignore */ }

// Pages often fill in after the route changes (events load, lists render), so
// the page may be too short at first to reach the saved position. Keep trying
// briefly until it can, or give up quietly if the user scrolls themselves.
function restoreWhenReady(y) {
    let frames = 0;
    let cancelled = false;
    const stop = () => { cancelled = true; };
    window.addEventListener('wheel', stop, { once: true, passive: true });
    window.addEventListener('touchstart', stop, { once: true, passive: true });

    const step = () => {
        if (cancelled) return;
        window.scrollTo(0, y);
        const reached = Math.abs(window.scrollY - y) < 2;
        if (reached || ++frames > 60) {
            window.removeEventListener('wheel', stop);
            window.removeEventListener('touchstart', stop);
            return;
        }
        requestAnimationFrame(step);
    };
    step();
}

export default function ScrollToTop() {
    const { pathname, hash, key } = useLocation();
    const navType = useNavigationType();

    // Track where the user is on the current history entry.
    useEffect(() => {
        const onScroll = () => remember(key, window.scrollY);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => {
            window.removeEventListener('scroll', onScroll);
            persist();
        };
    }, [key]);

    useLayoutEffect(() => {
        if (hash) return;
        const saved = navType === 'POP' ? positions.get(key) : undefined;
        if (saved != null && saved > 0) restoreWhenReady(saved);
        else window.scrollTo(0, 0);
    }, [pathname, hash, key, navType]);

    return null;
}
