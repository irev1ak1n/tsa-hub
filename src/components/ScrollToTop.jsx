import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Resets the page to the top on every route change, so navigating to a new
// page (Home, Events, Calendar, Resources, Settings, ...) always starts at
// scrollTop 0 instead of wherever the previous page happened to be left
// scrolled — React Router (unlike full page loads) never resets scroll
// position on its own.
//
// Mounted once in Layout.jsx, above <Outlet>, so it applies to every routed
// page without each page needing its own scrollTo(0, 0).
//
// Keyed on pathname alone (not the search string), so in-page filters that
// use query params don't get yanked back to the top on every keystroke.
// Skips the reset when the URL carries a hash — an explicit anchor target
// (e.g. /resources#your-state, used by Coach's "View [State] TSA
// Information" action) means "scroll to this specific section," and that is
// handled by the page itself; this component only owns the "no hash, so
// start at the very top" default.
export default function ScrollToTop() {
    const { pathname, hash } = useLocation();

    useLayoutEffect(() => {
        if (hash) return;
        window.scrollTo(0, 0);
    }, [pathname, hash]);

    return null;
}
