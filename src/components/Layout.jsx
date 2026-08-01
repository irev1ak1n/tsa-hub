import { NavLink, Outlet, Link, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { Icon, TabBadge } from './UI.jsx';

const TABS = [
    { to: '/', label: 'Home', icon: 'home', end: true },
    { to: '/events', label: 'Events', icon: 'grid' },
    { to: '/calendar', label: 'Calendar', icon: 'cal' },
    { to: '/resources', label: 'Resources', icon: 'book' },
    { to: '/profile', label: 'Profile', icon: 'user' },
];

function Wordmark() {
    return (
        <Link to="/" className="wordmark">
            TSA <span className="mark">HUB</span>
        </Link>
    );
}

function Tabs({ unread }) {
    return (
        <nav className="tabbar" aria-label="Main">
            {TABS.map((t) => (
                <NavLink key={t.to} to={t.to} end={t.end} className={({ isActive }) => (isActive ? 'active' : '')}>
          <span className="tab-ico">
            <Icon name={t.icon} size={21} />
              {t.badge && <TabBadge count={unread} />}
          </span>
                    <span>{t.label}</span>
                </NavLink>
            ))}
        </nav>
    );
}

export default function Layout() {
    const { profile, unreadTotal } = useApp();
    const { pathname } = useLocation();
    const who = profile
        ? `${[profile.first_name, profile.last_name].filter(Boolean).join(' ')} · ${profile.division} · ${profile.state}`
        : 'TSA Hub';

    const hideMobileTabs = ['/settings'].some((r) => pathname === r || pathname.startsWith(r + '/'));

    return (
        <div className="shell">
            <aside className="rail">
                <Wordmark />
                <Tabs unread={unreadTotal} />
            </aside>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <main className="content">
                    <Outlet />
                </main>
            </div>

            {!hideMobileTabs && (
                <div className="mobile-tabs-holder">
                    <MobileTabs unread={unreadTotal} />
                </div>
            )}
        </div>
    );
}

function MobileTabs({ unread }) {
    return (
        <div className="only-mobile">
            <Tabs unread={unread} />
        </div>
    );
}