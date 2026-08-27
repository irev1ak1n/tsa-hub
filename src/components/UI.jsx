import { Link } from 'react-router-dom';

const PATHS = {
    home: 'M3 10.5 12 3l9 7.5M5 9.5V21h5v-6h4v6h5V9.5',
    grid: 'M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z',
    spark: 'M12 2v4M12 18v4M2 12h4M18 12h4M5 5l2.8 2.8M16.2 16.2 19 19M19 5l-2.8 2.8M7.8 16.2 5 19M12 8.5 13.2 11l2.6 1-2.6 1L12 15.5 10.8 13l-2.6-1 2.6-1z',
    chat: 'M21 12a8 8 0 0 1-8 8H4l2-3.2A8 8 0 1 1 21 12z',
    'chat-bubble': 'M4 11.5a7.5 7.5 0 1 1 14.6 2.4A7.5 7.5 0 0 1 12 19l-4 1.5 1.3-4.2A7.5 7.5 0 0 1 4 11.5z',
    users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.87M15 3.13a4 4 0 0 1 0 7.75',
    user: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
    plus: 'M12 5v14M5 12h14',
    x: 'M18 6 6 18M6 6l12 12',
    search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3',
    send: 'M22 2 11 13M22 2l-7 20-4-9-9-4z',
    check: 'M20 6 9 17l-5-5',
    trophy: 'M8 21h8M12 17v4M7 4h10v6a5 5 0 0 1-10 0zM7 5H4a1 1 0 0 0-1 1c0 2.5 1.5 4 4 4M17 5h3a1 1 0 0 1 1 1c0 2.5-1.5 4-4 4',
    cal: 'M8 2v4M16 2v4M3 9h18M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z',
    bell: 'M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0',
    book: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15zM4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5',
    funnel: 'M3.6 4.5h16.8a1.1 1.1 0 0 1 .84 1.81L14.6 14.3v5.2a1.1 1.1 0 0 1-.6.98l-3 1.53a1.1 1.1 0 0 1-1.6-.98V14.3L2.76 6.31A1.1 1.1 0 0 1 3.6 4.5z',
    sliders: 'M4 7h6M14 7h6M4 12h10M18 12h2M4 17h3M11 17h9M10 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM16 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM7 21a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
    lock: 'M5 11h14a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2zM7 11V7a5 5 0 0 1 10 0v4',
    'chevron-right': 'm9 18 6-6-6-6',
    'arrow-left': 'M19 12H5M12 19l-7-7 7-7',
    help: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01',
    'question': 'M9 9a3 3 0 1 1 4.5 2.6c-1 .6-1.5 1.2-1.5 2.4M12 18h.01',
    shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
    'file-text': 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8',
    'log-out': 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
    switch: 'M8 3 4 7l4 4M4 7h16M16 21l4-4-4-4M20 17H4',
    info: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 16v-4M12 8h.01',
    globe: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20z',
    accessibility: 'M12 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM19 9l-5.5 1.5L12 21l-1.5-10.5L5 9M9 22l3-8 3 8',
    menu: 'M3 6h18M3 12h18M3 18h18',
    camera: 'M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
    'user-plus': 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM19 8v6M22 11h-6',
    settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z',
    trash: 'M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m3 0-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6h14zM10 11v6M14 11v6',
    edit: 'M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z',
    'circle-check': 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM8 12l3 3 5-6',
    flag: 'M4 15s1-1 4-1 5 2 8 0V3s-1 1-4 1-5-2-8 0v13zM4 22v-7',
    download: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3',
    headset: 'M3 18v-6a9 9 0 0 1 18 0v6M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z',
    activity: 'M22 12h-4l-3 9L9 3l-3 9H2',
    phone: 'M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .3 2 .7 3a2 2 0 0 1-.4 2.1L8 10.1a16 16 0 0 0 6 6l1.3-1.4a2 2 0 0 1 2.1-.4c1 .4 2 .6 3 .7a2 2 0 0 1 1.6 2z',
    mail: 'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM22 6l-10 7L2 6',
};

export function Icon({ name, size = 22 }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <path d={PATHS[name] || PATHS.spark} />
        </svg>
    );
}

/* Filter/sliders icon with FILLED knobs, matching the reference image.
   Kept separate from <Icon> because <Icon> forces fill="none" on the whole
   svg, which can't fill the knobs. Lines are stroked; knobs are filled. */
export function SlidersIcon({ size = 22 }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            {/* top row: knob on the left */}
            <line x1="10" y1="6" x2="21" y2="6" />
            <line x1="3" y1="6" x2="6" y2="6" />
            <circle cx="8" cy="6" r="2.4" fill="currentColor" stroke="none" />
            {/* middle row: knob toward the right */}
            <line x1="3" y1="12" x2="14" y2="12" />
            <line x1="18" y1="12" x2="21" y2="12" />
            <circle cx="16" cy="12" r="2.4" fill="currentColor" stroke="none" />
            {/* bottom row: knob on the left */}
            <line x1="10" y1="18" x2="21" y2="18" />
            <line x1="3" y1="18" x2="6" y2="18" />
            <circle cx="8" cy="18" r="2.4" fill="currentColor" stroke="none" />
        </svg>
    );
}

/* FILLED group-of-people icon (TSA leadership / board / staff).
   Filled so it reads as a solid glyph like the reference; uses currentColor
   so it themes with light/dark. Kept separate from <Icon> for the same
   fill="none" reason as SlidersIcon. */
export function UsersFilledIcon({ size = 22 }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
        >
            {/* back-left head */}
            <circle cx="6.5" cy="8" r="2.4" />
            {/* back-right head */}
            <circle cx="17.5" cy="8" r="2.4" />
            {/* front center head (larger) */}
            <circle cx="12" cy="7" r="3" />
            {/* back-left body */}
            <path d="M2 18.2c0-2.2 1.9-3.7 4.5-3.7 1 0 1.9.2 2.6.6-1 .9-1.6 2.1-1.7 3.6H2.4c-.3 0-.4-.2-.4-.5z" />
            {/* back-right body */}
            <path d="M22 18.2c0-2.2-1.9-3.7-4.5-3.7-1 0-1.9.2-2.6.6 1 .9 1.6 2.1 1.7 3.6h5c.3 0 .4-.2.4-.5z" />
            {/* front center body */}
            <path d="M12 13c3 0 5 1.8 5 4.3 0 .4-.2.7-.6.7H7.6c-.4 0-.6-.3-.6-.7C7 14.8 9 13 12 13z" />
        </svg>
    );
}

/* FILLED storefront icon (Official TSA Store). */
export function StoreFilledIcon({ size = 22 }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
        >
            {/* awning strip */}
            <rect x="3.5" y="3.5" width="17" height="3.2" rx="1.1" />
            {/* awning valance / roof */}
            <path d="M3 7h18l1.4 4.2a1 1 0 0 1-1 1.3 2.2 2.2 0 0 1-2-1.2 2.2 2.2 0 0 1-2 1.2 2.2 2.2 0 0 1-2-1.2 2.2 2.2 0 0 1-2 1.2 2.2 2.2 0 0 1-2-1.2 2.2 2.2 0 0 1-2 1.2 2.2 2.2 0 0 1-2-1.2 2.2 2.2 0 0 1-2 1.2 1 1 0 0 1-1-1.3L3 7z" />
            {/* store body with a doorway cut out */}
            <path d="M4.5 13.2c.5 0 1-.1 1.4-.3V20a1 1 0 0 0 1 1h4v-5h3v5h4a1 1 0 0 0 1-1v-7.1c.4.2.9.3 1.4.3v.0M5.9 12.9V20h4v-5.5c0-.3.2-.5.5-.5h3c.3 0 .5.2.5.5V20h4v-7.1" />
            {/* left window box */}
            <rect x="6.8" y="15.4" width="3.4" height="3.2" rx=".4" fill="none" stroke="currentColor" strokeWidth="1.4" />
        </svg>
    );
}

/* FILLED sparkle glyph (AI assistant).
   Three four-point sparkles with CONCAVE (curved-in) rays, like the reference:
   a LARGE one upper-right, a MEDIUM one lower-left, and a SMALL one to the
   left. No orbital disc — the sparkles ARE the glyph. Solid fill via
   currentColor so it themes with light/dark. Kept separate from <Icon>
   (which forces fill="none"), like the other filled icons.

   Each sparkle is one path: from top tip, curve IN to centre, OUT to right
   tip, IN to centre, OUT to bottom tip, IN, OUT to left tip, IN, close. */
export function SparkleOrbitIcon({ size = 22, className = '' }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 48 48"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            aria-hidden="true"
        >
            {/* large sparkle — centre (30,20), reach 16 */}
            <path d="M30 4C30.6 15.4 34.6 19.4 46 20C34.6 20.6 30.6 24.6 30 36C29.4 24.6 25.4 20.6 14 20C25.4 19.4 29.4 15.4 30 4Z" />
            {/* medium sparkle — centre (17,33), reach 10 */}
            <path d="M17 23C17.4 30.1 19.9 32.6 27 33C19.9 33.4 17.4 35.9 17 43C16.6 35.9 14.1 33.4 7 33C14.1 32.6 16.6 30.1 17 23Z" />
            {/* small sparkle — centre (11,17), reach 5 */}
            <path d="M11 12C11.2 15.6 12.4 16.8 16 17C12.4 17.2 11.2 18.4 11 22C10.8 18.4 9.6 17.2 6 17C9.6 16.8 10.8 15.6 11 12Z" />
        </svg>
    );
}

export function TabBadge({ count }) {
    if (!count || count < 1) return null;
    return (
        <span className="tab-badge" aria-label={`${count} unread`}>
      <span className="tab-badge-n">{count > 9 ? '9+' : count}</span>
    </span>
    );
}

export function Stars({ n }) {
    return (
        <span className="stars" aria-label={`Difficulty ${n} of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
          <span key={i} className={i <= n ? '' : 'off'}>
          ★
        </span>
      ))}
    </span>
    );
}

export function Progress({ pct }) {
    return (
        <div className="progress" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
            <span style={{ width: `${pct}%` }} />
        </div>
    );
}

export function Cite({ id }) {
    return <span className="cite">{id}</span>;
}

export function Empty({ ico, title, sub, action }) {
    return (
        <div className="empty">
            <div className="e-ico">{ico}</div>
            <h3>{title}</h3>
            <p>{sub}</p>
            {action}
        </div>
    );
}