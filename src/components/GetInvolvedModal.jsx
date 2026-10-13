import { useState } from 'react';
import { US_STATES } from '../data/stateTsa.js';
import { submitGetInvolved } from '../services/feedbackService.js';

const ROLE_OPTIONS = ['Student Member', 'Chapter Officer', 'State Officer', 'Chapter Advisor', 'Alumni', 'Other'];
const HELP_OPTIONS = ['Beta Testing', 'Suggesting Features', 'Development or Design', 'Promoting TSA Hub', 'Collaboration or Partnership', 'Other'];

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

    function toggleHelp(option) {
        setHelpWith((prev) => (prev.includes(option) ? prev.filter((h) => h !== option) : [...prev, option]));
    }

    const canSubmit = fullName.trim() && email.trim() && status !== 'sending';

    async function send() {
        if (!canSubmit) return;
        setStatus('sending');
        const res = await submitGetInvolved({
            fullName: fullName.trim(),
            email: email.trim(),
            role,
            state: state || null,
            helpWith,
            message: message.trim() || null,
            company,
        });
        setStatus(res.ok ? 'done' : 'error');
    }

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
                                disabled={status === 'sending'}
                                required
                            />

                            <label className="fb-label" htmlFor="gi-email">Email Address</label>
                            <input
                                id="gi-email"
                                type="email"
                                className="fb-input"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                disabled={status === 'sending'}
                                required
                            />

                            <label className="fb-label" htmlFor="gi-role">Your TSA Role</label>
                            <select id="gi-role" className="fb-select" value={role} onChange={(e) => setRole(e.target.value)} disabled={status === 'sending'}>
                                {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                            </select>

                            <label className="fb-label" htmlFor="gi-state">State (optional)</label>
                            <select id="gi-state" className="fb-select" value={state} onChange={(e) => setState(e.target.value)} disabled={status === 'sending'}>
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
                                            disabled={status === 'sending'}
                                        />
                                        <span>{option}</span>
                                    </label>
                                ))}
                            </div>

                            <label className="fb-label" htmlFor="gi-message">Additional Message (optional)</label>
                            <textarea
                                id="gi-message"
                                className="fb-textarea"
                                rows={3}
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Tell us a little about how you'd like to help."
                                disabled={status === 'sending'}
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
                                    disabled={!canSubmit}
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
