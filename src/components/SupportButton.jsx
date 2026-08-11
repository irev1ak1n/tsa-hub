import { Link } from 'react-router-dom';
import { Icon, SparkleOrbitIcon } from './UI.jsx';

// Reusable floating action button — a shortcut link to a page.
//
//   <SupportButton preset="coach" />         Home    -> AI Coach   (bubble + sparkle)
//   <SupportButton preset="recommender" />   Events  -> Recommender (bubble + bulb)
//
// Both are speech-bubble SHAPED buttons. The inner glyph differs per preset.
// Fixed bottom-right, above the mobile nav bar and safe-area, below modals.

const PRESETS = {
    coach: {
        to: '/coach',
        shape: 'bubble',
        glyph: 'sparkle',           // AI assistant
        label: 'Open AI Coach',
        accent: 'red',
    },
    recommender: {
        to: '/recommend',
        shape: 'bubble',
        glyph: 'bulb',              // idea / recommendation
        label: 'Open Event Recommender',
        accent: 'red',
    },
};

// Lightbulb + rays + check, centered in the circular body (tail ignored).
function BulbGlyph() {
    return (
        <g
            className="fab-bubble-icon"
            transform="translate(23 23) scale(0.5) translate(-24 -24)"
            fill="none"
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
    );
}

// Filled sparkle glyph — three four-point sparkles with concave rays (large
// upper-right, medium lower-left, small left), centered in the circular body
// (tail ignored). Source glyph viewBox is 0 0 48 48, so the transform just
// scales/centers it.
function SparkleGlyph() {
    return (
        <g
            className="fab-bubble-icon fab-bubble-icon--filled"
            transform="translate(23 23) scale(0.55) translate(-24 -24)"
            fill="currentColor"
            stroke="none"
        >
            {/* large sparkle — centre (30,20), reach 16 */}
            <path d="M30 4C30.6 15.4 34.6 19.4 46 20C34.6 20.6 30.6 24.6 30 36C29.4 24.6 25.4 20.6 14 20C25.4 19.4 29.4 15.4 30 4Z" />
            {/* medium sparkle — centre (17,33), reach 10 */}
            <path d="M17 23C17.4 30.1 19.9 32.6 27 33C19.9 33.4 17.4 35.9 17 43C16.6 35.9 14.1 33.4 7 33C14.1 32.6 16.6 30.1 17 23Z" />
            {/* small sparkle — centre (11,17), reach 5 */}
            <path d="M11 12C11.2 15.6 12.4 16.8 16 17C12.4 17.2 11.2 18.4 11 22C10.8 18.4 9.6 17.2 6 17C9.6 16.8 10.8 15.6 11 12Z" />
        </g>
    );
}

// The speech-bubble silhouette IS the button (near-circle + bottom-right tail).
function BubbleShape({ glyph }) {
    return (
        <svg className="fab-bubble-svg" viewBox="0 0 48 48" aria-hidden="true">
            <path
                d="M23 3a20 20 0 1 0 14.1 34.1l6 4.2a1.5 1.5 0 0 0 2.1-2l-3.2-6.7A20 20 0 0 0 23 3z"
                className="fab-bubble-path"
            />
            {glyph === 'sparkle' ? <SparkleGlyph /> : <BulbGlyph />}
        </svg>
    );
}

export default function SupportButton({ preset, to, icon, label, accent = 'blue', shape = 'circle', glyph }) {
    const cfg = preset ? PRESETS[preset] : { to, icon, label, accent, shape, glyph };
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
                {isBubble ? <BubbleShape glyph={cfg.glyph} /> : <Icon name={cfg.icon} size={24} />}
            </Link>
        </div>
    );
}