import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext.jsx';
import { Icon } from '../../components/UI.jsx';
import { submitFeedback } from '../../services/feedbackService.js';

// One settings row. If `onClick` is passed the WHOLE row is clickable
// (button), not just the chevron. `onEdit`/plain rows are unchanged.
function Row({ icon, label, value, onEdit, soon, onClick }) {
    const content = (
        <>
            {icon && (
                <span className="set-ico">
                    <Icon name={icon} size={20} />
                </span>
            )}
            <span className="set-label">
                {label}
                {value && <span className="set-sub">{value}</span>}
            </span>
            {soon && <span className="set-soon">Soon</span>}
            {onEdit && (
                <button
                    className="link linkbtn pf-change"
                    onClick={(e) => { e.stopPropagation(); onEdit(); }}
                >
                    Change
                </button>
            )}
            {(onClick || onEdit) && <Icon name="chevron-right" size={18} />}
        </>
    );

    // Full-row button when there's a row action (and no inline edit control).
    if (onClick && !onEdit) {
        return (
            <button type="button" className="set-row" onClick={onClick}>
                {content}
            </button>
        );
    }
    return <div className="set-row">{content}</div>;
}

// Feedback modal: a textarea + submit. Writes to Supabase, which emails it.
function FeedbackModal({ onClose }) {
    const [text, setText] = useState('');
    const [status, setStatus] = useState('idle'); // idle | sending | done | error

    async function send() {
        const msg = text.trim();
        if (!msg || status === 'sending') return;
        setStatus('sending');
        const res = await submitFeedback(msg);
        setStatus(res.ok ? 'done' : 'error');
    }

    return (
        <div className="rs-modal-backdrop" onClick={onClose}>
            <div
                className="rs-modal"
                role="dialog"
                aria-modal="true"
                aria-label="Send feedback"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="rs-modal-head">
                    <h3>Send Feedback</h3>
                    <button type="button" className="rs-modal-close" onClick={onClose} aria-label="Close">×</button>
                </div>
                <div className="rs-modal-body">
                    {status === 'done' ? (
                        <p className="fb-thanks">Thanks! Your feedback was sent.</p>
                    ) : (
                        <>
                            <p className="fb-hint">
                                Found an issue or have a suggestion? We&rsquo;d love to hear it.
                            </p>
                            <textarea
                                className="fb-textarea"
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                placeholder="Type your feedback…"
                                rows={5}
                                autoFocus
                                disabled={status === 'sending'}
                            />
                            {status === 'error' && (
                                <p className="fb-error">Couldn&rsquo;t send right now. Please try again.</p>
                            )}
                            <div className="fb-actions">
                                <button type="button" className="btn ghost small" onClick={onClose}>
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="btn primary small"
                                    onClick={send}
                                    disabled={!text.trim() || status === 'sending'}
                                >
                                    {status === 'sending' ? 'Sending…' : 'Send'}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function Settings() {
    const navigate = useNavigate();
    const { theme, toggleTheme } = useApp();
    const [note, setNote] = useState('');
    const [showFeedback, setShowFeedback] = useState(false);

    const dark = theme !== 'light';

    function soon(msg) {
        setNote(msg);
        setTimeout(() => setNote(''), 2200);
    }

    return (
        <>
            <div className="section">
                <div className="rs-eyebrow">SYSTEM & STYLE</div>
                <h1 className="cal-h1">Settings</h1>
            </div>

            {note && (
                <div className="notice info" role="status">
                    <span aria-hidden="true">ⓘ</span>
                    <span>{note}</span>
                </div>
            )}

            {/* Appearance */}
            <div className="set-card">
                <div className="set-card-title">Appearance</div>
                <div className="set-row set-toggle-row">
                    <span className="set-label">
                        <span className="set-uplabel">THEME</span>
                        <span className="set-theme-value">{dark ? 'Dark mode' : 'Light mode'}</span>
                    </span>
                    <button
                        type="button"
                        className={`set-theme-switch ${dark ? 'is-dark' : 'is-light'}`}
                        role="switch"
                        aria-checked={dark}
                        aria-label="Toggle theme"
                        onClick={toggleTheme}
                    >
                        <span className="set-theme-knob"><Icon name="spark" size={13} /></span>
                    </button>
                </div>
            </div>

            {/* Support */}
            <div className="set-card">
                <div className="set-card-title">Support</div>
                <Row icon="help" label="Help Center" soon onClick={() => soon("Help Center isn't available yet.")} />
                <Row icon="chat" label="Send Feedback" onClick={() => setShowFeedback(true)} />
                <Row icon="info" label="Report Incorrect Information" soon onClick={() => soon("Reporting isn't available yet.")} />
            </div>

            {/* About */}
            <div className="set-card">
                <div className="set-card-title">About</div>
                <Row icon="shield" label="Privacy Policy" onClick={() => navigate('/privacy')} />
                <Row icon="file-text" label="Terms and Policies" onClick={() => navigate('/terms')} />
            </div>

            <p className="small muted set-version">TSA Hub v0.1.0</p>

            {showFeedback && <FeedbackModal onClose={() => setShowFeedback(false)} />}
        </>
    );
}