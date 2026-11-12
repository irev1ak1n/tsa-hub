import { useLayoutEffect } from 'react';
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

const MAX_ENTRIES = 80;

// Memory only: positions are per history entry for the current page load.
const positions = new Map();

function remember(key, y) {
    positions.delete(key);
    positions.set(key, y);
    while (positions.size > MAX_ENTRIES) positions.delete(positions.keys().next().value);
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
    // A layout effect, so the old page's listener is removed in the same commit
    // that swaps the page. Otherwise the scroll jump caused by the new page
    // would be recorded as the old page's position.
    useLayoutEffect(() => {
        const onScroll = () => remember(key, window.scrollY);
        window.addEventListener('scroll', onScroll, { passive: true });
        // Scroll events arrive a frame late, so also note the exact position at
        // the moment of a tap or click, which is what starts most navigations.
        document.addEventListener('click', onScroll, true);
        return () => {
            window.removeEventListener('scroll', onScroll);
            document.removeEventListener('click', onScroll, true);
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
