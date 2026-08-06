import { Link } from 'react-router-dom';
import { Icon } from './UI.jsx';

// Reusable floating action button — a shortcut link to a page.
//
//   <SupportButton preset="coach" />         Home    -> AI Coach   (speech-bubble SHAPE)
//   <SupportButton preset="recommender" />   Events  -> Recommender (circle + icon)
//
// Two shapes:
//   shape: 'bubble'  -> the whole button IS a speech-bubble silhouette (empty inside)
//   shape: 'circle'  -> a round button with an <Icon> inside
//
// Fixed bottom-right, above the mobile nav bar and safe-area, below modals.

const PRESETS = {
    coach: {
        to: '/coach',
        shape: 'circle',
        icon: 'question',
        label: 'Open AI Coach',
        accent: 'blue',
    },
    recommender: {
        to: '/recommend',
        shape: 'bubble',
        label: 'Open Event Recommender',
        accent: 'red',
    },
};

// The speech-bubble silhouette IS the button. A small white lightbulb-with-
// check icon sits centered inside it (help / smart suggestion).
function BubbleShape() {
    return (
        <svg className="fab-bubble-svg" viewBox="0 0 48 48" aria-hidden="true">
            {/* bubble body + bottom-right tail */}
            <path
                d="M23 3a20 20 0 1 0 14.1 34.1l6 4.2a1.5 1.5 0 0 0 2.1-2l-3.2-6.7A20 20 0 0 0 23 3z"
                className="fab-bubble-path"
            />
            {/* lightbulb + rays + check — smaller, centered, white outline */}
            {/* Centered on the CIRCULAR body only (center ~23,23 in this
                viewBox), ignoring the bottom-right tail. Cy nudged so the
                bulb's optical center — not its bounding box — sits centered. */}
            <g
                className="fab-bubble-icon"
                transform="translate(23 23) scale(0.5) translate(-24 -24)"
                fill="none"
                stroke="#ffffff"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d="M17 27a9 9 0 1 1 14 0c-1.2 1.4-2 2.6-2.2 4.2H19.2C19 29.6 18.2 28.4 17 27z" />
                <path d="M20.5 35h7" />
                <path d="M21.5 38.5h5" />
                <path d="M24 5v3M8.5 12.5l2 2M39.5 12.5l-2 2M6 24h2.5M39.5 24H42" />
                <path d="M20.5 22.5l2.5 2.5 4.5-5" />
            </g>
        </svg>
    );
}

export default function SupportButton({ preset, to, icon, label, accent = 'blue', shape = 'circle' }) {
    const cfg = preset ? PRESETS[preset] : { to, icon, label, accent, shape };
    if (!cfg || !cfg.to) return null;

    const isBubble = cfg.shape === 'bubble';

    return (
        <div className="fab-wrap">
            <Link
                to={cfg.to}
                className={`fab-btn fab-btn--${cfg.accent} ${isBubble ? 'fab-btn--bubble' : 'fab-btn--circle'}`}
                aria-label={cfg.label}
                title={cfg.label}
            >
                {isBubble ? <BubbleShape /> : <Icon name={cfg.icon} size={24} />}
            </Link>
        </div>
    );
}