import { useRef, useState } from 'react';
import { US_STATES } from '../data/stateTsa.js';
import { submitGetInvolved } from '../services/feedbackService.js';

const ROLE_OPTIONS = ['Student Member', 'Chapter Officer', 'State Officer', 'Chapter Advisor', 'Alumni', 'Other'];
const HELP_OPTIONS = ['Beta Testing', 'Suggesting Features', 'Development or Design', 'Promoting TSA Hub', 'Collaboration or Partnership', 'Other'];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// A real name has at least one letter in it somewhere, ruling out a
// submission that's just numbers, punctuation, or a stray keyboard mash.
const NAME_HAS_LETTER_RE = /\p{L}/u;
const NAME_MIN = 2;
const NAME_MAX = 100;

function validate({ fullName, email, helpWith }) {
    const errors = {};

    const name = fullName.trim();
    if (!name) {
        errors.fullName = 'Enter your name.';
    } else if (name.length < NAME_MIN) {
        errors.fullName = 'That name looks too short.';
    } else if (name.length > NAME_MAX) {
        errors.fullName = `Name must be ${NAME_MAX} characters or fewer.`;
    } else if (!NAME_HAS_LETTER_RE.test(name)) {
        errors.fullName = 'Enter a valid name.';
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
        errors.email = 'Enter your email address.';
    } else if (!EMAIL_RE.test(trimmedEmail)) {
        errors.email = 'Enter a valid email address.';
    }

    if (helpWith.length === 0) {
        errors.helpWith = 'Choose at least one way you’d like to help.';
    }

    return errors;
}

// Get Involved with TSA Hub — a richer form than the plain-textarea
// SubmitModal (name, email, role, state, multi-select, message), but the
// same rs-modal shell and fb-* field classes as every other TSA Hub modal,
// and the same submit-feedback endpoint/table as Send Feedback and Report.
export default function GetInvolvedModal({ onClose }) {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState(ROLE_OPTIONS[0]);
    const [state, setState] = useState('');
    const [helpWith, setHelpWith] = useState([]);
    const [message, setMessage] = useState('');
    const [company, setCompany] = useState(''); // honeypot, left empty by real visitors
    const [status, setStatus] = useState('idle'); // idle | sending | done | error
    const [fieldErrors, setFieldErrors] = useState({});

    // Belt-and-suspenders guard against a double-click firing two submits
    // before React re-renders the disabled button — state updates inside
    // send() aren't visible to a second call that starts in the same tick.
    const sendingRef = useRef(false);
    // When the form opened — sent to the server so it can reject a submit
    // that arrives implausibly fast for a human to have filled in the form.
    const loadedAtRef = useRef(Date.now());

    function toggleHelp(option) {
        setHelpWith((prev) => (prev.includes(option) ? prev.filter((h) => h !== option) : [...prev, option]));
    }

    async function send() {
        if (sendingRef.current || status === 'sending') return;

        const errors = validate({ fullName, email, helpWith });
        setFieldErrors(errors);
        if (Object.keys(errors).length > 0) return;

        sendingRef.current = true;
        setStatus('sending');
        const res = await submitGetInvolved({
            fullName: fullName.trim(),
            email: email.trim(),
            role,
            state: state || null,
            helpWith,
            message: message.trim() || null,
            company,
            loadedAt: loadedAtRef.current,
        });
        sendingRef.current = false;
        setStatus(res.ok ? 'done' : 'error');
    }

    const disabled = status === 'sending';

    return (
        <div className="rs-modal-backdrop" onClick={onClose}>
            <div
                className="rs-modal"
                role="dialog"
                aria-modal="true"
                aria-label="Get Involved with TSA Hub"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="rs-modal-head">
                    <h3>Get Involved with TSA Hub</h3>
                    <button type="button" className="rs-modal-close" onClick={onClose} aria-label="Close">×</button>
                </div>
                <div className="rs-modal-body">
                    {status === 'done' ? (
                        <>
                            <p className="fb-thanks fb-thanks-title">Thanks for reaching out!</p>
                            <p className="fb-thanks">Your submission has been received. We&rsquo;ll reach out if there&rsquo;s an opportunity to get involved.</p>
                            <div className="fb-actions">
                                <button type="button" className="btn primary small" onClick={onClose}>Done</button>
                            </div>
                        </>
                    ) : (
                        <>
                            <p className="fb-hint">
                                Want to help make TSA Hub better? Share your ideas, help test new features, or contribute to the project.
                            </p>

                            <label className="fb-label" htmlFor="gi-name">Full Name</label>
                            <input
                                id="gi-name"
                                className="fb-input"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="Your name"
                                disabled={disabled}
                                aria-invalid={!!fieldErrors.fullName}
                                aria-describedby={fieldErrors.fullName ? 'gi-name-error' : undefined}
                                required
                            />
                            {fieldErrors.fullName && <p className="fb-field-error" id="gi-name-error">{fieldErrors.fullName}</p>}

                            <label className="fb-label" htmlFor="gi-email">Email Address</label>
                            <input
                                id="gi-email"
                                type="email"
                                className="fb-input"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                disabled={disabled}
                                aria-invalid={!!fieldErrors.email}
                                aria-describedby={fieldErrors.email ? 'gi-email-error' : undefined}
                                required
                            />
                            {fieldErrors.email && <p className="fb-field-error" id="gi-email-error">{fieldErrors.email}</p>}

                            <label className="fb-label" htmlFor="gi-role">Your TSA Role</label>
                            <select id="gi-role" className="fb-select" value={role} onChange={(e) => setRole(e.target.value)} disabled={disabled}>
                                {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                            </select>

                            <label className="fb-label" htmlFor="gi-state">State (optional)</label>
                            <select id="gi-state" className="fb-select" value={state} onChange={(e) => setState(e.target.value)} disabled={disabled}>
                                <option value="">Select a state</option>
                                {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>

                            <span className="fb-label">How Would You Like to Help?</span>
                            <div className="fb-checkbox-group">
                                {HELP_OPTIONS.map((option) => (
                                    <label key={option} className="fb-checkbox-item">
                                        <input
                                            type="checkbox"
                                            checked={helpWith.includes(option)}
                                            onChange={() => toggleHelp(option)}
                                            disabled={disabled}
                                        />
                                        <span>{option}</span>
                                    </label>
                                ))}
                            </div>
                            {fieldErrors.helpWith && <p className="fb-field-error">{fieldErrors.helpWith}</p>}

                            <label className="fb-label" htmlFor="gi-message">Additional Message (optional)</label>
                            <textarea
                                id="gi-message"
                                className="fb-textarea"
                                rows={3}
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Tell us a little about how you'd like to help."
                                disabled={disabled}
                            />

                            {/* Honeypot — hidden from real visitors with CSS, left blank by
                                them, but a bot filling every field will fill this too. */}
                            <input
                                type="text"
                                name="company"
                                value={company}
                                onChange={(e) => setCompany(e.target.value)}
                                className="fb-honeypot"
                                tabIndex={-1}
                                autoComplete="off"
                                aria-hidden="true"
                            />

                            {status === 'error' && (
                                <p className="fb-error">Couldn&rsquo;t send right now. Please try again.</p>
                            )}

                            <div className="fb-actions">
                                <button type="button" className="btn ghost small" onClick={onClose}>Cancel</button>
                                <button
                                    type="button"
                                    className="btn primary small"
                                    onClick={send}
                                    disabled={disabled}
                                >
                                    {status === 'sending' ? 'Submitting…' : 'Submit'}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
