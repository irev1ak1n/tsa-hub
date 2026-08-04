import { useNavigate, useLocation } from 'react-router-dom';
import { Icon } from '../../components/UI.jsx';
import { STATE_DIRECTORY_URL } from '../../data/stateTsa.js';

export { STATE_DIRECTORY_URL };

// National office contact (opens a modal).
export const NATIONAL_CONTACT = {
    phones: [
        { label: 'Phone', value: '703-860-9000' },
        { label: 'Toll Free', value: '888-860-9010' },
    ],
    email: 'general@tsaweb.org',
};

// Roles that belong in the leadership pages (not "{State} TSA").
export const LEADERSHIP_ROLES = new Set(['officer-team', 'advisor']);

// Renders a ready React icon element (node), an image icon (imported PNG/SVG),
// an inline SVG string, or a named <Icon>. `color` optionally tints the named
// <Icon>. `node` wins first so callers can pass filled SVG components.
// `mono` marks a white monochrome PNG so light-theme CSS can darken it
// (colored brand logos like Instagram/Facebook should NOT pass mono).
export function RowIcon({ node, icon, img, svg, color, mono }) {
    if (node) {
        return <span className="rs-ico">{node}</span>;
    }
    if (img) {
        return (
            <span className="rs-ico">
                <img
                    src={img}
                    alt=""
                    width={20}
                    height={20}
                    className={`rs-ico-img${mono ? ' rs-ico-img--mono' : ''}`}
                />
            </span>
        );
    }
    if (svg) {
        return (
            <span className="rs-ico">
                <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"
                     dangerouslySetInnerHTML={{ __html: svg }} />
            </span>
        );
    }
    return (
        <span className="rs-ico" style={color ? { color } : undefined}>
            <Icon name={icon} size={20} />
        </span>
    );
}

// A row that links externally (href), runs an action (onClick, e.g. opening a
// contact modal), or is disabled. Keyboard + focus come free from <a>/<button>.
// A row is NEVER rendered clickable with an empty destination.
export function Row({ node, icon, img, svg, iconColor, mono, title, desc, href, onClick }) {
    const inner = (
        <>
            <RowIcon node={node} icon={icon} img={img} svg={svg} color={iconColor} mono={mono} />
            <span className="rs-text">
                <span className="rs-title">{title}</span>
                {desc && <span className="rs-desc">{desc}</span>}
            </span>
            <Icon name="chevron-right" size={18} />
        </>
    );

    if (onClick) return <button type="button" className="rs-row" onClick={onClick}>{inner}</button>;
    if (href) return <a className="rs-row" href={href} target="_blank" rel="noreferrer">{inner}</a>;
    return <span className="rs-row is-disabled" aria-disabled="true">{inner}</span>;
}

// Renders one link object from a state's `links` array (handles link vs modal).
export function StateLinkRow({ link, onOpenContact }) {
    return (
        <Row
            node={link.node}
            icon={link.icon}
            img={link.img}
            svg={link.svg}
            iconColor={link.iconColor}
            mono={link.mono}
            title={link.title}
            desc={link.desc}
            href={link.contact ? undefined : link.url}
            onClick={link.contact ? () => onOpenContact(link.title, link.contact) : undefined}
        />
    );
}

// Contact modal for entries with a `contact` object (advisor / national office).
export function ContactModal({ title, contact, onClose }) {
    const telHref = (v) => `tel:${v.replace(/[^\d+]/g, '')}`;
    return (
        <div className="rs-modal-backdrop" onClick={onClose}>
            <div className="rs-modal" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
                <div className="rs-modal-head">
                    <h3>{title}</h3>
                    <button type="button" className="rs-modal-close" onClick={onClose} aria-label="Close">×</button>
                </div>
                <div className="rs-modal-body">
                    {contact.name && <div className="rs-contact-name">{contact.name}</div>}
                    {(contact.phones || []).map((p) => (
                        <a key={p.value} className="rs-contact-line" href={telHref(p.value)}>
                            <Icon name="phone" size={16} />
                            <span>{p.label ? `${p.label}: ${p.value}` : p.value}</span>
                        </a>
                    ))}
                    {contact.phone && (
                        <a className="rs-contact-line" href={telHref(contact.phone)}>
                            <Icon name="phone" size={16} />
                            <span>{contact.phone}</span>
                        </a>
                    )}
                    {contact.email && (
                        <a className="rs-contact-line" href={`mailto:${contact.email}`}>
                            <Icon name="mail" size={16} />
                            <span>{contact.email}</span>
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
}

// Back link at the top of sub-pages. Returns to the actual previous page in
// history (so coming from search returns to the search, coming from the 2026
// landing returns there, etc). Falls back to `to` on a direct/deep-link visit.
export function BackLink({ to = '/resources', label = 'Back' }) {
    const navigate = useNavigate();
    const location = useLocation();

    const goBack = () => {
        if (location.key && location.key !== 'default') navigate(-1);
        else navigate(to);
    };

    return (
        <button type="button" onClick={goBack} className="rs-back">
            <svg className="rs-back-arrow" width="21" height="21" viewBox="0 0 24 24"
                 fill="none" stroke="currentColor" strokeWidth="2.2"
                 strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 12H4" />
                <path d="M10 6l-6 6 6 6" />
            </svg>
            <span>{label}</span>
        </button>
    );
}